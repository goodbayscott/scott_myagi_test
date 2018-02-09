import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';
import $y from 'utilities/yaler';
import reactMixin from 'react-mixin';
import Style from 'style/index.js';

import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';

import createPaginatedStateContainer from 'state/pagination';

import { PrimaryButton, primaryBtnStyle } from 'components/common/buttons';

import { Box, BoxHeader, BoxContent, InfoHeader } from 'components/common/box';

import { SearchInput, searchMixinFactory } from 'components/common/search';

import { Page as UserInviteView } from './my-invites/page';
import { PublicCompanySelect } from 'components/company-select/company-search';
import { ExistingCompanyModal } from 'components/accounts/signup/company/page';

export class Page extends React.Component {
  static propTypes = {};

  constructor(props) {
    super(props);
    this.state = {
      existingCompany: null
    };
  }

  onCompanySelect = company => {
    this.setState({ existingCompany: company });
    _.defer(() => {
      if (this.refs.existingCompanyModal) {
        // Show existing company popup
        this.refs.existingCompanyModal.show();
      }
    });
  };

  renderExistingCompanyModal() {
    if (!this.state.existingCompany) return null;
    return (
      <ExistingCompanyModal
        ref="existingCompanyModal"
        existingCompany={this.state.existingCompany}
        createCompany={_.noop}
        createNewCompanyOpt={false}
      />
    );
  }

  render() {
    return (
      <Box>
        <BoxHeader heading="Join a company or create your own" />
        <BoxContent>
          <InfoHeader>You have invites from these companies. Click "ACCEPT" to join one</InfoHeader>
          <UserInviteView />

          <div className="ui horizontal divider">Or</div>

          <InfoHeader>
            Find your company below or{' '}
            <a href="/signup/company/" style={{ textDecoration: 'underline' }}>
              create your own
            </a>
          </InfoHeader>
          <div className="ui container" style={{ maxWidth: '500px !important' }}>
            <PublicCompanySelect onCompanySelect={this.onCompanySelect} />
          </div>
        </BoxContent>
        {this.renderExistingCompanyModal()}
      </Box>
    );
  }
}
