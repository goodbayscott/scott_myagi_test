import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const State = stateDefaultsGenerator({
  entity: 'actionItem',
  endpoint: 'action_items',
  makeEntitiesFullyImmutable: true
});

State.Store = State.Store.extend({
  addRequiredFields(fields) {
    // Do not add extra values to `fields`. This will prevent
    // backend defaults from being applied.
    return fields;
  },
  checkFetchOpts() {
    // This disables warning about `fields` not being set
  }
});

export default State;
