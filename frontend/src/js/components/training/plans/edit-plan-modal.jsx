import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import { ANALYTICS_EVENTS } from 'core/constants';

import $y from 'utilities/yaler.js';

import { TrainingPlanDetailsForm } from './plan-details';
import { Modal } from 'components/common/modal';

export class EditPlanModal extends React.Component {
  static data = {
    channels: $y.getData(TrainingPlanDetailsForm, 'channels'),
    trainingPlan: $y.getData(TrainingPlanDetailsForm, 'trainingPlan', { required: true })
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  show = () => {
    this.refs.modal.show();
    analytics.track(ANALYTICS_EVENTS.START_TRAINING_PLAN_EDITING);
  };

  onSubmit = () => {
    analytics.track(ANALYTICS_EVENTS.FINISH_TRAINING_PLAN_EDITING, {
      'Training Plan ID': this.props.trainingPlan.get('id')
    });
    this.context.displayTempPositiveMessage({ heading: 'Plan updated' });
    // Have received some sentry errors relating to modal not being defined.
    // No idea why, why have added this null reference check just in case.
    if (this.refs.modal) this.refs.modal.hide();
  };

  render() {
    return (
      <Modal ref="modal" header="Edit Plan" closeOnDimmerClick>
        <div className="content">
          <TrainingPlanDetailsForm
            onSubmit={this.onSubmit}
            channels={this.props.channels}
            currentUser={this.props.currentUser}
            trainingPlan={this.props.trainingPlan}
          />
        </div>
      </Modal>
    );
  }
}
