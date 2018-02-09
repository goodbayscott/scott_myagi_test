import tempfile 

from PIL import Image


def create_tmp_image_file():
    img = Image.new('RGB', (100, 100))
    f = tempfile.NamedTemporaryFile(suffix='.jpg')
    img.save(f)
    f.seek(0)
    return f 