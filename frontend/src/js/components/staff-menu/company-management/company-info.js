import Marty from 'marty';
import React from 'react';
import reactMixin from 'react-mixin';

import containerUtils from 'utilities/containers';

import CompaniesState from 'state/companies';
import CompanySettingsState from 'state/companysettings';
import ChannelsState from 'state/channels';

import { HeaderTabs, TabsMixin } from 'components/common/tabs';
import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent, BoxHeaderTabs } from 'components/common/box';

import { CompanySettingsTab } from 'components/settings/company-settings';

@reactMixin.decorate(TabsMixin)
class CompanyInfoContainer extends React.Component {
  getTabContentMap() {
    return {
      Settings: (
        <CompanySettingsTab
          company={this.props.company}
          companySettings={this.props.companySettings}
          currentUser={this.props.currentUser}
          internalUse
        />
      )
    };
  }

  render() {
    return (
      <Box>
        <LoadingContainer
          loadingProps={[this.props.company, this.props.companySettings, this.props.channels]}
          createComponent={() => (
            <Box>
              <BoxHeaderTabs>
                <HeaderTabs {...this.getTabsProps()} />
              </BoxHeaderTabs>
              {this.getTabContent()}
            </Box>
          )}
        />
      </Box>
    );
  }
}

export const CompanyInfoPage = Marty.createContainer(CompanyInfoContainer, {
  listenTo: [CompanySettingsState.Store, CompaniesState.Store, ChannelsState.Store],

  fetch: {
    companySettings() {
      const company = this.props.data;
      return CompanySettingsState.Store.getItems({
        company,
        fields: ['*']
      });
    },
    company() {
      const company = this.props.data;
      return CompaniesState.Store.getItem(company, {
        fields: ['*']
      });
    },
    channels() {
      const company = this.props.data;
      return ChannelsState.Store.getItems({
        fields: ['*'],
        limit: 0,
        company,
        ordering: 'name'
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, CompanyInfoContainer);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CompanyInfoContainer, errors);
  }
});
