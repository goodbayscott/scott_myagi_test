import pusher

from django.conf import settings


_client = None


def get_client():
    """ Shortcut for instantiating the Pusher module with
    correct settings. """
    global _client
    if not _client:
        _client = pusher.Pusher(
            app_id=settings.PUSHER_APP_ID,
            key=settings.PUSHER_KEY,
            secret=settings.PUSHER_SECRET,
            ssl=True,
            port=443
        )
    return _client
