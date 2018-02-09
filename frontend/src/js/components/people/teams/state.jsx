import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;

import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants([
  'TRAINING_PLAN_ENROLLMENTS_SET_SEARCH',
  'TEAM_LIST_SET_TEAM_ORDER'
]);

class TeamsPageActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.TRAINING_PLAN_ENROLLMENTS_SET_SEARCH, str);
  setTeamOrder = str => this.dispatch(Constants.TEAM_LIST_SET_TEAM_ORDER, str);
}

class TeamsPageStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.TRAINING_PLAN_ENROLLMENTS_SET_SEARCH,
      onSetTeamOrder: Constants.TEAM_LIST_SET_TEAM_ORDER
    };
    this.resetState();
  }

  onSetSearch(str) {
    this.state.search = str;
    this.hasChanged();
  }

  onSetTeamOrder(str) {
    this.state.order = str;
    this.hasChanged();
  }

  getSearch() {
    return this.state.search;
  }

  getTeamOrder() {
    return this.state.order;
  }

  resetState() {
    this.state = {
      search: ''
    };
  }
}

app.register('TeamsPageStore', TeamsPageStore);
app.register('TeamsPageActionCreators', TeamsPageActionCreators);

export default {
  Store: app.TeamsPageStore,
  ActionCreators: app.TeamsPageActionCreators
};
