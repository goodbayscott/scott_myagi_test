import React from 'react';
import Im from 'immutable';
import reactMixin from 'react-mixin';

import Style from 'style';
import { t } from 'i18n';

import containerUtils from 'utilities/containers';
import createPaginatedStateContainer from 'state/pagination';

import ChannelSharesState from 'state/channel-shares';
import PageState from './state';
import ChannelShareRequestsState from 'state/channel-share-requests';
import ChannelsState from 'state/channels';

import { Modal } from 'components/common/modal/index.jsx';
import { GatedFeatureBox, CONTENT_SHARING } from 'components/common/gated-feature';
import { LoadingContainer, NoData } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { PrimaryButton } from 'components/common/buttons';
import { ConnectionCard } from './card-connection';
import { RequestCard } from './card-request';
import BLUR_IMAGE from 'img/channel-connect-blur.jpg';
import { ConnectionModal } from '../../../common/create-connection-modal';

const DESCRIPTION_TEXT =
  'Ready to get your training material into the hands of sales associates? Upgrade to Pro today and start training your frontline workforce directly within seconds. Go ahead, calculate that ROI.';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  connectionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'flex-end'
  }
};

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
class ConnectionsPage extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  render() {
    const user = this.context.currentUser;
    const company = user.get('learner').company;
    const enableSharedContent = company.subscription.shared_content_enabled;

    if (!enableSharedContent) {
      return (
        <GatedFeatureBox
          backgroundImage={BLUR_IMAGE}
          hideContent
          headerText="Upgrade to Pro — Share Your Content"
          descriptionText={DESCRIPTION_TEXT}
          featureType={CONTENT_SHARING}
        />
      );
    }
    return (
      <div style={styles.container}>
        <div style={styles.searchContainer}>
          <div>
            { !this.props.channel.get('price') &&
              <PrimaryButton onClick={() => this.createConnectionModal.show()}>
                {t('create_connections')}
              </PrimaryButton>
            }
          </div>
          {this.getSearchInput({
            borderless: true
          })}
        </div>

        {this.props.requests && (
          <div style={styles.connectionsContainer}>
            {this.props.requests.map(r => <RequestCard request={r} key={r.get('id')} />)}
          </div>
        )}

        <LoadingContainer
          loadingProps={[this.props.connections]}
          createComponent={props => (
            <InfiniteScroll
              loadMore={this.props.loadMore}
              moreAvailable={this.props.moreAvailable}
              isLoading={this.props.isLoading}
            >
              <div style={styles.connectionsContainer}>
                {this.props.connections.map(c => (
                  <ConnectionCard connection={c} key={c.get('id')} channel={this.props.channel} />
                ))}
              </div>
            </InfiniteScroll>
          )}
          createNoDataComponent={() => <NoData>There are no channel connections available.</NoData>}
        />
        <Modal ref={c => (this.createConnectionModal = c)} header={t('create_connections')}>
          <ConnectionModal
            onConnectionsCreated={() => this.createConnectionModal.hide()}
            channel={this.props.channel}
          />
        </Modal>
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(ConnectionsPage, {
  mixins: [],

  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [ChannelSharesState.Store, ChannelShareRequestsState.Store, PageState.Store],

  paginate: {
    store: ChannelSharesState.Store,
    propName: 'connections',
    limit: 36,
    getQuery() {
      const q = {
        involving_company: this.context.currentUser.get('learner').company.id,
        fields: [
          'id',
          'company.company_name',
          'company.company_logo',
          'company.id',
          'company.user_count',
          'licence_quantity',
          'total_licences_used'
        ],
        ordering: 'company',
        training_unit: this.props.channel.get('id')
      };
      const search = PageState.Store.getSearch();
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }
      return q;
    }
  },

  fetch: {
    requests() {
      const q = {
        training_unit: this.props.channel.get('id'),
        pending: true,
        fields: [
          'id',
          'direction',
          'company.company_name',
          'company.company_logo',
          'company.id',
          'company.user_count'
        ],
        ordering: '-id',
        limit: 0
      };

      const search = PageState.Store.getSearch();
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }

      return ChannelShareRequestsState.Store.getItems(q);
    }
  },

  componentDidMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, ConnectionsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ConnectionsPage, errors);
  }
});
