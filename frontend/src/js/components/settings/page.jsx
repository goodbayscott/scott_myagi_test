import Marty from 'marty';
import React from 'react';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';
import { t } from 'i18n';

import { TabsMixin, Tabs, HeaderTabs } from 'components/common/tabs';
import { Panel, BoxHeader, BoxContent, BoxHeaderTabs } from 'components/common/box';

import { UserSettingsTabContent } from './user-settings';
import { CompanySettingsTabContent } from './company-settings';
import { NotificationSettingsTabContent } from './notification-settings';

@reactMixin.decorate(TabsMixin)
export class PageContent extends React.Component {
  getTabContentMap() {
    const tabs = {
      Profile: <UserSettingsTabContent currentUser={this.props.currentUser} />,
      Company: <CompanySettingsTabContent currentUser={this.props.currentUser} />,
      Notifications: <NotificationSettingsTabContent currentUser={this.props.currentUser} />
    };

    // dont render Company tab if user aint company admin
    if (!this.props.currentUser.get('learner').is_company_admin) {
      delete tabs.Company;
    }

    return tabs;
  }

  render() {
    return (
      <Panel>
        <BoxHeaderTabs>
          <HeaderTabs {...this.getTabsProps()} />
        </BoxHeaderTabs>
        {this.getTabContent()}
      </Panel>
    );
  }
}

export const Page = Marty.createContainer(PageContent, {});
