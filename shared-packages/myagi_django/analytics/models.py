from django.db import models, connections
from django.conf import settings

import copy

from django.db.migrations.recorder import MigrationRecorder
from django.db.migrations.loader import MigrationLoader
from django.utils import timezone

from myagi_django.querysets import MemorySavingQuerysetIterator


class AnalyticsModel(models.Model):
    class Meta():
        abstract = True

    DATABASE = "analytics"

    @classmethod
    def _get_current_hour_qs(cls, now=None):
        """
        Syncs all instances, but splits across 24 hour period (assumes that
        syncing routine gets called once every hour).
        """
        BaseModel = cls.BASE_MODEL

        now = now if now else timezone.now()

        ids = BaseModel.objects.all().values_list('id', flat=True)
        cur_hour = now.hour
        ids = [i for i in ids if i % 24 == cur_hour]

        return BaseModel.objects.filter(id__in=ids)

    @classmethod
    def get_base_model_update_qs(cls, now=None, force_all=False):
        if force_all:
            qs = cls.BASE_MODEL.objects.all()
        else:
            qs = cls._get_current_hour_qs(now=now)
        return qs.order_by('-id')

    @classmethod
    def initialize_from_base_instance(cls, base_instance):
        """
        For each field, uses the __access_func__ for that field
        to get the required value off `base_instance`
        """
        assert base_instance.__class__ == cls.BASE_MODEL
        self_fields = cls._meta.get_fields()
        vals = {}
        for f in self_fields:
            field_instance = cls._meta.get_field(f.name)
            # Not all fields will have an __access_func__,
            # e.g. _first_sync.
            if hasattr(f, '__access_func__'):
                vals[f.name] = f.__access_func__(base_instance)
        try:
            instance = cls.objects.get(id=vals['id'])
        except cls.DoesNotExist:
            instance = cls()
        for attr, val in vals.iteritems():
            setattr(instance, attr, val)
        return instance

    @classmethod
    def sync_with_third_party(cls, ai):
        """ Optionally override this method to sync the instance with
        something like Segment. """
        pass

    @classmethod
    def sync_base_instance(cls, i):
        assert i.id
        a_i = cls.initialize_from_base_instance(i)
        a_i.save()
        cls.sync_with_third_party(a_i)
        return a_i.id

    @classmethod
    def sync_deleted(cls, log=False):
        all_analytics_ids = cls.objects.all().values_list('id', flat=True)
        all_model_ids = cls.BASE_MODEL.objects.all().values_list(
            'id', flat=True)
        deleted = set(all_analytics_ids) - set(all_model_ids)
        cls.objects.filter(id__in=deleted).delete()
        if log:
            print 'Deleted %d rows' % len(deleted)

    @classmethod
    def sync_all(cls, log=False, force_all=False, now=None):
        qs = cls.get_base_model_update_qs(force_all=force_all, now=now)
        for i in MemorySavingQuerysetIterator(qs):
            res = cls.sync_base_instance(i)
            if log:
                print 'Synced %s with ID %s' % (str(cls), res)
        cls.sync_deleted(log=log)

    _first_sync = models.DateTimeField(auto_now_add=True, null=True)
    _last_sync = models.DateTimeField(auto_now=True, null=True)


def field_with_accessor(field_type, access_func):
    """
    Monkey-patches and __access_func__ onto the field type.
    This isn't ideal, but it does mean that the API for adding
    fields is quite simple.
    """
    field_type.__access_func__ = access_func
    return field_type


def copy_field(f, extra_field_attrs=None):
    fp = copy.copy(f)

    fp.creation_counter = models.Field.creation_counter
    models.Field.creation_counter += 1

    if hasattr(f, 'model'):
        del fp.attname
        del fp.column
        del fp.model
        fp.name = None
        fp.verbose_name = None

    if extra_field_attrs:
        for key, val in extra_field_attrs.iteritems():
            setattr(fp, key, val)

    return fp


def get_model_field(Model, field_name, accessor=None, extra_field_attrs=None):
    field_type = copy_field(
        Model._meta.get_field(field_name), extra_field_attrs)
    if not accessor:
        def accessor(i): return getattr(i, field_name)
    return field_with_accessor(field_type, accessor)


def analytics_instance_to_dict(instance):
    data = instance.__class__.objects.filter(id=instance.id).values()[0]
    # Filter out values like _first_sync and _last_sync
    return {key: value for key, value in data.iteritems() if key[0] != '_'}
