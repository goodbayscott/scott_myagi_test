'use strict';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';

export default stateDefaultsGenerator({
  entity: 'multichoiceQuestion',
  endpoint: 'multichoice_questions'
});
