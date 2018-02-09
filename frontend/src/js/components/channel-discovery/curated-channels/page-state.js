import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import moment from 'moment-timezone';

import app from 'core/application';

const Constants = Marty.createConstants(['PUBLIC_CURATED_CHANNEL_SEARCH']);

const CuratedChannelActionCreators = Marty.createActionCreators({
  id: 'CuratedChannelActionCreators',
  setCuratedChannelSearch(str) {
    this.dispatch(Constants.PUBLIC_CURATED_CHANNEL_SEARCH, str);
  }
});

const CuratedChannelStore = Marty.createStore({
  id: 'CuratedChannelStore',
  handlers: {
    onSetCuratedChannelSearch: Constants.PUBLIC_CURATED_CHANNEL_SEARCH
  },
  getInitialState() {
    return {
      search: ''
    };
  },
  onSetCuratedChannelSearch(str) {
    this.state.search = str;
    this.hasChanged();
  },
  getCuratedChannelSearch() {
    return this.state.search;
  },
  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('CuratedChannelStore', CuratedChannelStore);
app.register('CuratedChannelActionCreators', CuratedChannelActionCreators);

export default {
  Constants,
  ActionCreators: app.CuratedChannelActionCreators,
  Store: app.CuratedChannelStore
};
