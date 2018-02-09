import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';

import Radium from 'radium';

import Style from 'style';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { LoadingContainer } from 'components/common/loading';
import { t } from 'i18n';

import ChannelsState from 'state/channels';
import PageState, { YOUR_CHANNELS } from './page-state';
import NavbarState from 'components/navbar/component-state';

import { FilterSet, FilterItem } from 'components/common/filter-set';
import { Popup } from 'components/common/popup';
import { remoteSearchMixinFactory } from 'components/common/search';
import { AutoEnrollLabel } from 'components/content-management/channels-tab/auto-enroll';

import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';
import { ChannelCard } from 'components/common/channel-card';
import { InviteModal } from '../invite-modal';
import { CreateChannelModal } from '../create-channel-modal';
import {
  SortableElement,
  SortableContainer,
  arrayMove,
  ReorderButton,
  orderingStyles
} from 'components/common/ordering';

const styles = {
  grid: {
    marginTop: '0 !important',
    marginBottom: 6
  },
  channelCollection: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  background: {
    backgroundColor: Style.vars.colors.get('white')
  },
  filterSetContainer: {
    marginTop: -12,
    marginBottom: 25,
    padding: '5px 0px',
    color: Style.vars.colors.get('xxDarkGrey'),
    clear: 'both',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  filterButtonContainer: {
    margin: '5px 0 5px 0',
    display: 'inline-block'
  },
  searchAndSortContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 20
  },
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
    marginLeft: 12
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
  },
  createChannelBtn: {
    float: 'right',
    [Style.vars.media.get('tablet')]: {
      marginTop: 0
    },
    [Style.vars.media.get('mobile')]: {
      float: 'left',
      marginTop: 10,
      marginLeft: 0
    }
  },
  infoBtn: {
    float: 'right',
    marginTop: 10,
    [Style.vars.media.get('mobile')]: {
      float: 'left'
    }
  }
};

@SortableElement
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
      ? this.props.channel.get('attempts_by_users_count')
      : this.props.channel.get('attempts_by_users_in_own_company_count');
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

    icons.push({
      info: 'Users reached',
      el: (
        <div style={styles.blackIcon}>
          <i className="ui icon users" />
          {reachedUsers}
        </div>
      )
    });

    if (companyOwnsChannel) {
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
      <div style={styles.channelCardContainer} className="channel-card">
        <ChannelCard
          channel={channel}
          onClick={this.onChannelItemClick}
          reorderEnabled={this.props.reorderEnabled}
        />

        <div style={styles.iconsList}>
          {this.getIcons().map((icon, i) => (
            <Popup content={icon.info} key={i}>
              <div style={styles.icon}>{icon.el}</div>
            </Popup>
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

@SortableContainer
class ChannelsCollection extends React.Component {
  static propTypes = {
    channels: React.PropTypes.instanceOf(Im.List).isRequired
  };

  render() {
    return (
      <div style={styles.channelCollection}>
        {this.props.channels.map((channel, index) => (
          <ChannelItem
            key={channel.get('id')}
            channel={channel}
            index={index}
            reorderEnabled={this.props.reorderEnabled}
          />
        ))}
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.onSetChannelSearch.bind(PageState.ActionCreators)))
@Radium
export class ChannelsPage extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  static propTypes = {
    channels: React.PropTypes.instanceOf(Im.List),
    companies: React.PropTypes.instanceOf(Im.List)
  };

  constructor(props) {
    super();
    this.state = {
      newChannel: Im.Map(),
      sortedChannels: props.channels,
      reorderEnabled: false
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channels) {
      this.setState({ sortedChannels: nextProps.channels });
    }
  }

  showCreateChannelModal = () => {
    this.refs.createChannelModal.show();
  };

  onChannelCreated = newChannel => {
    this.setState({ newChannel });
    this.refs.createChannelModal.hide();
  };

  saveSorting = () => {
    this.state.sortedChannels.forEach((ch, i) => {
      if (ch.get('order') !== i) {
        ChannelsState.ActionCreators.update(ch.get('id'), { order: i });
      }
    });
  };

  onSortEnd = ({ oldIndex, newIndex }) => {
    this.setState({
      sortedChannels: Im.List(arrayMove(this.state.sortedChannels.toArray(), oldIndex, newIndex))
    });
    _.defer(this.saveSorting);
  };

  toggleReorder = () => {
    this.setState({ reorderEnabled: !this.state.reorderEnabled });
  };

  setFilter = newFilter => {
    if (newFilter) {
      this.context.router.push(`${this.context.location.pathname}?filter=${newFilter}`);
    }
    PageState.ActionCreators.onSetFilter(newFilter);
  };

  render() {
    let newContentManagement;
    const flags = this.context.currentUser.get('feature_flags');
    if (flags && flags['new-content-management']) newContentManagement = true;
    const showReorder = !this.props.curSearch && this.props.curFilter == YOUR_CHANNELS;
    return (
      <div style={styles.background}>
        <div style={styles.filterSetContainer}>
          <FilterSet
            ref="filterSet"
            filterNames={PageState.Store.getFilterNames()}
            setFilter={this.setFilter}
            initial={this.context.location.query.filter}
            createButton={defaultProps => (
              <FilterItem {...defaultProps} renderFilterName={name => t(name)} />
            )}
          />
          <div style={styles.searchAndSortContainer}>
            {this.getSearchInput({
              borderless: true
            })}
          </div>
        </div>
        {newContentManagement ? null : (
          <PrimaryButton onClick={this.showCreateChannelModal} style={styles.createChannelBtn}>
            {t('create_channel')}
          </PrimaryButton>
        )}
        {showReorder && (
          <ReorderButton
            containerStyle={styles.createChannelBtn}
            reorderEnabled={this.state.reorderEnabled}
            toggleReorder={this.toggleReorder}
            entity="channels"
          />
        )}
        <div style={{ padding: 50 }}>
          <LoadingContainer
            loadingProps={{
              channels: this.props.channels
            }}
            createComponent={props => (
              <div>
                <ChannelsCollection
                  channels={this.state.sortedChannels}
                  shouldCancelStart={() => !this.state.reorderEnabled}
                  onSortEnd={this.onSortEnd}
                  reorderEnabled={this.state.reorderEnabled}
                  axis="xy"
                />
              </div>
            )}
            noDataText="There are no channels available."
          />
        </div>
        <CreateChannelModal
          ref="createChannelModal"
          currentUser={this.context.currentUser}
          onChannelCreated={this.onChannelCreated}
        />
        <InviteModal
          ref="inviteModal"
          currentUser={this.context.currentUser}
          companies={this.props.companies}
          channel={this.state.newChannel}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(ChannelsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    location: React.PropTypes.object.isRequired
  },

  listenTo: [ChannelsState.Store, PageState.Store],

  fetch: {
    channels() {
      const curFilterQuery = PageState.Store.getCurrentFilterQuery(
        this.context.currentUser,
        this.context.location.query.filter
      );
      const query = _.extend(
        {
          fields: [
            'name',
            'logo',
            'cover_image',
            'deactivated',
            'attempts_by_users_count',
            'attempts_by_users_in_own_company_count',
            'subscribed_companies_count',
            'training_plans_count',
            'training_plans',
            'public',
            'order',
            'request_to_access',
            'auto_add_plans_to_auto_enroll_set',
            'auto_enroll_turned_on_for_current_user_company',
            'company.id',
            'company.cover_image',
            'company.company_logo',
            $y.getFields(AutoEnrollLabel, 'entity')
          ],
          limit: 0
        },
        curFilterQuery
      );
      const search = PageState.Store.getChannelSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return ChannelsState.Store.getItems(query);
    },
    curFilter() {
      return PageState.Store.getCurrentFilter();
    },
    curSearch() {
      return PageState.Store.getChannelSearch();
    }
  },

  componentWillMount() {
    NavbarState.ActionCreators.setTitle('Channels');
    NavbarState.ActionCreators.setInfo(`Channels allow you to group training plans
      and publish them to other companies.
      Subscribing companies can then attempt those training plans.`);
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelsPage, errors);
  }
});
