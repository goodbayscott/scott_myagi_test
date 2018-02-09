import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import moment from 'moment';

import app from 'core/application';

const Constants = Marty.createConstants(['TOGGLE_TAG_SELECTION']);

const TagCompanyActionCreators = Marty.createActionCreators({
  id: 'TagCompanyActionCreators',
  toggleTagSelection(tag) {
    this.dispatch(Constants.TOGGLE_TAG_SELECTION, tag);
  }
});

const TagCompanyStore = Marty.createStore({
  id: 'TagCompanyStore',

  handlers: {
    onToggleTagSelection: Constants.TOGGLE_TAG_SELECTION
  },

  getInitialState() {
    return {
      selectedTags: Im.Map()
    };
  },

  onToggleTagSelection(tag) {
    if (this.state.selectedTags.get(tag.get('id'))) {
      this.state.selectedTags = this.state.selectedTags.delete(tag.get('id'));
    } else {
      this.state.selectedTags = this.state.selectedTags.set(tag.get('id'), tag);
    }
    this.hasChanged();
  },

  isTagSelected(tag) {
    return Boolean(this.state.selectedTags.get(tag.get('id')));
  },

  getSelectedTags() {
    return this.state.selectedTags;
  },

  resetState(currentUser) {
    this.state = this.getInitialState();
    // Determine already selected tags from currentUser object
    if (currentUser.get('learner').company.tags) {
      currentUser.get('learner').company.tags.forEach(t => {
        this.state.selectedTags = this.state.selectedTags.set(t.id, Im.Map(t));
      });
    }
  }
});

app.register('TagCompanyStore', TagCompanyStore);
app.register('TagCompanyActionCreators', TagCompanyActionCreators);

export default {
  Constants,
  ActionCreators: app.TagCompanyActionCreators,
  Store: app.TagCompanyStore
};
