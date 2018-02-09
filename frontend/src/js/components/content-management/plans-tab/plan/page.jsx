import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Radium from 'radium';
import Style from 'style';
import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import TrainingPlansState from 'state/training-plans';
import CompaniesState from 'state/companies';
import ModulesState from 'state/modules';
import UsersState from 'state/users';

import { EnrollSection, EnrollPage } from './enrollments';
import { LessonSection } from './lessons';
import { ChannelsSection } from './channels';
import { PlanDetails } from './details';
import { PlanStats } from './details/stats';

import { RouterBackButton } from 'components/common/box';
import { LessonCard } from 'components/common/lesson-card';
import { LoadingContainer } from 'components/common/loading';
import { ButtonToggle } from 'components/common/form';

const COLUMN_PANELS = '@media screen and (max-width: 750px)';

const styles = {
  container: {
    background: '#eee',
    minHeight: 'calc(100vh - 80px)'
  },
  panelContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    background: '#eee',
    width: '100%',
    [COLUMN_PANELS]: {
      flexDirection: 'column',
      alignItems: 'center'
    }
  },
  panel: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginLeft: 10,
    marginBottom: 10,
    marginRight: 10,
    padding: 22
  },
  rightPanel: {
    marginTop: 40,
    maxWidth: 500,
    minWidth: 320
  },
  leftPanels: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 1300,
    flexGrow: 1
  },
  break: {
    borderBottom: '1px solid #e5e5e5',
    marginTop: 40,
    marginBottom: 40
  },
  backLink: {
    color: '#555',
    fontSize: '1.4rem',
    paddingTop: 10,
    paddingLeft: 30
  }
};

@Radium
export class PlanDetailsPage extends React.Component {
  static data = {
    plan: {
      required: true,
      fields: [
        'id',
        'owner.url',
        'owner.company_name',
        'owner.company_logo',
        'owner.auto_enroll_plans',
        'training_units.price',
        'training_units.learner_group',
        'name',
        'is_published',
        'thumbnail_url',
        'custom_thumbnail',
        'modules',
        'deactivated',
        'num_enrolled_users',

        $y.getFields(PlanDetails, 'plan'),
        $y.getFields(PlanStats, 'plan')
      ]
    }
  };

  static contextTypes = {
    location: React.PropTypes.object.isRequired,
    routeParams: React.PropTypes.object.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      userCanEditPlan: undefined,
      showArchivedLessons: false
    };
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    // calculate this once, to avoid flickering behavior when saving
    if (this.state.userCanEditPlan === undefined) {
      const learner = this.context.currentUser.get('learner');
      const lg = this.props.plan.get('training_units')[0]
        ? this.props.plan.get('training_units')[0].learner_group
        : null;
      const userCanEditPlan =
        learner.company.url === this.props.plan.get('owner').url &&
        (learner.can_manage_training_content ||
          (learner.is_learner_group_admin && lg === learner.learner_group));
      this.setState({ ...this.state, userCanEditPlan });
    }
  }

  onPlanPublishedToggle = () => {
    TrainingPlansState.ActionCreators.update(this.props.plan.get('id'), {
      is_published: !this.props.plan.get('is_published'),
      name: this.props.plan.get('name'),
      owner: this.props.plan.get('owner').url
    }).then(res => {
      this.context.displayTempPositiveMessage({ heading: 'changes_saved' });
    });
  };

  showArchive = () => {
    this.setState({
      showArchivedLessons: !this.state.showArchivedLessons
    });
  };

  render() {
    const learner = this.props.currentUser.get('learner');

    const isPaidChannel = (
      learner.company.url !== this.props.plan.get('owner').url &&
      this.props.plan.get('training_units')[0] &&
      this.props.plan.get('training_units')[0].price
    )

    return (
      <div style={styles.container}>
        <div style={styles.panelContainer}>
          <div style={styles.leftPanels}>
            <div style={styles.backLink}>
              <RouterBackButton text={this.context.location.query.previous || 'Plans'} />
            </div>
            <div style={styles.panel}>
              <PlanDetails
                plan={this.props.plan}
                channels={this.props.channels}
                currentUser={this.context.currentUser}
                userCanEditPlan={this.state.userCanEditPlan}
              />
            </div>
            <div style={styles.panel}>
              <LessonSection
                {...this.props}
                currentUser={this.context.currentUser}
                userCanEditPlan={this.state.userCanEditPlan}
                showArchivedLessons={this.state.showArchivedLessons}
                showArchive={this.showArchive}
              />
            </div>
          </div>
          {!isPaidChannel && 
            <div style={{ ...styles.panel, ...styles.rightPanel }}>
              {this.state.userCanEditPlan && (
                <div style={{ marginTop: 15 }}>
                  <ButtonToggle
                    leftLabel="Published"
                    rightLabel="Unpublished"
                    initialValue={this.props.plan.get('is_published') ? 'Published' : 'Unpublished'}
                    initialIsAcceptable
                    onChange={this.onPlanPublishedToggle}
                  />
                </div>
              )}
              {learner.can_enroll_others_in_training_content && (
                <div>
                  <div style={styles.break} />
                  <EnrollSection plan={this.props.plan} currentUser={this.context.currentUser} />
                </div>
              )}

              {learner.is_company_admin &&
                this.state.userCanEditPlan && (
                  <div>
                    <div style={styles.break} />
                    <ChannelsSection plan={this.props.plan} currentUser={this.context.currentUser} />
                  </div>
                )}
            </div>
          }
        </div>
      </div>
    );
  }
}

export class PlanDetailsPageContainer extends React.Component {
  render() {
    return (
      <LoadingContainer
        loadingProps={{
          plan: this.props.plan
        }}
        createComponent={props => <PlanDetailsPage {...this.props} />}
      />
    );
  }
}

export const Page = Marty.createContainer(PlanDetailsPageContainer, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired
  },
  listenTo: [TrainingPlansState.Store, CompaniesState.Store, UsersState.Store, ModulesState.Store],
  fetch: {
    plan() {
      return TrainingPlansState.Store.getItem(
        this.context.routeParams.planId,
        {
          fields: [
            $y.getFields(PlanDetailsPage, 'plan'),
            $y.getFields(LessonCard, 'module', 'modules'),
            $y.getFields(EnrollPage, 'plan')
          ]
        },
        { dependantOn: [ModulesState.Store, CompaniesState.Store] }
      );
    }
  },

  pending() {
    return containerUtils.defaultPending(this, PlanDetailsPageContainer);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, PlanDetailsPageContainer, errors);
  }
});
