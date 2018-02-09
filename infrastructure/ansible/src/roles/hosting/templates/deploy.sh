#!/bin/bash

set -eo pipefail

if [[ ! -n $1 ]]; then
    echo "Please include a full commit hash."
    echo "$ ./deploy.sh b12a3811c6e221397e2b5390e4f956248bb31548"
    exit
fi

REV=$1

SCRATCH_DIR=/home/myagi/scratch
SRC_DIR=/home/myagi/src
VENV_DIR=/home/myagi/venv
SCRATCH_DJANGO_DIR=$SCRATCH_DIR/myagi
STATIC_DIR=/home/myagi/static

# Set environment variables before proceeding
source /home/myagi/django_environment_variables

echo "Getting the latest source"
aws s3 cp s3://myagi-distributions/$REV/distro.tar ./
rm -rf ./scratch/*
tar -xvf distro.tar -C ./scratch
chmod -R 2775 $SCRATCH_DIR

source $VENV_DIR/bin/activate && pip install setuptools pip --upgrade && pip install -r $SCRATCH_DJANGO_DIR/requirements/production.txt --exists-action=w

if [[ $2 == "--is-leader" ]]; then
    echo "Executing leader commands"
    $SCRATCH_DJANGO_DIR/manage.py migrate --noinput
    # Try migrate analytics. Ignore failure. Some environments do not
    # have an analytics db.
    $SCRATCH_DJANGO_DIR/manage.py migrate --database=analytics --noinput || true
fi

echo "Collecting static"
$SCRATCH_DJANGO_DIR/manage.py collectstatic --noinput --ignore=scss

echo "Clearing old static files"
# This removes all except the last 10 JS files in the JS dir.
# Otherwise the server disks eventually run out of space (because JS files
# are stored with a hash in their name).
cd $STATIC_DIR/js && ls -tp | grep -v '/$' | tail -n +10 | xargs -I {} rm -- {} && cd -
# Same for CSS files.
cd $STATIC_DIR/css && ls -tp | grep -v '/$' | tail -n +10 | xargs -I {} rm -- {} && cd -

# Move scratch files to src dir
rsync -av --exclude '*.pyc' --delete ./scratch/ ./src/
find . -name "*.pyc" -exec rm -rf {} \;
chmod -R 2775 $SRC_DIR

deactivate

echo "Restarting services"
{% if ec2_tag_myagi_instance_type == 'web' or ec2_tag_myagi_instance_type == 'web_and_worker' %}
# Send HUP signal to gunicorn ... reloads with new code
# At some point supervisor will support running this out of the box
GUNICORN_PIDS=$(/usr/local/bin/supervisorctl status | sed -n '/myagi_web_workers.*RUNNING/s/.*pid \([[:digit:]]\+\).*/\1/p')
if [[ -n "$GUNICORN_PIDS" ]]; then
    echo "Sending HUP signal to GUNICORN_PIDS $GUNICORN_PIDS"
    kill -HUP $GUNICORN_PIDS
else
    echo "Straight up start myagi_web_workers"
    /usr/local/bin/supervisorctl start myagi_web_workers
fi
{% endif %}

{% if ec2_tag_myagi_instance_type == 'worker' or ec2_tag_myagi_instance_type == 'web_and_worker' %}

echo "Restarting worker processes"
/usr/local/bin/supervisorctl restart all

{% endif %}

echo "Deploy complete"
