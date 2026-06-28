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
    sync_lambda_code_from_s3
    deploy_cloudformation_layer "$ROOT/backend" "$BACKEND_STACK_NAME" &
    local backend_pid=$!
    deploy_cloudformation_layer "$FRONTEND_LAYER_DIR" "$FRONTEND_STACK_NAME" &
    local frontend_pid=$!
    wait "$backend_pid"
    wait "$frontend_pid"
  else
    echo "Unsupported INFRA_STACK: $INFRA_STACK" >&2
    exit 1
  fi
}

main "$@"

# Phase D (post-deploy, documented only — not executed here):
# 1. aws cloudformation describe-stacks --stack-name "$BACKEND_STACK_NAME" --query 'Stacks[0].Outputs'
# 2. Set Frontend/.env VITE_API_BASE_URL, VITE_COGNITO_* from outputs
# 3. cd Frontend && npm ci && npm run build
# 4. aws s3 sync dist/ s3://<FrontendBucketName>/ --delete
# 5. aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
# 6. cd backend && TEEVO_TABLE_NAME=<output> npm run seed
