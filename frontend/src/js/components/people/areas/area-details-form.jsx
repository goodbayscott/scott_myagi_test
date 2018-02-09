import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';

import DetailsFormUtils from 'utilities/details-form';

import AreasState from 'state/areas';

import { Form, TextInput, FieldHeader, SubmitButton } from 'components/common/form';
import { UserCardSelect } from 'components/common/card-searchable-select/index';

export class AreaDetailsForm extends React.Component {
  static data = {
    area: {
      required: false,
      fields: ['name', 'managers.url', 'managers.first_name', 'managers.last_name']
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
    if (!this.props.area) {
      AreasState.ActionCreators.create(data).then(() => {
        this.context.displayTempPositiveMessage({ heading: 'New area created' });
      });
    } else {
      AreasState.ActionCreators.update(this.props.area.get('id'), data);
      this.context.displayTempPositiveMessage({ heading: 'Area updated' });
    }
    if (this.props.onSubmit) this.props.onSubmit();
  };

  render() {
    const initVals = DetailsFormUtils.getInitialValues(this.props.area, ['name']);
    let initialManagers = [];
    if (this.props.area) {
      const managers = this.props.area.get('managers');
      initialManagers = managers.map(user => user.url);
    }

    return (
      <Form ref="form" onSubmitAndValid={this.onFormSubmitAndValid}>
        <FieldHeader required>{t('area_name')}</FieldHeader>
        <TextInput name="name" initialValue={initVals.name} required initialIsAcceptable />
        {this.props.currentUser.get('learner').is_company_admin ? (
          <div>
            <FieldHeader required>{t('managers')}</FieldHeader>
            <UserCardSelect
              initialValue={initialManagers}
              name="managers"
              ref="selectManager"
              currentUser={this.props.currentUser}
              company={this.props.currentUser.get('company')}
              onChange={_.noop}
              onCardClick={_.noop}
              fetchOpts={{
                learner__company: this.props.currentUser.get('learner').company.id
              }}
              required={false}
              many
            />
          </div>
        ) : null}
        <SubmitButton />
      </Form>
    );
  }
}
