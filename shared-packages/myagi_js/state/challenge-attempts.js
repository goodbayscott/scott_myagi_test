'use strict';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';

export default stateDefaultsGenerator({
  entity: 'challengeAttempt',
  endpoint: 'challenge_attempts'
});
