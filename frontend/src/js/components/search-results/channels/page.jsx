import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Radium from 'radium';
import { t } from 'i18n';
import Select from 'react-select';

import { ANALYTICS_EVENTS } from 'core/constants';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { resolve } from 'react-router-named-routes';

import ChannelsState from 'state/channels';
import PageState from '../../content-management/channels-tab/page-state';
import { AutoEnrollLabel } from '../../content-management/channels-tab/common/auto-enroll';

import createPaginatedStateContainer from 'state/pagination';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { LoadingContainer, NoData } from 'components/common/loading';
import { ChannelCardItem } from '../../training/channels/channels-tab';
import { ChannelItem as ChannelCardAdmin } from '../../content-management/channels-tab/channel-item';
import { FindMoreContentCard } from 'components/common/channels/find-more-channels';

import Style from 'style';

const styles = {
  container: {
    margin: '10px 0 0 0'
  },
  cardsContainer: {
    margin: '10px 0 0 0'
  },
  countSortingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  searchCount: {
    display: 'inline-block',
    margin: 0
  },
  sorting: {
    width: 114,
    border: 'none',
    cursor: 'pointer',
    height: 20,
    container: {
      display: 'inline-block'
    }
  },
  channelCard: {
    card: {
      backgroundSize: 'cover',
      backgroundPosition: '50% 50%',
      backgroundRepeat: 'no-repeat',
      height: 300,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      position: 'relative',
      marginBottom: 25,
      border: '1px solid #CCCCCC',
      borderRadius: 10,
      width: 250
    },
    container: {
      marginLeft: 14,
      marginRight: 14
    }
  }
};

export class ChannelsResultsPage extends React.Component {
  static data = {
    channel: {
      required: false,
      fields: [
        'name',
        'logo',
        'cover_image',
        'company',
        'company.company_name',
        'created',
        'deactivated',
        'attempts_by_users_count',
        'attempts_by_users_in_own_company_count',
        'subscribed_companies_count',
        'training_plans_count',
        'training_plans',
        'public',
        'auto_add_plans_to_auto_enroll_set',
        'auto_enroll_turned_on_for_current_user_company',
        'progress_for_user'
      ]
    }
  };

  static contextTypes = {
    currentUser: React.PropTypes.object.isRequired
  };

  componentWillUpdate() {
    if (PageState.Store.getChannelSearch() !== this.props.searchQuery) {
      PageState.ActionCreators.onSetChannelSearch(this.props.searchQuery);
    }
  }

  renderCards = channels =>
    channels.map((ch, i) => {
      if (this.context.currentUser.get('learner').is_company_admin) {
        return (
          <ChannelCardAdmin key={ch.get('id')} channel={ch} index={i} reorderEnabled={false} />
        );
      }
      return <ChannelCardItem key={ch.get('id')} channel={ch} />;
    });

  render() {
    const SORTING_OPTIONS = [
      { value: '-search_rank', label: t('relevance') },
      { value: 'name', label: t('name_az') },
      { value: '-name', label: t('name_za') },
      { value: '-created', label: t('newest') },
      { value: 'created', label: t('oldest') }
    ];
    return (
      <div style={styles.container}>
        <LoadingContainer
          loadingProps={{
            channels: this.props.channels
          }}
          createComponent={() => (
            <InfiniteScroll
              loadMore={this.props.loadMore}
              moreDataAvailable={this.props.moreDataAvailable}
              isLoading={this.props.isLoading}
            >
              <div style={styles.countSortingContainer}>
                <Select
                  style={styles.sorting}
                  options={SORTING_OPTIONS}
                  placeholder={<div>{t('sort_by')}</div>}
                  arrowRenderer={({ isOpen }) => (
                    <i
                      className="ui icon sort content descending"
                      style={{ color: isOpen ? 'black' : 'grey' }}
                    />
                  )}
                  clearable={false}
                  valueRenderer={o => <div>{o.label}</div>}
                  searchable={false}
                  onChange={v => PageState.ActionCreators.setChannelOrder(v.value)}
                  value={PageState.Store.getChannelOrder()}
                />
              </div>
              <div className="ui stackable equal width centered grid" style={styles.cardsContainer}>
                {this.renderCards(this.props.channels)}
                {this.context.currentUser.get('learner').is_company_admin ? (
                  <FindMoreContentCard style={styles.channelCard} />
                ) : null}
              </div>
            </InfiniteScroll>
          )}
          createNoDataComponent={() => (
            <NoData style={{ padding: 20 }}>{t('no_search_results')}</NoData>
          )}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(ChannelsResultsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    location: React.PropTypes.object.isRequired
  },

  listenTo: [PageState.Store, ChannelsState.Store],

  paginate: {
    store: ChannelsState.Store,
    propName: 'channels',
    limit: 24,
    getQuery() {
      const ordering = PageState.Store.getChannelOrder();
      const search = PageState.Store.getChannelSearch();

      const query = _.extend({
        connected_to_company: this.context.currentUser.get('learner').company.id,
        deactivated__isnull: true,
        ordering: 'name',
        has_content: true,
        limit: 24,
        search,
        ...(ordering ? { ordering } : { ordering: '-search_rank' }),
        fields: [
          $y.getFields(ChannelsResultsPage, 'channel'),
          $y.getFields(AutoEnrollLabel, 'entity')
        ]
      });
      // Do this check here, as if done on backend then query time will be longer
      if (!this.context.currentUser.get('learner').can_view_all_training_content) {
        query.has_enrollments_for_user = this.context.currentUser.get('id');
      }
      return query;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelsResultsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelsResultsPage, errors);
  }
});
