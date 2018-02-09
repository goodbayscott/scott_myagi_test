import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';
import Radium from 'radium';

import $y from 'utilities/yaler';
import { t } from 'i18n';

import Style from 'style';

import { TrainingPlanCard } from 'components/training/plans/plan-card';
import { Modal } from 'components/common/modal';
import { GroupSizeSwitch, SingleActorActivities } from './common';
import { PlusCountMoreButton } from 'components/common/buttons';

const MAX_PREVIEW_PLANS = 3;

const styles = {
  plansContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  planCardContainer: {
    marginBottom: 0
  },
  planName: {
    fontSize: 14,
    color: Style.vars.colors.get('xxDarkGrey')
  },
  plusCountBtn: {
    alignSelf: 'center',
    marginTop: -60
  },
  modalPlansContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'wrap',
    justifyContent: 'center'
  }
};

export default class PlanAttemptActivity extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  goToPlan = plan => {
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: plan.get('next_incompleted_module_for_user'),
      trainingPlanId: plan.get('id')
    }));
  };
  renderPlan(plan) {
    return (
      <TrainingPlanCard
        key={plan.get('id')}
        currentUser={this.props.currentUser}
        trainingPlan={Im.Map(plan.toJS())}
        hideProgress
        hideBadges
        // Until this prop is removed
        openTrainingPlanModal={() => {}}
        sizeMultiplier={0.6}
        containerStyle={styles.planCardContainer}
        nameStyle={styles.planName}
      />
    );
  }
  renderAllPlansModal(allPlans) {
    return (
      <Modal header={t('plans')} ref={e => (this.allPlansModal = e)}>
        <div style={styles.modalPlansContainer}>{allPlans.map(p => this.renderPlan(p)).toJS()}</div>
      </Modal>
    );
  }
  renderHiddenPlansCount(hiddenPlans) {
    if (!hiddenPlans.count()) return null;
    return (
      <PlusCountMoreButton
        style={styles.plusCountBtn}
        count={hiddenPlans.count()}
        onClick={() => this.allPlansModal.show()}
      />
    );
  }
  renderMany = acts => {
    let lessonCount = 0;
    acts.forEach(act => {
      const atts = act.get('object').get('attempts');
      // Get list of unique lessons
      const lessons = {};
      atts.forEach(a => {
        const lesson = a.get('module');
        if (!lessons[lesson]) lessons[lesson] = true;
      });
      lessonCount += _.values(lessons).length;
    });
    const allPlans = acts.map(a => a.get('object').get('plan'));
    const planCount = allPlans.count();
    const displayedPlans = allPlans.slice(0, MAX_PREVIEW_PLANS);
    const hiddenPlans = allPlans.slice(MAX_PREVIEW_PLANS);
    return (
      <SingleActorActivities
        activities={acts}
        summaryTxt={
          lessonCount === 1
            ? t('completed_one_lesson_from_plans')
            : t('completed_count_lessons_from_plans', { count: lessonCount })
        }
      >
        <div style={styles.plansContainer}>
          {displayedPlans.map(p => this.renderPlan(p)).toJS()}
          {this.renderHiddenPlansCount(hiddenPlans)}
        </div>
        {this.renderAllPlansModal(allPlans)}
      </SingleActorActivities>
    );
  };
  render() {
    // In future, we could creat a `renderOne` render method, though the majority of the
    // time this activity type ends up getting aggregated.
    return (
      <GroupSizeSwitch activityGroup={this.props.activityGroup} renderMany={this.renderMany} />
    );
  }
}
