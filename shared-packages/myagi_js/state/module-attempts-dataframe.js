import { stateDefaultsGenerator } from 'state/common/generators/dataframe.js';

const ModuleAttemptsDataframeState = stateDefaultsGenerator({
  entity: 'moduleAttempt',
  endpoint: 'module_attempts/dataframe'
});

export default ModuleAttemptsDataframeState;
