REV=$(git rev-parse HEAD)
echo "--- Uploading distribution"
aws s3 cp /tmp/myagi_distributions/$REV/distro.tar s3://myagi-distributions/$REV/distro.tar
# Reference branch as well...this allows machines to deploy to themselves when they
# first start up simply by requesting the latest `master` distribution.
aws s3 cp /tmp/myagi_distributions/$REV/distro.tar s3://myagi-distributions/$BUILDKITE_BRANCH/distro.tar
