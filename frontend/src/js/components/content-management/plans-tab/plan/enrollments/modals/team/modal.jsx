import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import { t } from 'i18n';
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
  teamSlideToggle: {
    marginLeft: 10,
    verticalAlign: 'bottom'
  },
  groupToggleItem: {
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 400
  }
};

export class TeamCollection extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      selectedTeam: null
    };
  }

  static propTypes = {
    teams: React.PropTypes.instanceOf(Im.List).isRequired,
    plan: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static data = {
    teams: {
      fields: ['id', 'url', 'name', 'description', 'auto_enroll_plans', 'num_users']
    }
  };

  showRemoveEnrollmentsModal = () => {
    this.refs.removeTeamEnrollmentsModal.show();
  };

  toggleAutoEnroll = team => {
    this.setState({ selectedTeam: team });
    const planURL = this.props.plan.get('url');
    let remove = false;
    let teamAutoEnrollPlans = team.get('auto_enroll_plans');
    if (teamAutoEnrollPlans.indexOf(planURL) === -1) {
      // Enrollment group does not currently have the plan in auto enroll. Add it.
      teamAutoEnrollPlans.push(planURL);
    } else {
      // Enrollment group already has the plan in auto enroll. Remove it.
      remove = true;
      teamAutoEnrollPlans = _.without(teamAutoEnrollPlans, planURL);
    }
    TeamsState.ActionCreators.update(team.get('id'), {
      auto_enroll_plans: teamAutoEnrollPlans
    });
    // Update optimistically. Otherwise, if you toggle multiple auto enroll
    // entities before the message disappears, changes may not be saved.
    this.context.displayTempPositiveMessage({
      heading: 'changes_saved'
    });
    // Ask user if they want to delete all enrollments for this team / plan combo
    if (remove) this.showRemoveEnrollmentsModal();
  };

  removeEnrollmentsConfirm = () => {
    // Remove all enrollments for users in selected team & plan
    const data = {
      training_plan: this.props.plan.get('url'),
      team: this.state.selectedTeam.get('url')
    };
    TrainingSchedulesState.ActionCreators.doListAction('disenroll_users_by_entity', data);
    this.refs.removeTeamEnrollmentsModal.hide();
    this.props.show();
  };

  createSlideToggle = (label, initial, onChange, disabled = false) => (
    <SlideToggle key={initial} initialValue={initial} onChange={onChange} disabled={disabled} />
  );

  static tableDataMapping = {
    Name: t => t.get('name'),
    Description: t => t.get('description'),
    'Number of users': t => t.get('num_users'),
    Enrolled: (t, cxt) => {
      const onChange = () => {
        cxt.toggleAutoEnroll(t);
      };
      const planInAutoEnroll = t.get('auto_enroll_plans').indexOf(cxt.props.plan.get('url')) > -1;
      const slideToggle = cxt.createSlideToggle('Enrolled', planInAutoEnroll, onChange);
      return slideToggle;
    }
  };

  getDataMapping() {
    const mapping = TeamCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    return this.props.teams.map(t => Im.List(funcs.map(f => f(t, this))));
  }

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();

    return (
      <div>
        {!this.props.teams.size ? (
          <div>{t('you_do_not_have_any_teams')}</div>
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
          ref="removeTeamEnrollmentsModal"
          onConfirm={this.removeEnrollmentsConfirm}
          onCancel={this.props.show}
          header={t('remove_existing_enrollments')}
          basic
        >
          <div className="content">
            {/* TODO */}
            You have removed the "{this.props.plan.get('name')}" plan from your "{this.state
              .selectedTeam
              ? this.state.selectedTeam.get('name')
              : null}" team. Would you also like to revoke access to this plan for previously
            enrolled team members?
          </div>
        </Modal>
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(ModalState.ActionCreators.setEnrollmentSearch.bind(ModalState.ActionCreators)))
export class TeamContainer extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <DescriptionBox
          style={{ marginBottom: 20, maxWidth: '100%' }}
          info={`Select teams that should have access to the "${this.props.plan.get('name')}" plan.`}
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
                teams: this.props.teams
              }}
              createComponent={props => <TeamCollection {...this.props} />}
            />
          </PageMenuContainer>
        )}
      </div>
    );
  }
}

export var TeamModal = createPaginatedStateContainer(TeamContainer, {
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
    store: TeamsState.Store,
    paginationType: NUM_PAGED,
    propName: 'teams',
    limit: 20,
    storeOpts: {
      // Users will need to be re-fetched when updating LearnerTrainingSchedules.
      // Deleting an enrollment is done through TrainingPlansState.
      dependantOn: [
        TrainingPlansState.Store,
        TrainingSchedulesState.Store,
        EnrollmentGroupsState.Store,
        UsersState.Store
      ]
    },
    getQuery() {
      const q = {
        ordering: 'name',
        fields: [$y.getFields(TeamCollection, 'teams')]
      };
      const learner = this.props.currentUser.get('learner');
      if (!learner.is_company_admin) {
        if (learner.is_area_manager) {
          q.areas__managers = this.props.currentUser.get('id');
        } else {
          q.has_user = this.props.currentUser.get('id');
        }
      }
      const search = ModalState.Store.getEnrollmentSearch();
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }
      return q;
    }
  },
  pending() {
    return containerUtils.defaultPending(this, TeamContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, TeamContainer, errors);
  }
});
