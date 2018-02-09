import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import _ from 'lodash';

import $y from 'utilities/yaler';

import UnclaimedCompanyDetailsModal from './unclaimed-company-details-modal';
import ExistingCompanyDetailsModal from './existing-company-details-modal';

import { isFromRetailerOrHospo } from '../utils';

export default class ConnectionRequestDetailsModal extends React.Component {
  static data = {
    connectionRequest: {
      fields: [
        'id',
        'to_company.unclaimed',
        $y.getFields(UnclaimedCompanyDetailsModal, 'company', 'to_company')
      ]
    }
  };

  componentDidMount() {
    // Use if `showOnInit` is set, then use this logic to determine
    // whether to actually show the detail modal
    if (this.props.showOnInit) {
      const co = this.props.connectionRequest.get('to_company');
      if (!co.unclaimed && co.num_publicly_viewable_channels > 0) {
        // For existing companies, only show details if there are
        // actually channels to connect with.
        this.show();
      } else if (co.unclaimed) {
        this.show();
      }
    }
  }

  show() {
    this.detailsModal.show();
  }

  render() {
    const co = this.props.connectionRequest.get('to_company');
    const props = {
      ref: el => (this.detailsModal = el),
      company: Im.Map(co),
      currentUser: this.props.currentUser
    };
    if (co.unclaimed) return <UnclaimedCompanyDetailsModal {...props} />;
    else if (isFromRetailerOrHospo(this.props.currentUser)) {
      return <ExistingCompanyDetailsModal {...props} />;
    }
    // If unclaimed and user is from brand (i.e. other company is a retailer), then don't show any modal
    // for now
    return <div />;
  }
}
