import { stateDefaultsGenerator } from 'state/common/generators/http-api';

export default stateDefaultsGenerator({
  entity: 'publicUser',
  endpoint: 'public/users'
});
