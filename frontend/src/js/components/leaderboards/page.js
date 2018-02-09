import React from 'react';
import { t } from 'i18n';

import { BoxHeaderTabs, BoxContent, Panel } from 'components/common/box';
import { RouterTabs } from 'components/common/router-tabs';

export class Page extends React.Component {
  routerTabs = () => {
    const learner = this.props.currentUser.get('learner');
    return [
      { name: t('users'), to: '/views/leaderboards/users/' },
      { name: t('teams'), to: '/views/leaderboards/teams/' },

      ...(learner.company.subscription.groups_and_areas_enabled
        ? [
          { name: t('groups'), to: '/views/leaderboards/groups/' },
          { name: t('areas'), to: '/views/leaderboards/areas/' }
        ]
        : [])
    ];
  };

  render() {
    return (
      <Panel>
        <BoxHeaderTabs>
          <RouterTabs tabs={this.routerTabs()} />
        </BoxHeaderTabs>
        <BoxContent>{this.props.children}</BoxContent>
      </Panel>
    );
  }
}
