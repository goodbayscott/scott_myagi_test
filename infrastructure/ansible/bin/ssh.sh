#!/bin/bash

# Usage: ./bin/ssh.sh <stack_name> <ip_addr>
#
# Example: `./bin/run.sh staging 10.0.0.1` will open shell on the instance with
# IP 10.0.0.1 within the staging stack.


STACK=$1
IP_ADDR=$2
EXTRA_TARGETING=''


if [ -z "$STACK" ]
  then
    echo "Please supply a stack to target (e.g. live, staging or common)"
    exit 1
fi


if [ -z "$IP_ADDR" ]
  then
    echo "Please supply a machine IP address within the stack you selected"
    exit 1
fi


# SSH into the machine using the correct config
# and IP_ADDR
ssh -F $STACK.ssh.config $IP_ADDR
