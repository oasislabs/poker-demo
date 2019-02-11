#!/bin/sh
# Note: This is not safe, and should only be used for local testing!
parity --chain oasis --jsonrpc-cors=all --jsonrpc-interface=0.0.0.0 --ws-hosts=all --ws-origins=all --ws-interface=0.0.0.0 -l debug
