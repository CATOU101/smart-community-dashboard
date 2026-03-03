#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: ./commit.sh \"Commit message\""
  exit 1
fi

message="$1"

git add -A
git commit -m "$message"
git push

