import React from 'react';
import Im from 'immutable';

import { ANALYTICS_EVENTS } from 'core/constants';

import $y from 'utilities/yaler.js';

import { TrainingPlanDetailsForm } from './plan-details';
import { ViewTrainingPlanModal } from './plan-modal';
import { Modal } from 'components/common/modal';

export class CreatePlanModal extends React.Component {
  static data = {
    channels: $y.getData(TrainingPlanDetailsForm, 'channels')
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  static propTypes = $y.propTypesFromData(CreatePlanModal, {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayPlanOnCompletion: React.PropTypes.bool,
    onPlanCreated: React.PropTypes.func
  });

  static defaultProps = {
    displayPlanOnCompletion: true
  };

  constructor() {
    super();
    this.state = {
      newPlan: null
    };
  }

  show = () => {
    this.refs.modal.show();
    analytics.track(ANALYTICS_EVENTS.START_TRAINING_PLAN_CREATION);
  };

  hide = () => {
    this.refs.modal.hide();
  };

  onModuleUpdate = () => {
    if (this.props.onModuleUpdate) this.props.onModuleUpdate();
  };

  onSubmit = res => {
    const plan = Im.Map(res.body);
    analytics.track(ANALYTICS_EVENTS.FINISH_TRAINING_PLAN_CREATION, {
      'Training Plan ID': plan.get('id')
    });
    this.setState({ newPlan: plan });
    if (this.props.displayPlanOnCompletion && this.refs.detailsModal) {
      this.refs.detailsModal.show();
    } else if (this.refs.modal) this.refs.modal.hide();
    if (this.props.onPlanCreated) {
      this.props.onPlanCreated(plan);
    }
  };

  render() {
    return (
      <div>
        <Modal ref="modal" header="Create a Plan" closeOnDimmerClick>
          <div className="content">
            <TrainingPlanDetailsForm
              onSubmit={this.onSubmit}
              channels={this.props.channels}
              initialChannels={this.props.initialChannels}
              currentUser={this.props.currentUser}
            />
          </div>
        </Modal>
        {this.state.newPlan ? (
          <ViewTrainingPlanModal
            ref="detailsModal"
            trainingPlan={this.state.newPlan}
            currentUser={this.props.currentUser}
            channels={this.props.channels}
            onModuleUpdate={this.onModuleUpdate}
            editable
          />
        ) : null}
      </div>
    );
  }
}
