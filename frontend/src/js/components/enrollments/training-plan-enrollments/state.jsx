import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;
import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['TRAINING_PLAN_ENROLLMENTS_SET_SEARCH']);

class TrainingPlanEnrollmentsActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.TRAINING_PLAN_ENROLLMENTS_SET_SEARCH, str);
}

class TrainingPlanEnrollmentsStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.TRAINING_PLAN_ENROLLMENTS_SET_SEARCH
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

app.register('TrainingPlanEnrollmentsStore', TrainingPlanEnrollmentsStore);
app.register('TrainingPlanEnrollmentsActionCreators', TrainingPlanEnrollmentsActionCreators);

export default {
  Store: app.TrainingPlanEnrollmentsStore,
  ActionCreators: app.TrainingPlanEnrollmentsActionCreators
};
