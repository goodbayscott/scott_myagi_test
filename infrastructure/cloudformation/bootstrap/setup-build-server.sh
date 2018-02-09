#!/bin/bash
set -e

# First argument should be stack name, second should be region, third should be AZ,
# fourth should be location of git repo key in S3 and fifth arg should be Bitbucket
# repo address, sixth arg should be init resource, seventh should be signal resource,
# eigth should be access key, ninth should be secret key.

apt-get -y update >> /tmp/cfn-init.log 2>&1

apt-get -y install python-setuptools
easy_install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-latest.tar.gz

#/usr/local/bin/cfn-init -v --stack $1 --resource $6 --region $2 --access-key $8 --secret-key $9

./setup-ansible.sh $4 $5

# Run ansible-playbook to configure this server
cd /root/ansible-config/ansible/
./bin/local/run.sh $1

# Let auto-scaling group know that instance was successfully deployed
#/usr/local/bin/cfn-signal --success true --stack $1 --resource $7 --region $2 --access-key $8 --secret-key $9
