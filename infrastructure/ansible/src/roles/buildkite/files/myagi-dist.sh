#!/bin/bash
set -eo pipefail

REV=$(git rev-parse HEAD)
export PROJECT_HOME=$( pwd -P )
export ROOT=$( cd ../ ; pwd -P )

cd $PROJECT_HOME/frontend

echo "--- NPM install"
yarn install --mutex file

echo "--- Building bundle.js"
npm run dist

echo "--- Building public-site"
cd $PROJECT_HOME/public-site
make build

cd $PROJECT_HOME

echo "--- Creating distribution"
rm -rf   /tmp/myagi_distributions
mkdir -p /tmp/myagi_distributions/$REV
tar -cf  /tmp/myagi_distributions/$REV/distro.tar --exclude=.happypack --exclude=node_modules * --exclude=mobile-apps
