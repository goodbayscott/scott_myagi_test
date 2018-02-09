import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import $y from 'utilities/yaler';

import ModalState from './modal-state';
import CompaniesState from 'state/companies';
import TrainingSchedulesState from 'state/training-schedules';
import TrainingPlansState from 'state/training-plans';
import TeamsState from 'state/teams';
import EnrollmentGroupsState from 'state/enrollment-groups';
import UsersState from 'state/users';

import { DescriptionBox } from 'components/settings/common/';
import PageMenuContainer from 'components/common/page-menu-container';
import { LoadingContainer } from 'components/common/loading';
import { ScrollableDataTable } from 'components/common/table';

import { Modal } from 'components/common/modal';
import { SlideToggle } from 'components/common/form';
import { remoteSearchMixinFactory } from 'components/common/search';

import containerUtils from 'utilities/containers';
import createPaginatedStateContainer, { NUM_PAGED } from 'state/pagination';

const styles = {
  container: {},
  enrollmentGroupSlideToggle: {
    marginLeft: 10,
    verticalAlign: 'bottom'
  },
  descriptionBox: {
    marginBottom: 20,
    maxWidth: '100%'
  },
  groupToggleItem: {
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 400
  }
};

export class EnrollmentGroupCollection extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      selectedEnrollmentGroup: null
    };
  }

  static propTypes = {
    enrollmentGroups: React.PropTypes.instanceOf(Im.List).isRequired,
    plan: React.PropTypes.instanceOf(Im.Map).isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static data = {
    enrollmentGroups: {
      fields: ['id', 'url', 'name', 'auto_enroll_plans', 'num_viewable_users']
    }
  };

  removeEnrollmentsConfirm = () => {
    // Remove all enrollments for users in selected team & plan
    const data = {
      training_plan: this.props.plan.get('url'),
      enrollment_group: this.state.selectedEnrollmentGroup.get('url')
    };
    TrainingSchedulesState.ActionCreators.doListAction('disenroll_users_by_entity', data);
    this.refs.removeGroupEnrollmentsModal.hide();
    this.props.show();
  };

  showRemoveGroupEnrollmentsModal = () => {
    this.refs.removeGroupEnrollmentsModal.show();
  };

  toggleAutoEnroll = enrollmentGroup => {
    this.setState({ selectedEnrollmentGroup: enrollmentGroup });
    const planURL = this.props.plan.get('url');
    let remove = false;
    let enrollmentGroupAutoEnrollPlans = enrollmentGroup.get('auto_enroll_plans');
    if (enrollmentGroupAutoEnrollPlans.indexOf(planURL) === -1) {
      // Enrollment group does not currently have the plan in auto enroll. Add it.
      enrollmentGroupAutoEnrollPlans.push(planURL);
    } else {
      // Enrollment group already has the plan in auto enroll. Remove it.
      remove = true;
      enrollmentGroupAutoEnrollPlans = _.without(enrollmentGroupAutoEnrollPlans, planURL);
    }
    EnrollmentGroupsState.ActionCreators.update(enrollmentGroup.get('id'), {
      auto_enroll_plans: enrollmentGroupAutoEnrollPlans
    });
    // Update optimistically. Otherwise, if you toggle multiple auto enroll
    // entities before the message disappears, changes may not be saved.
    this.context.displayTempPositiveMessage({
      heading: 'changes_saved'
    });
    // Ask user if they want to delete all enrollments for this user / plan combo
    if (remove) this.showRemoveGroupEnrollmentsModal();
  };

  createSlideToggle = (label, initial, onChange, disabled = false) => (
    <SlideToggle key={initial} initialValue={initial} onChange={onChange} disabled={disabled} />
  );

  static tableDataMapping = {
    Name: e => e.get('name'),
    'Number of users': e => e.get('num_viewable_users'),
    Enrolled: (e, cxt) => {
      const onChange = () => {
        cxt.toggleAutoEnroll(e);
      };
      const planInAutoEnroll = e.get('auto_enroll_plans').indexOf(cxt.props.plan.get('url')) > -1;
      const slideToggle = cxt.createSlideToggle('Enrolled', planInAutoEnroll, onChange);
      return slideToggle;
    }
  };

  getDataMapping() {
    const mapping = EnrollmentGroupCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    return this.props.enrollmentGroups.map(e => Im.List(funcs.map(f => f(e, this))));
  }

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();

    return (
      <div>
        {!this.props.enrollmentGroups.size ? (
          <div>{t('you_do_not_have_any_groups')}</div>
        ) : (
          <div>
            <ScrollableDataTable
              headers={headers}
              rows={rows}
              bodyHeight={null}
              ref="table"
              // Disabled sort when user is searching, because table will be sorted according to
              // search rank
              sortDisabled={Boolean(this.props.search)}
            />
          </div>
        )}
        <Modal
          ref="removeGroupEnrollmentsModal"
          onConfirm={this.removeEnrollmentsConfirm}
          onCancel={this.props.show}
          header={t('remove_existing_enrollments')}
          basic
        >
          <div className="content">
            {/* TODO */}
            You have removed the "{this.props.plan.get('name')}" plan from your "
            {this.state.selectedEnrollmentGroup
              ? this.state.selectedEnrollmentGroup.get('name')
              : null}
            " group. Would you also like to revoke access to this plan for previously enrolled team
            members?
          </div>
        </Modal>
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(ModalState.ActionCreators.setEnrollmentSearch.bind(ModalState.ActionCreators)))
export class EnrollmentGroupContainer extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <DescriptionBox
          style={styles.descriptionBox}
          info={`Select groups that should have access to the "${this.props.plan.get('name')}" plan.`}
        />
        <div style={styles.searchContainer}>
          {this.getSearchInput({
            initialValue: 'Search...',
            style: { marginBottom: 0 }
          })}
        </div>
        {this.props.numAvailablePages && (
          <PageMenuContainer
            currentPage={this.props.currentPage}
            numAvailablePages={this.props.numAvailablePages}
            goToPage={this.props.goToPage}
          >
            <LoadingContainer
              loadingProps={{
                enrollmentGroups: this.props.enrollmentGroups
              }}
              noDataText="You haven't created any groups"
              createComponent={props => <EnrollmentGroupCollection {...this.props} />}
            />
          </PageMenuContainer>
        )}
      </div>
    );
  }
}

export const GroupModal = createPaginatedStateContainer(EnrollmentGroupContainer, {
  listenTo: [
    TrainingPlansState.Store,
    TeamsState.Store,
    TrainingSchedulesState.Store,
    CompaniesState.Store,
    EnrollmentGroupsState.Store,
    UsersState.Store,
    ModalState.Store
  ],
  paginate: {
    // By default, get all users who are enrolled in the selected plan.
    // But when there's a search term, fetch all users so they can be
    // enrolled in the plan.
    store: EnrollmentGroupsState.Store,
    paginationType: NUM_PAGED,
    propName: 'enrollmentGroups',
    limit: 20,
    storeOpts: {
      // Users will need to be re-fetched when updating LearnerTrainingSchedules.
      // Deleting an enrollment is done through TrainingPlansState.
      dependantOn: [
        TrainingPlansState.Store,
        TrainingSchedulesState.Store,
        TeamsState.Store,
        UsersState.Store
      ]
    },
    getQuery() {
      const q = {
        ordering: 'name',
        fields: [$y.getFields(EnrollmentGroupCollection, 'enrollmentGroups')]
      };
      const search = ModalState.Store.getEnrollmentSearch();
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }
      return q;
    }
  },
  pending() {
    return containerUtils.defaultPending(this, EnrollmentGroupContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EnrollmentGroupContainer, errors);
  }
});
