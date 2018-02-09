/*
  State management for the TrainingPlanTrainingUnit model, which represents the many-to-many
  relationship between training plans and training units. It exists so that we can order
  plans within channels.
*/
import _ from 'lodash';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const State = stateDefaultsGenerator({
  entity: 'trainingPlanTrainingUnit',
  endpoint: 'training_plan_training_units'
});

State.Store = State.Store.extend({
  handlers: _.extend(
    {
      onDoListActionExtended: State.Constants.DO_LIST_ACTION_TRAININGPLANTRAININGUNIT
    },
    State.Store.handlers
  ),
  onDoListActionExtended(entities, headers, opts, action, payload) {
    this.onDoListAction(entities, headers, opts, action, payload);
    if (action === 'delete_for_plan_and_training_unit') {
      this.clearMatchesFilterForAllItems();
    }
  }
});

export default State;
