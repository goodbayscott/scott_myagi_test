import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const MultichoiceQuestionAttemptsState = stateDefaultsGenerator({
  entity: 'multichoiceQuestionAttempts',
  endpoint: 'multichoice_question_attempts'
});

export default MultichoiceQuestionAttemptsState;
