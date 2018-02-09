import { stateDefaultsGenerator } from 'state/common/generators/http-api';
import _ from 'lodash';

const ChannelsState = stateDefaultsGenerator({
  entity: 'channel',
  endpoint: 'training_units'
});

ChannelsState.Store = ChannelsState.Store.extend({
  handlers: _.extend(
    {
      onChannelUpdate: ChannelsState.Constants.UPDATE_CHANNEL,
      onChannelCreated: ChannelsState.Constants.CREATE_CHANNEL
    },
    ChannelsState.Store.handlers
  ),
  onChannelUpdate(id, entity, headers, updateOpts) {
    // If a channel is un-archived, channels will need to be re-fetched because
    // the queryset will change.
    if (entity.deactivated === null && updateOpts && updateOpts.doFetch) {
      this.clearRecentFetches();
      this.hasChanged();
      this.resetState();
    }
  },
  onChannelCreated(entity, headers, opts) {
    // Force update on channel creation.
    this.clearRecentFetches();
    this.hasChanged();
    this.resetState();
  }
});

export default ChannelsState;
