import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const CompaniesState = stateDefaultsGenerator({
  entity: 'companies',
  endpoint: 'companies'
});

export default CompaniesState;
