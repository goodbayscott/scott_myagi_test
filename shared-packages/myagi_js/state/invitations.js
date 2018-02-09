import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const InvitationsState = stateDefaultsGenerator({
  entity: 'invitation',
  endpoint: 'invitations'
});

export default InvitationsState;
