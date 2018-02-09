import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import CompaniesState from 'state/companies';
import CompanySettingsState from 'state/companysettings';

import { LoadingContainer } from 'components/common/loading';
import { GeneralTabsContent } from 'components/settings/company-settings/general';

class CompanySettingsTabInner extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <GeneralTabsContent
        companySettings={this.props.companySettings.get(0)}
        currentUser={this.props.currentUser}
        company={this.props.company}
      />
    );
  }
}

export class CompanySettingsTab extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={[this.props.company, this.props.companySettings]}
          createComponent={() => <CompanySettingsTabInner {...this.props} />}
        />
      </div>
    );
  }
}

export const CompanySettingsTabContent = Marty.createContainer(CompanySettingsTab, {
  listenTo: [CompanySettingsState.Store, CompaniesState.Store],

  fetch: {
    companySettings() {
      const company = this.props.currentUser.get('learner').company.id;
      return CompanySettingsState.Store.getItems({
        company,
        fields: $y.getFields(GeneralTabsContent, 'companySettings')
      });
    },
    company() {
      const company = this.props.currentUser.get('learner').company.id;
      return CompaniesState.Store.getItem(company, {
        fields: [$y.getFields(GeneralTabsContent, 'company')]
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, CompanySettingsTab);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CompanySettingsTab, errors);
  }
});
