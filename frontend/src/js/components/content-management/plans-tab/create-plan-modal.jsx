import React from 'react';
import { resolve } from 'react-router-named-routes';
import _ from 'lodash';

import TrainingPlansState from 'state/training-plans';
import CompaniesState from 'state/companies';

import { TextInput } from 'components/common/form';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';
import { LoadingSpinner } from 'components/common/loading';

const styles = {
  button: {
    display: 'block',
    width: 100,
    marginLeft: 0
  },
  spinner: {
    height: 30,
    width: 100
  },
  header: {
    borderBottom: 'none',
    paddingBottom: 0,
    fontSize: 24
  }
};

export class CreatePlanModal extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      error: false,
      submitted: false
    };
  }

  show() {
    this.refs.createPlanModal.show();
  }

  createPlan = () => {
    const name = this.input.refs.input.value;
    if (name && name.length > 0) {
      this.setState({ ...this.state, error: false, submitted: true });
      const data = {
        name,
        description: '',
        is_published: false,
        owner: this.props.currentUser.get('learner').company.url
      };

      TrainingPlansState.ActionCreators.create(data).then(res => {
        const learner = this.props.currentUser.get('learner');
        if (!learner.company.subscription.groups_and_areas_enabled) {
          // Add plan to auto enroll if company is on a free plan.
          CompaniesState.ActionCreators.update(learner.company.id, {
            auto_enroll_plans: [
              ...this.props.currentUser.get('learner').company.auto_enroll_plans,
              res.body.url
            ]
          });
        }
        this.refs.createPlanModal.hide();
        this.context.router.push(resolve('plan-management', { planId: res.body.id }));
      });
    } else {
      this.setState({ ...this.state, error: true, submitting: false });
    }
  };

  render() {
    return (
      <Modal
        ref="createPlanModal"
        header="Create Your Plan - What would you like to call it?"
        headerStyle={styles.header}
      >
        {/* TODO: Translations */}
        <div>
          <p>
            Plans are used to group lessons - Think about plans like creating a playlist of lessons.
          </p>
          <TextInput
            type="text"
            ref={c => (this.input = c)}
            placeholder="eg. Outerwear Summer Collection 2018"
          />
          {this.state.error && (
            <div className="ui negative message">Please type a valid name for your plan</div>
          )}
          {this.state.submitted ? (
            <LoadingSpinner containerStyle={styles.spinner} />
          ) : (
            <PrimaryButton style={styles.button} onClick={this.createPlan}>
              Next
            </PrimaryButton>
          )}
        </div>
      </Modal>
    );
  }
}
