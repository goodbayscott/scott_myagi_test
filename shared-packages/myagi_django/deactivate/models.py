from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError


class DeactivateQueryset(models.QuerySet):

    def _replace_is_active(self, kwargs):
        if 'is_active' in kwargs:
            kwargs['deactivated__isnull'] = not kwargs['is_active']
            kwargs = kwargs.pop('is_active')
        return kwargs

    def filter(self, *args, **kwargs):
        kwargs = self._replace_is_active(kwargs)
        return super(DeactivateQueryset, self).filter(*args, **kwargs)

    def get(self, *args, **kwargs):
        kwargs = self._replace_is_active(kwargs)
        return super(DeactivateQueryset, self).get(*args, **kwargs)

    def active_on(self, dt):
        ''' Returns models which where active at datetime `dt` '''
        return self.filter(Q(deactivated__isnull=True) | Q(deactivated__gt=dt), created__lt=dt)

    def is_active(self):
        return self.filter(deactivated__isnull=True)


class DeactivateMixin(models.Model):
    '''
    TODO - Ensure that deactivated is never set to None once it has been
    set.
    '''

    class Meta():
        abstract = True

    def __init__(self, *args, **kwargs):
        super(DeactivateMixin, self).__init__(*args, **kwargs)
        self._orig_deactivated = self.deactivated

    deactivated = models.DateTimeField(blank=True, null=True, db_index=True)

    objects = DeactivateQueryset.as_manager()

    def deactivate(self):
        if self.deactivated:
            return
        self.deactivated = timezone.now()
        self.save()

    def reactivate(self):
        if not self.deactivated:
            return
        self.deactivated = None
        self.save()

    @property
    def is_active(self):
        return self.deactivated == None

    def clean(self):
        if not self.deactivated and self._orig_deactivated:
            raise ValidationError("Deactivated cannot be set back to None")

    # def save(self, *args, **kwargs):
    #     # self.full_clean()
    #     super(DeactivateMixin, self).save(*args, **kwargs)
