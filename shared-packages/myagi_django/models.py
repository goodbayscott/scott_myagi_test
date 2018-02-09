from django.db import models
from django.utils import timezone

from polymorphic.models import PolymorphicModel as BasePolymorphicModel


class Model(models.Model):

    """
    Subclass this to reduce boilerplate when creating a new model.
    """

    class Meta():
        abstract = True

    def __unicode__(self):
        return "%s-%s" % (self.__class__.__name__, str(self.pk))

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)


class OrderedModel(models.Model):

    order = models.PositiveIntegerField(editable=False, db_index=True)

    class Meta:
        abstract = True
        ordering = ('order',)


class PolymorphicModel(BasePolymorphicModel):

    """
    Subclass this to reduce boilerplate when creating a new polymorphic model.
    """

    class Meta():
        abstract = True

    def __unicode__(self):
        return "%s-%s" % (self.__class__.__name__, str(self.pk))

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
