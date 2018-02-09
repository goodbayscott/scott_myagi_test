import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const QuestionSetPageAttemptsState = stateDefaultsGenerator({
  entity: 'QuestionSetPageAttempts',
  endpoint: 'question_set_page_attempts'
});

export default QuestionSetPageAttemptsState;
