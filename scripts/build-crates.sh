#!/bin/sh
/truffle/node_modules/.bin/truffle compile $@
cd core/client && ./build.sh
