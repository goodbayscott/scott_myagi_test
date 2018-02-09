import boto3

import os.path
import sys


def upload_dir_to_s3(bucket_name, source_dir, dest_dir, access_key, secret_key, create=False):

    # Max size in bytes before uploading in parts. between 1 and 5 GB
    # recommended
    MAX_SIZE = 20 * 1000 * 1000

    # Size of parts when uploading in parts
    PART_SIZE = 6 * 1000 * 1000

    # conn = boto.connect_s3(access_key, secret_key)
    conn = boto3.resource('s3')

    if create:
        bucket = conn.create_bucket(BucketName=bucket_name,
                                    CreateBucketConfiguration={
                                        'LocationConstraint': boto.s3.connection.Location.DEFAULT})
    else:
        bucket = conn.Bucket(bucket_name)

    upload_file_names = []
    for (source_dir, dirname, filename) in os.walk(source_dir):
        upload_file_names.extend(filename)
        break

    for filename in upload_file_names:
        sourcepath = os.path.join(source_dir, filename)
        destpath = os.path.join(dest_dir, filename)
        print 'Uploading %s to Amazon S3 bucket %s' % \
            (sourcepath, bucket_name)

        filesize = os.path.getsize(sourcepath)
        if filesize > MAX_SIZE:
            print "Multipart upload"
            mp = bucket.initiate_multipart_upload(destpath)
            fp = open(sourcepath, 'rb')
            fp_num = 0
            while (fp.tell() < filesize):
                fp_num += 1
                print "uploading part %i" % fp_num
                mp.upload_part_from_file(
                    fp, fp_num, cb=percent_cb, num_cb=10, size=PART_SIZE)

            mp.complete_upload()

        else:
            conn.meta.client.upload_file(
                sourcepath, bucket_name, destpath)
