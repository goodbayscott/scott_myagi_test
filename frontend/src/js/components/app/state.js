import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['APP_SET_SEARCH', 'APP_SET_BASE_TITLE']);

class ActionCreators extends Marty.ActionCreators {
  setSearch(str) {
    this.dispatch(Constants.APP_SET_SEARCH, str);
  }
  setBaseTitle(str) {
    this.dispatch(Constants.APP_SET_BASE_TITLE, str);
  }
}

function getInitialState() {
  return {
    search: '',
    pageTitle: 'Learn something useful',
    baseTitle: 'Myagi'
  };
}

class Store extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.APP_SET_SEARCH,
      onSetBaseTitle: Constants.APP_SET_BASE_TITLE
    };
    this.state = getInitialState();
  }

  onSetBaseTitle(str) {
    this.setState({ baseTitle: str });
    this.hasChanged();
  }

  onSetSearch(str) {
    this.state.search = str;
    this.hasChanged();
  }

  getSearch() {
    return this.state.search;
  }

  resetState() {
    this.state = getInitialState();
  }

  getTitle() {
    return `${this.state.baseTitle} | ${this.state.pageTitle}`;
  }
}

app.register('AppStore', Store);
app.register('AppActionCreators', ActionCreators);

export default {
  ActionCreators: app.AppActionCreators,
  Store: app.AppStore
};
