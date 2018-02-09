from django.db.models.signals import post_save, pre_delete

from .tasks import notify_subscribers


CREATED = 'created'
UPDATED = 'updated'
DELETED = 'deleted'


class ModelPublisher(object):

    """ Use this to enable pubsub for any django model.
    Subclass and add a `model` attribute to the subclass.
    Then, make sure the `connect_publisher` function gets
    run with the subclass as an argument. Model changes
    (i.e. 'created', 'updated' and 'deleted') will then be
    published via Pusher to relevant channels (with no extra
    data, beyond the event which has occurred). Clients
    subscribing to these events should then go and fetch
    the changed data using the standard REST API.

    Relevant channels are determined using the `filter_class`,
    which specifies which django filters are allowed in channel names.
    The `filter_class` should be created using
    `myagi_django.api.filters.create_filter_class` to ensure it works.
    Only clients which use those permitted filters will be notified.
    See docstring for `notify_subscribers` for more info on how this
    system works.

    """

    _save_receiver = None
    _delete_receiver = None

    save_signal = post_save
    delete_signal = pre_delete

    filter_class = None

    @property
    def model(self):
        raise NotImplementedError()

    @property
    def base_channel_name(self):
        return self.model.__name__

    def trigger(self, instance, evt):
        if self.should_trigger(instance, evt):
            notify_subscribers.delay(self, instance.id, evt)

    def should_trigger(self, instance, evt):
        # Override this when necessary
        return True

    def on_delete(self, instance):
        self.trigger(instance, DELETED)

    def on_save(self, instance, created):
        if created:
            evt = CREATED
        else:
            evt = UPDATED
        self.trigger(instance, evt)


def connect_publisher(model_publisher_klass):
    """ Create instance of `model_publisher_klass` and make sure
    it's `on_save` and `on_delete` methods are called
    on `post_save` and `pre_delete` of the class's model.
    Generated receivers are attached to `model_publisher_klass`
    both to ensure that the class only gets connected once
    and so that a reference is maintained to the receivers (otherwise
    django will stop calling them).
    """

    model_publisher = model_publisher_klass()

    if not model_publisher_klass._save_receiver:
        def _save_receiver(sender, instance, **kwargs):
            model_publisher.on_save(instance, kwargs.get('created'))
        model_publisher.save_signal.connect(_save_receiver, model_publisher.model)
        model_publisher_klass._save_receiver = _save_receiver

    if not model_publisher_klass._delete_receiver:
        def _delete_receiver(sender, instance, **kwargs):
            model_publisher.on_delete(instance)
        model_publisher.delete_signal.connect(_delete_receiver, model_publisher.model)
        model_publisher_klass._delete_receiver = _delete_receiver
