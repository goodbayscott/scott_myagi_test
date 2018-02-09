import Marty from 'marty';
import _ from 'lodash';
import Im from 'immutable';
import moment from 'moment';
import app from 'core/application';

const Constants = Marty.createConstants([
  'ENTITY_LIST_SET_ENTITY_SEARCH',
  'TOGGLE_ENTITY_SELECTION',
  'ENTITY_SELECT_SET_INNER_COMPONENT'
]);

const EntityListActionCreators = Marty.createActionCreators({
  id: 'EntityListActionCreators',
  setEntitySearch(str) {
    this.dispatch(Constants.ENTITY_LIST_SET_ENTITY_SEARCH, str);
  },
  toggleEntitySelection(entity) {
    this.dispatch(Constants.TOGGLE_ENTITY_SELECTION, entity);
  },
  setEntitySelectComponent(component) {
    this.dispatch(Constants.ENTITY_SELECT_SET_INNER_COMPONENT, component);
  }
});

const EntityListStore = Marty.createStore({
  id: 'EntityListStore',
  handlers: {
    onSetEntitySearch: Constants.ENTITY_LIST_SET_ENTITY_SEARCH,
    onToggleEntitySelection: Constants.TOGGLE_ENTITY_SELECTION,
    onSetEntitySelectComponent: Constants.ENTITY_SELECT_SET_INNER_COMPONENT
  },
  getInitialState() {
    return {
      search: '',
      selectedEntities: Im.Map(),
      entitySelectComponent: null
    };
  },

  onSetEntitySelectComponent(component) {
    if (component) this.state.entitySelectComponent = component;
  },

  onToggleEntitySelection(entity) {
    if (this.state.selectedEntities.get(entity.get('id'))) {
      this.state.selectedEntities = this.state.selectedEntities.delete(entity.get('id'));
    } else {
      this.state.selectedEntities = this.state.selectedEntities.set(entity.get('id'), entity);
    }
    this.hasChanged();
  },

  getSelectedEntities() {
    return this.state.selectedEntities;
  },

  getEntitySelectComponent() {
    return this.state.entitySelectComponent;
  },

  onSetEntitySearch(str) {
    this.state.search = str;
    this.hasChanged();
  },

  getEntitySearch() {
    return this.state.search;
  },
  resetState() {
    this.state = this.getInitialState();
  }
});

app.register('EntityListStore', EntityListStore);
app.register('EntityListActionCreators', EntityListActionCreators);

export default {
  Constants,
  ActionCreators: app.EntityListActionCreators,
  Store: app.EntityListStore
};
