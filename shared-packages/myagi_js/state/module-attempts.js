import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const ModuleAttemptsState = stateDefaultsGenerator({
  entity: 'moduleAttempts',
  endpoint: 'module_attempts'
});

export default ModuleAttemptsState;
