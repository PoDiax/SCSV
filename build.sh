#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Building extensions..."
npm run build

echo "Build complete. Artifacts are in the dist/ directory."
