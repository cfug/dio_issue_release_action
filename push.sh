#!/bin/zsh
. ~/.zshrc

_message=$1

pnpm run dist

echo "Adding files to git..."

git add .

if [ -z "$_message" ]; then
  echo "Commiting..."
  change_file_name=$(git diff --name-only HEAD~1 HEAD)
  git commit -m "Update in $(date +'%Y-%m-%d %H:%M:%S'), change files: $change_file_name"
else
  echo "Commiting with message: $_message"
  git commit -m "$_message"
fi

echo "Pushing to GitHub..."
hp git push