import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import moment from 'moment-timezone';

import app from 'core/application';

const Constants = Marty.createConstants([
  'PUBLIC_CHANNEL_SEARCH',
  'PUBLIC_CHANNEL_TAGS',
  'PUBLIC_CHANNEL_TAGS_FILTER'
]);

const ChannelDiscoveryActionCreators = Marty.createActionCreators({
  id: 'ChannelDiscoveryActionCreators',
  setPublicChannelSearch(str) {
    this.dispatch(Constants.PUBLIC_CHANNEL_SEARCH, str);
  },
  toggleTagActive(ids) {
    this.dispatch(Constants.PUBLIC_CHANNEL_TAGS, ids);
  },
  clearTagFilters() {
    this.dispatch(Constants.PUBLIC_CHANNEL_TAGS_FILTER);
  }
});

const ChannelDiscoveryStore = Marty.createStore({
  id: 'ChannelDiscoveryStore',
  handlers: {
    onSetPublicChannelSearch: Constants.PUBLIC_CHANNEL_SEARCH,
    onToggleTagActive: Constants.PUBLIC_CHANNEL_TAGS,
    onClearTagFilters: Constants.PUBLIC_CHANNEL_TAGS_FILTER
  },
  getInitialState() {
    return {
      search: '',
      tags: []
    };
  },
  onClearTagFilters() {
    this.setState({ tags: [] });
    this.hasChanged();
  },
  onSetPublicChannelSearch(str) {
    this.state.search = str;
    this.hasChanged();
  },
  onToggleTagActive(id) {
    let newTags = this.state.tags;
    if (newTags.indexOf(id) === -1) {
      newTags.push(id);
    } else {
      newTags = _.without(this.state.tags, id);
    }
    this.setState({ tags: newTags });
    this.hasChanged();
  },
  getPublicChannelSearch() {
    return this.state.search;
  },
  getTagsFilter() {
    return this.state.tags;
  },
  isTagActive(id) {
    return this.state.tags.indexOf(id) > -1;
  },
  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('ChannelDiscoveryStore', ChannelDiscoveryStore);
app.register('ChannelDiscoveryActionCreators', ChannelDiscoveryActionCreators);

export default {
  Constants,
  ActionCreators: app.ChannelDiscoveryActionCreators,
  Store: app.ChannelDiscoveryStore
};
