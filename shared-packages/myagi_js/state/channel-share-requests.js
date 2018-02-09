import _ from 'lodash';
import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const ChannelShareRequestsState = stateDefaultsGenerator({
  entity: 'sharedChannelRequest',
  endpoint: 'training_unit_share_requests'
});

ChannelShareRequestsState.Store = ChannelShareRequestsState.Store.extend({
  handlers: _.extend(
    {
      onDetailAction: ChannelShareRequestsState.Constants.DO_DETAIL_ACTION_SHAREDCHANNELREQUEST
    },
    ChannelShareRequestsState.Store.handlers
  ),
  onDetailAction(id, payload, headers, opts, action) {
    if (action && (action === 'accept' || action === 'reject')) {
      _.defer(() => {
        this.clearRecentFetches();
        this.hasChanged();
      });
    }
  }
});

export default ChannelShareRequestsState;
