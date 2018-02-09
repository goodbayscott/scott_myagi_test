import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import $y from 'utilities/yaler';
import PageState from './page-state';
import reactMixin from 'react-mixin';
import { t } from 'i18n';
import { resolve } from 'react-router-named-routes';
import { Link } from 'react-router';

import Style from 'style';
import containerUtils from 'utilities/containers';

import { Modal } from 'components/common/modal';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';
import { ChannelCardList } from 'components/channel-discovery/channel-cards/page';

import TagsState from 'state/tags';
import ChannelShareRequestsState from 'state/channel-share-requests';
import PublicChannelState from 'state/public-channels';

import createPaginatedStateContainer from 'state/pagination';

import { Panel } from 'components/common/box';
import { InfiniteScroll } from 'components/common/infinite-scroll';


const ALL = 'all';
const PAID = 'marketplace';
const FREE = 'free';

const PRICE_FILTERS = [
  {
    name: ALL,
    icon: 'ellipsis vertical'
  },
  {
    name: PAID,
    icon: 'add to cart'
  },
  {
    name: FREE,
    icon: 'book'
  }
];

const COLUMN_PANELS = '@media screen and (max-width: 500px)';

const styles = {
  pageContent: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  tagsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  tagItem: {
    position: 'relative',
    padding: '3px 7px',
    borderRadius: 3,
    marginBottom: 1,
    cursor: 'pointer',
    backgroundColor: 'white',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#0000',
    borderBottomColor: '#eee',
    transition: 'all 0.2s',
    ':hover': {
      transform: 'scale(1.04)'
    }
  },
  selectedTagItem: {
    backgroundColor: Style.vars.colors.get('green'),
    color: 'white',
    borderColor: '#0000',
    borderBottomColor: '#0000',
  },
  clearFilterItem: {
    backgroundColor: Style.vars.colors.get('grey'),
    border: `1px solid ${Style.vars.colors.get('grey')}`,
    color: Style.vars.colors.get('white'),
    marginBottom: 10,
  },
  searchContainer: {
    margin: '20px 10% 70px',
    textAlign: 'center'
  },
  search: {
    container: {
      maxWidth: 800,
      margin: '0 auto'
    },
    border: 'none',
    borderBottom: '1px solid #CCCCCC',
    borderRadius: 0,
    height: 50,
    fontSize: 20
  },
  finishedBtnContainer: {
    width: '100%',
    height: 60
  },
  btnStyle: {
    marginLeft: 10,
    float: 'right',
    marginBottom: 10,
    marginTop: 20,
    right: 15,
    zIndex: 999
  },
  channelContent: {
    width: '100%',
  },
  filtersContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: 160,
    marginLeft: 15,
    [COLUMN_PANELS]: {
      width: 100,
      marginLeft: 0,
    }
  },
  pricingFilter: {
    padding: '5px 12px 5px 10px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0000',
    cursor: 'pointer',
    borderRadius: 2,
    outline: 'none',
    ':hover': {
      transform: 'scale(1.04)'
    },
  },
  pricingFilterIcon: {
    marginRight: 5,
    fontSize: '1.3rem',
    [COLUMN_PANELS]: {
      display: 'none',
      marginRight: 0,
    }
  },
  pricingFilterActive: {
    backgroundColor: Style.vars.colors.get('green'),
    color: '#fff'
  }
};

export function getConnectionStatusText(channel, newFollow = false) {
  // Channel is not re-fetched after creating a connection or request,
  // so change connectionStatusText once a user requests or connections
  // to a channel.

  const requestToAccess = channel.get('request_to_access');
  const subscribed = channel.get('is_subscribed_to_by_current_company');
  const requested = channel.get('existing_request_for_current_company');

  let text = t('connect');

  if ((requested && !subscribed) || (newFollow && requestToAccess)) {
    text = t('requested');
  } else if (subscribed || (newFollow && !requestToAccess)) {
    text = t('connected');
  }

  if (channel.get('price') && !(subscribed || newFollow)) {
    text = t('start_trial');
  }

  return text;
}

@Radium
class TagItem extends React.Component {
  onTagClick = () => {
    if (this.props.isLoading()) return;
    this.props.onClick(this.props.tag.get('id'));
  };

  render() {
    let tagStyle = this.props.active
      ? {
        ...styles.tagItem,
        ...styles.selectedTagItem
      }
      : styles.tagItem;
    // Prevent user from clicking on a bunch of tags while data is still loading.
    if (this.props.isLoading()) {
      tagStyle = Style.funcs.merge(tagStyle, { cursor: 'default' });
    }

    return (
      <div key={this.props.tag.get('id')} style={tagStyle} onClick={this.onTagClick}>
        {this.props.tag.get('name')}
      </div>
    );
  }
}

@Radium
class ChannelFilters extends React.Component {
  static data = {
    tags: {
      many: true,
      required: false,
      fields: ['name', 'url', 'id', 'num_public_channels']
    }
  };

  onTagClick = tagId => {
    PageState.ActionCreators.toggleTagActive(tagId);
  };

  isTagActive = tag => PageState.Store.isTagActive(tag.get('id'));

  clearTagFilters = () => {
    PageState.ActionCreators.clearTagFilters();
  };

  render() {
    const tagItems = this.props.tags.map(tag => (
      <TagItem
        tag={tag}
        key={tag.get('id')}
        onClick={this.onTagClick}
        active={this.isTagActive(tag)}
        isLoading={this.props.isLoading}
      />
    ));
    return (
      <div style={styles.tagsContainer}>
        {PageState.Store.getTagsFilter().length > 0 &&
          <div style={{ width: '100%', float: 'left' }}>
            <div onClick={this.clearTagFilters} style={{...styles.tagItem, ...styles.clearFilterItem}}>
              {t('clear_filters')}
            </div>
          </div>
        }
        {tagItems}
      </div>
    );
  }
}

@Radium
class ChannelFiltersContainer extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  };

  showModal = () => {
    this.modal.show();
  };

  togglePricing = val => {
    PageState.ActionCreators.clearTagFilters()
    this.context.router.push(resolve(`/views/content/discover/?pricingToggle=${val}`));
  };

  renderPricingBtns = () =>
    PRICE_FILTERS.map(b => {
      const currentToggle = this.context.location.query.pricingToggle || ALL;
      return (
        <button
          key={b.name}
          style={{
            ...styles.pricingFilter,
            ...(b.name === currentToggle ? styles.pricingFilterActive : {})
          }}
          onClick={() => this.togglePricing(b.name)}
        >
          {b.icon && <i style={styles.pricingFilterIcon} className={`ui icon ${b.icon}`} />}
          {t(b.name)}
        </button>
      );
    });

  render() {
    return (
      <div style={{...styles.filtersContainer, marginTop: this.props.contentManagement ? -10 : 20}}>
        <h4>{t('filter')}</h4>
        <div>{this.renderPricingBtns()}</div>
        <h5>{t('categories')}</h5>
        <LoadingContainer
          ref="tagLoadingContainer"
          loadingProps={{tags: this.props.tags}}
          noDataText={t('')}
          createComponent={() => <ChannelFilters {...this.props} />}
        />
      </div>
    );
  }
}

@Radium
@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setPublicChannelSearch.bind(PageState.ActionCreators)))
class ChannelDirectoryPage extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    location: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      shownMarketplaceModal: true,
      renderKey: 0,
      numChannelsConnected: 0
    };
  }

  componentDidMount() {
    this.componentWillReceiveProps();
  }

  componentWillReceiveProps(nextProps) {
    if (this.context.location.query.pricingToggle == PAID && this.state.shownMarketplaceModal) {
      this.marketplaceWelcomeModal.show();
      this.setState({ ...this.state, shownMarketplaceModal: false });
    }
  }

  incrementNumChannelsConnected = () => {
    this.setState({ numChannelsConnected: this.state.numChannelsConnected + 1 });
  };

  render() {
    return (
      <Panel innerStyle={{flexDirection: 'row'}}>
        <ChannelFiltersContainer {...this.props} />

        <div style={styles.pageContent}>

          <div style={styles.channelContent}>
            {this.props.contentManagement === false ? (
              <Link to="training">
                <div style={styles.finishedBtnContainer}>
                  <button
                    key={this.state.renderKey}
                    ref={finishedSelectingButton =>
                      (this.finishedSelectingButton = finishedSelectingButton)
                    }
                    style={styles.btnStyle}
                    className="ui right labeled icon green button"
                    onClick={this.props.onFinishedSelectingClick}
                  >
                    <i className="right arrow icon" />
                    Finished
                  </button>
                </div>
              </Link>
            ) : null}

            <div style={styles.searchContainer}>
              {this.getSearchInput({
                style: styles.search,
                initialValue: `${t('find_content_share_content')}...`
              })}
            </div>

            <LoadingContainer
              ref="channelLoadingContainer"
              loadingProps={{
                channels: this.props.channels
              }}
              noDataText={`${t('no_channels_available')}. ${t('try_choosing_another_filter')}`}
              createComponent={() => (
                <InfiniteScroll
                  loadMore={this.props.loadMore}
                  moreAvailable={this.props.moreAvailable}
                  isLoading={this.props.isLoading}
                >
                  <ChannelCardList
                    {...this.props}
                    incrementNumChannelsConnected={this.incrementNumChannelsConnected}
                  />
                </InfiniteScroll>
              )}
            />
          </div>
        </div>
        <Modal
          ref={c => (this.marketplaceWelcomeModal = c)}
          header={t('welcome_to_the_marketplace')}
        >
          <div className="content">
            <p>{t('welcome_to_the_marketplace_info_1')}</p>
            <p>{t('welcome_to_the_marketplace_info_2')}</p>
            <p>
              <b style={{fontSize: '1.1rem'}}>{t('welcome_to_the_marketplace_info_3')}</b>
            </p>
          </div>
        </Modal>
      </Panel>
    );
  }
}

export const Page = createPaginatedStateContainer(ChannelDirectoryPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    location: React.PropTypes.object.isRequired
  },

  listenTo: [
    PublicChannelState.Store,
    PageState.Store,
    ChannelShareRequestsState.Store,
    TagsState.Store
  ],

  fetch: {
    tags() {
      const { pricingToggle } = this.context.location.query;
      const opts = _.extend({
        limit: 0,
        fields: $y.getFields(ChannelFilters, 'tags'),
        type: 'general',
        has_public_channels: pricingToggle || ALL,
        ordering: 'name'
      });
      return TagsState.Store.getItems(opts);
    }
  },

  paginate: {
    store: PublicChannelState.Store,
    propName: 'channels',
    dependantOn: [TagsState.Store],

    getQuery() {
      const query = {
        subscribable_by: this.context.currentUser.get('learner').company.id,
        order_as_suggestions_for_company: this.context.currentUser.get('learner').company.id,
        // Demo account should see non-paid companies, as this makes it easier to set up
        // fake channels to connect to.
        company__subscription__is_paying_customer: true,
        company__deactivated__isnull: true,
        limit: 30,
        has_content: true,
        fields: $y.getFields(ChannelCardList, 'channels')
      };
      const { pricingToggle } = this.context.location.query;
      if (pricingToggle === PAID) {
        query.price__isnull = false;
      } else if (pricingToggle === FREE) {
        query.price__isnull = true;
      }
      if (this.context.currentUser.get('learner').is_demo_account) {
        delete query.company__subscription__is_paying_customer;
      }
      const search = PageState.Store.getPublicChannelSearch();
      if (search) {
        query.search = search;
        delete query.order_as_suggestions_for_company;
        query.ordering = '-search_rank';
      }
      const tags = PageState.Store.getTagsFilter();
      if (tags.length) {
        query.tags = tags;
      }
      return query;
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelDirectoryPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelDirectoryPage, errors);
  }
});
