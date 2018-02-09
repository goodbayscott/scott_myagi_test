import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const ChannelLicencesState = stateDefaultsGenerator({
  entity: 'channelLicence',
  endpoint: 'channel_licences'
});

export default ChannelLicencesState;
