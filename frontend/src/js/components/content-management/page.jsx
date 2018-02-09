import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import { t } from 'i18n';

import { EnrollModal } from 'components/enrollments/enroll-modal';
import { PrimaryButton } from 'components/common/buttons';
import { Panel } from 'components/common/box';
import { RouterTabs } from 'components/common/router-tabs';
import { CreatePlanModal } from './plans-tab/create-plan-modal';
import { CreateChannelModal } from './channels-tab/common/create-channel-modal';

const styles = {
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    padding: '20px 20px 10px 20px'
  },
  tabContainer: {
    maxWidth: 600
  },
  buttonContainer: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  button: {
    display: 'inline-block',
    height: 38,
    marginLeft: 5
  },
  singleTabStyle: {
    borderBottom: 'none',
    fontSize: 18,
    paddingLeft: 5
  }
};

@Radium // @reactMixin.decorate(TabsMixin)
export class Page extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired
  };

  static PLANS_ROUTE = '/views/content/plans/';
  static CHANNELS_ROUTE = '/views/content/channels/';
  static CURATED_ROUTE = '/views/content/curated/';

  routerTabs = () => {
    const learner = this.props.currentUser.get('learner');
    return [
      { name: t('plans'), to: Page.PLANS_ROUTE },

      ...(learner.can_manage_training_content
        ? [{ name: t('channels'), to: Page.CHANNELS_ROUTE }]
        : []),

      ...(learner.can_make_new_channel_connections
        ? [
          { name: t('channel_sharing'), to: '/views/content/connections/' },
          { name: t('discover_content'), to: '/views/content/discover/' }
        ]
        : []),

      ...(learner.is_demo_account
        ? [
          { name: t('create_brief'), to: '/views/content/brief/' },
          { name: t('review'), to: '/views/content/review/' }
        ]
        : []),
      ...(learner.num_unfulfilled_company_connection_request_channels_for_user &&
      learner.can_make_new_channel_connections
        ? [{ name: t('curated'), to: Page.CURATED_ROUTE }]
        : [])
    ];
  };

  startEnrollment = () => {
    this.refs.enrollModal.show();
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    // Don't show indicator dot if shared content is turned off.
    const indicatorPages = [];
    if (
      learner.can_manage_training_content &&
      learner.company.open_connection_request_count.incoming
    ) {
      indicatorPages.push(t('channels'));
    }
    if (
      learner.company.subscription.shared_content_enabled &&
      learner.company.open_connection_request_count.outgoing
    ) {
      indicatorPages.push(t('channel_sharing'));
    }
    if (
      learner.num_unfulfilled_company_connection_request_channels_for_user &&
      learner.can_make_new_channel_connections
    ) {
      indicatorPages.push(t('curated'));
    }
    const tabs = this.routerTabs();
    return (
      <Panel>
        <div style={styles.headerContainer}>
          <RouterTabs
            tabs={tabs}
            indicator={indicatorPages}
            itemActiveStyle={tabs.length <= 1 ? styles.singleTabStyle : null}
          />
          <div style={styles.buttonContainer}>
            {this.context.router.isActive(Page.PLANS_ROUTE) &&
              (learner.can_manage_training_content ||
                this.props.currentUser.get('feature_flags')['team-content']) && (
                <PrimaryButton
                  style={styles.button}
                  onClick={() => this.refs.createPlanModal.show()}
                >
                  {t('create_plan')}
                </PrimaryButton>
              )}
            {this.context.router.isActive(Page.CHANNELS_ROUTE) && (
              <PrimaryButton
                style={styles.button}
                onClick={() => this.refs.createChannelModal.show()}
              >
                {t('create_channel')}
              </PrimaryButton>
            )}
          </div>
        </div>
        {this.props.children}
        <EnrollModal ref="enrollModal" currentUser={this.props.currentUser} />
        <CreatePlanModal ref="createPlanModal" currentUser={this.context.currentUser} />
        <CreateChannelModal ref="createChannelModal" currentUser={this.context.currentUser} />
      </Panel>
    );
  }
}
