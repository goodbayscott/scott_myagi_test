import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import { TrainingPlanCard } from 'components/training/plans/plan-card';
import { GroupSizeSwitch, Activity } from './common';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  planCardContainer: {
    marginBottom: 0
  }
};

export default class CreatePlanActivity extends React.Component {
  renderPlan(plan) {
    return (
      <div key={plan.get('id')}>
        <TrainingPlanCard
          currentUser={this.props.currentUser}
          trainingPlan={Im.Map(plan.toJS())}
          hideProgress
          // Until this prop is removed
          openTrainingPlanModal={() => {}}
          sizeMultiplier={1.5}
          containerStyle={styles.planCardContainer}
        />
      </div>
    );
  }
  renderOne = act => {
    const plan = act.get('object').get('plan');
    return (
      <Activity {...this.props} activity={act} activityTxt={t('created_a_plan')}>
        <div style={styles.container}>{this.renderPlan(plan)}</div>
      </Activity>
    );
  };
  render() {
    return <GroupSizeSwitch activityGroup={this.props.activityGroup} renderOne={this.renderOne} />;
  }
}
