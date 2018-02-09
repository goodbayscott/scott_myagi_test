from celery import shared_task

from .client import get_client


CHANNEL_NAME_DIVIDER = '-'
QUERY_DIVIDER = ','
QUERY_ARGS_DIVIDER = '='


@shared_task()
def notify_subscribers(model_publisher, instance_id, evt):
    """
    Takes a `model_publisher` and figures out which channels to send
    `evt` to. It does this by checking which channels are
    currently subscribed to which are prefixed with the `base_channel_name` specified by
    `model_publisher`. Then, it checks if the instance referenced by `instance_id`
    belongs to the filter set referenced by these channels. Only channels which reference
    a filter set containing the instance are notified.

    For example, if a client subscribes to a channel named 'Thread-members=123',
    then `evt` will only be sent to that channel if `instance_id` references a Thread instance
    which has user 123 as a member (and if `model_publisher` allows the `members` filter).

    Please note, only channels using filters permitted by the `filter_class` of the
    `model_publisher` will be notified.
    """
    c = get_client()
    base_channel_name = model_publisher.base_channel_name
    # Fetch all channels which are prefixed with `base_channel_name`
    relevant_channels = c.channels_info(base_channel_name).get('channels', {})
    channels_to_notify = []
    if model_publisher.filter_class:
        for channel in relevant_channels:
            try:
                filter_string = channel.replace(base_channel_name + CHANNEL_NAME_DIVIDER, '')
                individual_queries = filter_string.split(QUERY_DIVIDER)
                query_parts = [query.split(QUERY_ARGS_DIVIDER) for query in individual_queries]
                filter_kwargs = {parts[0]: parts[1] for parts in query_parts}
            except IndexError:
                # Channel name is malformed
                continue
            filter_set = model_publisher.filter_class(data=filter_kwargs)
            allowed = True
            allowed_filters = filter_set.get_allowed_filter_names()
            for k in filter_kwargs:
                if k not in allowed_filters:
                    allowed = False
                    break
            if not allowed:
                continue
            # Use the `filter_set` to perform the filtering
            if filter_set.qs.filter(id=instance_id).first():
                channels_to_notify.append(channel)
    for channel in channels_to_notify:
        # We don't actually send any data with the message,
        # instead it is up to clients to then go and fetch
        # the updated data.
        c.trigger(channel, evt, {})
