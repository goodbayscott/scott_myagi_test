import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const CompanySettingsState = stateDefaultsGenerator({
  entity: 'companysettings',
  endpoint: 'companysettings'
});

export default CompanySettingsState;
