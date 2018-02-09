import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const TrainingSchedulesState = stateDefaultsGenerator({
  entity: 'trainingSchedules',
  endpoint: 'learner_training_schedules'
});

export default TrainingSchedulesState;
