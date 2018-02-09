import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;

import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';

const Constants = Marty.createConstants(['PEOPLE_INVITATION_SET_SEARCH']);

class PeopleInvitationActionCreators extends Marty.ActionCreators {
  setSearch = str => this.dispatch(Constants.PEOPLE_INVITATION_SET_SEARCH, str);
}

class PeopleInvitationStore extends Marty.Store {
  constructor(opts) {
    super(opts);
    this.handlers = {
      onSetSearch: Constants.PEOPLE_INVITATION_SET_SEARCH
    };
    this.resetState();
  }

  resetState() {
    const state = {
      search: ''
    };
    this.setState(state);
    this.hasChanged();
  }

  onSetSearch(search) {
    this.setState({ search });
    this.hasChanged();
  }

  getSearch() {
    return this.state.search;
  }
}

app.register('PeopleInvitationStore', PeopleInvitationStore);
app.register('PeopleInvitationActionCreators', PeopleInvitationActionCreators);

export default {
  Store: app.PeopleInvitationStore,
  ActionCreators: app.PeopleInvitationActionCreators
};
