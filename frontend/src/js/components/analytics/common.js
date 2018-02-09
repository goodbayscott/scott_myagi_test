import { getIdFromApiUrl } from 'utilities/generic';

export function getDefaultFilter(currentUser) {
  const learner = currentUser.get('learner');
  // Admins allowed to see everything
  if (learner.is_company_admin) {
    return {};
  }
  // Area managers allowed to see attempts from their area
  if (learner.is_area_manager) {
    return {
      user__learner__learnergroups__areas__managers: currentUser.get('id')
    };
  }
  // Should be a team manager...in which case allow them to see
  // attempts from their team
  if (learner.learner_group) {
    return {
      user__learner__learnergroups: getIdFromApiUrl(learner.learner_group)
    };
  }
  // Should never get here, because only admins, team managers and
  // area managers are able to get to analytics.
  return { user__learner__learnergroups: 0 };
}
