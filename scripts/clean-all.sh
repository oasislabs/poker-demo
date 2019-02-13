#!/bin/sh
cd core/client && rm -rf target/ && rm -rf bindings/ && rm -f Cargo.lock && cd ../../
cd core/game && rm -rf target/ && rm -f Cargo.lock && cd ../../
cd contracts/*contract/ && rm -rf target/ && rm -f Cargo.lock && cd ../../
