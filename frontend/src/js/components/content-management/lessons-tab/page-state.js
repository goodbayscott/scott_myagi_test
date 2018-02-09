import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import moment from 'moment';
import { momentToISO } from 'utilities/time';
import trainingPageUtils from 'utilities/component-helpers/training-page';

import app from 'core/application';

const Constants = Marty.createConstants([
  'LESSON_LIST_SET_LESSON_SEARCH',
  'LESSON_LIST_SET_FILTER',
  'LESSON_LIST_SET_LESSON_ORDER'
]);

const LessonListActionCreators = Marty.createActionCreators({
  id: 'LessonListActionCreators',
  onSetFilter(key) {
    this.dispatch(Constants.LESSON_LIST_SET_FILTER, key);
  },
  onSetLessonSearch(str) {
    this.dispatch(Constants.LESSON_LIST_SET_LESSON_SEARCH, str);
  },
  setLessonOrder(str) {
    this.dispatch(Constants.LESSON_LIST_SET_LESSON_ORDER, str);
  }
});

const LessonListStore = Marty.createStore({
  id: 'LessonListStore',
  handlers: {
    onSetLessonSearch: Constants.LESSON_LIST_SET_LESSON_SEARCH,
    onFilter: Constants.LESSON_LIST_SET_FILTER,
    onSetLessonOrder: Constants.LESSON_LIST_SET_LESSON_ORDER
  },
  getInitialState() {
    return {
      search: ''
    };
  },
  onFilter(key) {
    this.clearLessonFilter();
    this.state.filterKey = key;
    this.hasChanged();
  },

  onSetLessonSearch(str) {
    // this.clearLessonFilter();
    this.state.search = str;
    this.hasChanged();
  },

  onSetLessonOrder(str) {
    this.state.order = str;
    this.hasChanged();
  },

  clearLessonFilter() {
    if (!this.state.planIds) return;
    this.hasChanged();
  },

  getCurrentFilterQuery(currentUser) {
    const allFilters = this.setupFiltersForUser(currentUser);
    const filterDesc = _.findWhere(allFilters, { name: this.state.filterKey });
    return filterDesc.query;
  },

  getFilterNames() {
    return _.pluck(this.state.filterCache, 'name');
  },

  getFiltersForUser(currentUser) {
    const learner = currentUser.get('learner');
    const filters = [];
    filters.push({
      name: 'all_lessons',
      query: {
        deactivated__isnull: true,
        ordering: 'name'
      }
    });
    if (learner.can_manage_training_content) {
      filters.push({
        name: 'archived_lessons',
        query: {
          show_deactivated: true,
          ordering: '-deactivated'
        }
      });
    }
    return filters;
  },

  setupFiltersForUser(currentUser) {
    if (!this.state.filterCache) {
      this.state.filterCache = this.getFiltersForUser(currentUser);
      this.state.filterKey = this.state.filterCache[0].name;
    }
    return this.state.filterCache;
  },

  getLessonSearch() {
    return this.state.search;
  },

  getLessonOrder() {
    return this.state.order;
  },

  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('LessonListStore', LessonListStore);
app.register('LessonListActionCreators', LessonListActionCreators);

export default {
  Constants,
  ActionCreators: app.LessonListActionCreators,
  Store: app.LessonListStore
};
