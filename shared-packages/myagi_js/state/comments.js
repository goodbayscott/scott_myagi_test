'use strict';

import _ from 'lodash';
import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const mod = stateDefaultsGenerator({
  entity: 'comment',
  endpoint: 'comments'
});

export default mod;
