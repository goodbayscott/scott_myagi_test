from easy_thumbnails.source_generators import pil_image

from django.conf import settings 

import os


def default_image(source, exif_orientation=True, **options):
    """ 
    Include this source generator in the `THUMBNAIL_SOURCE_GENERATORS` 
    setting to prevent exceptions being raised if images do not exist. 
    """
    assert hasattr(settings, "DEFAULT_THUMBNAIL_SOURCE") 
    source = open(settings.DEFAULT_THUMBNAIL_SOURCE, 'r')
    img = pil_image(source, exif_orientation=exif_orientation, **options) 
    return img 
