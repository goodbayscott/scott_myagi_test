import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const LearnersState = stateDefaultsGenerator({
  entity: 'learners',
  endpoint: 'learners'
});

export default LearnersState;
