import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const ChannelAccessUserState = stateDefaultsGenerator({
  entity: 'channelAccessUser',
  endpoint: 'channel_access_users'
});

export default ChannelAccessUserState;
