/*
  State management for the ModuleTrainingPlan model, which represents the many-to-many
  relationship between modules and plans. It exists so that we can order
  lessons within plans.
*/
import _ from 'lodash';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';
import ModuleAttemptsState from 'state/module-attempts';

const State = stateDefaultsGenerator({
  entity: 'moduleTrainingPlan',
  endpoint: 'module_training_plans'
});

State.Store = State.Store.extend({
  handlers: _.extend(
    {
      onDoListActionExtended: State.Constants.DO_LIST_ACTION_MODULETRAININGPLAN,
      onModuleAttemptDetailAction:
        ModuleAttemptsState.Constants.DO_DETAIL_ACTION_MODULEATTEMPTS_STARTING
    },
    State.Store.handlers
  ),
  onDoListActionExtended(entities, headers, opts, action, payload) {
    this.onDoListAction(entities, headers, opts, action, payload);
    if (action === 'delete_for_module_and_plan') {
      this.clearMatchesFilterForAllItems();
    }
  },
  onModuleAttemptDetailAction(id, action, payload) {
    if (action === 'finish') {
      // Ensure the completion display for modules gets reset
      // For example, without this, modules would still show as
      // incomplete in the plans list even when they were completed.
      this.clearRecentFetches();
    }
  }
});

export default State;
