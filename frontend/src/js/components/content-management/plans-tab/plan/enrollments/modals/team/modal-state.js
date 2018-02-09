import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import app from 'core/application';

const Constants = Marty.createConstants(['TEAM_ENROLLMENT_LIST_SET_ENROLLMENT_SEARCH']);

const TeamEnrollmentListActionCreators = Marty.createActionCreators({
  id: 'TeamEnrollmentListActionCreators',
  setEnrollmentSearch(str) {
    this.dispatch(Constants.TEAM_ENROLLMENT_LIST_SET_ENROLLMENT_SEARCH, str);
  }
});

const TeamEnrollmentListStore = Marty.createStore({
  id: 'TeamEnrollmentListStore',
  handlers: {
    onSetEnrollmentSearch: Constants.TEAM_ENROLLMENT_LIST_SET_ENROLLMENT_SEARCH
  },
  getInitialState() {
    return {
      search: ''
    };
  },

  onSetEnrollmentSearch(str) {
    this.state.search = str;
    this.hasChanged();
  },

  getEnrollmentSearch() {
    return this.state.search;
  },
  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('TeamEnrollmentListStore', TeamEnrollmentListStore);
app.register('TeamEnrollmentListActionCreators', TeamEnrollmentListActionCreators);

export default {
  Constants,
  ActionCreators: app.TeamEnrollmentListActionCreators,
  Store: app.TeamEnrollmentListStore
};
