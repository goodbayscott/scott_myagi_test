import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const BadgeAwardsState = stateDefaultsGenerator({
  entity: 'badge_award',
  endpoint: 'badge_awards'
});

export default BadgeAwardsState;
