from django.contrib.postgres.search import SearchQuery, SearchVector, SearchRank, TrigramSimilarity
from django.db.models import Q, F, Value, Max
from django.db.models.functions import Concat

from rest_framework.filters import DjangoFilterBackend as DRFDjangoFilterBackend

from rest_framework_filters.filterset import FilterSet, FilterSetMetaclass
import rest_framework_filters as filters

from rest_framework.utils import model_meta

RELATED_FIELD_SEP = '__'
SEARCH_RANK_THRESHOLD = 0.05
MIN_TRIGRAM_LEN = 3


class NoValidationFilterSet(FilterSet):
    @property
    def qs(self):
        """ URGENT TODO - Figure out if there are any major security concerns with
        just blindly using filters like this. I've basically overriden the
        default implementation of this method from django-filters completely.
        The original does some checking to see if filters are valid based on it's
        internal form, which would always determine that related lookups like
        response__isnull were invalid (and would therefore return an empty qs).
        """
        filter_kwargs = {}
        for f in self.data:
            if f in self.filters:
                filter_kwargs[f] = self.data[f]
        return self.queryset.filter(**filter_kwargs)


class DjangoFilterBackend(DRFDjangoFilterBackend):
    """ Can be used to customize DRF filtering system. """

    # default_filter_set = NoValidationFilterSet

    def to_html(self, request, queryset, view):
        # This method is used by the API exploration view,
        # however can cause a huge amount of DB queries in instances
        # where a particular filter can have a large range of choices
        return ''

    def filter_queryset(self, request, queryset, view):
        """
        Can sometimes get duplicates in results, so have added distinct call to ensure
        these are removed.
        """
        qs = super(DjangoFilterBackend, self).filter_queryset(
            request, queryset, view)
        return qs.distinct()


_field_info_cache = {}


def _get_field_info(Model):
    if Model not in _field_info_cache:
        _field_info_cache[Model] = model_meta.get_field_info(Model)
    return _field_info_cache[Model]


def _get_related_model(Model, field_name):
    info = _get_field_info(Model)
    try:
        return info.relations[field_name].related_model
    except (AttributeError, KeyError):
        return None


def _get_model_field(Model, field_name):
    info = _get_field_info(Model)
    return info.fields_and_pk.get(field_name, info.relations.get(field_name))


def create_filter_class(Model, *args, **kwargs):
    """ Pass in a Model and a set of fields on that model. This
    function will return a FilterSet class which allows all lookup types
    (e.g. contains, exact, lt, gt ...) when filtering on the specified fields via the
    API.

    Also generates related filter sets. E.g. if somefield__first_name
    is specified, then all filter types will be available for somefield__first_name.

    Finally, if kwargs are interpreted as custom paramater to function mappings.
    If the parameter is included in the request, then the queryset will be passed into
    the associated function and a new queryset is assumed to be returned with some
    new query.
    """

    # Construct filter_set classes for any related fields
    related_fields = {}
    args = list(args)
    for f in args:
        if RELATED_FIELD_SEP in f or _get_related_model(Model, f):
            parts = f.split(RELATED_FIELD_SEP)
            fname = parts[0]
            if fname not in related_fields:
                related_fields[fname] = []
            if fname not in args:
                # Make sure the base field name is also in
                # args, or else filter class will not
                # work as expected.
                args.append(fname)
            rest = RELATED_FIELD_SEP.join(parts[1:])
            if rest:
                related_fields[fname].append(rest)
    related_classes = {}
    for f, model_fields in related_fields.iteritems():
        rel_model = _get_related_model(Model, f)
        # Recursively create related filter set
        related_classes[f] = create_filter_class(rel_model, *model_fields)

    def validate_field(f):
        if not _get_model_field(Model, f):
            raise Exception(
                "Field '%s' specified in create_filter_class func does not exist on %s"
                % (f, Model))

    # Construct the class attributes for the new filter set.
    # Will included related fields and all lookups filter fields
    # where necessary.
    fields_on_model = []
    class_attrs = {}

    for f in args:
        # fields of related fields will be handled by the related_class
        # generated for that related field
        if RELATED_FIELD_SEP in f:
            continue
        validate_field(f)
        if f in related_classes:
            # TODO - Should we somehow filter the queryset?
            class_attrs[f] = filters.RelatedFilter(
                related_classes[f],
                name=f,
                queryset=related_classes[f].Meta.model.objects.all())
        else:
            class_attrs[f] = filters.AllLookupsFilter(name=f)
        fields_on_model.append(f)

    class AllLookupsFilterSetMetaclass(FilterSetMetaclass):
        def __new__(cls, name, bases, attrs):
            # On class instantiation, make sure generated fields are included
            attrs.update(class_attrs)
            return super(AllLookupsFilterSetMetaclass, cls).__new__(
                cls, name, bases, attrs)

    class AllLookupsFilterSet(FilterSet):

        __metaclass__ = AllLookupsFilterSetMetaclass

        class Meta:
            model = Model
            # NOTE - If this fields option is not specified,
            # then all model fields will be filterable
            fields = fields_on_model

        def __init__(self, *args, **kwargs):
            super(AllLookupsFilterSet, self).__init__(*args, **kwargs)

        @property
        def qs(self):
            qs = super(AllLookupsFilterSet, self).qs
            # kwargs can be used to provide extra functions which should be run
            # when particular params are included in the request
            for extra_filter in kwargs:
                if extra_filter in self.data:
                    qs = kwargs[extra_filter](qs, self.data[extra_filter])
            # Added `distinct` call, as there should be no situation under
            # which we don't want distinct values
            return qs.distinct()

        def get_allowed_filter_names(self):
            return self.filters.keys() + kwargs.keys()

    # Initialising the filterset multiple times
    # prevents issues with related filters not working
    # until class has been used once. This is a bit of
    # hack...
    AllLookupsFilterSet()
    AllLookupsFilterSet()

    return AllLookupsFilterSet


def _do_trigram_search(qs, field, val):
    if type(field) == list:
        field_tmp = []
        for f in field:
            # Add F expression and space Value for this field
            field_tmp.append(F(f))
            field_tmp.append(Value('||'))
        # This means that search will be across all fields
        field = Concat(*field_tmp)
    qs = qs.annotate(
        search_rank=TrigramSimilarity(field, val),
    ).filter(
        search_rank__gt=SEARCH_RANK_THRESHOLD
    )
    return qs


def _do_contains_search(qs, field, val):
    if type(field) != list:
        field = [field]
    q = Q()
    for f in field:
        fil = '%s__icontains' % f
        q = q | Q(**{fil: val})
    # Just use first field to compute similarity...should be enough
    # for now given this function is only used when search is 1-2 characters.
    qs = qs.annotate(
        search_rank=TrigramSimilarity(field[0], val)
    )
    return qs.filter(q)


def make_trigram_search_queryset(qs, field, val):
    """ Simplifies the process of creating a search query. Pass in queryset (`qs`)
    that is being search, a `field` to search on and a search query (`val`). `field` can
    also be a list of column names, in which case all of them will be searched.
    Resulting queryset can be ordered by search_rank if desired (e.g. `qs.order_by('-search_rank')`).

    If the length of val is less than MIN_TRIGRAM_LEN, then a simple icontains search will be used instead
    (because trigram search will return nothing).
    """
    if not val:
        return qs

    if len(val) < MIN_TRIGRAM_LEN:
        qs = _do_contains_search(qs, field, val)
    else:
        qs = _do_trigram_search(qs, field, val)

    return qs.annotate(
        # override search_rank with the max, then run distinct
        # otherwise distinct doesn't work and duplicates will appear
        # if searching multiple fields
        search_rank=Max('search_rank')
    ).distinct()
