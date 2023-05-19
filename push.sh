#!/bin/zsh
. ~/.zshrc

set -e

_message=$1

pnpm run dist

echo "Adding files to git..."

git add .

if [ -z "$_message" ]; then
  echo "Commiting..."
  change_file_name=$(git diff --name-only HEAD)
  git commit -m "Update files: $change_file_name, at $(date '+%Y-%m-%d %H:%M:%S'))"
else
  echo "Commiting with message: $_message"
  git commit -m "$_message"
fi

echo "Pushing to GitHub..."
git push