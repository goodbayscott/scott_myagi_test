import Marty from 'marty';

import app from 'core/application';

const Constants = Marty.createConstants(['CONNECTIONS_SET_SEARCH']);

class ConnectionsActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.CONNECTIONS_SET_SEARCH, str);
}

class ConnectionsStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.CONNECTIONS_SET_SEARCH
    };
    this.resetState();
  }

  resetState() {
    const state = {
      search: ''
    };
    this.setState(state);
    this.hasChanged();
  }

  onSetSearch(search) {
    this.setState({ search });
    this.hasChanged();
  }

  getSearch() {
    return this.state.search;
  }
}

app.register('ConnectionsStore', ConnectionsStore);
app.register('ConnectionsActionCreators', ConnectionsActionCreators);

export default {
  Store: app.ConnectionsStore,
  ActionCreators: app.ConnectionsActionCreators
};
