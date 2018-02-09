'use strict';

import _ from 'lodash';
import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const mod = stateDefaultsGenerator({
  entity: 'postActivity',
  endpoint: 'post_activities'
});

export default mod;
