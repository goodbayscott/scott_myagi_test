import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const MessagesState = stateDefaultsGenerator({
  entity: 'multimedia_message',
  endpoint: 'multimedia_messages'
});

export default MessagesState;
