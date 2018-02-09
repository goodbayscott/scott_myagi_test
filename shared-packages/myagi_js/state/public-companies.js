import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const PublicCompanyState = stateDefaultsGenerator({
  entity: 'publicCompany',
  endpoint: 'public/companies'
});

export default PublicCompanyState;
