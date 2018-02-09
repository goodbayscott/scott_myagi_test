const _ = require('lodash');
const Im = require('immutable');
const moment = require('moment');
require('moment-range');

const PT_AGG_HEADER_ROW = 0;
const PT_SUMMARY_VALUES_HEADER_ROW = 1;
const PT_INDEX_VALUES_HEADER_ROW = 2;

// NOTE: Val and agg header row index are
// reversed from pivot table when timeseries data is returned
// via python pandas.
const TS_VALUE_HEADER_ROW = 0;
const TS_AGG_HEADER_ROW = 1;
const TS_INDEX_HEADER_ROW = 2;

function parseVals(vals, parseFuncs) {
  let i = 0;
  return _.map(vals, val => {
    const f = parseFuncs[i];
    i += 1;
    if (f) {
      return f(val);
    }
    return val;
  });
}

function getIndexDescriptor(descs, attr) {
  return _.findWhere(descs, {
    attr
  });
}

function getValueDescriptor(descs, aggFunc, sumVal) {
  return _.findWhere(descs, {
    attr: sumVal,
    aggFunc
  });
}

function getHeadersAndRows(df, indexDescs, valDescs, aggHeaderRow, valHeaderRow, indexHeaderRow) {
  /*
    `df` should be a pivot table formatted immutable list of immutable lists (i.e. format returned
    by default from DataFrame stores).
    Retrieves headers and rows from `df` based on `indexDescriptors` and `valDescriptors`.
    Assumes that `df` is a pivot-table.
  */
  const ret = {
    headers: Im.List(),
    rows: Im.List()
  };
  const aggHeaders = df.get(aggHeaderRow);
  const summaryValHeaders = df.get(valHeaderRow);
  const indexValHeaders = df.get(indexHeaderRow);
  if (!aggHeaders || !summaryValHeaders || !indexValHeaders || !df.count()) return ret;
  const colsToDisplay = [];
  const parseFuncs = [];
  let topHeadersStartIndex = 0;
  // This while loop retrieves all the index headers (which display on left side of table)
  while (indexValHeaders.get(topHeadersStartIndex)) {
    const indexDesc = getIndexDescriptor(indexDescs, indexValHeaders.get(topHeadersStartIndex));
    if (indexDesc && !indexDesc.hidden) {
      ret.headers = ret.headers.push(indexDesc.name);
      colsToDisplay.push(topHeadersStartIndex);
      parseFuncs.push(indexDesc.parseFunc);
    }
    topHeadersStartIndex += 1;
  }
  // This while loop retrieves all the summary value headers (which display on right side of table)
  while (aggHeaders.get(topHeadersStartIndex) && summaryValHeaders.get(topHeadersStartIndex)) {
    const aggFunc = aggHeaders.get(topHeadersStartIndex);
    const sumVal = summaryValHeaders.get(topHeadersStartIndex);
    const valDesc = getValueDescriptor(valDescs, aggFunc, sumVal);
    if (valDesc && !valDesc.hidden) {
      ret.headers = ret.headers.push(valDesc.name);
      colsToDisplay.push(topHeadersStartIndex);
      parseFuncs.push(valDesc.parseFunc);
    }
    topHeadersStartIndex += 1;
  }
  // Last row is empty, so look at all values from headers until second last.
  ret.rows = df.slice(indexHeaderRow + 1, -1).map(row => {
    row = row.toArray();
    let vals = _.pullAt(row, colsToDisplay);
    vals = parseVals(vals, parseFuncs);
    return Im.List(vals);
  }, this);

  return ret;
}

export const PivotTableProcessor = function (indexDescriptors, valDescriptors) {
  /*
    `indexDescriptors` should be a list of objects, where objects
    can have an attr key (e.g. user__first_name) and a name (e.g. First Name). `valDescriptors` should be
    a list of objects, where objects can have an attr key (e.g. percentage_score) and an aggFunc (e.g. mean).
    It is assumed that these indexDescriptors and valDescriptors were used when retrieving the dataframe.
  */
  return {
    getIndexes() {
      return _.unique(_.pluck(indexDescriptors, 'attr'));
    },
    getValues() {
      return _.unique(_.pluck(valDescriptors, 'attr'));
    },
    getAggFuncs() {
      return _.unique(_.pluck(valDescriptors, 'aggFunc'));
    },
    _getHeadersAndRows(df) {
      return getHeadersAndRows(
        df,
        indexDescriptors,
        valDescriptors,
        PT_AGG_HEADER_ROW,
        PT_SUMMARY_VALUES_HEADER_ROW,
        PT_INDEX_VALUES_HEADER_ROW
      );
    },
    getHeaders(df) {
      return this._getHeadersAndRows(df).headers;
    },
    getRows(df) {
      return this._getHeadersAndRows(df).rows;
    }
  };
};

export const TimeseriesProcessor = function (indexDesc, valDescriptors, groupingDesc, opts) {
  return {
    getAggFuncs() {
      return _.unique(_.pluck(valDescriptors, 'aggFunc'));
    },
    getIndex() {
      return indexDesc.attr;
    },
    getValues() {
      return _.unique(_.pluck(valDescriptors, 'attr'));
    },
    getGroupBy() {
      return groupingDesc !== undefined ? groupingDesc.attr : null;
    },
    _getValueDescriptor(aggFunc, sumVal) {
      return _.findWhere(valDescriptors, {
        attr: sumVal,
        aggFunc
      });
    },
    isGrouped() {
      return groupingDesc !== undefined;
    },
    _getHeadersAndRows(df) {
      const indexDescs = [indexDesc];
      if (groupingDesc) indexDescs.push(groupingDesc);
      const headersAndRows = getHeadersAndRows(
        df,
        indexDescs,
        valDescriptors,
        TS_AGG_HEADER_ROW,
        TS_VALUE_HEADER_ROW,
        TS_INDEX_HEADER_ROW
      );
      return headersAndRows;
    },
    getHeaders(df) {
      return this._getHeadersAndRows(df).headers;
    },
    getRows(df) {
      return this._getHeadersAndRows(df).rows;
    },
    getGroupings(df) {
      /* Gets grouped rows, assumes that groupingDesc is defined */
      const headersAndRows = this._getHeadersAndRows(df);
      let groupings = Im.List();
      let currentGrouping = Im.Map();
      const indexForGroup = headersAndRows.headers.findIndex(header => header === groupingDesc.name);
      headersAndRows.rows.forEach(row => {
        const groupingVal = row.get(indexForGroup);
        if (currentGrouping.get('name') !== groupingVal) {
          if (currentGrouping.get('rows')) groupings = groupings.push(currentGrouping);
          currentGrouping = Im.Map({
            name: groupingVal,
            rows: Im.List()
          });
        }
        const newRows = currentGrouping.get('rows').push(row);
        currentGrouping = currentGrouping.set('rows', newRows);
      });
      if (currentGrouping.get('rows')) groupings = groupings.push(currentGrouping);
      return groupings;
    }
  };
};

export const DataframeProcessor = function () {
  return {
    toCSV(dataframe) {
      return dataframe.toJSON();
    }
  };
};
