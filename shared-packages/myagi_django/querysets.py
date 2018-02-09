import copy


class MemorySavingQuerysetIterator(object):
    """
    From http://stackoverflow.com/questions/4856882/limiting-memory-use-in-a-large-django-queryset.
    Can be used to wrap a large queryset and reduce memory usage when
    iterating over that queryset.

    Usage:

        ```python

            for obj in MemorySavingQuerysetIterator(in SomeObject.objects.filter(foo='bar')):
                do_something(obj)

        ```
    """
    def __init__(self, queryset, max_obj_num=1000):
        self._base_queryset = queryset
        self._generator = self._setup()
        self.max_obj_num = max_obj_num

    def _setup(self):
        for i in xrange(0, self._base_queryset.count(), self.max_obj_num):
            # By making a copy of of the queryset and using that to actually access
            # the objects we ensure that there are only `max_obj_num` objects in
            # memory at any given time
            smaller_queryset = copy.deepcopy(self._base_queryset)[i:i+self.max_obj_num]
            print 'Grabbing next %s objects from DB' % self.max_obj_num
            for obj in smaller_queryset.iterator():
                yield obj
            del smaller_queryset

    def __iter__(self):
        return self

    def next(self):
        return self._generator.next()
