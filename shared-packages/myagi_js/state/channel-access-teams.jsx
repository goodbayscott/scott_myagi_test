import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const ChannelAccessTeamState = stateDefaultsGenerator({
  entity: 'channelAccessTeam',
  endpoint: 'channel_access_teams'
});

export default ChannelAccessTeamState;
