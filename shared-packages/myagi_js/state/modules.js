import { stateDefaultsGenerator } from 'state/common/generators/http-api';
import _ from 'lodash';

const ModulesState = stateDefaultsGenerator({
  entity: 'modules',
  endpoint: 'modules'
});

ModulesState.Store = ModulesState.Store.extend({
  handlers: _.extend(
    {
      onUpdateExtended: ModulesState.Constants.UPDATE_MODULES
    },
    ModulesState.Store.handlers
  ),
  onUpdateExtended(id, entity, headers, updateOpts) {
    this.onUpdateStarting(id, entity, headers, updateOpts);
    // If module has been deactivated...clear all filter matches.
    // It will be refetched if it still matches a given filter.
    if (entity.deactivated) {
      this.clearMatchesFilterForItem(id);
    }
  }
});

export default ModulesState;
