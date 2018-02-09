import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['USER_ENROLLMENTS_SET_USER_SEARCH']);

class EnrollmentsActionCreators extends Marty.ActionCreators {
  setUserSearch = str => {
    this.dispatch(Constants.USER_ENROLLMENTS_SET_USER_SEARCH, str);
  };
}

class EnrollmentsStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.state = {
      search: ''
    };
    this.handlers = {
      onSetUserSearch: Constants.USER_ENROLLMENTS_SET_USER_SEARCH
    };
  }
  onSetUserSearch(str) {
    this.state.search = str;
    this.hasChanged();
  }
  getUserSearch() {
    return this.state.search;
  }
  resetState() {
    this.state = this.getInitialState();
  }
}

app.register('EnrollmentsStore', EnrollmentsStore);
app.register('EnrollmentsActionCreators', EnrollmentsActionCreators);

export default {
  Constants,
  ActionCreators: app.EnrollmentsActionCreators,
  Store: app.EnrollmentsStore
};
