#!/bin/bash
set -e

BACKUP_DIR=/data/backups

# Make variables available for pg commands
export PGDATABASE=postgres
export PGHOST="production.cqfvrpr3cagt.us-west-2.rds.amazonaws.com"
export PGPORT=5432
export PGUSER=myagi
export PGPASSWORD=HsDvf3sRG

if [[ "$1" != "daily" && "$1" != "regularly" ]]; then
    echo "Must specify daily or regularly backups"
    echo "Example: ./db_backup.sh daily"
    exit
fi

if [[ ! -d $BACKUP_DIR ]]; then
    mkdir -p $BACKUP_DIR
    mkdir $BACKUP_DIR/daily
    mkdir $BACKUP_DIR/regularly
fi

# Get all non-system databases
DBS=$(psql -At -c "select datname from pg_database where datname not like 'template%' and datname <> 'postgres' and datname <> 'rdsadmin';")
TIMESTAMP=$(date "+%Y-%m-%d-%H-%M")

for DB in $DBS; do
    DUMP_FILE="$BACKUP_DIR/$1/$DB-$TIMESTAMP.dump"
    echo "Backing up $TIMESTAMP of $DB to $DUMP_FILE"
    pg_dump -Fc $DB > $DUMP_FILE
    ln -sf $DUMP_FILE $BACKUP_DIR/latest-$DB.dump
done

if [[ "$1" == "daily" ]]; then
    # Delete daily backups that is older than 10 days
    find $BACKUP_DIR/daily/ -mtime +10 -print0 | xargs --no-run-if-empty -0 rm
    # Push everything up to S3 and sort it out later
    s3cmd -c /etc/s3cfg --follow-symlinks --no-delete-removed --acl-private sync $BACKUP_DIR/daily/ s3://myagi-backups/db/daily/
    echo "Deleting old backups"
    /usr/local/bin/delete_old_backups.sh "daily" "365 days"
elif [[ "$1" == "regularly" ]]; then
    # Delete regularly backups older than 12 hours
    find $BACKUP_DIR/regularly/ -mmin +720 -print0 | xargs --no-run-if-empty -0 rm
    # Push everything up to S3 and sort it out later
    s3cmd -c /etc/s3cfg --follow-symlinks --acl-private sync $BACKUP_DIR/regularly/ s3://myagi-backups/db/regularly/
    s3cmd -c /etc/s3cfg --follow-symlinks --no-delete-removed --acl-private sync $BACKUP_DIR/latest-* s3://myagi-backups/db/
    echo "Deleting old backups"
    /usr/local/bin/delete_old_backups.sh "regularly" "60 days"
fi
