import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';

import { t } from 'i18n';
import { qs } from 'utilities/http';
import { isMobileWidth } from 'utilities/generic';
import { ANALYTICS_EVENTS } from 'core/constants';

import Style from 'style';

import ModulesState from 'state/modules';
import ModuleTrainingPlansState from 'state/module-training-plans';
import ModuleAttemptsState from 'state/module-attempts';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { LoadingContainer } from 'components/common/loading';
import { Panel } from 'components/common/box';

import { Page as QuestionSetPageAttemptSummary } from 'components/module-attempt/module-pages/question-set-page/attempt-summary';
import { Page as FlipCardMatchPageAttemptSummary } from 'components/module-attempt/module-pages/flip-card-match-page/attempt-summary';
import { Page as QuestionPageAttemptSummary } from 'components/module-attempt/module-pages/question-page/attempt-summary';
import AttemptSummaryLeaderboard from 'components/demo/attempt-summary-leaderboard';
import { DetailedProgressBar } from '../training-plan-progress-bar';

import FeedbackModal from './feedback-modal';
import StatsBox from './stats-box';
import OverallOutcomeBox from './outcome-box';

const PAGE_ATTEMPT_TYPE_SUMMARY_MAPPINGS = {
  questionsetpageattempt: QuestionSetPageAttemptSummary,
  flipcardmatchpageattempt: FlipCardMatchPageAttemptSummary,
  questionpageattempt: QuestionPageAttemptSummary
};

const MICRODECK_PAGE_TYPE = 'flipcardpage';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row'
  },
  rightContainer: {
    width: '75%',
    marginLeft: '25%',
    [Style.vars.media.get('mobile')]: {
      width: '100%',
      marginLeft: 0
    }
  },
  feedbackContainer: {
    display: 'inline',
    textAlign: 'center'
  },
  actionButtonsBar: {
    position: 'fixed',
    bottom: 0,
    left: '25%',
    backgroundColor: Style.vars.colors.get('white'),
    borderTop: `1px solid ${Style.vars.colors.get('darkGrey')}`,
    padding: 10,
    // We've added a margin of 5 to the bottom of buttons to help when
    // the wrap on mobile, so only need padding of 5 here.
    paddingBottom: 5,
    width: '75%',
    zIndex: 9999,
    [Style.vars.media.get('mobile')]: {
      width: '100%',
      left: 0
    }
  },
  actionButtonsInner: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  feedbackButton: {
    marginLeft: 20
  }
};

function getNextForTodayIDs(location) {
  const next = location.query.nextForToday;
  return next ? next.split(',') : null;
}

@Radium
export class AttemptSummaryPageContent extends React.Component {
  static data = {
    moduleAttempt: {
      fields: [
        'id',
        'url',
        'is_successful',
        'percentage_score',
        'next_module_info',
        'page_attempts.id',
        'page_attempts.type',
        'training_plan.url',
        'training_plan.id',
        'training_plan.description',
        'training_plan.modules.id',
        'training_unit.id',
        'training_unit.name',
        'training_unit.display_name',
        $y.getFields(OverallOutcomeBox, 'moduleAttempt'),
        $y.getFields(StatsBox, 'moduleAttempt'),
        $y.getFields(FeedbackModal, 'moduleAttempt')
      ]
    },

    module: {
      fields: [
        'id',
        'url',
        'name',
        'training_plans',
        'pages.type',
        $y.getFields(StatsBox, 'module'),
        $y.getFields(FeedbackModal, 'module')
      ]
    },

    // Optional prop which is only fetched if the `nextForToday`
    // query param is set
    nextModuleForToday: {
      required: false,
      fields: ['id', 'most_relevant_training_plan_for_current_user', 'training_plans.id']
    }
  };

  static propTypes = $y.propTypesFromData(AttemptSummaryPageContent);

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    routeParams: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      distanceFromTop: 80
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);

    const mod = this.props.module;
    if (mod) {
      // Track completion of microdecks so that we can send
      // a feedback request via Intercom
      const pages = mod.get('pages');
      if (pages) {
        let isMicrodeck = false;
        pages.forEach(a => {
          if (a.type === MICRODECK_PAGE_TYPE) {
            isMicrodeck = true;
          }
        });
        if (isMicrodeck) {
          analytics.track('Finish Microdeck module', {
            'Current Module ID': this.props.module.get('id')
          });
        }
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  getPageAttemptSummaryComponent = (pageAttempt, i, allPageAttemptTypes) => {
    let component = PAGE_ATTEMPT_TYPE_SUMMARY_MAPPINGS[pageAttempt.type];
    if (component) {
      component = React.createFactory(component);
      const rendered = component({
        key: pageAttempt.id,
        pageAttemptId: pageAttempt.id,
        currentUser: this.props.currentUser,
        index: i,
        allPageAttemptTypes
      });
      return rendered;
    }
    return null;
  };

  getTrainingPlanId = () => this.props.moduleAttempt.get('training_plan').id;

  handleScroll = event => {
    const distanceFromTop = this.page.getBoundingClientRect().top;
    this.setState({
      distanceFromTop
    });
  };

  repeatModule = () => {
    // If the router is used here instead of just changing the URL,
    // there will be a problem with the ModuleAttemptPage when generating
    // a new ModuleAttempt & corresponding QuestionSetPageAttempt.
    // An unwanted duplicate QuestionSetPageAttempt is created otherwise.
    const modId = this.props.module.get('id');
    const tpId = this.getTrainingPlanId();
    window.location.href = `/views/training_plans/${tpId}/modules/${modId}/attempts/new/${
      this.context.location.search
    }`;
  };

  startModuleAttempt = (modId, planId, currentModId, nextQuery = '') => {
    analytics.track(ANALYTICS_EVENTS.GO_TO_NEXT_MODULE, {
      'Current Module ID': currentModId,
      'Next Module ID': modId
    });

    this.context.router.push(resolve('new-module-attempt', {
      moduleId: modId,
      trainingPlanId: planId
    }) + nextQuery);
  };

  renderHomeBtn = () => {
    const { goToChannelOnCompletion, goToReviewOnCompletion } = this.context.location.query;
    let text = t('home');
    let action = () => this.context.router.push(resolve('training'));
    const className = 'basic home';
    const styling = {
      backgroundColor: `${Style.vars.colors.get('mediumGrey')} !important`
    };

    // This param is used during the demo
    if (goToReviewOnCompletion) {
      text = t('back_to_review');
      action = () =>
        this.context.router.push(`${resolve('demo-allocation-management')}?tab=Review`);
    }
    // Go to channelId if there was one specified
    if (goToChannelOnCompletion) {
      text = t('back_to_channel');
      action = () =>
        this.context.router.push(resolve('channel-content', {
          channelId: this.props.moduleAttempt.get('training_unit').id
        }));
    }
    return this.renderButton(className, styling, action, text);
  };

  renderNextBtn = () => {
    /*
      This method will take the user to one of three routes:
        1. The next lesson in the plan
        2. The next lesson for today
        3. The first lesson in the next plan
    */
    const { moduleAttempt, nextModuleForToday } = this.props;
    const nextMod = moduleAttempt.get('next_module_info');
    const currentModId = moduleAttempt.get('module').id;
    let text = t('next_lesson');
    let action = () => this.startModuleAttempt(nextMod.mod_id, nextMod.plan_id, currentModId);
    const className = 'next-btn';
    const styling = {
      color: Style.vars.colors.get('white'),
      backgroundColor: Style.vars.colors.get('green')
    };

    // Construct next query by removing current next module from nextForToday
    // set (if it exists), and passing along the rest of the ids
    let nextIds = getNextForTodayIDs(this.context.location);
    nextIds = nextIds && nextIds.filter(i => i !== String(nextModuleForToday.get('id')));
    const nextQuery = nextIds && nextIds.length > 0 ? `?nextForToday=${nextIds.join(',')}` : '';
    if (nextIds) {
      text = t('next_for_today');
      action = () =>
        this.startModuleAttempt(
          nextModuleForToday.get('id'),
          nextModuleForToday.get('most_relevant_training_plan_for_current_user').id,
          currentModId,
          nextQuery
        );
    } else if (nextMod && !nextMod.from_current_plan) {
      // If next lesson belongs to another plan, indicate that.
      // No need to update lesson and plan ids as the `next_module_info`
      // method handles this
      text = t('next_plan');
    }
    if (!nextMod) return <span />;
    return this.renderButton(className, styling, action, text);
  };

  renderBackToEditBtn = () => {
    const { returnToEdit } = this.context.location.query;
    if (!returnToEdit) return <span />;
    const className = 'back-to-edit';
    const action = () =>
      this.context.router.push(resolve(`/views/content/lessons/${
        this.context.routeParams.moduleId
      }/?returnToPlan=${this.getTrainingPlanId()}`));
    const text = t('back_to_edit');
    const styling = {
      color: Style.vars.colors.get('white'),
      backgroundColor: Style.vars.colors.get('green')
    };
    return this.renderButton(className, styling, action, text);
  };

  renderRepeatBtn = () => {
    const className = 'repeat-btn';
    const action = this.repeatModule;
    const text = ` ${t('retake')}`;
    const icon = 'repeat';
    const styling = {
      color: Style.vars.colors.get('primary'),
      backgroundColor: 'transparent',
      border: `1px solid ${Style.vars.colors.get('primary')}`
    };
    return this.renderButton(className, styling, action, text, icon);
  };

  renderButton = (name, styling, action, text, icon) => (
    <button
      className={`ui button ${name}`}
      key={name}
      style={Object.assign(
        {
          marginBottom: 5
        },
        styling
      )}
      onClick={action}
    >
      {icon && <i className={`icon ${icon}`} />}
      {text}
    </button>
  );

  render() {
    const attempts = _.sortBy(this.props.moduleAttempt.get('page_attempts'), pa => pa.id);
    const allPageAttemptTypes = attempts.map(a => a.type);
    const pageAttemptSummaries = attempts.map((a, i) =>
      this.getPageAttemptSummaryComponent(a, i, allPageAttemptTypes));
    return (
      <div ref={ref => (this.page = ref)}>
        <div style={styles.container}>
          <DetailedProgressBar
            {...this.props}
            // Setting arbitrary number here to ensure it shows completed progress
            curPageIdx={100}
            plan={new Im.Map(this.props.moduleAttempt.get('training_plan'))}
            currentModule={this.props.module}
            moduleAttempt={this.props.moduleAttempt}
            distanceFromTop={this.state.distanceFromTop}
            extraStyling={{ paddingBottom: 50 }}
          />
          <div style={styles.rightContainer}>
            <OverallOutcomeBox {...this.props} />
            <StatsBox {...this.props} />
            {this.props.currentUser.get('learner').is_demo_account &&
              !this.context.location.query.goToReviewOnCompletion && (
                <div style={{ display: 'inline', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: 0 }}>{t('leaderboard')}</h3>
                  <br />
                  <AttemptSummaryLeaderboard currentUser={this.props.currentUser} />
                </div>
              )}
            <div style={styles.feedbackContainer}>
              <h3 style={{ marginBottom: 0 }}>{t('lesson_feedback')}</h3>
              <br />
              <FeedbackModal
                ref="ratingModal"
                currentUser={this.props.currentUser}
                module={this.props.module}
                moduleAttempt={this.props.moduleAttempt}
                feedbackSubmitted={this.feedbackSubmitted}
              />
            </div>
            <div style={{ marginBottom: 100 }}>{pageAttemptSummaries}</div>
            <div style={styles.actionButtonsBar}>
              <div style={styles.actionButtonsInner}>
                {this.renderHomeBtn()}
                {this.renderRepeatBtn()}
                {this.renderNextBtn()}
                {this.renderBackToEditBtn()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class AttemptSummaryPage extends React.Component {
  static data = {
    moduleAttempt: {
      required: false,
      fields: $y.getFields(AttemptSummaryPageContent, 'moduleAttempt')
    },
    module: {
      required: false,
      fields: $y.getFields(AttemptSummaryPageContent, 'module')
    },
    nextModuleForToday: {
      required: false,
      fields: $y.getFields(AttemptSummaryPageContent, 'nextModuleForToday')
    }
  };

  static propTypes = $y.propTypesFromData(AttemptSummaryPage);

  render() {
    const loadingProps = {
      moduleTrainingPlans: this.props.moduleTrainingPlans,
      moduleAttempt: this.props.moduleAttempt,
      module: this.props.module
    };
    if (this.props.hasNextModule) {
      loadingProps.nextModuleForToday = this.props.nextModuleForToday;
    }
    return (
      <Panel style={{ minHeight: window.innerHeight - 170 }}>
        <LoadingContainer
          loadingProps={loadingProps}
          createComponent={() => <AttemptSummaryPageContent {...this.props} />}
        />
      </Panel>
    );
  }
}

export const Page = Marty.createContainer(AttemptSummaryPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  },

  listenTo: [ModuleTrainingPlansState.Store, ModuleAttemptsState.Store, ModulesState.Store],

  fetch: {
    moduleAttempt() {
      return ModuleAttemptsState.Store.getItem(this.context.routeParams.attemptId, {
        fields: $y.getFields(AttemptSummaryPage, 'moduleAttempt')
      });
    },
    module() {
      return ModulesState.Store.getItem(this.context.routeParams.moduleId, {
        fields: $y.getFields(AttemptSummaryPage, 'module')
      });
    },
    hasNextModule() {
      const nextIds = getNextForTodayIDs(this.context.location);
      return nextIds && nextIds[0];
    },
    nextModuleForToday() {
      // nextForToday is an optional query param. If specified, then
      // we use that to determine where to send the current user after they
      // complete the current module.
      const nextIds = getNextForTodayIDs(this.context.location);
      if (nextIds && nextIds[0]) {
        return ModulesState.Store.getItem(nextIds[0], {
          fields: $y.getFields(AttemptSummaryPage, 'nextModuleForToday')
        });
      }
      return null;
    },
    moduleTrainingPlans() {
      const { moduleId } = this.context.routeParams;
      return ModuleTrainingPlansState.Store.getItems({
        ordering: 'order,module__name',
        for_attempt: moduleId,
        module_is_attemptable: true,
        module__deactivated__isnull: true,
        limit: 0,
        fields: [
          'module.order',
          'module.name',
          'module.successfully_completed_by_current_user',
          'module.id',
          'module.thumbnail_url',
          'module.description',
          'module.pages',
          'module.pages.type',
          'module.pages.thumbnail_url',
          'module.pages.question',
          'module.pages.cards'
        ]
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, AttemptSummaryPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, AttemptSummaryPage, errors);
  }
});
