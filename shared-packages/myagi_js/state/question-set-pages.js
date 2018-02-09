import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const QuestionSetPagesState = stateDefaultsGenerator({
  entity: 'QuestionSetPages',
  endpoint: 'question_set_pages'
});

export default QuestionSetPagesState;
