'use strict';

import _ from 'lodash';
import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const mod = stateDefaultsGenerator({
  entity: 'questionPageAttempt',
  endpoint: 'question_page_attempts'
});

export default mod;
