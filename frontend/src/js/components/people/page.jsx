import React from 'react';
import Radium from 'radium';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import NavbarState from 'components/navbar/component-state';

import { Panel } from 'components/common/box';
import { RouterTabs } from 'components/common/router-tabs';

import { BasicInviteUsersButton } from 'components/common/invites';

const styles = {
  headerContainer: {
    margin: 20,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  inviteBtn: {
    display: 'inline-block',
    bottom: 6,
    [Style.vars.media.get('mobile')]: {
      display: 'none'
    }
  }
};

@Radium
export class Page extends React.Component {
  componentWillMount() {
    NavbarState.ActionCreators.setTitle('People');
    NavbarState.ActionCreators.setInfo('View and manage users and teams');
  }

  routerTabs = () => {
    const learner = this.props.currentUser.get('learner');
    const isManager = learner.is_company_admin || learner.is_area_manager;
    return [
      { name: t('teams'), to: resolve('teams') },

      ...(isManager ? [{ name: t('users'), to: resolve('users') }] : []),

      { name: t('groups'), to: resolve('groups') },

      ...(isManager ? [{ name: t('areas'), to: resolve('areas') }] : []),

      ...(isManager ? [{ name: t('invites'), to: resolve('invites') }] : [])
    ];
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    const showInviteBtn =
      learner.is_company_admin || learner.is_training_unit_admin || learner.is_area_manager;

    return (
      <Panel>
        <div style={styles.headerContainer}>
          <RouterTabs tabs={this.routerTabs()} />
          {showInviteBtn && (
            <div>
              <BasicInviteUsersButton
                currentUser={this.props.currentUser}
                btnStyle={styles.inviteBtn}
              />
            </div>
          )}
        </div>
        <div style={{ margin: 20 }}>{this.props.children}</div>
      </Panel>
    );
  }
}
