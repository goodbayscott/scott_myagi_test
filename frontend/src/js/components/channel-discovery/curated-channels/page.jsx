import React from 'react';
import Im from 'immutable';
import $y from 'utilities/yaler';
import PageState from './page-state';
import reactMixin from 'react-mixin';
import Marty from 'marty';
import { t } from 'i18n';
import _ from 'lodash';

import { resolve } from 'react-router-named-routes';
import Style from 'style';
import containerUtils from 'utilities/containers';

import PublicChannelsState from 'state/public-channels';
import CompanyConnectionRequestsState from 'state/company-connection-requests';

import { LoadingContainer } from 'components/common/loading';

import { Panel } from 'components/common/box';
import ChannelShareRequestsState from 'state/channel-share-requests';
import { ChannelCardList } from 'components/channel-discovery/channel-cards/page';
import { PrimaryButton } from 'components/common/buttons';

const styles = {
  channelsContainer: {
    marginTop: 40
  },
  search: {
    container: {
      maxWidth: 400,
      margin: '0 auto'
    }
  },
  divider: {
    marginBottom: 25,
    marginTop: 25,
    color: '#E9E9E9',
    borderStyle: 'solid',
    borderTopWidth: 0
  },
  connectToAllContainer: {
    float: 'right',
    marginRight: 20
  },
  header: {
    margin: 'auto',
    textAlign: 'center',
    maxWidth: 800,
    marginTop: 40
  }
};

export class CuratedChannelsPage extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      renderKey: 0
    };
  }

  onChannelDetailsHidden = () => {
    // Bump key so that the channel detail page lifecycle will update
    // when the modal is hidden. Otherwise, the previous channel's plans
    // will be displayed.
    this.setState({ renderKey: this.state.renderKey + 1 });
  };

  onConnectAllCuratedClick = () => {
    this.props.channels.forEach(channel => {
      this.connectToChannel(channel, true);
    });
    this.context.displayTempPositiveMessage({
      heading: 'Requested'
    });
    _.defer(() => {
      // Manually reset state. We don't want to reset state every time a connection
      // is created - only when we connect to all channels.
      PublicChannelsState.Store.resetState();
    });
  };

  connectToChannel = (channel, bulkAdd = false) => {
    const companyURL = this.context.currentUser.get('learner').company.url;
    ChannelShareRequestsState.ActionCreators.create({
      company: companyURL.replace('/companies', '/public/companies'),
      training_unit: channel.get('url').replace('/public/training_unit', '/training_units'),
      requester: this.context.currentUser.get('url')
    })
      .then(dat => {
        let message;
        if (!channel.get('request_to_access')) {
          message = {
            heading: 'connection_created'
          };
        } else {
          message = {
            heading: 'connection_requested',
            body: t('we_let_company_know_channel_requested', {
              companyName: channel.get('company').company_name
            })
          };
        }
        if (!bulkAdd) this.context.displayTempPositiveMessage(message);
      })
      .catch(err => {
        if (!bulkAdd) {
          this.context.displayTempNegativeMessage({
            heading: 'request_failed',
            body: 'failed_to_create_request'
          });
        }
      });
  };

  incrementNumChannelsConnected = () => {
    _.noop();
  };

  rejectChannel = (channel, companyConnectionRequest) => {
    CompanyConnectionRequestsState.ActionCreators.update(companyConnectionRequest.get('id'), {
      rejected_channels: companyConnectionRequest
        .get('rejected_channels')
        .concat(channel.get('url'))
    }).then(res => {
      this.context.displayTempPositiveMessage({
        heading: t('channel_ignored')
      });
    });
  };

  channelsAvailable = () => {
    if (this.props.channels && this.props.channels.size && !this.props.loading) return true;
    return false;
  };

  discoverContent = () => {
    this.context.router.push(resolve('channel-directory'));
  };

  render() {
    const discoverLink = (
      <span>
        <u style={{ cursor: 'pointer' }} onClick={this.discoverContent}>
          {t('click_here')}
        </u>{' '}
        {t('to_find_and_use_other_great_content')}
      </span>
    );
    return (
      <Panel>
        <div style={styles.connectToAllContainer}>
          {this.channelsAvailable() ? (
            <PrimaryButton onClick={this.onConnectAllCuratedClick}>
              {t('connect_to_all')}
            </PrimaryButton>
          ) : null}
        </div>
        <div style={styles.header}>
          {this.channelsAvailable() || this.props.loading ? (
            <p>{t('we_created_a_list_of_companies')}</p>
          ) : (
            <p>
              {t('you_connected_to_all_curated')} {discoverLink}
            </p>
          )}
        </div>

        <LoadingContainer
          loadingProps={{
            channels: this.props.channels,
            companyConnectionRequests: this.props.companyConnectionRequests
          }}
          createComponent={() => (
            <div>
              <div style={styles.channelsContainer}>
                <ChannelCardList
                  {...this.props}
                  loadMore={this.props.loadMore}
                  moreAvailable={this.props.moreAvailable}
                  isLoading={this.props.isLoading}
                  onChannelDetailsHidden={this.onChannelDetailsHidden}
                  renderKey={`channel-card-${this.state.renderKey}`}
                  companyConnectionRequests={this.props.companyConnectionRequests}
                  incrementNumChannelsConnected={this.incrementNumChannelsConnected}
                  rejectChannel={this.rejectChannel}
                  curated
                />
              </div>
            </div>
          )}
        />
      </Panel>
    );
  }
}

export const Page = Marty.createContainer(CuratedChannelsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [
    PublicChannelsState.Store,
    ChannelShareRequestsState.Store,
    PageState.Store,
    CompanyConnectionRequestsState.Store
  ],

  fetch: {
    channels() {
      const companyId = this.context.currentUser.get('learner').company.id;
      const query = {
        subscribable_by: companyId,
        curated_for: companyId,
        order_as_suggestions_for_company: companyId,
        fields: $y.getFields(ChannelCardList, 'channels'),
        limit: 99
      };
      if (this.context.currentUser.get('learner').is_demo_account) {
        delete query.company__subscription__is_paying_customer;
      }
      const search = PageState.Store.getCuratedChannelSearch();
      if (search) {
        query.search = search;
        delete query.order_as_suggestions_for_company;
        query.ordering = '-search_rank';
      }
      return PublicChannelsState.Store.getItems(query);
    },
    companyConnectionRequests() {
      const companyId = this.context.currentUser.get('learner').company.id;
      return CompanyConnectionRequestsState.Store.getItems(
        {
          from_company: companyId,
          fields: ['id', 'from_company', 'rejected_channels', 'to_company', 'url'],
          limit: 0
        },
        { dependantOn: PublicChannelsState.Store }
      );
    }
  },

  pending() {
    return containerUtils.defaultPending(this, CuratedChannelsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CuratedChannelsPage, errors);
  }
});
