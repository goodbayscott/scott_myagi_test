import copy

from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

from rest_framework import serializers

import rest_pandas

from .utils.pandas.io import read_frame

from .decorators import classproperty

from .utils.serializer_loading import get_serializer_for_model
from .fields import ExpandableRelatedField

RELATED_FIELD_SEPARATOR = "."
ALL_FIELDS_SPECIFIER = "*"
FIELDS_DIVIDER = ","
SEARCH_RANK = 'search_rank'


class ModelSerializer(serializers.HyperlinkedModelSerializer):
    """
    Base class from which all serializers should extend.
    Includes functionality which we want to share amongst all
    serializers (e.g. handling of the `fields` query parameter).
    """

    serializer_related_field = ExpandableRelatedField

    # Show id as well as URL for each
    # model by default
    id = serializers.IntegerField(read_only=True, source='pk')

    def _process_fields_based_on_context(self, all_fields, extra_fields=[]):
        """
        Determines which fields on the serializer to include based on
        `self.context`, which may include a `requested_fields` value which
        indicates which fields should be included or a request which has
        a "fields" query that does the same thing.

        NOTE - This function mutates all_fields
        TODO - Decide whether to send BadRequest if invalid field specified
        """
        request = self.context.get("request")
        if request:
            request_params = getattr(request, "query_params", request.GET)
            fields_in_request = request_params.get("fields")
            if fields_in_request:
                fields_in_request = fields_in_request.split(FIELDS_DIVIDER)
        else:
            fields_in_request = None
        # requested_fields option takes precendant over fields requested query_params, as requested_fields option
        # is used by parent serializers to pass along relevant requested fields to nested serializers.
        # If neither of these values are set, fall back to
        # default_requested_fields`
        fields = self.context.get("requested_fields", fields_in_request) or getattr(
            self.__class__.Meta, 'default_requested_fields', None)
        if fields:
            fields = list(fields)
            fields += extra_fields
            relevant_fields = []
            for field in fields:
                try:
                    field = field.split(RELATED_FIELD_SEPARATOR)[0]
                    relevant_fields.append(field)
                except IndexError:
                    pass
            if not ALL_FIELDS_SPECIFIER in fields:
                # Drop any fields that are not specified in the `fields`
                # argument.
                allowed = set(relevant_fields)
                existing = set(all_fields.keys())
                for field_name in existing - allowed:
                    all_fields.pop(field_name)
            # Get the relevant expansion information for related fields.
            fields_to_expand_map = {}
            for field in fields:
                try:
                    field_parts = field.split(RELATED_FIELD_SEPARATOR)
                    if len(field_parts) > 1:
                        key = field_parts[0]
                        if key not in fields_to_expand_map:
                            fields_to_expand_map[key] = []
                        fields_to_expand_map[key].append(
                            RELATED_FIELD_SEPARATOR.join(field_parts[1:]))
                except IndexError:
                    pass
            for key, val in all_fields.iteritems():
                # Set requested_fields value for expandable fields.
                requested_fields = fields_to_expand_map.get(key, [])
                if hasattr(val, 'requested_fields'):
                    val.requested_fields = requested_fields
                elif hasattr(val, 'child_relation') and hasattr(
                        val.child_relation, 'requested_fields'):
                    val.child_relation.requested_fields = requested_fields
        return all_fields

    def get_fields(self, extra_fields=[]):
        """
        Limits the fields used during serialization based on value of `fields`
        query in request, or on the value of `requested_fields` which may be
        included in `self.context`.

        The `extra_fields` argument can be used by subclasses to add additional fields
        based on certain factors.
        """
        fields = super(ModelSerializer, self).get_fields()
        fields = self._process_fields_based_on_context(
            fields, extra_fields=extra_fields)
        return fields

    def build_obj(self, data=None):
        """ Much of this is copied from the create method
        of ModelSerializer in DRF, as we need to be able
        to create an object using the serializer without saving it,
        which the create method does not allow.
        """
        from rest_framework.utils import model_meta
        from rest_framework.serializers import raise_errors_on_nested_writes

        # Copy as validated_data is mutated
        if data == None:
            data = self.validated_data
        validated_data = copy.copy(data)

        raise_errors_on_nested_writes('create', self, validated_data)

        ModelClass = self.Meta.model

        # Remove many-to-many relationships from validated_data.
        # They are not valid arguments to the default `.create()` method,
        # as they require that the instance has already been saved.
        info = model_meta.get_field_info(ModelClass)
        many_to_many = {}
        for field_name, relation_info in info.relations.items():
            if relation_info.to_many and (field_name in validated_data):
                many_to_many[field_name] = validated_data.pop(field_name)

        try:
            instance = ModelClass(**validated_data)
        except TypeError as exc:
            msg = ('Got a `TypeError` when building `%s` object. '
                   'This may be because you have a writable field on the '
                   'serializer class that is not a valid argument to '
                   '`%s` init. You may need to make the field '
                   'read-only, or override the __init__ method to handle '
                   'this correctly.\nOriginal exception text was: %s.' %
                   (ModelClass.__name__, ModelClass.__name__,
                    self.__class__.__name__, exc))
            raise TypeError(msg)

        return instance

    def call_model_clean_using_data(self, data):
        """ If validation logic is in model clean method,
        this can be used to trigger that method. """
        try:
            return self.build_obj(data).clean()
        except ValidationError as e:
            # Convert exception to DRF validation error
            # so that it is returned as a 400
            raise serializers.ValidationError(e.message)


class PolymorphicModelSerializer(ModelSerializer):
    """
    Can be used with polymorphic models to represent underlying
    subtypes for a model using the value of `subtype_serializers`,
    which is an attribute on the Meta class.
    """

    type = serializers.ReadOnlyField(source='polymorphic_ctype.model')

    def to_representation(self, obj):
        """
        For a given model, attempts to find relevant serializer for that
        model using the serializers in `self.subtype_serializers`, then uses
        that serializer to represent the object.
        """
        subtype_serializers_map = {}
        for subtype_serializer in self.__class__.Meta.subtype_serializers:
            subtype_serializers_map[
                subtype_serializer.Meta.model] = subtype_serializer
        for model in subtype_serializers_map:
            if isinstance(obj, model):
                serializer = subtype_serializers_map[model]
                r = serializer(
                    obj, context=self.context).to_representation(obj)
                return r
        # Could not find subtype serializer, so just just the serializer.
        return super(PolymorphicModelSerializer, self).to_representation(obj)


class SearchableModelSerializer(ModelSerializer):
    """ Simply adds the search_rank attribute. Assumes that the make_search_queryset function
    is used and the search_rank value will be set on each instance. """

    search_rank = serializers.SerializerMethodField()

    def get_search_rank(self, obj):
        # Required for searching using __search
        # and then ordering the results. Should abstract
        # this out if it is needed elsewhere
        return getattr(obj, SEARCH_RANK, 0.0)

    def get_fields(self):
        """
        Makes sure that `search_rank` is always returned if `search` query is used.
        This is useful for the frontend, so that it does not always have to explicitly request
        the `search_rank` field when searching.
        """
        request = self.context.get("request")
        extra_fields = []
        # Only add SEARCH_RANK field if this is the root serializer
        if request and not self.context.get("requested_fields"):
            if request.GET.get('search'):
                extra_fields.append(SEARCH_RANK)
        fields = super(SearchableModelSerializer, self).get_fields(
            extra_fields=extra_fields)
        return fields


class PandasSerializer(ModelSerializer):
    @classmethod
    def get_dataframe_fieldnames(cls):
        return getattr(cls.Meta, 'fieldnames', [])

    @classmethod
    def transform_dataframe(cls, df):
        # Override if necessary
        return df


class PandasListSerializer(rest_pandas.PandasSerializer):
    """
    More performant version of original PandasSerializer from rest_pandas. Avoids
    proper serialization of each model in queryset and instead just uses read_frames
    func from django_pandas (which retrieves value lists from db as opposed to proper
    python objects).
    """

    @property
    def data(self):
        # Assumes self.instance is a queryset
        df = read_frame(
            self.instance,
            fieldnames=self.child.get_dataframe_fieldnames(),
            # No verbosity significantly reduces time it takes
            # to create dataframe
            verbose=False)
        df = self.child.transform_dataframe(df)
        return self.transform_dataframe(df)
