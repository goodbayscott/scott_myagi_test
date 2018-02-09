import boto
import boto.s3
from boto.s3.key import Key

from django.conf import settings


BUCKET_NAME = 'myagi-data-dump'
MANIFEST_BUCKET_NAME = 'myagi-data-dump-manifests'
MANIFEST = '''{
    "fileLocations": [
              {"URIs": ["https://myagi-data-dump.s3.amazonaws.com/%s"]}
     ],
     "globalUploadSettings": {
       "format": "CSV",
       "delimiter": ",",
       "containsHeader": "true"
    }
}'''


def dump_to_s3(filename, string):
    conn = boto.connect_s3(
        settings.AWS_ACCESS_KEY_ID,
        settings.AWS_SECRET_ACCESS_KEY
    )

    bucket = conn.get_bucket(BUCKET_NAME)

    k = Key(bucket)
    k.key = filename
    k.set_contents_from_string(string)

    manifest_bucket = conn.get_bucket(MANIFEST_BUCKET_NAME)
    manifest_string = MANIFEST % filename
    manifest_filename = "%s.manifest.json" % filename
    k = Key(manifest_bucket)
    k.key = manifest_filename
    k.set_contents_from_string(manifest_string)
    # Allow public access to manifest
    k.set_acl('public-read')
    print "Manifest URL for upload is: https://%s.s3.amazonaws.com/%s" % (MANIFEST_BUCKET_NAME, manifest_filename)
