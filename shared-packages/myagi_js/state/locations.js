import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const LocationsState = stateDefaultsGenerator({
  entity: 'locations',
  endpoint: 'locations'
});

LocationsState.Store = LocationsState.Store.extend({
  getInitialState() {
    const state = this.__super__.getInitialState.apply(this, arguments);
    return state;
  },

  onRetrievedMany: function onRetrievedMany(entities, headers, fetchOpts, storeOpts) {
    this.__super__.onRetrievedMany.call(this, entities.predictions, headers, fetchOpts, storeOpts);
  }
});

export default LocationsState;
