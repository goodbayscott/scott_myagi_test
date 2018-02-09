import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const PublicChannelState = stateDefaultsGenerator({
  entity: 'publicChannel',
  endpoint: 'public/training_unit'
});

export default PublicChannelState;
