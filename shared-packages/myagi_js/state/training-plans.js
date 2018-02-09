import _ from 'lodash';
import Im from 'immutable';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';

import ChannelsState from './channels';
import ModulesState from './modules';
import ModuleAttemptsState from './module-attempts';

import { hasFields } from 'utilities/generic';

const TrainingPlansState = stateDefaultsGenerator({
  entity: 'trainingPlan',
  endpoint: 'training_plans'
});

TrainingPlansState.Store = TrainingPlansState.Store.extend({
  handlers: _.extend(
    {
      onChannelUpdateStarting: ChannelsState.Constants.UPDATE_CHANNEL_STARTING,
      onModuleUpdate: ModulesState.Constants.UPDATE_MODULES,
      onModuleUpdateStarting: ModulesState.Constants.UPDATE_MODULES_STARTING,
      onModuleAttemptDetailAction:
        ModuleAttemptsState.Constants.DO_DETAIL_ACTION_MODULEATTEMPTS_STARTING
    },
    TrainingPlansState.Store.handlers
  ),
  onChannelUpdateStarting(channelId, updatedChannel) {
    // When channel is updated and plans in team are altered,
    // make sure to clear any removed items from matching the filter
    // for that channel.
    this.updateLocalFilterResults(
      { training_units: channelId },
      updatedChannel.get('training_plans'),
      plan => plan.get('url')
    );
  },
  onModuleUpdate(moduleId, updatedModule) {
    if (updatedModule.deactivated) {
      // Somewhat blunt method for preventing the
      // now deactivated module from displaying
      // to users
      this.clearRecentFetches();
      this.hasChanged();
    }
  },
  onModuleUpdateStarting(moduleId, updatedModule) {
    // when adding training plans to module.training_plans, we need to
    // re-fetch training plans so new modules appear in appropriate plans.
    // TODO - This breaks module selection during native app
    // content creation
    // _.defer(() => {
    //   this.clearMatchesFilterForAllItems();
    //   this.clearRecentFetches();
    // });
  },
  onModuleAttemptDetailAction(id, action, payload) {
    if (action === 'finish') {
      // Blunt method for ensuring the completion display for plans
      // gets reset. For example, without this, plans would still show in
      // the incomplete plans list even when they were completed.
      // This means that training page needs to be fully reloaded after a
      // module is completed. TODO - Try and clear filter match for
      // relevant plan only.
      // NOTE - This used to just clear matches filter values, however this
      // caused odd behaviour on the native app training page.
      this.resetState();
      // this.clearMatchesFilterForAllItems();
      this.hasChanged();
    }
  },
  parse(plan) {
    if (hasFields(plan.modules, ['successfully_completed_by_current_user'])) {
      // Next module is first where it has yet to be completed by current user.
      plan.next_module =
        _.findWhere(plan.modules, {
          successfully_completed_by_current_user: false
        }) ||
        plan.modules[0] ||
        null;
    }
    return plan;
  }
});

export default TrainingPlansState;
