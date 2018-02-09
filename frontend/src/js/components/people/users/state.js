import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;

import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['PEOPLE_USER_SET_SEARCH']);

class PeopleUserActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.PEOPLE_USER_SET_SEARCH, str);
}

class PeopleUserStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.PEOPLE_USER_SET_SEARCH
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

app.register('PeopleUserStore', PeopleUserStore);
app.register('PeopleUserActionCreators', PeopleUserActionCreators);

export default {
  Store: app.PeopleUserStore,
  ActionCreators: app.PeopleUserActionCreators
};
