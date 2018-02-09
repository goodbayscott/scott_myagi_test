import React from 'react';
import pluralize from 'pluralize';

import Style from 'style';

import $y from 'utilities/yaler';

import CompanyConnectionRequestsState from 'state/company-connection-requests';

import { Modal } from 'components/common/modal';
import { CardCollection, CardImage, Card } from 'components/common/cards';
import ConnectionRequestDetailsModal from './connection-request-details-modal';

import { isFromRetailerOrHospo } from './utils';

const styles = {
  requestCard: {
    width: 200,
    paddingTop: 10
  },
  reqCardInfo: {
    margin: 10,
    color: Style.vars.colors.get('darkGrey')
  },
  reqCardInfoHighlight: {
    color: Style.vars.colors.get('fadedRed')
  },
  cardRemoveIcon: {
    position: 'absolute',
    top: 2,
    right: 0,
    color: Style.vars.colors.get('xDarkGrey')
  }
};

class CompanyConnectionRequestCard extends React.Component {
  static data = {
    connectionRequest: {
      fields: [
        'id',
        'to_company.company_name',
        'to_company.company_logo',
        'to_company.unclaimed',
        'to_company.num_contacts_created_by_current_company',
        'to_company.num_channel_requests_for_current_company',
        'to_company.num_publicly_viewable_channels',
        $y.getFields(ConnectionRequestDetailsModal, 'connectionRequest')
      ]
    }
  };

  showDetails = evt => {
    if (evt) evt.stopPropagation();
    this.detailsModal.show();
  };

  deleteReq = req => {
    CompanyConnectionRequestsState.ActionCreators.delete(req.get('id'));
  };

  showDeleteModal = evt => {
    if (evt) evt.stopPropagation();
    this.refs.deleteModal.show();
  };

  renderContactCount() {
    const num = this.props.connectionRequest.get('to_company')
      .num_contacts_created_by_current_company;
    const style = Style.funcs.mergeIf(num === 0, styles.reqCardInfo, styles.reqCardInfoHighlight);
    return (
      <div className="info" style={style}>
        {num} {pluralize('contact', num)} added
      </div>
    );
  }

  renderChannelConnectionCount() {
    const num = this.props.connectionRequest.get('to_company')
      .num_channel_requests_for_current_company;
    const possibleNum = this.props.connectionRequest.get('to_company')
      .num_publicly_viewable_channels;
    // Highlight this connection if the current company has not connected to any channels,
    // but there are channels available to connect with.
    const style = Style.funcs.mergeIf(
      num === 0 && possibleNum > 0,
      styles.reqCardInfo,
      styles.reqCardInfoHighlight
    );
    if (!isFromRetailerOrHospo(this.props.currentUser)) {
      // This is a brand, therefore should not by trying
      // to get them to connect to the retailer's channels
      return <div />;
    }
    return (
      <div className="info" style={style}>
        {num} channel {pluralize('connection', num)}
      </div>
    );
  }

  render() {
    const req = this.props.connectionRequest;
    const co = req.get('to_company');
    return (
      <Card style={styles.requestCard} onClick={this.showDetails}>
        <i style={styles.cardRemoveIcon} className="remove icon" onClick={this.showDeleteModal} />
        <CardImage
          src={co.company_logo}
          imageStyle={{ height: '6em' }}
          onClick={this.showDetails}
        />
        <div className="content">
          <div className="header" style={{ fontSize: 14 }}>
            {co.company_name}
          </div>
          {co.unclaimed ? this.renderContactCount() : this.renderChannelConnectionCount()}
        </div>
        <ConnectionRequestDetailsModal
          ref={el => (this.detailsModal = el)}
          connectionRequest={req}
          currentUser={this.props.currentUser}
        />
        <Modal
          ref="deleteModal"
          header="Are you sure you want to delete this connection?"
          onConfirm={() => this.deleteReq(req)}
          basic
        />
      </Card>
    );
  }
}

export default class CompanyConnectionRequestsList extends React.Component {
  static data = {
    connectionRequests: {
      many: true,
      fields: [$y.getFields(CompanyConnectionRequestCard, 'connectionRequest')]
    }
  };

  renderConnectionRequest = req => (
    <CompanyConnectionRequestCard
      connectionRequest={req}
      key={req.get('id')}
      currentUser={this.props.currentUser}
    />
  );

  render() {
    return (
      <CardCollection
        style={{ justifyContent: 'center' }}
        createCard={this.renderConnectionRequest}
        entities={this.props.connectionRequests}
      />
    );
  }
}
