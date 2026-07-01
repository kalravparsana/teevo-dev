#!/usr/bin/env bash
set -euo pipefail

DEV_REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
WORKSPACE_ROOT="$(cd "$DEV_REPO_ROOT/.." && pwd)"

node "$DEV_REPO_ROOT/scripts/sync-launchpad-manifest.mjs"
exec bash "$WORKSPACE_ROOT/.cursor/skills/cloud-deploy-run/launchpad-cloud-deploy-run.sh" "$DEV_REPO_ROOT"
