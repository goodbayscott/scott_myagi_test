import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;

import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['ENROLLMENT_GROUPS_SET_SEARCH']);

class EnrollmentGroupsPageActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.ENROLLMENT_GROUPS_SET_SEARCH, str);
}

class EnrollmentGroupsPageStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.ENROLLMENT_GROUPS_SET_SEARCH
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

app.register('EnrollmentGroupsPageStore', EnrollmentGroupsPageStore);
app.register('EnrollmentGroupsPageActionCreators', EnrollmentGroupsPageActionCreators);

export default {
  Store: app.EnrollmentGroupsPageStore,
  ActionCreators: app.EnrollmentGroupsPageActionCreators
};
