import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;

import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['NAVBAR_UPDATE_TITLE', 'NAVBAR_UPDATE_INFO']);

class NavbarActionCreators extends Marty.ActionCreators {
  setTitle = autoDispatch(Constants.NAVBAR_UPDATE_TITLE);
  setInfo = autoDispatch(Constants.NAVBAR_UPDATE_INFO);
}

class NavbarStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.state = {
      title: '',
      info: null
    };
    this.handlers = {
      onUpdateTitle: Constants.NAVBAR_UPDATE_TITLE,
      onUpdateInfo: Constants.NAVBAR_UPDATE_INFO
    };
  }

  onUpdateTitle(title) {
    this.state.title = title;
    this.hasChanged();
  }

  onUpdateInfo(info) {
    this.state.info = info;
    this.hasChanged();
  }

  getTitle() {
    return this.state.title;
  }

  getInfo() {
    return this.state.info;
  }
}

app.register('NavbarStore', NavbarStore);
app.register('NavbarActionCreators', NavbarActionCreators);

export default {
  Store: app.NavbarStore,
  ActionCreators: app.NavbarActionCreators
};
