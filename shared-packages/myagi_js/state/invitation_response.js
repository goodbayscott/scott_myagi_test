import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const InvitationResponseState = stateDefaultsGenerator({
  entity: 'invitation_response',
  endpoint: 'invitation_response'
});

export default InvitationResponseState;
