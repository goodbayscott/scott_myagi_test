import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const TeamsState = stateDefaultsGenerator({
  entity: 'team',
  endpoint: 'learner_groups'
});

export default TeamsState;
