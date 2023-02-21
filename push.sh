#!/bin/zsh
. ~/.zshrc

pnpm run dist

echo "Adding files to git..."

git add .
git commit -m "Update in $(date +'%Y-%m-%d %H:%M:%S')"

echo "Pushing to GitHub..."
hp git push