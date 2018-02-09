import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const TextMessagesState = stateDefaultsGenerator({
  entity: 'text_message',
  endpoint: 'text_messages'
});

export default TextMessagesState;
