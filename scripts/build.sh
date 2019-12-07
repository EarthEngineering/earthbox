#!/usr/bin/env bash

rm -rf build
node_modules/.bin/babel --minified --no-comments src -d build
cp -r src/components/ContractSchema/spec build/components/ContractSchema/spec
cp scripts/earthcli.js build/.
chmod +x build/earthcli.js
