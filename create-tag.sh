#!/bin/bash

# Script to create and push v1.1.0 tag
# Usage: ./create-tag.sh

set -e

TAG_NAME="v1.1.0"

echo "======================================"
echo "Creating and pushing tag: $TAG_NAME"
echo "======================================"
echo

# Ensure we're on main and up to date
echo "1. Checking out main branch..."
git checkout main

echo "2. Pulling latest changes..."
git pull origin main

# Check if tag already exists
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo "⚠️  Tag $TAG_NAME already exists locally"
    read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing tag..."
        git tag -d "$TAG_NAME"
    else
        echo "Skipping tag creation"
        exit 1
    fi
fi

# Create the tag
echo "3. Creating tag $TAG_NAME..."
git tag "$TAG_NAME"

# Verify tag
echo "4. Verifying tag..."
git tag -l "$TAG_NAME"
git show "$TAG_NAME" --no-patch

# Push the tag
echo
echo "5. Pushing tag to origin..."
git push origin "$TAG_NAME"

echo
echo "✅ Success! Tag $TAG_NAME has been created and pushed."
echo
echo "Verify at: https://github.com/kernel-spec/ai-portfolio-builder/releases/tag/$TAG_NAME"
