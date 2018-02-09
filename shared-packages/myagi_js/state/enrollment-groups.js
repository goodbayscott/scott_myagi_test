import { stateDefaultsGenerator } from 'state/common/generators/http-api';

const EnrollmentGroupsState = stateDefaultsGenerator({
  entity: 'enrollmentGroup',
  endpoint: 'enrollment_groups'
});

export default EnrollmentGroupsState;
