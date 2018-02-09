#!/bin/bash

set -eo pipefail

export PROJECT_HOME=$( pwd -P )

REV=$(git rev-parse HEAD)
echo "Buildkite commit: $BUILDKITE_COMMIT"
echo "Git commit: $REV"

buildkite-agent meta-data set "rev" "$REV"
