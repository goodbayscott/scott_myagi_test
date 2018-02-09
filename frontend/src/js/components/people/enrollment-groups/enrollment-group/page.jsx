import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';
import EnrollmentGroupsState from 'state/enrollment-groups';
import UsersState from 'state/users';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import Style from 'style';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import createPaginatedStateContainer from 'state/pagination';
import { getIdFromApiUrl } from 'utilities/generic';
import containerUtils from 'utilities/containers';
import { momentToISO } from 'utilities/time';
import $y from 'utilities/yaler';
import { getHeaders, getRows } from 'utilities/table';
import { TimeseriesProcessor, PivotTableProcessor } from 'utilities/dataframe';
import { AttemptStatsContainer } from 'components/common/stats';
import parsing from 'components/analytics/parsing';

import { LoadingContainer } from 'components/common/loading';
import { Modal } from 'components/common/modal';
import { Form, SubmitButton } from 'components/common/form/index';
import { Panel, BoxHeader, BoxContent } from 'components/common/box';
import { AvatarImage } from 'components/common/avatar-images';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';
import { EnrollmentGroupDetailsForm } from '../enrollment-group-details-form';
import { ScrollableDataTable } from 'components/common/table';
import { Dropdown } from 'components/common/dropdown';
import { ManyUsersSelection } from 'components/common/many-users-selection/index';

const ACTION_BTN_DATA_NUM = 3;

const ENROLLMENT_GROUP_STATS_PERIOD = 14;
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
    // percentage of enrollment group members in the stat component
    aggFunc: 'nunique',
    name: ACTIVE_USERS,
    parseFunc: parsing.toTruncatedInt
  }
];

const PIVOT_TABLE_INDEX_DESCRIPTORS = [{ attr: 'user__enrollment_groups__name', name: 'Group' }];

function getEnrollmentGroupStatsTsProcessor() {
  const tsProcessor = new TimeseriesProcessor(TIMESERIES_INDEX_DESC, TIMESERIES_VALUE_DESCRIPTORS);
  return tsProcessor;
}

function getEnrollmentGroupStatsPtProcessor() {
  const ptProcessor = new PivotTableProcessor(
    PIVOT_TABLE_INDEX_DESCRIPTORS,
    TIMESERIES_VALUE_DESCRIPTORS
  );
  return ptProcessor;
}

const styles = {
  dropdownMenu: {
    width: '125px'
  },
  dropItem: {},
  settingsIcon: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    fontSize: 18
  },
  removeUserIcon: {
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 16,
    float: 'right'
  },
  container: {
    margin: 20,
    marginTop: 40
  }
};

class AddUsersModal extends React.Component {
  static data = {
    enrollmentGroup: {
      fields: ['members.url']
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  };

  onSubmit = data => {
    const usersSet = this.props.enrollmentGroup.get('members').map(user => user.url);
    const groupName = this.props.enrollmentGroup.get('name');
    usersSet.push(...data.users);
    EnrollmentGroupsState.ActionCreators.update(
      this.props.enrollmentGroup.get('id'),
      { members: usersSet },
      {
        query: { fields: $y.getFields(EnrollmentGroupPage, 'enrollmentGroup') },
        updateOptimistically: false
      }
    );
    this.context.displayTempPositiveMessage({ heading: `Users added to the "${groupName}" group` });
    this.hide();
  };

  show() {
    this.refs.modal.show();
  }

  hide() {
    this.refs.modal.hide();
  }

  render() {
    // TODO: exclude users who are currently in the group
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('add_users')}>
        <div className="content">
          <Form onSubmitAndValid={this.onSubmit}>
            <ManyUsersSelection
              name="users"
              currentUser={this.props.currentUser}
              getTeamUsers
              hideEnrollmentGroups
              required
            />
            <SubmitButton />
          </Form>
        </div>
      </Modal>
    );
  }
}

class EditEnrollmentGroupModal extends React.Component {
  static data = {
    enrollmentGroup: {
      required: true,
      fields: $y.getFields(EnrollmentGroupDetailsForm, 'enrollmentGroup')
    }
  };

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
    const learner = this.props.currentUser.get('learner');
    let modalTitle = 'Group Details';
    if (learner.is_area_manager || learner.is_company_admin || learner.is_training_unit_admin) {
      modalTitle = 'Edit Group';
    }

    return (
      <Modal ref="modal" header={modalTitle} closeOnDimmerClick>
        <div className="content">
          <EnrollmentGroupDetailsForm
            currentUser={this.props.currentUser}
            onSubmit={this.hide}
            enrollmentGroup={this.props.enrollmentGroup}
          />
        </div>
      </Modal>
    );
  }
}

class UsersCollection extends React.Component {
  static data = {
    viewableMembers: {
      fields: ['first_name', 'last_name', 'url', 'id', 'learner', 'learner.profile_photo']
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  static tableDataMapping = {
    '': (u, cxt) => <AvatarImage user={u} />,
    'First Name': u => u.get('first_name'),
    'Last Name': u => u.get('last_name'),
    Actions: (user, cxt) => {
      const removeUser = _.partial(cxt.showRemoveUserModal, user);
      return (
        <Dropdown className="ui top left pointing dropdown" key={user.get('id')}>
          <i className="setting icon" style={styles.settingsIcon} />
          <div className="menu" style={styles.dropdownMenu}>
            <div className="ui item" style={styles.dropItem} onClick={removeUser}>
              {t('remove')}
              <i className="remove icon" style={styles.removeUserIcon} />
            </div>
          </div>
        </Dropdown>
      );
    }
  };

  onRowClick = (row, dataNum) => {
    // Don't navigate to user when clicking on action button
    if (dataNum == ACTION_BTN_DATA_NUM) return;
    const user = row.first().props.user;
    this.context.router.push(resolve('profile', { userId: user.get('id') }));
  };

  showRemoveUserModal = user => {
    this.setState({ editUser: user });
    _.defer(this.refs.removeUserModal.show.bind(this.refs.removeUserModal));
  };

  onRemoveUserConfirm = () => {
    let userSet = this.props.enrollmentGroup.get('members').map(user => user.url);
    userSet = _.filter(userSet, url => url !== this.state.editUser.get('url'));
    EnrollmentGroupsState.ActionCreators.update(
      this.props.enrollmentGroup.get('id'),
      { members: userSet },
      {
        query: { fields: $y.getFields(EnrollmentGroupPage, 'enrollmentGroup') },
        updateOptimistically: false
      }
    );
    this.context.displayTempPositiveMessage({ heading: 'User removed from group' });
    this.refs.removeUserModal.hide();
  };

  render() {
    const headers = getHeaders(this.constructor.tableDataMapping);
    const rows = getRows(this.constructor.tableDataMapping, this.props.viewableMembers, this);
    return (
      <div>
        <InfiniteScroll
          loadMore={this.props.loadMore}
          moreDataAvailable={this.props.moreDataAvailable}
          dataIsLoading={this.props.dataIsLoading}
        >
          <ScrollableDataTable
            rows={rows}
            headers={headers}
            onRowClick={this.onRowClick}
            bodyHeight={null}
          />
        </InfiniteScroll>
        <Modal
          ref="removeUserModal"
          onConfirm={this.onRemoveUserConfirm}
          header={t('are_you_sure_remove_user_from_group', {
            name: this.props.enrollmentGroup.get('name')
          })}
          basic
        />
      </div>
    );
  }
}

export class EnrollmentGroupPage extends React.Component {
  static data = {
    enrollmentGroup: {
      required: false,
      fields: [
        'id',
        'url',
        // $y.getFields(EnrollmentGroupStatsContainer, 'enrollmentGroup'),
        $y.getFields(AddUsersModal, 'enrollmentGroup'),
        $y.getFields(EditEnrollmentGroupModal, 'enrollmentGroup')
      ]
    }
  };

  static propTypes = $y.propTypesFromData(EnrollmentGroupPage, {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      showStats: false
    };
  }

  showEditEnrollmentGroupModal = () => {
    this.refs.editEnrollmentGroupModal.show();
  };

  showAddUsersModal = () => {
    this.refs.addUsersModal.show();
  };

  toggleShowStats = () => {
    // If enrollment group has not loaded, then don't do anything
    if (!this.props.enrollmentGroup.get('id')) return;
    this.setState({ showStats: !this.state.showStats });
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    let heading;
    let subHeading;
    if (this.props.enrollmentGroup) {
      heading = this.props.enrollmentGroup.get('name');
    }
    const backOpts = {
      text: 'Groups',
      onClick: this.context.router.goBack
    };

    let detailsText = 'View details';
    if (learner.is_company_admin) {
      detailsText = 'Edit details';
    }

    return (
      <Panel>
        <BoxHeader
          heading={heading}
          subHeading={subHeading}
          style={{ overflow: 'visible' }}
          backOpts={backOpts}
        >
          <PrimaryButton style={{ float: 'right' }} onClick={this.showAddUsersModal}>
            {t('add_users')}
          </PrimaryButton>

          <SecondaryButton style={{ float: 'right' }} onClick={this.showEditEnrollmentGroupModal}>
            {detailsText}
          </SecondaryButton>

          <button
            className="ui button right floated show-stats-btn"
            style={{ background: 'none' }}
            onClick={this.toggleShowStats}
          >
            {this.state.showStats ? 'Hide Analytics' : 'View Analytics'}
          </button>

          <div style={{ clear: 'both' }} />
          {this.state.showStats ? (
            <LoadingContainer
              loadingProps={[
                this.props.enrollmentGroup,
                this.props.viewableMembers,
                this.props.enrollmentGroupAttemptTimeseries,
                this.props.enrollmentGroupAttemptStats
              ]}
              createComponent={() => (
                <AttemptStatsContainer
                  attemptStats={this.props.enrollmentGroupAttemptStats}
                  attemptTimeseries={this.props.enrollmentGroupAttemptTimeseries}
                  enrollmentGroup={this.props.enrollmentGroup}
                  users={this.props.viewableMembers}
                  show={this.state.showStats}
                  entityName="Enrollment Group"
                  query="user__enrollment_groups__name"
                />
              )}
              shouldRenderNoData={() => false}
            />
          ) : null}
        </BoxHeader>
        <BoxContent>
          <LoadingContainer
            loadingProps={[this.props.enrollmentGroup, this.props.viewableMembers]}
            createComponent={() => {
              const members = Im.List(this.props.enrollmentGroup.get('members').map(Im.Map));
              return (
                <UsersCollection
                  loadMore={this.props.loadMore}
                  moreDataAvailable={this.props.moreDataAvailable}
                  dataIsLoading={this.props.dataIsLoading}
                  enrollmentGroup={this.props.enrollmentGroup}
                  viewableMembers={this.props.viewableMembers}
                  allMembers={members}
                  currentUser={this.props.currentUser}
                />
              );
            }}
            shouldRenderNoData={() => {
              if (this.props.enrollmentGroup) {
                if (this.props.viewableMembers.size === 0) {
                  return true;
                }
                return false;
              }
              return true;
            }}
            noDataText={t('no_users_available')}
          />
        </BoxContent>
        <EditEnrollmentGroupModal
          ref="editEnrollmentGroupModal"
          currentUser={this.props.currentUser}
          enrollmentGroup={this.props.enrollmentGroup}
        />
        <AddUsersModal
          ref="addUsersModal"
          currentUser={this.props.currentUser}
          enrollmentGroup={this.props.enrollmentGroup}
        />
      </Panel>
    );
  }
}

export const Page = createPaginatedStateContainer(EnrollmentGroupPage, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [EnrollmentGroupsState.Store, UsersState.Store, ModuleAttemptsDataframeState.Store],

  getStatPeriodStart() {
    if (!this._periodStart) {
      this._periodStart = moment().subtract(ENROLLMENT_GROUP_STATS_PERIOD, 'days');
    }
    return this._periodStart;
  },
  //
  getStatPeriodEnd() {
    if (!this._periodEnd) {
      this._periodEnd = moment();
    }
    return this._periodEnd;
  },
  //
  getEnrollmentGroupPivotTableFetchParams() {
    const ptProcessor = getEnrollmentGroupStatsPtProcessor();
    return {
      indexes: ptProcessor.getIndexes(),
      values: ptProcessor.getValues(),
      agg_funcs: ptProcessor.getAggFuncs(),
      fill_na: 0,
      start_time__gte: momentToISO(this.getStatPeriodStart()),
      // Because we are restricting to one area and data is indexed by area name,
      // should always get back a table with only one row (at most).
      user__enrollment_groups__id: this.context.routeParams.enrollmentGroupId,
      user__is_active: true
    };
  },
  //
  getEnrollmentGroupTimeseriesFetchParams() {
    const tsProcessor = getEnrollmentGroupStatsTsProcessor();
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
      user__enrollment_groups__id: this.context.routeParams.enrollmentGroupId,
      user__is_active: true
    };
  },

  getViewableMembersQuery(query, currentUser) {
    const learner = currentUser.get('learner');
    // if learner is just a team manager, limit users to only users in team
    if (
      !learner.is_company_admin &&
      !learner.is_area_manager &&
      !learner.is_training_unit_admin &&
      learner.is_learner_group_admin
    ) {
      return _.extend(query, { learner__learnergroups: getIdFromApiUrl(learner.learner_group) });
    }
    return query;
  },

  paginate: {
    store: UsersState.Store,
    propName: 'viewableMembers',
    getQuery() {
      let query = {
        ordering: 'first_name',
        limit: 10,
        enrollment_groups: this.context.routeParams.enrollmentGroupId,
        fields: [$y.getFields(UsersCollection, 'viewableMembers')]
      };
      query = this.getViewableMembersQuery(query, this.props.currentUser);
      return query;
    }
  },

  fetch: {
    enrollmentGroup() {
      return EnrollmentGroupsState.Store.getItem(this.context.routeParams.enrollmentGroupId, {
        fields: $y.getFields(EnrollmentGroupPage, 'enrollmentGroup')
      });
    },

    enrollmentGroupAttemptTimeseries() {
      return ModuleAttemptsDataframeState.Store.getTimeseries(this.getEnrollmentGroupTimeseriesFetchParams());
    },

    enrollmentGroupAttemptStats() {
      return ModuleAttemptsDataframeState.Store.getPivotTable(this.getEnrollmentGroupPivotTableFetchParams());
    }
  },

  pending() {
    return containerUtils.defaultPending(this, EnrollmentGroupPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, EnrollmentGroupPage, errors);
  }
});
