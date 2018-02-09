import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['PRODUCT_SEARCH_SET_SEARCH']);

class ActionCreators extends Marty.ActionCreators {
  setSearch(str) {
    this.dispatch(Constants.PRODUCT_SEARCH_SET_SEARCH, str);
  }
}

function getInitialState() {
  return {
    search: ''
  };
}

class Store extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.PRODUCT_SEARCH_SET_SEARCH
    };
    this.state = getInitialState();
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
}

app.register('ProductSearchStore', Store);
app.register('ProductSearchActionCreators', ActionCreators);

export default {
  ActionCreators: app.ProductSearchActionCreators,
  Store: app.ProductSearchStore
};
