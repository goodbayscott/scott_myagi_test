import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import Style from 'style';
import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';
import { resolve } from 'react-router-named-routes';
import { Link } from 'react-router';

import { Modal } from 'components/common/modal';
import { Info } from 'components/common/info.jsx';

import CompaniesState from 'state/companies';
import TrainingSchedulesState from 'state/training-schedules';
import TrainingPlansState from 'state/training-plans';
import TeamsState from 'state/teams';
import EnrollmentGroupsState from 'state/enrollment-groups';
import UsersState from 'state/users';

import { LoadingContainer } from 'components/common/loading';
import { ButtonToggle } from 'components/common/form';
import { TeamModal } from './modals/team/modal';
import { GroupModal } from './modals/enrollment-group/modal';
import { EnrollWithSelectedPlansModal } from 'components/enrollments/enroll-modal';
import { SecondaryButton } from 'components/common/buttons';
import { EditButton } from '../../../common/edit-button';
import { GatedFeatureModal, GROUPS_AND_AREAS } from 'components/common/gated-feature';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    fontWeight: '200',
    fontSize: '1.6rem',
    marginBottom: 10
  },
  listTitle: {
    fontSize: '1.1rem',
    marginTop: 18,
    marginBottom: 3,
    marginRight: 10,
    display: 'flex',
    alignItems: 'center'
  },
  selectionContainer: {
    borderLeft: '5px solid #eee',
    paddingLeft: 15,
    transition: 'all 0.5s ease',
    ':hover': {
      borderLeft: `5px solid ${Style.vars.colors.get('blue')}`
    }
  },
  listItem: {
    display: 'inline-block',
    backgroundColor: Style.vars.colors.get('blue'),
    color: '#fff',
    padding: '4px 8px',
    borderRadius: 4,
    margin: '4px 8px 4px 0px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: Style.vars.colors.get('primary'),
      color: Style.vars.colors.get('primaryFontColor')
    }
  },
  manualEnrollBtn: {
    width: 150,
    marginLeft: 0
  },
  manageEnrollBtn: {
    width: '100%',
    marginLeft: 0
  },
  viewEnrollBtn: {
    width: 150,
    marginLeft: 0
  },
  break: {
    marginTop: 40,
    marginBottom: 40
  },
  tooltip: {
    tooltip: { left: -100, width: 500 },
    content: { fontSize: 14, whiteSpace: 'wrap', fontWeight: 'normal' }
  }
};

@Radium
export class EnrollPage extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    plan: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  static data = {
    plan: {
      fields: [
        'name',
        'num_enrolled_users',
        'num_enrolled_users_in_own_company',
        'enrollment_groups',
        'auto_enroll'
      ]
    },
    enrollmentGroups: {
      fields: ['name']
    },
    teams: {
      fields: ['name']
    }
  };

  planAutoEnrollTurnedOn = () => {
    const companyAutoEnrollPlans = this.currentCompanyAutoEnrollPlans();
    if (companyAutoEnrollPlans.includes(this.props.plan.get('url'))) return true;
    return false;
  };

  onCompanyAutoEnrollToggle = () => {
    let newCompanyAutoEnrollPlans = this.currentCompanyAutoEnrollPlans();
    const planURL = this.props.plan.get('url');

    if (newCompanyAutoEnrollPlans.indexOf(planURL) > -1) {
      newCompanyAutoEnrollPlans = _.without(newCompanyAutoEnrollPlans, planURL);
      this.removeCompanyEnrollmentsModal.show();
    } else {
      newCompanyAutoEnrollPlans.push(planURL);
    }
    CompaniesState.ActionCreators.update(this.props.currentUser.get('learner').company.id, {
      auto_enroll_plans: newCompanyAutoEnrollPlans
    });
    // Update optimistically. Otherwise, if you toggle multiple auto enroll
    // entities before the message disappears, changes may not be saved.
    this.context.displayTempPositiveMessage({
      heading: 'changes_saved'
    });
  };

  currentCompanyAutoEnrollPlans = () =>
    this.props.currentUser.get('learner').company.auto_enroll_plans;

  viewEnrollments = () =>
    this.context.router.push(resolve('training-plan-enrollments', {
      planId: this.props.plan.get('id')
    }));

  removeEnrollmentsConfirm = () => {
    // Remove all enrollments for users in selected team & plan
    const data = {
      training_plan: this.props.plan.get('url'),
      company: this.props.currentUser.get('learner').company.url
    };
    TrainingSchedulesState.ActionCreators.doListAction('disenroll_users_by_entity', data);
    this.removeCompanyEnrollmentsModal.hide();
  };

  renderAutoEnrollControl() {
    const planInCompanyAutoEnroll = _.includes(
      this.currentCompanyAutoEnrollPlans(),
      this.props.plan.get('url')
    );
    return (
      <div style={styles.container}>
        <div style={styles.title}>
          {t('automatic_enrollment')}
          <Info content={t('automatic_enrollment_info')} tooltipStyle={styles.tooltip} />
        </div>
        <div>
          <ButtonToggle
            leftLabel={t('everyone')}
            rightLabel={t('custom')}
            initialValue={planInCompanyAutoEnroll ? t('everyone') : t('custom')}
            initialIsAcceptable
            onChange={this.onCompanyAutoEnrollToggle}
          />
        </div>
        {!planInCompanyAutoEnroll && (
          <div>
            <div key="enrollTeams" style={styles.selectionContainer}>
              <div style={styles.listTitle}>{t('teams')}</div>

              {this.props.teams &&
                this.props.teams.map(t => (
                  <div key={t.get('id')}>
                    <Link to={resolve('team', { teamId: t.get('id') })}>
                      <div style={styles.listItem} key={t.get('id')}>
                        {t.get('name')}
                      </div>
                    </Link>
                  </div>
                ))}
              <EditButton
                id="editTeams"
                onClick={() => this.enrollTeamsModal.show()}
                length={this.props.teams && this.props.teams.size}
              />
            </div>

            <div key="enrollGroups" style={styles.selectionContainer}>
              <div style={styles.listTitle}>{t('groups')}</div>

              {this.props.enrollmentGroups &&
                this.props.enrollmentGroups.map(e => (
                  <div key={e.get('id')}>
                    <Link
                      to={resolve('enrollment-groups', {
                        enrollmentGroupId: e.get('id')
                      })}
                    >
                      <div style={styles.listItem} key={e.get('id')}>
                        {e.get('name')}
                      </div>
                    </Link>
                  </div>
                ))}
              <EditButton
                id="editGroups"
                onClick={() => this.enrollGroupsModal.show()}
                length={this.props.enrollmentGroups && this.props.enrollmentGroups.size}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  onManualEnrollClick = () => {
    if (this.props.currentUser.get('learner').company.subscription.groups_and_areas_enabled) {
      this.manualEnrollModal.show();
    } else {
      this.enrollGatedModal.show();
    }
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    const freePlan = !learner.company.subscription.groups_and_areas_enabled;
    return (
      <div>
        {learner.can_manage_training_content &&
          learner.company.subscription.groups_and_areas_enabled &&
          this.renderAutoEnrollControl()}

        {learner.can_manage_training_content &&
          learner.company.subscription.groups_and_areas_enabled && <div style={styles.break} />}

        {freePlan ? (
          <div style={styles.container}>
            <div style={styles.title}>
              {t('enrollments')}
              <Info content={t('manual_enrollments_info')} tooltipStyle={styles.tooltip} />
            </div>
            <SecondaryButton
              style={styles.manageEnrollBtn}
              onClick={() => this.onManualEnrollClick()}
            >
              <i className="ui icon user" /> {t('manage_enrollments')}
            </SecondaryButton>
          </div>
        ) : (
          <div style={styles.container}>
            <div style={styles.title}>
              {t('manual_enrollments')}
              <Info content={t('manual_enrollments_info')} tooltipStyle={styles.tooltip} />
            </div>
            <SecondaryButton
              style={styles.manualEnrollBtn}
              onClick={() => this.onManualEnrollClick()}
            >
              <i className="ui icon user" /> {t('select_users')}
            </SecondaryButton>
          </div>
        )}

        <div style={styles.break} />

        {!freePlan && (
          <div style={styles.container}>
            <div style={styles.title}>
              {t('current_enrollments')}
              <Info content={t('current_enrollments_info')} tooltipStyle={styles.tooltip} />
            </div>
            <SecondaryButton style={styles.viewEnrollBtn} onClick={this.viewEnrollments}>
              <i className="ui icon unhide" />
              {` ${t('view')}`}
            </SecondaryButton>
          </div>
        )}

        <Modal ref={m => (this.enrollTeamsModal = m)} header={t('your_teams')}>
          <TeamModal
            plan={this.props.plan}
            currentUser={this.props.currentUser}
            show={() => this.enrollTeamsModal && this.enrollTeamsModal.show()}
          />
        </Modal>
        <Modal ref={m => (this.enrollGroupsModal = m)} header={t('your_groups')}>
          <GroupModal
            plan={this.props.plan}
            currentUser={this.props.currentUser}
            show={() => this.enrollGroupsModal && this.enrollGroupsModal.show()}
          />
        </Modal>
        <Modal
          ref={m => (this.removeCompanyEnrollmentsModal = m)}
          onConfirm={this.removeEnrollmentsConfirm}
          header={t('remove_existing_enrollments')}
          basic
        >
          <div className="content">
            {/* TODO */}
            You have removed the "{this.props.plan.get('name')}" plan from automatic enrollments.
            Would you also like to revoke access to this plan for previously enrolled users?
          </div>
        </Modal>
        <EnrollWithSelectedPlansModal
          ref={m => (this.manualEnrollModal = m)}
          currentUser={this.props.currentUser}
          selectedTrainingPlans={[this.props.plan]}
        />
        <GatedFeatureModal
          ref={m => (this.enrollGatedModal = m)}
          headerText="Upgrade to Pro — Selectively Enroll Users"
          descriptionText="All users have admin access on free plans.  Myagi Pro puts the control in your hands by giving you groups, areas, and user tiers to keep your company’s training organized."
          featureType={GROUPS_AND_AREAS}
        />
      </div>
    );
  }
}

export class EnrollPageContainer extends React.Component {
  render() {
    return (
      <LoadingContainer
        loadingProps={{
          plan: this.props.plan
        }}
        createComponent={props => <EnrollPage {...this.props} />}
      />
    );
  }
}

export const EnrollSection = Marty.createContainer(EnrollPageContainer, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [
    TrainingPlansState.Store,
    TeamsState.Store,
    TrainingSchedulesState.Store,
    CompaniesState.Store,
    EnrollmentGroupsState.Store,
    UsersState.Store
  ],
  fetch: {
    enrollmentGroups() {
      return EnrollmentGroupsState.Store.getItems({
        auto_enroll_plans: this.props.plan.get('id'),
        fields: $y.getFields(EnrollPage, 'enrollmentGroups'),
        limit: 10
      });
    },
    teams() {
      return TeamsState.Store.getItems({
        auto_enroll_plans: this.props.plan.get('id'),
        fields: $y.getFields(EnrollPage, 'teams'),
        limit: 10
      });
    }
  },
  pending() {
    return containerUtils.defaultPending(this, EnrollPageContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EnrollPageContainer, errors);
  }
});
