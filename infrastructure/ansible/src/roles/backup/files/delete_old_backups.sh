#!/bin/bash

# Usage: ./delete_old_backups "daily" "30 days"

BUCKET_ADDR=myagi-backups/db/$1/

s3cmd -c /etc/s3cfg ls s3://$BUCKET_ADDR | while read -r line;
  do
    createDate=`echo $line|awk {'print $1" "$2'}`
    createDate=`date -d"$createDate" +%s`
    olderThan=`date -d"-$2" +%s`
    if [[ $createDate -lt $olderThan ]]
      then
        fileName=`echo $line|awk {'print $4'}`
        echo $fileName
        if [[ $fileName != "" ]]
          then
            s3cmd -c /etc/s3cfg del "$fileName"
        fi
    fi
  done;
