import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import app from 'core/application';

const Constants = Marty.createConstants(['CHANNEL_LIST_SET_SEARCH']);

const ChannelListActionCreators = Marty.createActionCreators({
  id: 'ChannelListActionCreators',
  setChannelSearch(str) {
    this.dispatch(Constants.CHANNEL_LIST_SET_SEARCH, str);
  }
});

const ChannelListStore = Marty.createStore({
  id: 'ChannelListStore',
  handlers: {
    onSetChannelSearch: Constants.CHANNEL_LIST_SET_SEARCH
  },
  getInitialState() {
    return {
      search: ''
    };
  },

  onSetChannelSearch(str) {
    this.state.search = str;
    this.hasChanged();
  },

  getChannelSearch() {
    return this.state.search;
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
