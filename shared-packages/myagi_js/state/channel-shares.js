import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const ChannelShareState = stateDefaultsGenerator({
  entity: 'sharedChannel',
  endpoint: 'training_unit_shares'
});

export default ChannelShareState;
