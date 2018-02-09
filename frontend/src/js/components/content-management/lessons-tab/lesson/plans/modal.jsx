import React from 'react';
import Marty from 'marty';
import Im from 'immutable';
import _ from 'lodash';
import RSVP from 'rsvp';

import Style from 'style';

import ModulesState from 'state/modules';
import ModuleTrainingPlansState from 'state/module-training-plans';
import TrainingPlansState from 'state/training-plans';
import containerUtils from 'utilities/containers';
import { LoadingContainer } from 'components/common/loading';
import { PrimaryButton } from 'components/common/buttons';

import $y from 'utilities/yaler';

import { MultiSelect } from 'components/common/form/select';
import { CreatePlanModal } from 'components/training/plans/create-plan-modal';

const styles = {
  container: {},
  button: {
    marginTop: 20,
    display: 'inline-block'
  }
};

export class PlansModalInner extends React.Component {
  static data = {
    trainingPlan: {
      fields: ['url', 'name']
    },
    module: {
      required: false,
      fields: [
        'name',
        'description',
        'training_plans.name',
        'training_plans.url',
        'training_plans.id',
        'training_plans.thumbnail_url'
      ]
    },
    channels: {
      required: false,
      fields: $y.getFields(CreatePlanModal, 'channels')
    }
  };

  constructor(props) {
    super();
    this.state = {
      selectedPlans: this.getInitalPlans(props)
    };
  }

  getInitalPlans(props) {
    const plans = props.initialPlans.map(plan => ({ label: plan.name, value: plan.url }));
    return plans.toJS();
  }

  onSubmit = () => {
    const initialPlans = this.getInitalPlans(this.props).map(tp => tp.value);
    const selectedPlans = this.state.selectedPlans.map(tp => tp.value);

    if (selectedPlans.length === 0) {
      return;
    }

    const addedPlans = selectedPlans.filter(tp => !_.includes(initialPlans, tp));

    const removedPlans = initialPlans.filter(tp => !_.includes(selectedPlans, tp));

    const promises = [];
    addedPlans.forEach(tpURL => {
      promises.push(ModuleTrainingPlansState.ActionCreators.create({
        module: this.props.lesson.get('url'),
        training_plan: tpURL,
        order: 0
      }));
    });

    removedPlans.forEach(tpURL => {
      promises.push(ModuleTrainingPlansState.ActionCreators.doListAction('delete_for_module_and_plan', {
        module: this.props.lesson.get('url'),
        training_plan: tpURL
      }));
    });

    // Wait for all training plans to be added / removed, because this has implications
    // for module permissions (and whether module can be fetched or not).
    this.props.onSubmit();
    // RSVP.all(promises).then(() => {
    //   this.setState({ loading: false });
    // });
  };

  onTrainingPlansChange = plans => {
    const selectedPlans = plans.map(plan => ({ label: plan.label, value: plan.value }));
    this.setState({ selectedPlans });
  };

  render() {
    const planOpts = this.props.availablePlans
      .map(p => ({ label: p.get('name'), value: p.get('url') }))
      .toJS();

    return (
      <div style={styles.container}>
        <div>
          Select which plans will contain this lesson. You can choose as many plans as you'd like.
          <br />
          <br />
        </div>

        <MultiSelect
          key={this.state.renderKey}
          required
          ref="planMultiSelect"
          name="training_plans"
          options={planOpts}
          initialSelection={this.state.selectedPlans}
          placeholder="Select plans..."
          noResultsText="No plans found."
          onChange={this.onTrainingPlansChange}
          multi
        />

        <PrimaryButton
          onClick={this.onSubmit}
          disabled={this.state.selectedPlans.length === 0}
          style={styles.button}
        >
          Save
        </PrimaryButton>
      </div>
    );
  }
}

export class PlansModalLoader extends React.Component {
  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.availablePlans]}
        createComponent={props => <PlansModalInner {...this.props} />}
      />
    );
  }
}

export const PlansModal = Marty.createContainer(PlansModalLoader, {
  listenTo: [TrainingPlansState.Store, ModuleTrainingPlansState.Store],
  fetch: {
    availablePlans() {
      const learner = this.props.currentUser.get('learner');
      return TrainingPlansState.Store.getItems({
        owner: learner.company.id,
        fields: ['id', 'name'],
        limit: 0,
        ordering: 'name'
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, PlansModalLoader);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, PlansModalLoader, errors);
  }
});
