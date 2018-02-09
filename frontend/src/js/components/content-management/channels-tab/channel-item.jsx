import React from 'react';
import Im from 'immutable';
import cx from 'classnames';
import { resolve } from 'react-router-named-routes';
import Radium from 'radium';

import Style from 'style';
import { t } from 'i18n';
import ChannelsState from 'state/channels';

import { Info } from 'components/common/info';
import { ChannelCard } from 'components/common/channel-card';
import { Modal } from 'components/common/modal';
import { SortableElement } from 'components/common/ordering';

const styles = {
  channelCardContainer: {
    marginLeft: 14,
    marginRight: 14
  },
  iconsList: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 25
  },
  icon: {
    // for some reason, info popups don't work well without these margins
    margin: '2px 0px 0px 12px',
    display: 'flex'
  },
  greenIcon: {
    color: Style.vars.colors.get('oliveGreen')
  },
  redIcon: {
    color: Style.vars.colors.get('red')
  },
  blackIcon: {
    color: '#666'
  },
  greyIcon: {
    color: '#bbb'
  }
};

@Radium
export class ChannelItem extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = {
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  restoreConfirmClick = () => {
    // Pass in doFetch update opt to force re-fetch of channels because
    // channel queryset will change.
    ChannelsState.ActionCreators.update(
      this.props.channel.get('id'),
      { deactivated: null },
      { doFetch: true }
    );
    this.refs.restoreModal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'changes_saved'
    });
  };

  onChannelItemClick = () => {
    if (this.props.reorderEnabled) return;
    const deactivated = this.props.channel.get('deactivated');
    if (deactivated) {
      this.refs.restoreModal.show();
      return;
    }
    this.context.router.push(resolve('channel', {
      channelId: this.props.channel.get('id')
    }));
  };

  getIcons() {
    const companyOwnsChannel =
      this.props.channel.get('company').id == this.context.currentUser.get('learner').company.id;
    const icons = [];
    const channelInAutoEnroll = this.props.channel.get('auto_enroll_turned_on_for_current_user_company');
    const reachedUsers = companyOwnsChannel
      ? this.props.channel.get('reached_users_count')
      : this.props.channel.get('reached_users_in_own_company_count');
    const plansCount = this.props.channel.get('training_plans').length;
    const publicStatus = this.props.channel.get('public');
    const requestToAccess = this.props.channel.get('request_to_access');
    const subscribedCompaniesCount = this.props.channel.get('subscribed_companies_count');
    let pubPrivText;

    let pubPrivStyle = styles.greenIcon;
    if (requestToAccess && publicStatus) {
      pubPrivText = 'Request to Access';
      // green
    } else if (publicStatus) {
      pubPrivText = 'Public';
      // green
    } else {
      pubPrivText = 'Private';
      // red
      pubPrivStyle = styles.redIcon;
    }

    icons.push({
      info: 'Plans',
      el: (
        <div style={styles.blackIcon}>
          <i className="ui icon browser" />
          {plansCount}
        </div>
      )
    });

    if (companyOwnsChannel) {
      icons.push({
        info: 'Users reached',
        el: (
          <div style={styles.blackIcon}>
            <i className="ui icon users" />
            {reachedUsers}
          </div>
        )
      });
      icons.push({
        info: pubPrivText,
        el: (
          <div style={pubPrivStyle}>
            <i
              className={cx('ui', 'icon', {
                unlock: publicStatus && !requestToAccess,
                lock: !publicStatus || requestToAccess
              })}
            />
          </div>
        )
      });
    }

    if (channelInAutoEnroll) {
      icons.push({
        info: 'Auto enroll on',
        el: <i className="ui icon student" style={styles.greenIcon} />
      });
    }

    if (companyOwnsChannel) {
      icons.push({
        info: 'Connected companies',
        el: (
          <div>
            <i className="ui icon share alternate" />
            {subscribedCompaniesCount}
          </div>
        )
      });
    }

    if (this.props.channel.get('price')) {
      icons.push({
        info: 'Paid channel',
        el: (
          <div>
            <i className="ui icon dollar" />
          </div>
        )
      });
    }

    return icons;
  }

  render() {
    const channel = this.props.channel;
    const company = channel.get('company');
    let channelCoverImage;
    let channelLogo;
    channelCoverImage = channel.get('cover_image');
    channelLogo = channel.get('logo');
    // Default to company images if channel attributes don't exist
    if (!channelCoverImage) {
      channelCoverImage = company.cover_image;
    }
    if (!channelLogo) {
      channelLogo = company.company_logo;
    }
    return (
      <div style={styles.channelCardContainer}>
        <ChannelCard
          channel={channel}
          onClick={this.onChannelItemClick}
          reorderEnabled={this.props.reorderEnabled}
        />

        <div style={styles.iconsList}>
          {this.getIcons().map((icon, i) => (
            <Info content={icon.info} key={i}>
              <div style={styles.icon}>{icon.el}</div>
            </Info>
          ))}
        </div>

        <Modal
          ref="restoreModal"
          onConfirm={this.restoreConfirmClick}
          header={t('channel_currently_archived')}
          basic
        />
      </div>
    );
  }
}
