import Marty from 'marty';
import React from 'react';
import cx from 'classnames';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';
import { t } from 'i18n';
import reactMixin from 'react-mixin';

import Style from 'style';

import { momentToISO } from 'utilities/time';

import TrainingSchedulesState from 'state/training-schedules';

import { Modal } from 'components/common/modal/index';
import {
  Form,
  SubmitButton,
  HiddenTextInput,
  SearchableSelect
} from 'components/common/form/index';
import { ManyUsersSelection } from 'components/common/many-users-selection/index';
import { TrainingPlanSearchableMultiSelect } from 'components/common/searchable-multiselect';

import { ANALYTICS_EVENTS } from 'core/constants';

function getEnrollmentDate() {
  const now = moment();
  return momentToISO(now.add(...arguments));
}

const NO_DUE_DATE = 'NO_DUE_DATE';
const ENROLLMENT_DUE_DATES = [
  {
    label: 'No due date',
    // Required because searchable dropdown does not like
    // falsey values.
    value: NO_DUE_DATE
  },
  {
    label: '1 week',
    value: getEnrollmentDate(1, 'week')
  },
  {
    label: '2 weeks',
    value: getEnrollmentDate(2, 'weeks')
  },
  {
    label: '1 month',
    value: getEnrollmentDate(1, 'month')
  },
  {
    label: '45 days',
    value: getEnrollmentDate(45, 'days')
  },
  {
    label: '2 months',
    value: getEnrollmentDate(2, 'months')
  }
];

class DueDateSelectionInput extends React.Component {
  getNameAndValue() {
    return this.refs.selection.getNameAndValue();
  }

  isValid() {
    return this.refs.selection.isValid();
  }

  render() {
    return (
      <div style={this.props.style}>
        <h3>Select due date</h3>
        <p>Date by which plans must be completed.</p>
        <HiddenTextInput />
        <SearchableSelect
          options={ENROLLMENT_DUE_DATES}
          name={this.props.name}
          style={{ container: { marginBottom: 10 } }}
          ref="selection"
        />
      </div>
    );
  }
}

export class SelectUsersModal extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  show() {
    this.refs.modal.show();
  }

  hide() {
    this.refs.modal.hide();
  }

  render() {
    // `minHeight` on modal prevents modal from jumping around too much on resize
    return (
      <Modal ref="modal" header="Manual Enrollment" closeOnDimmerClick>
        <div className="content">
          <Form onSubmitAndValid={this.props.onSubmitAndValid}>
            <DueDateSelectionInput name="due_date" />
            <h3>Select users</h3>
            <p>These users will be informed that they have been enrolled in the selected plans.</p>
            <ManyUsersSelection currentUser={this.props.currentUser} required returnLearners />
            <SubmitButton text={this.props.submitText} />
          </Form>
        </div>
      </Modal>
    );
  }
}

export class SelectTrainingPlansModal extends React.Component {
  show() {
    this.refs.modal.show();
  }

  hide() {
    this.refs.modal.hide();
  }

  addOption = () => {
    // if the modal is not refreshed and many options have been added,
    // it will become unscrollable.
    if (this.refs.modal) {
      this.refs.modal.refresh();
    }
  };

  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick header="Manual Enrollment">
        <div className="content">
          <Form onSubmitAndValid={this.props.onSubmitAndValid}>
            <h3>Select plans</h3>
            <HiddenTextInput />
            <p>Only plans which have lessons and are published can be selected.</p>
            <TrainingPlanSearchableMultiSelect
              name="trainingPlanURLs"
              onChange={this.addOption}
              required
            />
            {this.props.showDueDateSelection ? (
              <DueDateSelectionInput style={{ marginTop: 10 }} name="due_date" />
            ) : null}
            <SubmitButton text={this.props.submitText || t('next')} />
          </Form>
        </div>
      </Modal>
    );
  }
}

const EnrollModalMixin = {
  contextTypes: {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  },

  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  createEnrollments(data) {
    analytics.track(ANALYTICS_EVENTS.ENROLL_USERS_IN_CONTENT, {
      assignedBy: data.assigned_by,
      trainingPlans: data.training_plans,
      learners: data.learners,
      teams: data.teams
    });
    if (data.due_date === NO_DUE_DATE) data.due_date = undefined;
    data.assigned_by = this.props.currentUser.get('url');
    TrainingSchedulesState.ActionCreators.doListAction('bulk_create', data);
    this.context.displayTempPositiveMessage({
      heading: 'Enrollment successful'
    });
    this.hideAll();
  }
};

@reactMixin.decorate(EnrollModalMixin)
export class EnrollModal extends React.Component {
  constructor() {
    super();
    this.state = {
      enrollmentData: {}
    };
  }

  onFirstSubmitAndValid = data => {
    this.state.enrollmentData.training_plans = data.trainingPlanURLs;
    this.refs.selectUsersModal.show();
  };

  onSecondSubmitAndValid = data => {
    _.extend(this.state.enrollmentData, data);
    this.createEnrollments.call(this, this.state.enrollmentData);
  };

  hideAll() {
    this.refs.selectPlansModal.hide();
    this.refs.selectUsersModal.hide();
  }

  show() {
    this.refs.selectPlansModal.show();
  }

  render() {
    return (
      <div>
        <SelectTrainingPlansModal
          ref="selectPlansModal"
          onSubmitAndValid={this.onFirstSubmitAndValid}
          currentUser={this.props.currentUser}
        />
        <SelectUsersModal
          ref="selectUsersModal"
          onSubmitAndValid={this.onSecondSubmitAndValid}
          currentUser={this.props.currentUser}
        />
      </div>
    );
  }
}

@reactMixin.decorate(EnrollModalMixin)
export class EnrollWithSelectedPlansModal extends React.Component {
  static propTypes = {
    selectedTrainingPlans: React.PropTypes.array.isRequired
  };

  onFormSubmitAndValid = data => {
    data.training_plans = this.props.selectedTrainingPlans.map(plan => plan.get('url'));
    this.createEnrollments(data);
  };

  hideAll() {
    this.refs.selectUsersModal.hide();
  }

  show() {
    this.refs.selectUsersModal.show();
  }

  render() {
    return (
      <div>
        <SelectUsersModal
          ref="selectUsersModal"
          onSubmitAndValid={this.onFormSubmitAndValid}
          currentUser={this.props.currentUser}
        />
      </div>
    );
  }
}

@reactMixin.decorate(EnrollModalMixin)
export class EnrollWithSelectedUsersModal extends React.Component {
  static propTypes = {
    selectedUsers: React.PropTypes.array.isRequired
  };

  onFormSubmitAndValid = data => {
    const submitData = {};
    submitData.learners = this.props.selectedUsers.map(user => user.get('learner').url || user.get('learner'));
    submitData.due_date = data.due_date;
    delete data.due_date;
    submitData.training_plans = data.trainingPlanURLs;
    this.createEnrollments(submitData);
  };

  hideAll() {
    this.refs.selectPlansModal.hide();
  }

  show() {
    this.refs.selectPlansModal.show();
  }

  render() {
    return (
      <div>
        <SelectTrainingPlansModal
          ref="selectPlansModal"
          onSubmitAndValid={this.onFormSubmitAndValid}
          currentUser={this.props.currentUser}
          submitText={t('submit')}
          showDueDateSelection
        />
      </div>
    );
  }
}
