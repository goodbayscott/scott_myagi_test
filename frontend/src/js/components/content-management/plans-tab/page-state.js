import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import moment from 'moment';

import { momentToISO } from 'utilities/time';
import { getIdFromApiUrl } from 'utilities/generic';

import app from 'core/application';

const Constants = Marty.createConstants([
  'TRAINING_LIST_SET_FILTER',
  'TRAINING_LIST_SET_ENROLL_MODE',
  'TRAINING_LIST_SELECT_FOR_ENROLLMENT',
  'TRAINING_LIST_SET_TRAINING_PLAN_SEARCH',
  'TRAINING_LIST_SET_TRAINING_PLAN_ID_FILTER'
]);

export const filterNames = {
  COMPANY_PLANS: 'company_plans',
  TEAM_PLANS: 'team_plans',
  MY_TEAM_PLANS: 'my_team_plans',
  PLANS_FROM_CHANNELS: 'external_plans',
  ARCHIVED_PLANS: 'archived_plans'
};

const PlanListActionCreators = Marty.createActionCreators({
  id: 'PlanListActionCreators',
  setFilter(key) {
    this.dispatch(Constants.TRAINING_LIST_SET_FILTER, key);
  },
  setTrainingPlanSearch(str) {
    this.dispatch(Constants.TRAINING_LIST_SET_TRAINING_PLAN_SEARCH, str);
  },
  setTrainingPlanIdFilter(str) {
    this.dispatch(Constants.TRAINING_LIST_SET_TRAINING_PLAN_ID_FILTER, str);
  }
});

const PlanListStore = Marty.createStore({
  id: 'PlanListStore',
  handlers: {
    onFilter: Constants.TRAINING_LIST_SET_FILTER,
    onSetTrainingPlanSearch: Constants.TRAINING_LIST_SET_TRAINING_PLAN_SEARCH,
    onSetTrainingPlanIdFilter: Constants.TRAINING_LIST_SET_TRAINING_PLAN_ID_FILTER
  },
  getInitialState() {
    return {
      filterKey: null,
      filters: [],
      enrollModeEnabled: false,
      selectedForEnrollment: Im.Map(),
      search: '',
      planIds: ''
    };
  },
  onFilter(key) {
    this.clearTrainingPlanFilter();
    this.state.filterKey = key;
    this.hasChanged();
  },
  onSetTrainingPlanSearch(str) {
    this.clearTrainingPlanFilter();
    this.state.search = str;
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

  getCurrentFilterQuery(currentUser, initialValue) {
    const allFilters = this.setupFiltersForUser(currentUser, initialValue);
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
      name: filterNames.COMPANY_PLANS,
      query: {
        owner: learner.company.id,
        exclude_team_plans: true,
        ordering: 'name'
      }
    });
    if (learner.is_company_admin && currentUser.get('feature_flags')['team-content']) {
      filters.push({
        name: filterNames.TEAM_PLANS,
        query: {
          owner: learner.company.id,
          is_team_plan: true,
          ordering: 'name'
        }
      });
    }
    if (
      learner.is_learner_group_admin &&
      learner.learner_group &&
      currentUser.get('feature_flags')['team-content']
    ) {
      filters.push({
        name: filterNames.MY_TEAM_PLANS,
        query: {
          owner: learner.company.id,
          training_units__learner_group: getIdFromApiUrl(learner.learner_group),
          ordering: 'name'
        }
      });
    }
    filters.push({
      name: filterNames.PLANS_FROM_CHANNELS,
      query: {
        shared_with: learner.company.id,
        exclude_owner: learner.company.id,
        ordering: 'name'
      }
    });
    if (learner.can_manage_training_content) {
      filters.push({
        name: filterNames.ARCHIVED_PLANS,
        query: {
          show_deactivated: true,
          owner: learner.company.id,
          ordering: '-deactivated'
        }
      });
    }
    return filters;
  },

  getDescriptionForFilter(filterName) {
    return FILTER_DESCRIPTIONS[filterName];
  },

  getPlanDueSoonDatetime() {
    const now = moment();
    return momentToISO(now.add(...SOON_TIME_SPAN));
  },

  setupFiltersForUser(currentUser, initialValue) {
    if (!this.state.filterCache) {
      this.state.filterCache = this.getFiltersForUser(currentUser);
      this.state.filterKey = initialValue || this.state.filterCache[0].name;
    }
    return this.state.filterCache;
  },
  getTrainingPlanSearch() {
    return this.state.search;
  },
  getCurrentFilterName() {
    return this.state.filterKey;
  },
  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('PlanListStore', PlanListStore);
app.register('PlanListActionCreators', PlanListActionCreators);

export default {
  Constants,
  ActionCreators: app.PlanListActionCreators,
  Store: app.PlanListStore
};
