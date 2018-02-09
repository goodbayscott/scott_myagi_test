import Im from 'immutable';
import Raven from 'raven-js';
import _ from 'lodash';
import moment from 'moment';

import { intercom, analytics } from 'core/state-configuration';

import { stateDefaultsGenerator } from 'state/common/generators/http-api';
import { entitiesAreEqual } from 'state/common/generators/http-api/create-store';

import TeamsState from './teams';
import ChannelsState from './channels';
import ChannelShareRequestsState from './channel-share-requests';
import EnrollmentGroupsState from './enrollment-groups';
import CompaniesState from './companies';

import { compatGet } from './common/utils';

const CURRENT_USER = 'current';
const CHURN_ZERO_KEY = 'ROnu4AH-lFq6S3S4gwjWaHNls78ER1JTUZ4NqijBA0A';

const UsersState = stateDefaultsGenerator({
  entity: 'user',
  endpoint: 'users'
});

function getUserAnalyticsData(user) {
  // Bare minimum amount of data should be synced here.
  // Almost all data should be synced by the backend. Aim to only put data
  // here which can only be retrieved by the frontend.
  let companyAttrs;
  const company = compatGet(user.get('learner'), 'company');
  if (company) {
    companyAttrs = {
      // `toString` required for iOS segment lib
      id: compatGet(company, 'id').toString(),
      // Add name so that company is identifiable until backend sync completes
      name: compatGet(company, 'company_name')
    };
  }
  const data = {
    id: user.get('id'),
    // Email is required by Raven
    email: user.get('email'),
    // Add basic name data so user is identifiable until backend
    // sync completes.
    first_name: user.get('first_name'),
    last_name: user.get('last_name'),
    name: `${user.get('first_name')} ${user.get('last_name')}`,
    company: companyAttrs
  };
  let fullstoryURL;
  if (window.FS && window.FS.getCurrentSessionURL) fullstoryURL = window.FS.getCurrentSessionURL();
  if (fullstoryURL) {
    data.fullstory_url = fullstoryURL;
  }
  return data;
}

function doIntercomReg(user, analyticsData) {
  if (!intercom) return;
  // Intercom is basically only defined in the native app, because Segment doesn't
  // automatically initialize it. On webapp, we rely on segment.
  intercom.registerIdentifiedUser({ userId: analyticsData.id.toString() });
  intercom.updateUser({
    ...analyticsData,
    language_override: compatGet(user.get('learner'), 'locale')
  });
  intercom.setUserHash(compatGet(user.get('learner'), 'intercom_user_hash'));
}

function doSegmentReg(user, analyticsData) {
  if (!analytics) return;
  // toString required for iOS Segment lib
  analytics.identify(analyticsData.id.toString(), analyticsData, {
    integrations: {
      Intercom: {
        user_hash: compatGet(user.get('learner'), 'intercom_user_hash'),
        language_override: compatGet(user.get('learner'), 'locale')
      }
    }
  });
  if (analyticsData.company) {
    analytics.group(analyticsData.company.id.toString(), analyticsData.company, {
      integrations: {
        // No need to send this to Intercom. The Intercom integration just uses the company attr
        // on the user object.
        Intercom: false
      }
    });
  }
}

function doChurnZeroReg(user, analyticsData) {
  if (!window.ChurnZero || !analyticsData.company) return;
  window.ChurnZero.push(['setAppKey', CHURN_ZERO_KEY]);
  window.ChurnZero.push([
    'setContact',
    analyticsData.company.id.toString(),
    analyticsData.id.toString()
  ]);
}

function doRavenReg(user, analyticsData) {
  Raven.setUserContext({
    email: analyticsData.email,
    id: analyticsData.id
  });
}

UsersState.Store = UsersState.Store.extend({
  handlers: _.extend(
    {
      onTeamUpdateStarting: TeamsState.Constants.UPDATE_TEAM_STARTING,
      onChannelUpdateStarting: ChannelsState.Constants.UPDATE_CHANNEL_STARTING,
      onChannelShareRequestDetailAction:
        ChannelShareRequestsState.Constants.DO_DETAIL_ACTION_SHAREDCHANNELREQUEST,
      onEnrollmentGroupUpdateStarting: EnrollmentGroupsState.Constants.UPDATE_ENROLLMENTGROUP,
      onCompanyUpdate: CompaniesState.Constants.UPDATE_COMPANIES,
      // This is only relevant in native app. Arguably it should be part of the
      // start configuration module.
      onAuthStatusChanged: 'SET_AUTH_TOKEN'
    },
    UsersState.Store.handlers
  ),

  getInitialState() {
    const initState = this.__super__.getInitialState.apply(this, arguments);
    initState.currentUser = undefined;
    return initState;
  },

  parse(user) {
    user.full_name = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;

    const groups = {};
    if (user.groups) {
      user.groups.forEach(group => {
        groups[group.name] = true;
      });
      user.groups = groups;
    }

    if (user.learner && user.learner.learnergroups) {
      user.learner.learnergroup = user.learner.learnergroups[0];
    }
    return user;
  },

  onAuthStatusChanged() {
    // Wipe the current user and clear recent fetches. Should force a refetch where
    // necessary.
    this.setState({ currentUser: undefined });
    this.clearRecentFetches();
    this.hasChanged();
  },

  onRetrieved(id, entity, headers, fetchOpts) {
    if (id === CURRENT_USER) {
      const parsedEntity = this.fullParse(entity);
      const hasChanged = !entitiesAreEqual(this.state.currentUser, parsedEntity);
      this.state.currentUser = Im.Map(parsedEntity);
      // For now, don't add currentUser to this.state.items.
      // Can change this behaviour once local filtering is working
      // correctly.
      if (hasChanged) this.hasChanged();
      this.cleanupPostFetch(fetchOpts);
      return;
    }
    this.__super__.onRetrieved.apply(this, arguments);
  },

  getOneLocally(id) {
    if (id === CURRENT_USER) {
      return this.state.currentUser;
    }
    return this.__super__.getOneLocally.apply(this, arguments);
  },

  getCurrent() {
    const current = this.getItem(CURRENT_USER, {
      fields: [
        'id',
        'first_name',
        'last_name',
        'date_joined',
        'email',
        'feature_flags',
        'notification_settings',
        'badge_awards.id',
        'badge_awards.url',
        'badge_awards.unique_code',
        'badge_awards.badge.id',
        'badge_awards.badge.name',
        'badge_awards.badge.description',
        'badge_awards.badge.badge_image',
        'badge_awards.badge.discount_code',
        'badge_awards.badge.discount_url',
        'learner.id',
        'learner.url',
        'learner.locale',
        'learner.training_score',
        'learner.learner_group',
        'learner.areas',
        'learner.learnergroup_rank',
        'learner.learnergroup_name',
        'learner.company_rank',
        'learner.company_rank_for_past_month',
        'learner.num_training_plan_enrollments',
        'learner.profile_photo',
        'learner.user_cover_image',
        'learner.is_training_unit_admin',
        'learner.is_learner_group_admin',
        'learner.is_area_manager',
        'learner.is_company_admin',
        'learner.is_myagi_staff',
        'learner.is_internal_user',
        'learner.can_manage_training_content',
        'learner.can_view_all_training_content',
        'learner.can_enroll_others_in_training_content',
        'learner.can_make_new_channel_connections',
        'learner.must_watch_videos_in_full',
        'learner.num_modules_completed',
        'learner.num_training_plans_completed',
        'learner.num_unfulfilled_company_connection_request_channels_for_user',
        'learner.average_percentage_score',
        'learner.challenge_points',
        'learner.num_past_due_enrollments',
        'learner.phone_number',
        'learner.job_title',
        'learner.completed_nps',
        'learner.is_demo_account',
        'learner.progress',
        'learner.intercom_user_hash',
        'learner.tmp_new_home_page_enabled',
        'learner.next_incomplete_plan_id',

        'learner.company.id',
        'learner.company.url',
        'learner.company.user_count',
        'learner.company.has_content',
        'learner.company.auto_enroll_plans',
        'learner.company.company_name',
        'learner.company.cover_image',
        'learner.company.company_type',
        'learner.company.company_logo',
        'learner.company.timezone',
        'learner.company.open_connection_request_count',
        'learner.company.region',

        'learner.company.tags.id',
        'learner.company.tags.url',
        'learner.company.tags.name',

        'learner.company.subscription.paused',
        'learner.company.subscription.analytics_enabled',
        'learner.company.subscription.shared_content_enabled',
        'learner.company.subscription.groups_and_areas_enabled',

        'learner.company.demo_product_name',
        'learner.company.demo_brand_name',
        'learner.company.companysettings.users_can_make_own_connections',
        'learner.company.companysettings.users_can_invite_others_to_join',
        'learner.company.companysettings.module_feedback_modal_switch',
        'learner.company.companysettings.leaderboard_enabled',
        'learner.company.companysettings.product_search_enabled',
        'learner.company.companysettings.video_search_enabled',
        'learner.company.companysettings.flip_card_creation_enabled',
        'learner.company.companysettings.style_customization_enabled',
        'learner.company.companysettings.nav_color',
        'learner.company.companysettings.nav_font_color',
        'learner.company.companysettings.nav_logo',
        'learner.company.companysettings.primary_color',
        'learner.company.companysettings.primary_font_color',
        'learner.company.companysettings.competition_start',
        'learner.company.companysettings.competition_end',

        'groups.name',
        'nps_responses.score'
      ]
    });

    if (current.done && current.result) {
      const user = current.result;
      const analyticsData = getUserAnalyticsData(user);
      let skip = false;
      if (this._lastSyncData && this._lastSyncData === JSON.stringify(analyticsData)) {
        // Prevents multiple unnecessary calls to segement / sentry
        skip = true;
      }
      if (!skip) {
        doIntercomReg(user, analyticsData);
        doRavenReg(user, analyticsData);
        doSegmentReg(user, analyticsData);
        doChurnZeroReg(user, analyticsData);
        if (!this._trackedSession) {
          // Broad event which can be used to track usage frequency of Myagi over time.
          analytics.track('Started session');
          this._trackedSession = true;
        }
      }
      this._lastSyncData = JSON.stringify(analyticsData);
    }
    return current;
  },

  //
  // Handlers for updates to related stores
  //
  onTeamUpdateStarting(teamId, updatedTeam) {
    /* When team updates and members are removed, need to make sure
    removed users no longer match the filter for that team. */
    this.updateLocalFilterResults(
      { learner__learnergroups: teamId },
      updatedTeam.get('members'),
      user => user.get('learner').url || user.get('learner')
    );
  },

  onChannelUpdateStarting(channelId, updatedChannel) {
    this.updateLocalFilterResults(
      { learner__trainingunits: channelId },
      updatedChannel.get('owners'),
      user => user.get('learner').url || user.get('learner')
    );
  },

  onChannelShareRequestDetailAction(channelShareId, updatedChannelShare) {
    this.clearRecentFetches();
    this.hasChanged();
  },

  onCompanyUpdate(companyId, updatedCompany) {
    // If company auto_enroll_plans is different, call hasChanged
    const currentAutoEnrollPlans = this.state.currentUser.get('learner').company.auto_enroll_plans;
    const newAutoEnrollPlans = updatedCompany.auto_enroll_plans;
    // Check if arrays have all the same values. If not, refresh the user so
    // company auto_enroll_plans are updated.
    if (!_.isEmpty(_.xor(currentAutoEnrollPlans, newAutoEnrollPlans))) {
      this.clearRecentFetches();
      this.hasChanged();
    }
  },

  onEnrollmentGroupUpdateStarting(groupId, updatedGroup) {
    this.clearMatchesFilterForAllItems();
    this.clearRecentFetches();
  }
});

export default UsersState;
