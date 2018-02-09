#!/bin/bash

# First arg should be location of key which has access to git repo. Second arg
# should be bitbucket repo address

# Setup ansible on this server so it can configure itself
# See https://ivan-site.com/2014/10/auto-scaling-on-amazon-ec2-with-ansible/


apt-get -y install git python-dev libffi-dev libssl-dev

# Setup private key that will be used to clone git repo
# NOTE: This assumes that awscli tool has already been installed and configured.
# Configuration takes place in user-data script (/var/lib/cloud/instance/user-data.txt on server
# and in stack.template here).
aws s3 cp $1 /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa
(
cat << 'EOP'
github.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==
EOP
) > /root/.ssh/known_hosts

# Clone ansible config git repo"
rm -rf /root/ansible-config
git clone $2 /root/ansible-config

# Install requirements, should contain ansible and boto with their versions frozen
pip install -r /root/ansible-config/requirements.txt
