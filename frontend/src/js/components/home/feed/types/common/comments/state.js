import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['COMMENTS_SET_LIMIT']);

const DEFAULT_LIMIT = 5;

class ActionCreators extends Marty.ActionCreators {
  setLimit(activityId, newLimit) {
    this.dispatch(Constants.COMMENTS_SET_LIMIT, activityId, newLimit);
  }
}

function getInitialState() {
  return {
    limits: Im.Map()
  };
}

class Store extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetLimit: Constants.COMMENTS_SET_LIMIT
    };
    this.state = getInitialState();
  }

  onSetLimit(activityId, newLimit) {
    this.setLimit(activityId, newLimit);
    this.hasChanged();
  }

  setLimit(activityId, newLimit) {
    this.state.limits = this.state.limits.set(activityId, newLimit);
  }

  getLimit(activityId) {
    if (this.state.limits.get(activityId) === undefined) this.setLimit(activityId, DEFAULT_LIMIT);
    return this.state.limits.get(activityId);
  }

  resetState() {
    this.state = getInitialState();
  }
}

app.register('CommentsStore', Store);
app.register('CommentsActionCreators', ActionCreators);

export default {
  ActionCreators: app.CommentsActionCreators,
  Store: app.CommentsStore
};
