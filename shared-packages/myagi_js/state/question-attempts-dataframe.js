import { stateDefaultsGenerator } from 'state/common/generators/dataframe.js';

const QuestionAttemptsDataframeState = stateDefaultsGenerator({
  entity: 'questionAttempt',
  endpoint: 'abstract_question_attempts/dataframe'
});

export default QuestionAttemptsDataframeState;
