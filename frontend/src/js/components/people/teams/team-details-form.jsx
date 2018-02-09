import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import DetailsFormUtils from 'utilities/details-form';

import TeamsState from 'state/teams';

import { Form, TextInput, TextArea, FieldHeader, SubmitButton } from 'components/common/form';
import { Info } from 'components/common/info';
import { TrainingPlanSearchableMultiSelect } from 'components/common/searchable-multiselect';
import { ANALYTICS_EVENTS } from 'core/constants';

export class TeamDetailsForm extends React.Component {
  static data = {
    team: {
      required: false,
      fields: ['name', 'description', 'auto_enroll_plans']
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
    const autoEnrollPlans = data.auto_enroll_plans;
    if (autoEnrollPlans && this.props.team) {
      const teamAutoEnrollPlans = this.props.team.get('auto_enroll_plans');
      const newAutoEnrollPlans = data.auto_enroll_plans;
      if (newAutoEnrollPlans.length !== teamAutoEnrollPlans.length) {
        analytics.track(ANALYTICS_EVENTS.SET_AUTO_ENROLL_TEAM_IN_PLANS, {
          teamName: this.props.team.get('name'),
          teamID: this.props.team.get('id'),
          numPlansAdded: newAutoEnrollPlans.length - teamAutoEnrollPlans.length
        });
      }
    }
    if (!this.props.team) {
      TeamsState.ActionCreators.create(data).then(() => {
        this.context.displayTempPositiveMessage({ heading: 'New team created' });
      });
    } else {
      TeamsState.ActionCreators.update(this.props.team.get('id'), data);
      this.context.displayTempPositiveMessage({ heading: 'Team updated' });
    }
    if (this.props.onSubmit) this.props.onSubmit();
  };

  render() {
    const initVals = DetailsFormUtils.getInitialValues(this.props.team, [
      'name',
      'description',
      'auto_enroll_plans'
    ]);
    // If groups_and_areas_enabled is set to False, only auto enroll will be
    // allowed. Disable enrolling at a team level.
    const enableTeamEnroll = this.props.currentUser.get('learner').company.subscription
      .groups_and_areas_enabled;
    return (
      <Form onSubmitAndValid={this.onFormSubmitAndValid}>
        <FieldHeader required>{t('team_name')}</FieldHeader>
        <TextInput name="name" initialValue={initVals.name} required initialIsAcceptable />
        <FieldHeader required>{t('description')}</FieldHeader>
        <TextInput name="description" initialValue={initVals.description} initialIsAcceptable />
        {enableTeamEnroll ? (
          <div>
            <FieldHeader required>
              {t('auto_enroll_in_plans')}
              <Info content={t('auto_enroll_in_plans_info')} />
            </FieldHeader>

            <TrainingPlanSearchableMultiSelect
              name="auto_enroll_plans"
              initialSelections={initVals.auto_enroll_plans}
              initialIsAcceptable
            />
          </div>
        ) : null}
        <SubmitButton />
      </Form>
    );
  }
}
