"""
Miscellaneous utility functions.
"""


import inspect
import importlib
import traceback
import sys

from django.conf import settings

from ..api.simple_api.utils import *


def print_stack():
    """ Shortcut from printing the current call stack. """
    traceback.print_stack(file=sys.stdout)


def safe_divide(v1, v2, default=0):
    """ Performs division without risk of ZeroDivisionError. """
    try:
        return v1 / float(v2)
    except ZeroDivisionError:
        return default


def float_cmp(v1, v2, allowed_error=0.01, log=False):
    """ Returns True if `v1` and `v2` are within `allowed_error`
    of one another, False is otherwise.
    """
    r = abs(v1 - v2) <= allowed_error
    if not r and log:
        print v1, v2
    return r
