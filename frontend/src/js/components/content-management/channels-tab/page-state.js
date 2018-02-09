import Marty from 'marty';
import _ from 'lodash';

import app from 'core/application';

export const YOUR_CHANNELS = 'your_channels';
export const EXTERNAL_CHANNELS = 'external_channels';
export const TEAM_CHANNELS = 'team_channels';

const STD_ORDER = 'order,name';

const Constants = Marty.createConstants([
  'CHANNEL_LIST_SET_CHANNEL_SEARCH',
  'CHANNEL_LIST_SET_FILTER',
  'CHANNEL_LIST_SET_CHANNEL_ORDER'
]);

const ChannelListActionCreators = Marty.createActionCreators({
  id: 'ChannelListActionCreators',
  onSetFilter(key) {
    this.dispatch(Constants.CHANNEL_LIST_SET_FILTER, key);
  },
  onSetChannelSearch(str) {
    this.dispatch(Constants.CHANNEL_LIST_SET_CHANNEL_SEARCH, str);
  },
  setChannelOrder(str) {
    this.dispatch(Constants.CHANNEL_LIST_SET_CHANNEL_ORDER, str);
  }
});

const ChannelListStore = Marty.createStore({
  id: 'ChannelListStore',
  handlers: {
    onSetChannelSearch: Constants.CHANNEL_LIST_SET_CHANNEL_SEARCH,
    onFilter: Constants.CHANNEL_LIST_SET_FILTER,
    onSetChannelOrder: Constants.CHANNEL_LIST_SET_CHANNEL_ORDER
  },
  getInitialState() {
    return {
      search: ''
    };
  },
  onFilter(key) {
    this.clearChannelFilter();
    this.state.filterKey = key;
    this.hasChanged();
  },

  onSetChannelSearch(str) {
    // this.clearChannelFilter();
    this.state.search = str;
    this.hasChanged();
  },

  onSetChannelOrder(order) {
    this.state.order = order;
    this.hasChanged();
  },

  clearChannelFilter() {
    if (!this.state.planIds) return;
    this.hasChanged();
  },

  getCurrentFilterQuery(currentUser, initialValue) {
    const allFilters = this.setupFiltersForUser(currentUser, initialValue);
    const filterDesc = _.findWhere(allFilters, { name: this.state.filterKey });
    return filterDesc.query;
  },

  getFilterNames() {
    return _.pluck(this.state.filterCache, 'name');
  },

  getCurrentFilter() {
    return this.state.filterKey;
  },

  getFiltersForUser(currentUser) {
    const learner = currentUser.get('learner');
    let filters = [
      {
        name: YOUR_CHANNELS,
        query: {
          deactivated__isnull: true,
          learner_group__isnull: true,
          ordering: STD_ORDER,
          company: learner.company.id
        }
      },
      currentUser.get('feature_flags')['team-content'] && {
        name: TEAM_CHANNELS,
        query: {
          deactivated__isnull: true,
          learner_group__isnull: false,
          ordering: STD_ORDER,
          company: learner.company.id
        }
      },
      {
        name: EXTERNAL_CHANNELS,
        query: {
          deactivated__isnull: true,
          ordering: STD_ORDER,
          is_external: learner.company.id
        }
      },
      {
        name: 'archived_channels',
        query: {
          show_deactivated: true,
          ordering: '-deactivated',
          company: learner.company.id
        }
      }
    ];
    filters = _.filter(filters, Boolean);
    return filters;
  },

  setupFiltersForUser(currentUser, initialValue) {
    if (!this.state.filterCache) {
      this.state.filterCache = this.getFiltersForUser(currentUser);
      this.state.filterKey = initialValue || this.state.filterCache[0].name;
    }
    return this.state.filterCache;
  },

  getChannelSearch() {
    return this.state.search;
  },

  getChannelOrder() {
    return this.state.order;
  },

  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('ChannelListStore', ChannelListStore);
app.register('ChannelListActionCreators', ChannelListActionCreators);

export default {
  Constants,
  ActionCreators: app.ChannelListActionCreators,
  Store: app.ChannelListStore
};
