#!/bin/sh
truffle compile $@
cd core/client && ./build.sh
