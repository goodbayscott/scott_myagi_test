#!/bin/bash

set -eo pipefail

export PROJECT_HOME=$( pwd -P )
source /etc/bash_completion.d/virtualenvwrapper

echo "--- Install python dependencies"
cd $PROJECT_HOME/myagi

# Create or activate myagi virtual environment
workon myagi || mkvirtualenv myagi && pip install setuptools pip --upgrade && pip install -r requirements/development.txt --exists-action=w

echo "--- Running backend tests in parallel"
coverage run --source=apps,myagi,myagi_common manage.py test -t . -v2 --failfast --noinput --parallel

codeclimate-test-reporter
rm -f -R ./media/*
