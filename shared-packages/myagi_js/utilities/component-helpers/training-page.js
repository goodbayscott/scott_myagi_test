import moment from 'moment';

/*
  This module is for sharing logic between webapp training view
  and app training view.
*/

const SOON_DAYS = 7;
const SUCCESSFUL_COMPLETION_HOURS = 24;

export const constants = {
  ALL_PLANS: 'all_plans',
  COMPANY_PLANS: 'company_plans',
  DUE_SOON: 'due_soon',
  PUBLIC_PLANS: 'public_plans',
  PLANS_FROM_CHANNELS: 'plans_from_subscribed_channels',
  PLANS_FROM_MY_CHANNEL: 'plans_from_my_channels',
  YOUR_PLANS: 'enrolled_plans',
  INCOMPLETE_PLANS: 'incomplete_plans',
  NEW_PLANS: 'new_plans',
  FILTER_DESCRIPTIONS: {
    'Company Plans': 'Plans owned by or shared with your company',
    'Your Plans': 'Plans which have been assigned to you for completion',
    'Public Plans': 'Plans which have been shared publicly'
  },
  DEFAULT_ORDERING: 'name',
  CREATED: '-created',
  ARCHIVED: '-deactivated'
};

export default {
  getFiltersForUser(currentUser) {
    let learner = currentUser.get('learner');
    // Native app uses fully immutable state
    if (learner.toJS) learner = learner.toJS();
    let filters;
    if (learner.can_view_all_training_content) {
      filters = [
        {
          name: constants.ALL_PLANS,
          query: {
            owned_by_or_shared_with_owner: learner.company.id,
            ordering: constants.DEFAULT_ORDERING
          }
        },
        {
          name: constants.INCOMPLETE_PLANS,
          query: {
            not_successfully_completed_by_user: currentUser.get('id'),
            learnertrainingschedule__learner: learner.id,
            ordering: constants.DEFAULT_ORDERING
          }
        }
      ];
    } else {
      filters = [
        {
          name: constants.ALL_PLANS,
          query: {
            // All plans where there is an enrollment for current user
            learnertrainingschedule__learner__user: currentUser.get('id'),
            ordering: constants.DEFAULT_ORDERING
          }
        },
        {
          name: constants.INCOMPLETE_PLANS,
          query: {
            not_successfully_completed_by_user: currentUser.get('id'),
            learnertrainingschedule__learner: learner.id,
            ordering: constants.DEFAULT_ORDERING
          }
        }
      ];
    }
    return filters;
  },

  moduleWasCompletedToday(mod) {
    let last = mod.get('last_successful_attempt_for_current_user');
    if (!last) return false;
    const now = moment();
    last = moment(last);
    if (now.diff(last, 'hours') < SUCCESSFUL_COMPLETION_HOURS) {
      return true;
    }
    return false;
  },

  moduleWasCompletedByCurrentUser(mod) {
    return Boolean(mod.get('last_successful_attempt_for_current_user'));
  },

  getColorForProgress(progressColors, progress) {
    let progColor;
    _.each(progressColors, (color, val) => {
      if (progress >= val) {
        progColor = color;
      }
    });
    return progColor;
  }
};
