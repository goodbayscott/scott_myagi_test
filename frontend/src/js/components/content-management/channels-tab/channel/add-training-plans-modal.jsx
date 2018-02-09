import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';

import TrainingPlanTrainingUnitsState from 'state/training-plan-training-units';

import { MultiSelect } from 'components/common/form/select';
import { Modal } from 'components/common/modal/index.jsx';
import { Form, SubmitButton } from 'components/common/form/index.jsx';

export const AddTrainingPlansForm = React.createClass({
  propTypes: {
    trainingPlans: React.PropTypes.instanceOf(Im.List),
    onSubmitAndValid: React.PropTypes.func.isRequired,
    label: React.PropTypes.string,
    selectedTrainingPlans: React.PropTypes.instanceOf(Im.List)
  },
  getInitialState(props) {
    let plans = this.props.selectedTrainingPlans ? this.props.selectedTrainingPlans : [];
    plans = plans.map(plan => ({ label: plan.name, value: plan.url }));
    return {
      selectedTrainingPlans: plans,
      renderKey: 1
    };
  },
  getSelectionProps(curProps, i) {
    if (this.props.selectedTrainingPlans) {
      const selectedPlan = this.props.selectedTrainingPlans.get(i);
      if (selectedPlan && selectedPlan.get) {
        curProps.initialSelection = selectedPlan.get('url');
      }
    }

    return curProps;
  },
  onSubmitAndValid(data) {
    this.props.onSubmitAndValid(data);
  },
  onPlanCreated(plan) {
    this.setState({
      selectedTrainingPlans: this.state.selectedTrainingPlans.concat({
        label: plan.get('name'),
        value: plan.get('url')
      }),
      renderKey: this.state.renderKey + 1
    });
  },
  render() {
    let options = [];
    if (this.props.trainingPlans) {
      options = this.props.trainingPlans
        .map(tp => ({
          value: tp.get('url'),
          label: tp.get('name')
        }))
        .toJSON();
      options = _.sortBy(options, 'name');
    }
    const initPlanSelection = this.state.selectedTrainingPlans.map(plan => ({
      label: plan.label,
      value: plan.value
    }));
    return (
      <Form
        onSubmitAndValid={this.onSubmitAndValid}
        loading={this.props.trainingPlans === undefined}
      >
        <h3>{t('select_plans')}</h3>

        <MultiSelect
          key={this.state.renderKey}
          required
          ref="planMultiSelect"
          name="training_plans"
          options={options}
          initialSelection={initPlanSelection}
          placeholder={`${t('select_plans')}...`}
          noResultsText={`${t('no_plans_found')}.`}
          onChange={_.noop}
          multi
        />
        <SubmitButton loading={this.props.loading} />
      </Form>
    );
  }
});

export const AddTrainingPlansModal = React.createClass({
  propTypes: {
    trainingPlans: React.PropTypes.instanceOf(Im.List),
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  contextTypes: {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  },
  onSubmitAndValid(data) {
    // Get added and removed plans
    const submittedPlans = data.training_plans;
    delete data.training_plans;

    const channelPlans = this.props.channel.get('training_plans');

    const addedPlans = submittedPlans.filter(tp => !_.includes(channelPlans, tp));

    addedPlans.forEach(tpURL => {
      TrainingPlanTrainingUnitsState.ActionCreators.create({
        training_unit: this.props.channel.get('url'),
        training_plan: tpURL,
        order: 0
      });
    });

    this.context.displayTempPositiveMessage({
      heading: 'Added plans to channel'
    });

    this.refs.modal.hide();
  },
  show() {
    this.refs.modal.show();
  },
  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('add_plans')}>
        <div className="content">
          <AddTrainingPlansForm
            onSubmitAndValid={this.onSubmitAndValid}
            currentUser={this.props.currentUser}
            channel={this.props.channel}
            trainingPlans={this.props.trainingPlans}
          />
        </div>
      </Modal>
    );
  }
});
