import React from 'react';
import { resolve } from 'react-router-named-routes';

import { ANALYTICS_EVENTS } from 'core/constants';

import TrainingPageUtils from 'utilities/component-helpers/training-page';

import { LessonCard } from 'components/common/lesson-card';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: 1400,
    flexWrap: 'wrap'
  }
};

export default class ModuleCards extends React.Component {
  static data = {
    modules: {
      many: true,
      fields: [
        'id',
        'last_successful_attempt_for_current_user',
        'most_relevant_training_plan_for_current_user'
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  attemptModule = module => {
    let nextModules;
    if (this.props.passNextForToday) {
      // Get the next, incomplete module in the set
      nextModules = this.props.modules.filter(mod => mod.get('id') !== module.get('id') && !TrainingPageUtils.moduleWasCompletedToday(mod));
    }
    // Pass all nextIds so that user can complete the sequence of modules for today
    const nextIds =
      nextModules && nextModules.count() ? nextModules.map(m => m.get('id')).toArray() : null;
    const nextQuery = nextIds ? `?nextForToday=${nextIds.join(',')}` : '';
    analytics.track(ANALYTICS_EVENTS.START_TODAY_MODULE, {
      'Module ID': module.get('id')
    });
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: module.get('id'),
      trainingPlanId: module.get('most_relevant_training_plan_for_current_user').id
    }) + nextQuery);
  };

  render() {
    return (
      <div style={styles.container}>
        {this.props.modules.map(m => (
          <LessonCard key={m.get('id')} module={m} onClick={() => this.attemptModule(m)} />
        ))}
      </div>
    );
  }
}
