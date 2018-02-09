#!/bin/bash
set -eo pipefail

export PROJECT_HOME=$( pwd -P )

cd $PROJECT_HOME/frontend

echo "--- NPM install"
yarn install --mutex file

echo "--- Running frontend tests"
npm run test
