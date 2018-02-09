import os
import time
import json
import logging

from fabric.api import cd, task, settings, sudo, local, env, lcd, run, abort, \
    hide, prefix, put, prompt
from fabric.colors import red, green
from fabric.contrib.files import exists
from fabric.decorators import hosts

import boto3
from botocore.exceptions import ClientError

import pprint

from .s3_upload import upload_dir_to_s3


S3_INFRA_BUCKET = "myagi-infra"
BOOTSTRAP_DIR = "bootstrap"
STACK_PARAMS_FILE = "./stack.params.json"
COMMENT_KEY = "_comment"

f = open(STACK_PARAMS_FILE)

STACK_PARAMS = json.loads(f.read())

f.close()

PROTECTED_STACKS = ["production", "live"]

DEFAULT_REGION = "us-west-2"


# The region which should be used by Boto
os.environ['AWS_DEFAULT_REGION'] = DEFAULT_REGION


boto3.set_stream_logger(level=logging.INFO)


def _get_creds():
    return None, None
    f = open(os.path.abspath(".aws-credentials"), "r")
    creds = f.read()
    f.close()
    creds = creds.split("\n")
    creds = [pair.split("=") for pair in creds]
    return creds[0][1], creds[1][1]


def _get_cloudformation_conn(region=DEFAULT_REGION):
    return boto3.client('cloudformation')


def _get_template_body(stack_name):
    tpl = STACK_PARAMS[stack_name]['template']
    f = open(tpl, "r")
    js = json.loads(f.read())
    # Load and dump json to shorten template
    t = json.dumps(js)
    f.close()
    return t


def _get_policy_body(stack_name):
    policy = STACK_PARAMS[stack_name]['policy']
    f = open(policy, "r")
    # Load and dump json to shorten policy
    t = json.dumps(json.loads(f.read()))
    f.close()
    return t


def _get_params(stack_name):
    params = STACK_PARAMS[stack_name]['params']
    processed_params = {}
    for param, val in params.iteritems():
        if param == COMMENT_KEY:
            continue
        if val == None:
            val = prompt('Please specify a value for "%s": ' % param)
        processed_params[param] = val
    return [{
            'ParameterKey': k,
            'ParameterValue': v
            } for k, v in processed_params.iteritems()]


def update_stack(stack_name):
    update_stack_policy(stack_name)
    print green("Updating %s stack" % stack_name)

    push_bootstrap_scripts()

    conn = _get_cloudformation_conn()
    conn.update_stack(
        StackName=stack_name,
        TemplateBody=_get_template_body(stack_name),
        Parameters=_get_params(stack_name),
        Capabilities=['CAPABILITY_IAM']
    )
    stop_events = [
        "UPDATE_COMPLETE",
        "UPDATE_ROLLBACK_COMPLETE"
    ]
    describe_stack_events(stack_name, stop_event=stop_events)
    print green("Update complete")


def create_stack(stack_name, region=DEFAULT_REGION):
    print green("Creating %s stack" % stack_name)

    push_bootstrap_scripts()

    conn = _get_cloudformation_conn()
    conn.create_stack(
        stack_name,
        template_body=_get_template_body(stack_name),
        parameters=_get_params(stack_name),
        capabilities=['CAPABILITY_IAM']
    )
    stop_event = "CREATE_COMPLETE" % stack_name
    describe_stack_events(stack_name, stop_event=stop_event)
    update_stack_policy(stack_name)
    print green("Creation complete")


def delete_stack(stack_name, region=DEFAULT_REGION):
    if stack_name in PROTECTED_STACKS:
        print "Cannot delete this stack!"
        return
    print green("Deleting %s stack" % stack_name)
    conn = _get_cloudformation_conn()
    try:
        conn.delete_stack(
            stack_name
        )
        stop_event = "StackEvent AWS::CloudFormation::Stack %s DELETE_COMPLETE" % stack_name
        describe_stack_events(stack_name, stop_event=stop_event)
    except ClientError as e:
        print e
    print green("Deletion complete")


def update_stack_policy(stack_name, region=DEFAULT_REGION):
    print green("Updating stack policy for %s" % stack_name)
    conn = _get_cloudformation_conn()
    conn.set_stack_policy(
        StackName=stack_name,
        StackPolicyBody=_get_policy_body(stack_name)
    )
    print green("Policy update complete")


def rebuild_stack(stack_name, region=DEFAULT_REGION):
    delete_stack(stack_name)
    create_stack(stack_name)


def describe_stack_events(stack_name, stop_event=None):
    conn = _get_cloudformation_conn()
    last_event = None
    while (True):
        try:
            events = conn.describe_stack_events(
                StackName=stack_name)['StackEvents']
        except ClientError as e:
            print e
            break
        latest_event = str(events[0]['ResourceStatus']).strip()
        if latest_event != last_event:
            print latest_event
        last_event = latest_event
        if stop_event:
            if isinstance(stop_event, list) and latest_event in stop_event:
                break
            elif stop_event == latest_event:
                break
        time.sleep(1)


def push_bootstrap_scripts():
    access_key, secret_key = _get_creds()
    upload_dir_to_s3(S3_INFRA_BUCKET, BOOTSTRAP_DIR,
                     BOOTSTRAP_DIR, access_key, secret_key)
