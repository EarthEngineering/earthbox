#!/usr/bin/env bash

cd packages/earthwrap/earthweb
current_earthweb_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')
cd ../../..

echo $current_earthweb_branch

if [ $current_earthweb_branch = "master" ]
then
  exit 0 # push will execute
else
    read -p "

YOUR ATTENTION, PLEASE!
You're about to push a earthweb branch which is not master.

Is that what you intended? [y|n] " -n 1 -r < /dev/tty
    echo
    if echo $REPLY | grep -E '^[Yy]$' > /dev/null
    then
        exit 0 # push will execute
    fi
    exit 1 # push will not execute
fi
