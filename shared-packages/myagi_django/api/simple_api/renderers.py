from rest_framework import status, renderers

from rest_pandas.renderers import PandasCSVRenderer as BaseCSVRenderer

from pandas import DataFrame


ERRONEOUS_STR_1 = 'None,,'
CORRECT_STR_1 = ',,'
ERRONEOUS_STR_2 = 'None,'
CORRECT_STR_2 = ','


class PandasCSVRenderer(BaseCSVRenderer):

    def render(self, *args, **kwargs):
        out = super(PandasCSVRenderer, self).render(*args, **kwargs)
        # Pandas outputs 'None' text at start of first
        # two rows when encoding is set for the to_csv method.
        # No idea why, however this quick fix prevents those values
        # from being displayed to users.
        out = out.replace(ERRONEOUS_STR_1, CORRECT_STR_1)
        out = out.replace(ERRONEOUS_STR_2, CORRECT_STR_2)
        return out

    def get_pandas_kwargs(self, data):
        # This disables the default index column which is included by
        # pandas. This means that when a basic dataframe (not reindexed)
        # is converted to CSV, it won't have the extra, unnecessary
        # default index column at the start.
        do_not_include_index = not data.index.name and data.index.is_numeric() and not getattr(data.index, 'levels', None)
        return {'encoding': self.charset, 'index': not do_not_include_index}


class CSVTextRenderer(renderers.BaseRenderer):

    media_type = 'text/csv'
    format = 'csv'

    def render(self, data, media_type=None, renderer_context=None):
        return data.encode('utf-8')
