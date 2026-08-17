#!/bin/bash
# PMApp PWA Build Script — esbuild bundler
# Bundles src/*.js ES modules into a single bundle.js for GitHub Pages deployment

set -e
cd "$(dirname "$0")"

ESBUILD="./node_modules/esbuild/bin/esbuild"

echo "Building PMApp PWA bundle..."
$ESBUILD src/app.js \
  --bundle \
  --outfile=bundle.js \
  --format=iife \
  --target=es2020 \
  --minify \
  --banner:js="/* PMApp Mobile v3.16.4 — Bundled by esbuild */"

echo "Done! bundle.js size: $(wc -c < bundle.js) bytes"
