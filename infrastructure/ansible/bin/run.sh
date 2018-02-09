#!/bin/bash

# Usage: ./bin/run.sh <stack_name> [extra_targeting_arg]
# Example 1: `./bin/run.sh staging` will configure every machine in the
#             staging stack.
# Example 2: `./bin/run.sh staging tag_myagi_instance_type_bastion` will
#             only configure the bastion instances. Other instance types
#             are 'web' and 'worker'.
# Example 3: `./bin/run.sh live "-l 10.0.5.64"` will only configure a specific
#             instance within the live env.
# Example 4: `./bin/run.sh live "-l 10.0.5.64 -u ubuntu"` will configure a specific
#             instance within the live env using the ubuntu user.

STACK=$1

if [ -z "$STACK" ]
  then
    echo "Please supply a stack to target (e.g. production or staging)"
    exit 1
fi

# Select ssh config according to stack
export ANSIBLE_SSH_ARGS="-o ControlPersist=15m -F '$STACK'.ssh.config -q"

ansible-playbook -i ec2.py src/site.yml -l tag_myagi_stack_$STACK $2
