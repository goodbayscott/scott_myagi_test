import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import app from 'core/application';

const Constants = Marty.createConstants(['GROUP_ENROLLMENT_LIST_SET_ENROLLMENT_SEARCH']);

const GroupEnrollmentListActionCreators = Marty.createActionCreators({
  id: 'GroupEnrollmentListActionCreators',
  setEnrollmentSearch(str) {
    this.dispatch(Constants.GROUP_ENROLLMENT_LIST_SET_ENROLLMENT_SEARCH, str);
  }
});

const GroupEnrollmentListStore = Marty.createStore({
  id: 'GroupEnrollmentListStore',
  handlers: {
    onSetEnrollmentSearch: Constants.GROUP_ENROLLMENT_LIST_SET_ENROLLMENT_SEARCH
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

app.register('GroupEnrollmentListStore', GroupEnrollmentListStore);
app.register('GroupEnrollmentListActionCreators', GroupEnrollmentListActionCreators);

export default {
  Constants,
  ActionCreators: app.GroupEnrollmentListActionCreators,
  Store: app.GroupEnrollmentListStore
};
