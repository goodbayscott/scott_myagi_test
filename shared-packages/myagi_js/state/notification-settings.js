'use strict';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';

export default stateDefaultsGenerator({
  entity: 'notificationSettings',
  endpoint: 'notification_settings'
});
