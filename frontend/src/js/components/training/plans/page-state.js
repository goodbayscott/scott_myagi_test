import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import trainingPageUtils from 'utilities/component-helpers/training-page';

import app from 'core/application';

const Constants = Marty.createConstants([
  'TRAINING_LIST_SET_FILTER',
  'TRAINING_LIST_SET_ENROLL_MODE',
  'TRAINING_LIST_SELECT_FOR_ENROLLMENT',
  'TRAINING_LIST_SET_TRAINING_PLAN_SEARCH',
  'TRAINING_LIST_SET_TRAINING_PLAN_ORDER',
  'TRAINING_LIST_SET_TRAINING_PLAN_ID_FILTER'
]);

const TrainingListActionCreators = Marty.createActionCreators({
  id: 'TrainingListActionCreators',
  setFilter(key) {
    this.dispatch(Constants.TRAINING_LIST_SET_FILTER, key);
  },
  setEnrollMode(bool) {
    this.dispatch(Constants.TRAINING_LIST_SET_ENROLL_MODE, bool);
  },
  selectForEnrollment(tp) {
    this.dispatch(Constants.TRAINING_LIST_SELECT_FOR_ENROLLMENT, tp);
  },
  setTrainingPlanSearch(str) {
    this.dispatch(Constants.TRAINING_LIST_SET_TRAINING_PLAN_SEARCH, str);
  },
  setTrainingPlanOrder(str) {
    this.dispatch(Constants.TRAINING_LIST_SET_TRAINING_PLAN_ORDER, str);
  },
  setTrainingPlanIdFilter(str) {
    this.dispatch(Constants.TRAINING_LIST_SET_TRAINING_PLAN_ID_FILTER, str);
  }
});

const TrainingListStore = Marty.createStore({
  id: 'TrainingListStore',
  handlers: {
    onFilter: Constants.TRAINING_LIST_SET_FILTER,
    onSetEnrollMode: Constants.TRAINING_LIST_SET_ENROLL_MODE,
    onSelectForEnrollment: Constants.TRAINING_LIST_SELECT_FOR_ENROLLMENT,
    onSetTrainingPlanSearch: Constants.TRAINING_LIST_SET_TRAINING_PLAN_SEARCH,
    onSetTrainingPlanOrder: Constants.TRAINING_LIST_SET_TRAINING_PLAN_ORDER,
    onSetTrainingPlanIdFilter: Constants.TRAINING_LIST_SET_TRAINING_PLAN_ID_FILTER
  },
  getInitialState() {
    return {
      filterKey: null,
      filters: [],
      enrollModeEnabled: false,
      selectedForEnrollment: Im.Map(),
      search: '',
      order: null,
      planIds: ''
    };
  },
  onFilter(key) {
    this.clearTrainingPlanFilter();
    this.state.filterKey = key;
    this.hasChanged();
  },
  onSetEnrollMode(bool) {
    this.state.enrollModeEnabled = bool;
    if (!bool) this.state.selectedForEnrollment = Im.Map();
    this.hasChanged();
  },
  onSelectForEnrollment(tp) {
    if (this.state.selectedForEnrollment.get(tp.get('id'))) {
      this.state.selectedForEnrollment = this.state.selectedForEnrollment.delete(tp.get('id'));
    } else {
      this.state.selectedForEnrollment = this.state.selectedForEnrollment.set(tp.get('id'), tp);
    }
    this.hasChanged();
  },

  onSetTrainingPlanSearch(str) {
    this.clearTrainingPlanFilter();
    this.state.search = str;
    this.hasChanged();
  },

  onSetTrainingPlanOrder(order) {
    this.state.order = order;
    this.hasChanged();
  },

  onSetTrainingPlanIdFilter(str) {
    // set filter for training plan id in query string
    this.state.planIds = str;
    this.hasChanged();
  },

  clearTrainingPlanFilter() {
    // We want to get rid of any filtering by plan id if the user tries
    // to apply another filter or search.
    if (!this.state.planIds) return;
    this.onSetTrainingPlanIdFilter('');
    history.replaceState({}, '', window.location.pathname);
    this.hasChanged();
  },

  getTrainingPlanIDFilter() {
    return this.state.planIds;
  },

  getCurrentFilterQuery(currentUser) {
    const allFilters = this.setupFiltersForUser(currentUser);
    const filterDesc = _.findWhere(allFilters, { name: this.state.filterKey });
    if (filterDesc && filterDesc.query) return filterDesc.query;
    return {};
  },

  getFilterNames() {
    return _.pluck(this.state.filterCache, 'name');
  },

  setupFiltersForUser(currentUser) {
    if (!this.state.filterCache) {
      this.state.filterCache = trainingPageUtils.getFiltersForUser(currentUser);
      this.state.filterKey = this.state.filterCache[0].name;
    }
    return this.state.filterCache;
  },
  getEnrollModeEnabled() {
    return this.state.enrollModeEnabled;
  },
  isSelectedForEnrollment(tp) {
    return this.state.selectedForEnrollment.get(tp.get('id')) !== undefined;
  },
  getSelectedPlans() {
    return this.state.selectedForEnrollment
      .toSeq()
      .valueSeq()
      .toList();
  },
  getTrainingPlanSearch() {
    return this.state.search;
  },
  getTrainingPlanOrder() {
    return this.state.order;
  },
  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('TrainingListStore', TrainingListStore);
app.register('TrainingListActionCreators', TrainingListActionCreators);

export default {
  Constants,
  ActionCreators: app.TrainingListActionCreators,
  Store: app.TrainingListStore
};
