import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';

import Radium from 'radium';

import Style from 'style';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { LoadingContainer } from 'components/common/loading';
import { t } from 'i18n';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import createPaginatedStateContainer from 'state/pagination';

import ChannelsState from 'state/channels';
import PageState, { YOUR_CHANNELS, EXTERNAL_CHANNELS } from './page-state';
import NavbarState from 'components/navbar/component-state';
import ChannelShareRequestsState from 'state/channel-share-requests';

import { FilterSet, FilterItem } from 'components/common/filter-set';
import { remoteSearchMixinFactory } from 'components/common/search';

import { PrimaryButton } from 'components/common/buttons';
import { AutoEnrollLabel } from './common/auto-enroll';
import { InviteModal } from './common/invite-modal';
import { CreateChannelModal } from './common/create-channel-modal';
import { SortableContainer, arrayMove, ReorderButton } from 'components/common/ordering';
import { ChannelItem } from './channel-item';
import { RequestItem } from './request-item';
import { SortableElement } from 'components/common/ordering';

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
    backgroundColor: Style.vars.colors.get('white'),
    margin: '0px 20px 30px'
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
class SortableChannelItem extends React.Component {
  render() {
    return (
      <ChannelItem
        key={this.props.key}
        channel={this.props.channel}
        index={this.props.index}
        reorderEnabled={this.props.reorderEnabled}
      />
    );
  }
}

@SortableContainer
export class ChannelsCollection extends React.Component {
  static propTypes = {
    channels: React.PropTypes.instanceOf(Im.List).isRequired
  };

  render() {
    return (
      <div style={styles.channelCollection}>
        {this.props.channels.map((channel, index) => (
          <SortableChannelItem
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
    const learner = this.context.currentUser.get('learner');
    const flags = this.context.currentUser.get('feature_flags');
    if (flags && flags['new-content-management']) newContentManagement = true;
    const showReorder = !this.props.curSearch && this.props.curFilter == YOUR_CHANNELS;

    const showExternalChannelsIndicator =
      learner.company.open_connection_request_count.incoming &&
      learner.company.subscription.shared_content_enabled;

    const indicators = showExternalChannelsIndicator ? [EXTERNAL_CHANNELS] : [];
    const showChannelRequests = PageState.Store.getCurrentFilter() === EXTERNAL_CHANNELS;

    return (
      <div style={styles.background}>
        <div style={styles.filterSetContainer}>
          <FilterSet
            ref="filterSet"
            filterNames={PageState.Store.getFilterNames()}
            setFilter={this.setFilter}
            initial={this.context.location.query.filter}
            indicators={indicators}
            createButton={defaultProps => <FilterItem {...defaultProps} />}
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
          <div style={styles.channelCollection}>
            {showChannelRequests &&
              this.props.requests &&
              this.props.requests.map(r => <RequestItem key={r.get('id')} request={r} />)}
          </div>
          <LoadingContainer
            loadingProps={{
              channels: this.props.channels
            }}
            createComponent={props => (
              <InfiniteScroll
                loadMore={this.props.loadMore}
                moreAvailable={this.props.moreAvailable}
                isLoading={this.props.isLoading}
              >
                <ChannelsCollection
                  channels={this.state.sortedChannels}
                  shouldCancelStart={() => !this.state.reorderEnabled}
                  onSortEnd={this.onSortEnd}
                  reorderEnabled={this.state.reorderEnabled}
                  axis="xy"
                />
              </InfiniteScroll>
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

export const Page = createPaginatedStateContainer(ChannelsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    location: React.PropTypes.object.isRequired
  },

  listenTo: [ChannelsState.Store, PageState.Store, ChannelShareRequestsState.Store],

  paginate: {
    store: ChannelsState.Store,
    propName: 'channels',
    limit: 24,
    getQuery() {
      const curFilterQuery = PageState.Store.getCurrentFilterQuery(
        this.context.currentUser,
        this.context.location.query.filter
      );
      const query = _.extend(
        {
          fields: [
            'name',
            ...(PageState.Store.getCurrentFilter() === EXTERNAL_CHANNELS ? ['display_name'] : []),
            'logo',
            'cover_image',
            'cover_image_thumbnail',
            'deactivated',
            'reached_users_count',
            'reached_users_in_own_company_count',
            'subscribed_companies_count',
            'training_plans_count',
            'training_plans',
            'price',
            'public',
            'order',
            'request_to_access',
            'auto_add_plans_to_auto_enroll_set',
            'auto_enroll_turned_on_for_current_user_company',
            'company.id',
            'company.cover_image',
            'company.company_logo',
            $y.getFields(AutoEnrollLabel, 'entity')
          ]
        },
        curFilterQuery
      );
      const search = PageState.Store.getChannelSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },
  fetch: {
    requests() {
      const company = this.context.currentUser.get('learner').company;
      const q = ChannelShareRequestsState.Store.getItems({
        fields: [
          'id',
          'accepted',
          'direction',
          'decided_at',
          'sharedtrainingunit_set.id',
          'url',
          'training_unit.id',
          'training_unit.name',
          'training_unit.logo',
          'training_unit.cover_image',
          'training_unit.company.id',
          'training_unit.company.cover_image',
          'training_unit.company.company_logo',
          'training_unit.company.company_name',
          'requester.learner.company.id'
        ],
        ordering: 'direction,company',
        company: company.id,
        pending: true,
        // currently fetching "all", might need to sort out pagination
        // if this starts to take too long
        limit: 150
      });
      return q;
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
