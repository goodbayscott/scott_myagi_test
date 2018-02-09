import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const GoalState = stateDefaultsGenerator({
  entity: 'goal',
  endpoint: 'goals'
});

export default GoalState;
