import uuid 


def get_file_upload_location(loc_str, i, f):
    """ 
    Given a `loc_str` path which is relative to the base media 
    path, returns path for new file `f`.
    """
    return loc_str + "-" + str(uuid.uuid4()) + "."+ f.split(".")[-1]
