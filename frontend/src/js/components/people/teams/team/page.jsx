import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';

import TeamsState from 'state/teams';
import UsersState from 'state/users';
import TrainingPlansState from 'state/training-plans';
import ProgressTrackerState from 'components/progress-tracker/state';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import { t } from 'i18n';
import Style from 'style/index';
import $y from 'utilities/yaler';

import { LoadingContainer } from 'components/common/loading';
import containerUtils from 'utilities/containers';
import { momentToISO } from 'utilities/time';
import { TimeseriesProcessor, PivotTableProcessor } from 'utilities/dataframe';
import { AttemptStatsContainer } from 'components/common/stats';

import { LoadingSpinner } from 'components/common/loading';
import { Modal } from 'components/common/modal';
import { BoxHeader, BoxContent, Panel } from 'components/common/box';
import {
  GatedFeatureBox,
  GatedFeatureModal,
  ANALYTICS,
  GROUPS_AND_AREAS
} from 'components/common/gated-feature';
import { AvatarImage } from 'components/common/avatar-images';
import { ProgressReportSegment, ProgressLabel } from 'components/progress-tracker/segment';
import { TeamDetailsForm } from '../team-details-form';
import { InviteUsersButton } from 'components/common/invites';
import { EnrollWithSelectedUsersModal } from 'components/enrollments/enroll-modal';
import { UserPermissionsModal } from 'components/enrollments/user-permissions-modal';

import parsing from 'components/analytics/parsing';

import { ScrollableDataTable } from 'components/common/table';
import { Dropdown } from 'components/common/dropdown';
import { AddUsersModalContainer } from './add-users-modal';
import blurImage from 'img/team-analytics-blur.jpg';

const TEAM_STATS_PERIOD = 14;
const NUMBER_OF_ATTEMPTS = 'Number of Attempts';
const AVG_SCORE = 'Average Score (%)';
const ACTIVE_USERS = 'Active Users (%)';
const START_TIME = 'Start Time';
const TIMESERIES_INDEX_DESC = {
  attr: 'start_time',
  name: START_TIME
};
const TIMESERIES_FREQ = 'D';
const TIMESERIES_VALUE_DESCRIPTORS = [
  {
    attr: 'percentage_score',
    aggFunc: 'mean',
    name: AVG_SCORE,
    parseFunc: parsing.toOneDecimalPlace
  },
  {
    attr: 'total_count',
    aggFunc: 'sum',
    name: NUMBER_OF_ATTEMPTS,
    parseFunc: parsing.toTruncatedInt
  },
  {
    attr: 'user__id',
    // This is a sum initially, however it is converted to a
    // percentage of team members in the stat component
    aggFunc: 'nunique',
    name: ACTIVE_USERS,
    parseFunc: parsing.toTruncatedInt
  }
];

const PIVOT_TABLE_INDEX_DESCRIPTORS = [
  { attr: 'user__learner__learnergroups__name', name: 'Team' }
];

function getTeamStatsTsProcessor() {
  const tsProcessor = new TimeseriesProcessor(TIMESERIES_INDEX_DESC, TIMESERIES_VALUE_DESCRIPTORS);
  return tsProcessor;
}

function getTeamStatsPtProcessor() {
  const ptProcessor = new PivotTableProcessor(
    PIVOT_TABLE_INDEX_DESCRIPTORS,
    TIMESERIES_VALUE_DESCRIPTORS
  );
  return ptProcessor;
}

const goalStyle = {
  noPadding: {
    padding: 0
  },
  slim: {
    padding: 5
  }
};

const styles = {
  editPencil: {
    cursor: 'pointer'
  }
};

const userListItem = {
  avatarImage: {
    marginRight: '15px',
    cursor: 'pointer'
  },
  dropdownMenu: {
    width: '125px'
  },
  dropItem: {},
  settings: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    fontSize: '18px'
  },
  settingsIcon: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    fontSize: 18
  },
  deactivateUserIcon: {
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 16,
    float: 'right'
  }
};

export class UsersCollection extends React.Component {
  static propTypes = {
    users: React.PropTypes.instanceOf(Im.List).isRequired,
    team: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  getUserProgressSegment() {
    const userId = this.props.user.get('id');
    const status = ProgressTrackerState.Store.getUserStatus(userId);
    let segment = null;
    if (status) {
      segment = (
        <div className="meta">
          <ProgressLabel status={status} />
        </div>
      );
    }
    return segment;
  }

  constructor() {
    super();
    this.state = {
      selectedUser: null,
      gatedFeatureHeaderText: 'Upgrade to Pro — Selectively Enroll Users'
    };
  }

  showGatedFeatureModal = () => {
    this.groupsAndAreasGatedModal.show();
  };

  showDeactivateUserModal = user => {
    this.setState({ selectedUser: user });
    _.defer(() => this.refs.deactivateUserModal.show());
  };

  showEnrollUserModal = user => {
    this.setState({ gatedFeatureHeaderText: 'Upgrade to Pro — Selectively Enroll Users' });
    if (this.props.currentUser.get('learner').company.subscription.groups_and_areas_enabled) {
      this.setState({
        selectedUser: user
      });
      _.defer(() => this.refs.enrollModal.show());
    } else {
      this.showGatedFeatureModal();
    }
  };

  showEditUserModal = user => {
    this.setState({
      gatedFeatureHeaderText: 'Upgrade to Pro — Grant permissions to certain users'
    });
    if (this.props.currentUser.get('learner').company.subscription.groups_and_areas_enabled) {
      this.setState({
        selectedUser: user
      });
      _.defer(() => this.refs.permissionsModal.show());
    } else {
      this.showGatedFeatureModal();
    }
  };

  deactivateUserConfirmClick = () => {
    const learnerURL = this.state.selectedUser.get('learner').url;
    let mems = this.props.team.get('members');
    mems = _.without(mems, learnerURL);
    TeamsState.ActionCreators.update(this.props.team.get('id'), { members: mems });
    UsersState.ActionCreators.update(this.state.selectedUser.get('id'), { is_active: false });
    this.refs.deactivateUserModal.hide();
  };

  userIsManager() {
    const learner = this.props.currentUser.get('learner');
    return learner.is_company_admin || learner.is_learner_group_admin || learner.is_area_manager;
  }

  getTableRow = user => {
    const learner = user.get('learner');
    const fullName = `${user.get('first_name')} ${user.get('last_name')}`;
    const image = <AvatarImage size="2.5em" style={userListItem.avatarImage} user={user} />;
    const score = learner.training_score;
    const rank = learner.learnergroup_rank_for_past_month;
    const accuracy = Math.round(learner.average_percentage_score);
    const enrollments = learner.num_training_plan_enrollments;
    const pastDueEnrollments = learner.num_past_due_enrollments;
    const modules = learner.num_modules_completed;
    const lastActivityTxt = learner.last_activity
      ? moment(learner.last_activity).fromNow()
      : 'No activity';
    const lastActivitySort = learner.last_activity ? moment(learner.last_activity).valueOf() : 0;
    const lastActivity = <span key={lastActivitySort}>{lastActivityTxt}</span>;
    const manager = learner.is_learner_group_admin ? 'Yes' : 'No';
    const progress = (learner.module_consumption_proportion * 100).toFixed(1);

    const enrollUser = _.partial(this.showEnrollUserModal, user);
    const editUser = _.partial(this.showEditUserModal, user);
    const deactivateUser = _.partial(this.showDeactivateUserModal, user);

    const actions = (
      <Dropdown className="ui top left pointing dropdown">
        <i className="setting icon" style={userListItem.settingsIcon} />
        <div className="menu" style={userListItem.dropdownMenu}>
          <div className="ui item" style={userListItem.dropItem} onClick={enrollUser}>
            {t('enroll')}
            <i className="plus icon" style={userListItem.deactivateUserIcon} />
          </div>
          <div className="ui item" style={userListItem.dropItem} onClick={editUser}>
            {t('edit')}
            <i className="write icon" style={userListItem.deactivateUserIcon} />
          </div>
          <div className="ui item" style={userListItem.dropItem} onClick={deactivateUser}>
            {t('deactivate')}
            <i className="remove icon" style={userListItem.deactivateUserIcon} />
          </div>
        </div>
      </Dropdown>
    );

    let row = Im.List([
      image,
      fullName,
      score,
      rank,
      progress,
      enrollments,
      pastDueEnrollments,
      lastActivity,
      manager
    ]);

    if (this.userIsManager()) row = row.push(actions);

    // Attach user so it can be used by onRowClick
    row.__user = user;

    return row;
  };

  navigateToUser = user => {
    this.context.router.push(resolve('profile', {
      userId: user.get('id')
    }));
  };

  onRowClick = (row, dataNum) => {
    // Do not navigate to user if this is the action cell
    if (dataNum === row.size - 1) {
      return;
    }
    this.navigateToUser(row.__user);
  };

  render() {
    let headers = Im.List([
      '',
      'Name',
      'Score',
      'Rank for Month',
      'Progress (%)',
      'Enrollments',
      'Overdue',
      'Last Activity',
      'Manager'
    ]);

    if (this.userIsManager()) headers = headers.push('Actions');

    const rows = this.props.users
      .map(u => {
        // When users are removed from team, user store is not necessarily
        // updated. This ensures that the user is no longer rendered.
        if (_.includes(this.props.team.get('members'), u.get('learner').url)) {
          return this.getTableRow(u);
        }
        return null;
      })
      .filter(Boolean);

    return (
      <div>
        <ScrollableDataTable
          rows={rows}
          headers={headers}
          bodyHeight={null}
          onRowClick={this.onRowClick}
          exportEnabled={this.userIsManager()}
          exportIgnoreHeaders={['', 'Actions']}
        />

        {this.state.selectedUser && (
          <Modal
            ref="deactivateUserModal"
            onConfirm={this.deactivateUserConfirmClick}
            header={t('are_you_sure')}
            basic
          >
            <div className="content">
              {t('deactivate_user_info', {
                selectedUser: this.state.selectedUser.get('first_name')
              })}
            </div>
          </Modal>
        )}

        {this.state.selectedUser && (
          <EnrollWithSelectedUsersModal
            ref="enrollModal"
            currentUser={this.props.currentUser}
            selectedUsers={[this.state.selectedUser]}
          />
        )}

        {this.state.selectedUser && (
          <UserPermissionsModal
            ref="permissionsModal"
            currentUser={this.props.currentUser}
            selectedUser={this.state.selectedUser}
            showIsActiveToggle={false}
            teams={this.props.teams}
          />
        )}
        <GatedFeatureModal
          ref={groupsAndAreasGatedModal =>
            (this.groupsAndAreasGatedModal = groupsAndAreasGatedModal)
          }
          headerText={this.state.gatedFeatureHeaderText}
          descriptionText={t('all_user_admin_access')}
          featureType={GROUPS_AND_AREAS}
        />
      </div>
    );
  }
}

class EditTeamModal extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  show = () => {
    this.refs.modal.show();
  };

  hide = () => {
    this.refs.modal.hide();
  };

  render() {
    return (
      <Modal ref="modal" header={t('edit_team')} closeOnDimmerClick>
        <div className="content">
          <TeamDetailsForm
            currentUser={this.props.currentUser}
            onSubmit={this.hide}
            team={this.props.team}
          />
        </div>
      </Modal>
    );
  }
}

export class TeamPage extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    team: React.PropTypes.instanceOf(Im.Map).isRequired,
    users: React.PropTypes.instanceOf(Im.List).isRequired,
    loading: React.PropTypes.bool
  };

  static defaultProps = {
    loading: false
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      showStats: false
    };
  }

  showEditTeamModal = () => {
    this.refs.editTeamModal.show();
  };

  toggleShowStats = () => {
    // If team has not loaded, then don't do anything
    if (!this.props.team.get('id')) return;
    this.setState({ showStats: !this.state.showStats });
    analytics.track('view stats');
  };

  toggleProgressReport = () => {
    // If team has not loaded, then don't do anything
    if (!this.props.team.get('id')) return;
    this.setState({ showProgressReport: !this.state.showProgressReport });
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    let innerContent = (
      <UsersCollection
        users={this.props.users}
        currentUser={this.props.currentUser}
        team={this.props.team}
      />
    );
    if (!this.props.loading && this.props.users.count() === 0) {
      innerContent = <p>{t('team_has_no_members')}</p>;
    } else if (this.props.loading) {
      innerContent = <LoadingSpinner />;
    }
    const statsButtonText = this.state.showStats ? t('hide_analytics') : t('view_analytics');
    let progressReportSegment = null;
    if (this.state.showProgressReport) {
      progressReportSegment = <ProgressReportSegment team={this.props.team} />;
    }
    let editTeamButton;
    if (learner.is_learner_group_admin || learner.is_company_admin || learner.is_area_manager) {
      editTeamButton = (
        <i style={styles.editPencil} onClick={this.showEditTeamModal} className="icon pencil" />
      );
    }
    const enableAnalytics = this.props.currentUser.get('learner').company.subscription
      .analytics_enabled;
    const descriptionText =
      'Dig deeper with Myagi’s analytics and find out how your associates consume training content, improve performance, and compare to other associates and teams.';
    // Only show back button if this is an admin user. Otherwise, there is no
    // point really.
    const backOpts =
      learner.is_company_admin || learner.is_area_manager
        ? {
          text: 'Teams',
          onClick: this.context.router.goBack
        }
        : null;

    let displayInviteBtn;
    const inviteSwitch = learner.company.companysettings.users_can_invite_others_to_join;
    if (
      learner.is_company_admin ||
      learner.is_learner_group_admin ||
      learner.is_training_unit_admin ||
      learner.is_area_manager ||
      inviteSwitch
    ) {
      displayInviteBtn = true;
    }

    return (
      <Panel>
        <BoxHeader
          heading={this.props.team.get('name')}
          style={{ overflow: 'visible' }}
          backOpts={backOpts}
        >
          {editTeamButton}
          {displayInviteBtn ? (
            <InviteUsersButton
              currentUser={this.props.currentUser}
              btnStyle={{ float: 'right' }}
              team={this.props.team}
            />
          ) : null}
          {learner.is_company_admin ? <AddUsersModalContainer team={this.props.team} /> : null}
          <button
            className="ui button right floated show-stats-btn"
            style={{ background: 'none' }}
            onClick={this.toggleShowStats}
          >
            {statsButtonText}
          </button>

          <div style={{ clear: 'both' }} />
          {this.state.showStats ? (
            <LoadingContainer
              loadingProps={[
                this.props.team,
                this.props.users,
                this.props.teamAttemptTimeseries,
                this.props.teamAttemptStats
              ]}
              createComponent={() => (
                <GatedFeatureBox
                  hideContent={!enableAnalytics}
                  descriptionText={descriptionText}
                  headerText="Upgrade to Pro — Get Analytics Access"
                  backgroundImage={blurImage}
                  featureType={ANALYTICS}
                >
                  <AttemptStatsContainer
                    attemptStats={this.props.teamAttemptStats}
                    attemptTimeseries={this.props.teamAttemptTimeseries}
                    users={this.props.users}
                    show={this.state.showStats}
                    entityName="Team"
                    query="user__learner__learnergroups__name"
                  />
                </GatedFeatureBox>
              )}
              shouldRenderNoData={() => false}
            />
          ) : null}
        </BoxHeader>

        <div>
          <BoxContent>
            <div>
              {progressReportSegment}

              {innerContent}
            </div>
          </BoxContent>
        </div>

        <EditTeamModal
          ref="editTeamModal"
          currentUser={this.props.currentUser}
          team={this.props.team}
        />
      </Panel>
    );
  }
}

export const Page = Marty.createContainer(TeamPage, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [
    TeamsState.Store,
    UsersState.Store,
    TrainingPlansState.Store,
    ProgressTrackerState.Store,
    ModuleAttemptsDataframeState.Store
  ],

  getStatPeriodStart() {
    if (!this._periodStart) {
      this._periodStart = moment().subtract(TEAM_STATS_PERIOD, 'days');
    }
    return this._periodStart;
  },

  getStatPeriodEnd() {
    if (!this._periodEnd) {
      this._periodEnd = moment();
    }
    return this._periodEnd;
  },

  getTeamPivotTableFetchParams() {
    const ptProcessor = getTeamStatsPtProcessor();
    return {
      indexes: ptProcessor.getIndexes(),
      values: ptProcessor.getValues(),
      agg_funcs: ptProcessor.getAggFuncs(),
      fill_na: 0,
      start_time__gte: momentToISO(this.getStatPeriodStart()),
      // Because we are restricting to one team and data is indexed by team name,
      // should always get back a table with only one row (at most).
      user__learner__learnergroups: this.context.routeParams.teamId,
      user__is_active: true
    };
  },

  getTeamTimeseriesFetchParams() {
    const tsProcessor = getTeamStatsTsProcessor();
    return {
      index: tsProcessor.getIndex(),
      values: tsProcessor.getValues(),
      freq: TIMESERIES_FREQ,
      agg_funcs: tsProcessor.getAggFuncs(),
      group_by: tsProcessor.getGroupBy(),
      // Without this, graphs will not work in instance where average score for a day
      // is `NaN`
      fill_na: 0,
      start_time__gte: momentToISO(this.getStatPeriodStart()),
      fill_range_start: momentToISO(this.getStatPeriodStart()),
      fill_range_end: momentToISO(this.getStatPeriodEnd()),
      user__learner__learnergroups: this.context.routeParams.teamId,
      user__is_active: true
    };
  },

  fetch: {
    team() {
      return TeamsState.Store.getItem(this.context.routeParams.teamId, {
        fields: ['id', 'name', 'members'].concat($y.getFields(TeamDetailsForm, 'team'))
      });
    },

    teamAttemptTimeseries() {
      return ModuleAttemptsDataframeState.Store.getTimeseries(this.getTeamTimeseriesFetchParams());
    },

    teamAttemptStats() {
      return ModuleAttemptsDataframeState.Store.getPivotTable(this.getTeamPivotTableFetchParams());
    },

    users() {
      // TODO - Users should be fetched by expanding the team members field. Advantage of this
      // is that the previous view (teams) already fetches members. Means some data will be cached.
      return UsersState.Store.getItems(
        {
          learner__learnergroups: this.context.routeParams.teamId,
          is_active: true,
          fields: [
            'id',
            'first_name',
            'last_name',
            'is_active',
            'learner.profile_photo',
            'learner.average_percentage_score',
            'learner.learnergroup_rank_for_past_month',
            'learner.learnergroup_id',
            'learner.num_training_plan_enrollments',
            'learner.num_modules_completed',
            'learner.num_past_due_enrollments',
            'learner.training_score',
            'learner.url',
            'learner.is_company_admin',
            'learner.is_learner_group_admin',
            'learner.last_activity',
            'learner.module_consumption_proportion'
          ],
          ordering: 'first_name',
          // TODO - Paginate users
          limit: 0
        },
        {
          // When user is removed from team, remote fetch is immediately
          // triggered unless this option is specified.
          dependantOn: TeamsState.Store
        }
      );
    },

    trainingPlans() {
      return TrainingPlansState.Store.getItems(
        {
          ordering: 'name',
          fields: ['name', 'id', 'url'],
          limit: 0
        },
        {
          // Prevent reads while teams are being updated.
          // Although technically this store is not dependant on
          // teams, adding this option prevents excessive remote calls.
          dependantOn: TeamsState.Store
        }
      );
    }
  },

  getDefaultProps() {
    return {
      team: Im.Map(),
      users: Im.List(),
      trainingPlans: Im.List()
    };
  },

  pending() {
    return containerUtils.defaultPending(this, TeamPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TeamPage, errors);
  }
});
