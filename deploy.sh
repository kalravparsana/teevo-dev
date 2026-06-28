#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
: "${INFRA_STACK:?}"
: "${DEPLOY_ENVIRONMENT:?}"
: "${BACKEND_STACK_NAME:?}"
: "${FRONTEND_STACK_NAME:?}"

if [[ -d "$ROOT/Frontend" ]]; then
  FRONTEND_LAYER_DIR="$ROOT/Frontend"
elif [[ -d "$ROOT/frontend" ]]; then
  FRONTEND_LAYER_DIR="$ROOT/frontend"
else
  echo "No frontend layer directory found (expected Frontend/ or frontend/)" >&2
  exit 1
fi

read_cfn_param() {
  local params_file="$1"
  local key="$2"
  node -e "
    const fs = require('fs');
    const key = process.argv[1];
    const file = process.argv[2];
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    const row = rows.find((r) => r.ParameterKey === key);
    process.stdout.write(row ? String(row.ParameterValue ?? '') : '');
  " "$key" "$params_file"
}

read_stack_output() {
  local stack_name="$1"
  local output_key="$2"
  aws cloudformation describe-stacks --stack-name "$stack_name" \
    --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue | [0]" \
    --output text 2>/dev/null || echo ""
}

patch_cfn_param() {
  local params_file="$1"
  local key="$2"
  local value="$3"
  node -e "
    const fs = require('fs');
    const [key, value, file] = process.argv.slice(1);
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    const index = rows.findIndex((r) => r.ParameterKey === key);
    if (index >= 0) rows[index].ParameterValue = value;
    else rows.push({ ParameterKey: key, ParameterValue: value });
    fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n');
  " "$key" "$value" "$params_file"
}

write_frontend_env_from_outputs() {
  local env_file="$FRONTEND_LAYER_DIR/.env"
  local api_url pool_id client_id cognito_domain cloudfront_url region
  api_url="$(read_stack_output "$BACKEND_STACK_NAME" "ApiBaseUrl")"
  pool_id="$(read_stack_output "$BACKEND_STACK_NAME" "CognitoUserPoolId")"
  client_id="$(read_stack_output "$BACKEND_STACK_NAME" "CognitoClientId")"
  cognito_domain="$(read_stack_output "$BACKEND_STACK_NAME" "CognitoDomain")"
  cloudfront_url="$(read_stack_output "$FRONTEND_STACK_NAME" "CloudFrontUrl")"
  region="$(read_stack_output "$BACKEND_STACK_NAME" "Region")"
  [[ -n "$region" && "$region" != "None" ]] || region="${AWS_DEFAULT_REGION:-us-east-1}"

  node -e "
    const fs = require('fs');
    const [file, apiUrl, poolId, clientId, domain, cloudfrontUrl, region] = process.argv.slice(1);
    const updates = {
      VITE_USE_LOCAL_DATA: 'false',
      VITE_API_BASE_URL: apiUrl,
      VITE_COGNITO_USER_POOL_ID: poolId,
      VITE_COGNITO_CLIENT_ID: clientId,
      VITE_COGNITO_DOMAIN: domain,
      VITE_COGNITO_REGION: region,
      VITE_OAUTH_REDIRECT_URI: cloudfrontUrl ? cloudfrontUrl.replace(/\\/\$/, '') + '/auth/callback' : '',
    };
    const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n') : [];
    const map = new Map();
    for (const line of lines) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      map.set(line.slice(0, idx), line.slice(idx + 1));
    }
    for (const [key, value] of Object.entries(updates)) {
      if (value) map.set(key, value);
    }
    fs.writeFileSync(file, [...map.entries()].map(([k, v]) => k + '=' + v).join('\n') + '\n');
  " "$env_file" "$api_url" "$pool_id" "$client_id" "$cognito_domain" "$cloudfront_url" "$region"
}

patch_cors_origins_from_frontend() {
  local params="$ROOT/backend/parameters.json"
  [[ -f "$params" ]] || return 0

  local cloudfront_url existing cors
  cloudfront_url="$(read_stack_output "$FRONTEND_STACK_NAME" "CloudFrontUrl")"
  [[ -n "$cloudfront_url" && "$cloudfront_url" != "None" ]] || return 0

  existing="$(read_cfn_param "$params" "CorsOrigins")"
  if [[ "$existing" == *"$cloudfront_url"* ]]; then
    return 0
  fi

  if [[ -n "$existing" ]]; then
    cors="${existing},${cloudfront_url}"
  else
    cors="http://localhost:5173,${cloudfront_url}"
  fi
  echo "Patching CorsOrigins to include ${cloudfront_url}" >&2
  patch_cfn_param "$params" "CorsOrigins" "$cors"
}

publish_frontend_spa() {
  local bucket_name distribution_id cloudfront_url
  bucket_name="$(read_stack_output "$FRONTEND_STACK_NAME" "FrontendBucketName")"
  distribution_id="$(read_stack_output "$FRONTEND_STACK_NAME" "DistributionId")"
  cloudfront_url="$(read_stack_output "$FRONTEND_STACK_NAME" "CloudFrontUrl")"
  [[ -n "$bucket_name" && "$bucket_name" != "None" ]] || {
    echo "Frontend bucket output missing; skipping SPA publish" >&2
    return 0
  }

  write_frontend_env_from_outputs
  echo "Building frontend SPA for ${cloudfront_url:-$bucket_name}" >&2
  (cd "$FRONTEND_LAYER_DIR" && npm ci --include=dev && npm run build)
  aws s3 sync "$FRONTEND_LAYER_DIR/dist/" "s3://${bucket_name}/" --delete

  if [[ -n "$distribution_id" && "$distribution_id" != "None" ]]; then
    aws cloudfront create-invalidation --distribution-id "$distribution_id" --paths "/*" >/dev/null
  fi
  echo "Frontend published to ${cloudfront_url:-s3://${bucket_name}}" >&2
}

log_stack_failure_events() {
  local stack_name="$1"
  echo "CloudFormation failure events for stack: $stack_name" >&2
  aws cloudformation describe-stack-events --stack-name "$stack_name" \
    --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`ROLLBACK_IN_PROGRESS`].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
    --output text 2>/dev/null | tail -n 5 >&2 || true
}

recover_failed_stack() {
  local stack_name="$1"
  local status
  status="$(aws cloudformation describe-stacks --stack-name "$stack_name" \
    --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")"
  case "$status" in
    ROLLBACK_COMPLETE|ROLLBACK_FAILED|DELETE_FAILED)
      echo "Recovering failed stack $stack_name (status: $status)" >&2
      aws cloudformation delete-stack --stack-name "$stack_name"
      aws cloudformation wait stack-delete-complete --stack-name "$stack_name"
      ;;
  esac
}

prepare_backend_lambda_artifact() {
  local params="$ROOT/backend/parameters.json"
  [[ -f "$params" ]] || { echo "Missing backend/parameters.json" >&2; exit 1; }
  local bucket key
  bucket="$(read_cfn_param "$params" "LambdaCodeS3Bucket")"
  key="$(read_cfn_param "$params" "LambdaCodeS3Key")"
  [[ -n "$bucket" && -n "$key" ]] || { echo "LambdaCodeS3Bucket/Key missing in parameters.json" >&2; exit 1; }

  if ! aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
    aws s3 mb "s3://${bucket}"
  fi

  (cd "$ROOT/backend" && npm ci --include=dev && npm run build && npm run package:lambda)
  local zip_file="$ROOT/backend/dist-lambda.zip"
  [[ -f "$zip_file" ]] || { echo "Lambda zip was not created. Check package:lambda." >&2; exit 1; }
  aws s3 cp "$zip_file" "s3://${bucket}/${key}"
  rm -f "$zip_file"
}

sync_lambda_code_from_s3() {
  local params="$ROOT/backend/parameters.json"
  [[ -f "$params" ]] || return 0

  local bucket key env_name function_name
  bucket="$(read_cfn_param "$params" "LambdaCodeS3Bucket")"
  key="$(read_cfn_param "$params" "LambdaCodeS3Key")"
  env_name="$(read_cfn_param "$params" "EnvironmentName")"
  [[ -n "$bucket" && -n "$key" && -n "$env_name" ]] || return 0

  function_name="${env_name}-api"
  if ! aws lambda get-function --function-name "$function_name" >/dev/null 2>&1; then
    echo "Lambda function $function_name not found yet; skipping code sync" >&2
    return 0
  fi

  echo "Updating Lambda code for $function_name from s3://${bucket}/${key}" >&2
  aws lambda update-function-code \
    --function-name "$function_name" \
    --s3-bucket "$bucket" \
    --s3-key "$key" >/dev/null
  aws lambda wait function-updated-v2 --function-name "$function_name"
}

prepare_backend_artifact() {
  local bucket=""
  if [[ -f "$ROOT/backend/parameters.json" ]]; then
    bucket="$(read_cfn_param "$ROOT/backend/parameters.json" "LambdaCodeS3Bucket")"
  fi
  if [[ -n "$bucket" && "$bucket" != "null" ]]; then
    prepare_backend_lambda_artifact
  fi
}

deploy_cloudformation_layer() {
  local layer_dir="$1"
  local stack_name="$2"
  local template="cloudformation-template.yaml"
  local params="parameters.json"

  recover_failed_stack "$stack_name"

  local -a cap_args=()
  if grep -q 'RoleName:' "$layer_dir/$template" 2>/dev/null; then
    cap_args+=(--capabilities CAPABILITY_NAMED_IAM)
  fi

  local -a param_args=()
  if [[ -f "$layer_dir/$params" ]]; then
    param_args+=(--parameters "file://${params}")
  fi

  (
    cd "$layer_dir"
    if aws cloudformation describe-stacks --stack-name "$stack_name" >/dev/null 2>&1; then
      local update_output=""
      local skip_wait=0
      if ! update_output="$(aws cloudformation update-stack \
        --stack-name "$stack_name" \
        --template-body "file://${template}" \
        "${param_args[@]}" "${cap_args[@]}" 2>&1)"; then
        if [[ "$update_output" == *"No updates are to be performed"* ]]; then
          echo "No CloudFormation updates required for $stack_name" >&2
          skip_wait=1
        elif aws cloudformation describe-stacks --stack-name "$stack_name" \
          --query 'Stacks[0].StackStatus' --output text 2>/dev/null | grep -q 'IN_PROGRESS'; then
          echo "Stack update already in progress for $stack_name" >&2
        else
          echo "$update_output" >&2
          log_stack_failure_events "$stack_name"
          exit 1
        fi
      fi
      if [[ "$skip_wait" -eq 0 ]]; then
        aws cloudformation wait stack-update-complete --stack-name "$stack_name" || {
          log_stack_failure_events "$stack_name"
          exit 1
        }
      fi
    else
      aws cloudformation create-stack \
        --stack-name "$stack_name" \
        --template-body "file://${template}" \
        "${param_args[@]}" "${cap_args[@]}" || {
        log_stack_failure_events "$stack_name"
        exit 1
      }
      aws cloudformation wait stack-create-complete --stack-name "$stack_name" || {
        log_stack_failure_events "$stack_name"
        exit 1
      }
    fi
  )
}

main() {
  if [[ "$INFRA_STACK" == "cloudformation" ]]; then
    prepare_backend_artifact
    patch_cors_origins_from_frontend
    deploy_cloudformation_layer "$ROOT/backend" "$BACKEND_STACK_NAME" &
    local backend_pid=$!
    deploy_cloudformation_layer "$FRONTEND_LAYER_DIR" "$FRONTEND_STACK_NAME" &
    local frontend_pid=$!
    wait "$backend_pid"
    wait "$frontend_pid"
    sync_lambda_code_from_s3
    publish_frontend_spa
  else
    echo "Unsupported INFRA_STACK: $INFRA_STACK" >&2
    exit 1
  fi
}

main "$@"
