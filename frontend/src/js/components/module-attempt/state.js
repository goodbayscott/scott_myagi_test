import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants([
  'MODULE_ATTEMPT_REGISTER_PAGE_MAX_PROGRESS',
  'MODULE_ATTEMPT_INCREMENT_PROGRESS',
  'MODULE_ATTEMPT_INCREMENT_CURRENT_SCORE',
  'MODULE_ATTEMPT_RESET_CURRENT_SCORE'
]);

class ActionCreators extends Marty.ActionCreators {
  registerPageMaxProgress(pageId, maxProgress) {
    this.dispatch(Constants.MODULE_ATTEMPT_REGISTER_PAGE_MAX_PROGRESS, pageId, maxProgress);
  }
  incrementProgress() {
    this.dispatch(Constants.MODULE_ATTEMPT_INCREMENT_PROGRESS);
  }
  resetCurrentScore() {
    this.dispatch(Constants.MODULE_ATTEMPT_RESET_CURRENT_SCORE);
  }
  incrementCurrentScore() {
    this.dispatch(Constants.MODULE_ATTEMPT_INCREMENT_CURRENT_SCORE);
  }
}

function getInitialState() {
  return {
    pageMaxProgress: {},
    progress: 0,
    score: 0
  };
}

class Store extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onRegisterPage: Constants.MODULE_ATTEMPT_REGISTER_PAGE_MAX_PROGRESS,
      onIncrementProgress: Constants.MODULE_ATTEMPT_INCREMENT_PROGRESS,
      onIncrementCurrentScore: Constants.MODULE_ATTEMPT_INCREMENT_CURRENT_SCORE,
      onResetCurrentScore: Constants.MODULE_ATTEMPT_RESET_CURRENT_SCORE
    };
    this.state = getInitialState();
  }

  onRegisterPage(pageId, max) {
    this.state.pageMaxProgress[pageId] = max;
    this.hasChanged();
  }

  onIncrementProgress() {
    this.state.progress = this.state.progress + 1;
    this.hasChanged();
  }

  onIncrementCurrentScore() {
    this.state.score = this.state.score + 1;
    this.hasChanged();
  }

  onResetCurrentScore() {
    this.state.score = 0;
    this.hasChanged();
  }

  getMaxProgress() {
    let total = 0;
    _.each(this.state.pageMaxProgress, (v, k) => (total += v));
    return total;
  }

  getCurProgress() {
    return this.state.progress;
  }

  getCurProgressPercentage() {
    const max = this.getMaxProgress();
    if (!max) return 0.0;
    return this.getCurProgress() / max * 100;
  }

  getCurrentScore() {
    return this.state.score;
  }

  resetState() {
    this.state = getInitialState();
  }
}

app.register('ModuleAttemptStore', Store);
app.register('ModuleAttemptActionCreators', ActionCreators);

export default {
  ActionCreators: app.ModuleAttemptActionCreators,
  Store: app.ModuleAttemptStore
};
