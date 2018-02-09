import Marty from 'marty';
import { autoDispatch } from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import app from 'core/application';

const Constants = Marty.createConstants(['CONNECTION_SET_SEARCH']);

class ConnectionsActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.CONNECTION_SET_SEARCH, str);
}

class ConnectionsStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.CONNECTION_SET_SEARCH
    };
    this.resetState();
  }

  onSetSearch(str) {
    this.state.search = str;
    this.hasChanged();
  }

  getSearch() {
    return this.state.search;
  }

  resetState() {
    this.state = {
      search: ''
    };
  }
}

app.register('ConnectionsStore', ConnectionsStore);
app.register('ConnectionsActionCreators', ConnectionsActionCreators);

export default {
  Store: app.ConnectionsStore,
  ActionCreators: app.ConnectionsActionCreators
};
