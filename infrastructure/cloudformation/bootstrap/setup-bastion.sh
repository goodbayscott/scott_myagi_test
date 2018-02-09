#!/bin/bash
set -e

# First argument should be stack name, second should be region, third should be AZ,
# fourth should be location of git repo key in S3 and final arg should be Bitbucket
# repo address

ETH0_MAC=$(cat /sys/class/net/eth0/address)
VPC_CIDR_URI="http://169.254.169.254/latest/meta-data/network/interfaces/macs/${ETH0_MAC}/vpc-ipv4-cidr-block"
VPC_CIDR_RANGE=$(curl --retry 3 --silent --fail ${VPC_CIDR_URI})
sysctl -q -w net.ipv4.ip_forward=1 net.ipv4.conf.eth0.send_redirects=0 && (
  iptables -t nat -C POSTROUTING -o eth0 -s ${VPC_CIDR_RANGE} -j MASQUERADE 2> /dev/null ||
  iptables -t nat -A POSTROUTING -o eth0 -s ${VPC_CIDR_RANGE} -j MASQUERADE )
sysctl net.ipv4.ip_forward net.ipv4.conf.eth0.send_redirects
iptables -n -t nat -L POSTROUTING
echo $1-gw-$2$3 > /etc/hostname
hostname $1-gw-$2$3

./setup-ansible.sh $4 $5

# Run ansible-playbook to configure this server
cd /root/ansible-config/ansible/
./bin/local/run.sh $1

/usr/sbin/service rsyslog restart
