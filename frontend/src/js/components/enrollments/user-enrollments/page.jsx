import React from 'react';
import Im from 'immutable';
import moment from 'moment-timezone';

import Style from 'style/index';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import createPaginatedStateContainer from 'state/pagination';

import UsersState from 'state/users';
import TeamsState from 'state/teams';
import TrainingSchedulesState from 'state/training-schedules';

import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';
import { Modal } from 'components/common/modal/index';
import { Image } from 'components/common/image';
import { EnrollWithSelectedUsersModal } from '../enroll-modal';
import { UserPermissionsModal } from '../user-permissions-modal';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';
import { InfiniteScroll } from 'components/common/infinite-scroll';

import { ScrollableDataTable } from 'components/common/table';
import { Dropdown } from 'components/common/dropdown';

const enrollmentListItem = {
  image: {
    height: '50px'
  },
  dropdownMenu: {
    width: '140px'
  },
  dropItem: {
    paddingTop: '10px',
    paddingBottom: '10px'
  },
  settings: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    fontSize: '18px'
  },
  removeTraining: {
    color: Style.vars.colors.get('darkGrey'),
    fontSize: '16px',
    marginLeft: '10px'
  },
  buttons: {
    enroll: {
      background: Style.vars.colors.get('primary'),
      color: Style.vars.colors.get('primaryFontColor'),
      border: 'none',
      width: '100px',
      height: '35px',
      float: 'right',
      marginLeft: '5px'
    }
  }
};

export class EnrollmentsCollection extends React.Component {
  static data = {
    enrollments: {
      many: true,
      fields: [
        'id',
        'plan_due_date',
        'completed_date',
        'training_plan.thumbnail_url',
        'training_plan.name'
      ]
    },
    user: {
      fields: ['first_name']
    }
  };

  static propTypes = $y.propTypesFromData(EnrollmentsCollection);

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      deleteModalCallback: null
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    /*
      This prevents an infinite loop which can happen when enrollments are deleted.
      Exact cause of infinite loop is currently unknown.
    */
    if (nextProps.enrollments && !Im.is(nextProps.enrollments, this.props.enrollments)) {
      return true;
    }
    if (nextState.deleteModalCallback !== this.state.deleteModalCallback) {
      return true;
    }
    return false;
  }

  onDeleteClick = (evt, enrollment) => {
    this.showDeleteModal(() => {
      TrainingSchedulesState.ActionCreators.delete(enrollment.get('id'));
      this.context.displayTempPositiveMessage({
        heading: 'Enrollment removed',
        body: `<b>${this.props.user.get('first_name')}</b> is no longer enrolled in <b>${
          enrollment.get('training_plan').name
        }</b>`
      });
    });
  };

  showDeleteModal = confirmCallback => {
    this.setState({ deleteModalCallback: confirmCallback });
    this.refs.deleteModal.show();
  };

  deleteConfirmClick = () => {
    this.state.deleteModalCallback();
    this.refs.deleteModal.hide();
  };

  getTableRow = enrollment => {
    const image = (
      <Image src={enrollment.get('training_plan').thumbnail_url} style={enrollmentListItem.image} />
    );
    const plan = enrollment.get('training_plan').name;
    const completed = Boolean(enrollment.get('completed_date'));
    const completedDate = moment(enrollment.get('completed_date')).format('DD-MM-YYYY');
    const completedText = completed ? `Completed on ${completedDate}` : 'Not completed';
    const completedTextColor = completed
      ? Style.vars.colors.get('green')
      : Style.vars.colors.get('red');
    const completedStyle = { color: completedTextColor };
    const planDueDate = enrollment.get('plan_due_date');
    const dueDate = planDueDate ? `Due ${moment(planDueDate).fromNow()}` : 'No due date';
    let overdueText = 'No';
    if (!completed && dueDate && moment().isAfter(planDueDate)) {
      overdueText = 'Yes';
    }
    const deleteClick = evt => this.onDeleteClick(evt, enrollment);
    const actions = (
      <Dropdown className="ui top left pointing dropdown">
        <i className="setting icon" style={enrollmentListItem.settings} />
        <div className="menu" style={enrollmentListItem.dropdownMenu}>
          <div className="ui item" onClick={deleteClick}>
            Remove
            <i className="remove icon" style={enrollmentListItem.removeTraining} />
          </div>
        </div>
      </Dropdown>
    );

    return Im.List([image, plan, dueDate, completedText, overdueText, actions]);
  };

  render() {
    const headers = Im.List(['', 'Plan', 'Due', 'Status', 'Overdue', 'Actions']);

    const rows = this.props.enrollments.map(this.getTableRow);
    return (
      <div>
        <InfiniteScroll
          loadMore={this.props.loadMore}
          moreAvailable={this.props.moreAvailable}
          isLoading={this.props.isLoading}
        >
          <ScrollableDataTable
            rows={rows}
            headers={headers}
            // Needs to be null for infinite scroll to work
            bodyHeight={null}
          />
        </InfiniteScroll>
        <Modal
          ref="deleteModal"
          onConfirm={this.deleteConfirmClick}
          header="Are you sure you want to remove this enrollment?"
          basic
        />
      </div>
    );
  }
}

export class UserEnrollmentsPage extends React.Component {
  static data = {
    enrollments: {
      required: false,
      many: true,
      fields: ['id', $y.getFields(EnrollmentsCollection, 'enrollments')]
    },
    user: {
      required: false,
      fields: [
        'id',
        'url',
        'first_name',
        'last_name',
        'email',
        'is_active',
        'learner.profile_photo',
        'learner.is_learner_group_admin',
        'learner.is_company_admin',
        'learner.url',
        'learner.learner_group',
        'learner.learnergroup_name',
        'groups.*',
        $y.getFields(EnrollmentsCollection, 'user')
      ]
    }
  };

  static propTypes = $y.propTypesFromData(UserEnrollmentsPage, {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    loading: React.PropTypes.bool
  });

  showEnrollModal = () => {
    this.refs.enrollModal.show();
  };

  showPermissionsModal = () => {
    if (
      this.refs.userPermissionsModalContainer &&
      this.refs.userPermissionsModalContainer.refs.permissionsModal
    ) {
      this.refs.userPermissionsModalContainer.refs.permissionsModal.show();
    }
  };

  render() {
    const user = this.props.user;
    const currentLearner = this.props.currentUser.get('learner');
    let permissionsBtn;
    if (currentLearner.is_learner_group_admin || currentLearner.is_company_admin) {
      permissionsBtn = (
        <SecondaryButton className="enroll-btn" onClick={this.showPermissionsModal} floatRight>
          Edit User
        </SecondaryButton>
      );
    }

    return (
      <Box>
        <BoxHeader
          heading={
            user
              ? `Enrollments for ${user.get('full_name')} (${
                user.get('learner').learnergroup_name
              })`
              : ''
          }
          imgSrc={user ? user.get('learner').profile_photo : null}
          backOpts={{
            text: 'Back'
          }}
        >
          <PrimaryButton className="enroll-btn" onClick={this.showEnrollModal} floatRight>
            Enroll
          </PrimaryButton>
          {permissionsBtn}
        </BoxHeader>
        <BoxContent>
          <LoadingContainer
            loadingProps={[this.props.user, this.props.enrollments]}
            createComponent={() => (
              <EnrollmentsCollection
                user={this.props.user}
                enrollments={this.props.enrollments}
                loadMore={this.props.loadMore}
                moreAvailable={this.props.moreAvailable}
                isLoading={this.props.isLoading}
              />
            )}
            shouldRenderNoData={() => !this.props.enrollments.count()}
            noDataText="This user has no enrollments"
          />
        </BoxContent>
        <EnrollWithSelectedUsersModal
          ref="enrollModal"
          currentUser={this.props.currentUser}
          selectedUsers={[this.props.user]}
        />

        <LoadingContainer
          ref="userPermissionsModalContainer"
          loadingProps={[this.props.user]}
          createComponent={() => (
            <UserPermissionsModal
              ref="permissionsModal"
              currentUser={this.props.currentUser}
              selectedUser={this.props.user}
              teams={this.props.teams}
            />
          )}
        />
      </Box>
    );
  }
}

export const Page = createPaginatedStateContainer(UserEnrollmentsPage, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  mixins: [],

  listenTo: [UsersState.Store, TrainingSchedulesState.Store, TeamsState.Store],

  paginate: {
    store: TrainingSchedulesState.Store,
    propName: 'enrollments',
    limit: 20,
    getQuery() {
      return {
        learner__user: this.context.routeParams.userId,
        fields: $y.getFields(UserEnrollmentsPage, 'enrollments'),
        ordering: '-id'
      };
    }
  },

  fetch: {
    user() {
      return UsersState.Store.getItem(this.context.routeParams.userId, {
        fields: $y.getFields(UserEnrollmentsPage, 'user')
      });
    },
    teams() {
      return TeamsState.Store.getItems({
        ordering: 'name',
        limit: 0,
        fields: ['name', 'id', 'url']
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, UserEnrollmentsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, UserEnrollmentsPage, errors);
  }
});
