const Marty = require('marty');
const _ = require('lodash');
const Im = require('immutable');
const moment = require('moment');

import { INDEX_DESCRIPTORS, DEFAULT_DATETIME_DAY_RANGE } from './pivot-tables-tab-constants.jsx';

import app from 'core/application';

const Constants = Marty.createConstants([
  'UPDATE_PT_SELECTION',
  'UPDATE_PT_DATE_RANGE',
  'UPDATE_PT_SEARCH'
]);

const PivotTablesTabActionCreators = Marty.createActionCreators({
  id: 'PivotTablesTabActionCreators',
  updateSelection(key) {
    this.dispatch(Constants.UPDATE_PT_SELECTION, key);
  },
  updateDateRange(startDate, endDate) {
    this.dispatch(Constants.UPDATE_PT_DATE_RANGE, startDate, endDate);
  },
  setModuleAttemptSearch(str) {
    this.dispatch(Constants.UPDATE_PT_SEARCH, str);
  }
});

const PivotTablesTabStore = Marty.createStore({
  id: 'PivotTablesTabStore',
  handlers: {
    onUpdate: Constants.UPDATE_PT_SELECTION,
    onUpdateDateRange: Constants.UPDATE_PT_DATE_RANGE,
    onSetModuleAttemptSearch: Constants.UPDATE_PT_SEARCH
  },
  getInitialState() {
    return {
      selection: _.keys(INDEX_DESCRIPTORS)[0],
      startDate: moment().subtract(DEFAULT_DATETIME_DAY_RANGE, 'days'),
      endDate: moment(),
      search: ''
    };
  },
  onSetModuleAttemptSearch(str) {
    this.state.search = str;
    this.hasChanged();
  },
  getModuleAttemptSearch() {
    return this.state.search;
  },
  onUpdate(key) {
    if (!key) return;
    this.state.selection = key;
    this.hasChanged();
  },
  onUpdateDateRange(startDate, endDate) {
    this.state.startDate = startDate;
    this.state.endDate = endDate;
    this.hasChanged();
  },
  getSelectedIndexDescKey() {
    return this.state.selection;
  },
  getStartDate() {
    return this.state.startDate;
  },
  getEndDate() {
    return this.state.endDate;
  }
});

app.register('PivotTablesTabStore', PivotTablesTabStore);
app.register('PivotTablesTabActionCreators', PivotTablesTabActionCreators);

export default {
  Constants,
  ActionCreators: app.PivotTablesTabActionCreators,
  Store: app.PivotTablesTabStore
};
