import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const BadgesState = stateDefaultsGenerator({
  entity: 'badge',
  endpoint: 'badges'
});

export default BadgesState;
