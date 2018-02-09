#!/bin/bash

# This is run by servers when they first boot.
# The way they are configured is determined by how they
# are tagged (i.e. what myagi_instance_type the machine is tagged as).
# See the various playbooks in src.
# The -l option means that the playbook will only run on the current instance.
ansible-playbook -i ec2.py src/site.yml -c local -l $(curl http://169.254.169.254/latest/meta-data/local-ipv4)
