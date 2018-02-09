import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import { TrainingPlanCard } from 'components/training/plans/plan-card';
import { Modal } from 'components/common/modal';
import { Activity, GroupSizeSwitch } from './common';

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
  plansSummaryContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginLeft: 'calc(4em + 10px)'
  },
  planSummary: {
    padding: 5,
    color: 'white',
    backgroundColor: Style.vars.colors.get('xDarkGrey'),
    fontSize: 12,
    marginRight: 5,
    marginTop: 5,
    borderRadius: 3
  }
};

export default class AttemptActivity extends React.Component {
  showPlans = () => {
    this.modal.show();
  };
  renderPlan(plan) {
    return (
      <div key={plan.get('id')}>
        <TrainingPlanCard
          currentUser={this.props.currentUser}
          trainingPlan={Im.Map(plan.toJS())}
          hideProgress
          // Until this prop is removed
          openTrainingPlanModal={() => {}}
          sizeMultiplier={1}
          containerStyle={styles.planCardContainer}
        />
      </div>
    );
  }
  renderPlanSummary(plan) {
    return (
      <div key={plan.get('id')} style={styles.planSummary}>
        {plan.get('name')}
      </div>
    );
  }
  renderOne = act => {
    const atts = act.get('object').get('attempts');
    // // Get list of unique plans
    // let plans = {};
    // atts.forEach((a) => {
    //   const tp = a.get('training_plan');
    //   if (!plans[tp.get('id')]) plans[tp.get('id')] = tp;
    // });
    // plans = _.values(plans);
    // const count = plans.length;
    let totalSeconds = 0;
    atts.forEach(a => {
      totalSeconds += a.get('total_time_in_seconds');
    });
    return (
      <Activity
        {...this.props}
        activity={act}
        activityTxt={`completed ${totalSeconds / 60} minutes worth of training`}
        onClick={this.showPlans}
      />
    );
  };
  render() {
    return <GroupSizeSwitch activityGroup={this.props.activityGroup} renderOne={this.renderOne} />;
  }
}
