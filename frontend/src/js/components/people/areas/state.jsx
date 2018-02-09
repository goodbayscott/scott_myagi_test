import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;

import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['AREAS_SET_SEARCH']);

class AreasPageActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.AREAS_SET_SEARCH, str);
}

class AreasPageStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.AREAS_SET_SEARCH
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

app.register('AreasPageStore', AreasPageStore);
app.register('AreasPageActionCreators', AreasPageActionCreators);

export default {
  Store: app.AreasPageStore,
  ActionCreators: app.AreasPageActionCreators
};
