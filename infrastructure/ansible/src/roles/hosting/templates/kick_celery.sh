#!/bin/bash

##
# This sigusr1 signal seems to kickstart celery when it gets stuck, so send it
# periodically.
##

set -e;

# Define a handle for USR1 which just ignores the signal.
# Otherwise this script will signal itself and fail.
trap '' USR1;

now=$(date +"%T")
echo $now': Starting...'

# Give other processes time to start up before sending first signal.
sleep 30;

while true;
do
  # Send signal to specific processes. Other processes, such as the celery beat
  # process, will actual stop if they receive sigusr1...so need to send it selectively

  # NOTE: Have disabled this task for now...trying to get Celery to work without it.
  # Uncomment following lines to re-enable.

  # supervisorctl signal sigusr1 myagi_celery_worker_1 myagi_celery_worker_2 myagi_celery_worker_3 myagi_celery_backend_worker_1 myagi_celery_backend_worker_2;
  # now=$(date +"%T")
  # echo $now': Kicked celery';

  sleep 600;
done

# Unexpected exit
exit 1000;
