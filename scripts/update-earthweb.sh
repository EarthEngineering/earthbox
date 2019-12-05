#!/usr/bin/env bash

(
cd packages/earthwrap/earthweb
git reset --hard
git checkout master
git pull origin master
yarn install
yarn build
)
