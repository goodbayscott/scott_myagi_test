import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';

import DetailsFormUtils from 'utilities/details-form';

import EnrollmentGroupsState from 'state/enrollment-groups';
import {
  TrainingPlanSearchableMultiSelect,
  TrainingPlanTiles
} from 'components/common/searchable-multiselect';

import { Form, TextInput, TextArea, FieldHeader, SubmitButton } from 'components/common/form';
import { Info } from 'components/common/info';

export class EnrollmentGroupDetailsForm extends React.Component {
  static data = {
    enrollmentGroup: {
      required: false,
      fields: ['name', 'auto_enroll_plans', 'members']
    }
  };

  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  };

  onFormSubmitAndValid = data => {
    data.company = this.props.currentUser.get('learner').company.url;
    let groupName;
    if (data.name) groupName = data.name;
    if (!this.props.enrollmentGroup) {
      EnrollmentGroupsState.ActionCreators.create(data).then(() => {
        this.context.displayTempPositiveMessage({ heading: `New group "${groupName}" created` });
      });
    } else {
      // data.manager = data.manager || this.props.enrollmentGroup.get('manager').url;
      EnrollmentGroupsState.ActionCreators.update(this.props.enrollmentGroup.get('id'), data);
      this.context.displayTempPositiveMessage({ heading: `Group "${groupName}" updated` });
    }
    if (this.props.onSubmit) this.props.onSubmit();
  };

  render() {
    const initVals = DetailsFormUtils.getInitialValues(this.props.enrollmentGroup, [
      'name',
      'auto_enroll_plans'
    ]);
    const learner = this.props.currentUser.get('learner');
    const nameHeader = <FieldHeader required>{t('group_name')}</FieldHeader>;
    const autoEnrollHeader = (
      <FieldHeader required>
        {t('auto_enroll_in_plans')}
        <Info content={t('auto_enroll_in_plans_info')} />
      </FieldHeader>
    );
    if (learner.is_area_manager || learner.is_company_admin || learner.is_training_unit_admin) {
      return (
        <Form ref="form" onSubmitAndValid={this.onFormSubmitAndValid}>
          {nameHeader}
          <TextInput name="name" initialValue={initVals.name} required initialIsAcceptable />
          {autoEnrollHeader}
          <TrainingPlanSearchableMultiSelect
            name="auto_enroll_plans"
            initialSelections={initVals.auto_enroll_plans}
            initialIsAcceptable
          />
          <SubmitButton />
        </Form>
      );
    }
    // learner group admins must be able to view details of the enrollment
    // group, but they may not edit.
    return (
      <div>
        {nameHeader}
        <p>{initVals.name}</p>
        {autoEnrollHeader}
        <TrainingPlanTiles
          name="auto_enroll_plans"
          initialSelections={initVals.auto_enroll_plans}
          fetchOpts={{ enrollment_groups: this.props.enrollmentGroup.get('id') }}
          initialIsAcceptable
        />
      </div>
    );
  }
}
