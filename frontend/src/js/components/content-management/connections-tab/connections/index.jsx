import React from 'react';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import Style from 'style';
import Radium from 'radium';
import { Link } from 'react-router';
import { t } from 'i18n';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import { InfiniteScroll } from 'components/common/infinite-scroll';

import ChannelShareRequestsState from 'state/channel-share-requests';
import ChannelSharesState from 'state/channel-shares';
import PublicCompaniesState from 'state/public-companies';
import PageState from './state';

import { LoadingContainer } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';
import { PendingShareItem, DECIDER_IS_PRODUCER } from './pending-share-item';
import { CONTENT_SELLER } from 'core/constants';
import { CompanyItem } from './company-item';
import { Modal } from 'components/common/modal';
import { ConnectionModal } from '../../common/create-connection-modal';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  whiteContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e5e5',
    boxShadow: 'rgba(0,0,0,0.18) 4px 3px 20px',
    margin: '10px 0px',
    borderRadius: 2,
    padding: 30
  },
  searchInput: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    width: 130
  },
  heading: {
    fontSize: '2.4rem',
    marginBottom: 20,
    textAlign: 'center'
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
    maxWidth: 300,
    padding: '8px 20px',
    ':hover': {
      border: `1px solid ${Style.vars.colors.get('primary')}`,
      transform: 'scale(1.02)',
      cursor: 'pointer'
    }
  },
  addButtonIcon: {
    color: Style.vars.colors.get('primary'),
    fontSize: '2rem',
    lineHeight: '2rem',
    marginRight: 15
  },
  addButtonText: {
    fontSize: '1.5rem',
    lineHeight: '1.6rem',
    color: '#666'
  }
};

@Radium
@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
class ConnectionsSectionInner extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired,

    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  shareAccepted = (companyId, shareRequestId) => {
    const component = this[`company${companyId}`];
    if (component) {
      component.shareAccepted(shareRequestId);
    }
  };

  shareRejected = (companyId, shareRequestId) => {
    const component = this[`company${companyId}`];
    if (component) {
      component.shareRejected(shareRequestId);
    }
  };

  componentWillReceiveProps(nextProps) {
    const hasRequests = nextProps.connectionRequests && nextProps.connectionRequests.size;
    if (hasRequests && !this.props.connectionRequests) {
      this.pendingRequestModal.show();
    }
  }

  componentDidMount() {
    const hasRequests = this.props.connectionRequests && this.props.connectionRequests.size;
    if (hasRequests) {
      this.pendingRequestModal.show();
    }
  }

  refreshState = () => {
    ChannelShareRequestsState.ActionCreators.resetLocalData();
    PublicCompaniesState.ActionCreators.resetLocalData();
  };

  onNewConnectionsCreated = () => {
    this.refreshState();
    this.createConnectionModal.hide();
  };
  render() {
    const { company } = this.context.currentUser.get('learner')
    const addButton = company.company_type !== CONTENT_SELLER  ? (
      <div
        key="add-connection"
        style={{ ...styles.whiteContainer, ...styles.addButton }}
        onClick={() => this.createConnectionModal.show()}
      >
        <i className="ui icon add circle" style={styles.addButtonIcon} />
        <div style={styles.addButtonText}>{t('create_connection')}</div>
      </div>
    ) : null;

    return (
      <div style={styles.container}>
        <div style={styles.searchInput}>
          {this.getSearchInput({
            borderless: true,
            style: { backgroundColor: 'rgba(0,0,0,0)' }
          })}
        </div>
        <InfiniteScroll
          loadMore={this.props.loadMore}
          moreAvailable={this.props.moreAvailable}
          isLoading={this.props.isLoading}
          style={{ width: '100%' }}
        >
          <LoadingContainer
            loadingProps={{ companies: this.props.companies }}
            createComponent={props => (
              <div style={styles.container}>
                <div style={{ display: 'flex' }}>
                  {this.props.connectionRequests &&
                    this.props.connectionRequests.size > 0 && (
                      <div
                        key="view-requests"
                        style={{
                          ...styles.whiteContainer,
                          ...styles.addButton,
                          marginRight: 20
                        }}
                        onClick={() => {
                          this.refreshState();
                          this.pendingRequestModal.show();
                        }}
                      >
                        <i className="ui icon bullseye" style={styles.addButtonIcon} />
                        <div style={styles.addButtonText}>View requests</div>
                      </div>
                    )}

                  {addButton}
                </div>
                {this.props.companies.map(c => (
                  <CompanyItem
                    key={c.get('id')}
                    ref={ci => (this[`company${c.get('id')}`] = ci)}
                    company={c}
                  />
                ))}
              </div>
            )}
            createNoDataComponent={() => (
              <div style={styles.container}>
                {addButton}
                <div style={styles.whiteContainer}>
                  <strong>{t('what_are_connections')}</strong>
                  <br />
                  <span>{t('company_connection_info')}</span>
                  <br />
                  <br />
                  <span>
                    Click &nbsp;<Link to="/views/content/channels/?filter=external_channels">
                      here
                    </Link>&nbsp; if you are looking for incoming connections.
                  </span>
                  <br />
                </div>
              </div>
            )}
          />
        </InfiniteScroll>
        <Modal ref={c => (this.createConnectionModal = c)} header={t('create_connections')}>
          <ConnectionModal onConnectionsCreated={this.onNewConnectionsCreated} />
        </Modal>
        <Modal ref={c => (this.pendingRequestModal = c)}>
          <div style={styles.container}>
            <div style={styles.heading}>{t('requests_for_your_content')}</div>
            {this.props.connectionRequests &&
              this.props.connectionRequests.map(cr => (
                <PendingShareItem
                  key={cr.get('id')}
                  connection={cr}
                  shareAccepted={this.shareAccepted}
                  shareRejected={this.shareRejected}
                />
              ))}
            {this.props.connectionRequests &&
              this.props.connectionRequests.size == 0 && <div>You have no requests</div>}
          </div>
        </Modal>
      </div>
    );
  }
}

export const ConnectionsSection = createPaginatedStateContainer(ConnectionsSectionInner, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [ChannelShareRequestsState.Store, ChannelSharesState.Store, PageState.Store],

  paginate: {
    store: PublicCompaniesState.Store,
    propName: 'companies',
    limit: 15,
    getQuery() {
      const company = this.context.currentUser.get('learner').company;
      const q = {
        fields: [
          'id',
          'company_name',
          'company_logo',
          'shares_and_requests_to_company',
          'shared_training_unit_requests.id',
          'shared_training_unit_requests.training_unit.id',
          'shared_training_unit_requests.training_unit.logo',
          'shared_training_unit_requests.training_unit.name',
          'shared_training_unit_requests.company.company_name',
          'shared_training_unit_requests.direction',
          'shared_training_units.id',
          'shared_training_units.training_unit.id',
          'shared_training_units.training_unit.logo',
          'shared_training_units.training_unit.name',
          'shared_training_units.company.company_name'
        ],
        has_incoming_connection_from_company: company.id,
        ordering: 'company_name'
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
    connectionRequests() {
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
          'training_unit.company.id',
          'company.company_name',
          'company.company_description',
          'company.company_logo',
          'company.id',
          'company.company_url',
          'company.companysettings',
          'company.companysettings.nav_logo',
          'requester.learner.company.id'
        ],
        ordering: '-direction,company',
        training_unit__company: company.id,
        // direction: DECIDER_IS_PRODUCER,
        pending: true
      });
      return q;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ConnectionsSectionInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ConnectionsSectionInner, errors);
  }
});
