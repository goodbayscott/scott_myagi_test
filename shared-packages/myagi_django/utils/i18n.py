from django.utils import translation


class set_lang():
    """ Useful for temporarily setting the language """

    def __init__(self, lang):
        self.old_lang = translation.get_language()
        self.lang = lang

    def __enter__(self):
        translation.activate(self.lang)

    def __exit__(self, *args):
        translation.activate(self.old_lang)
