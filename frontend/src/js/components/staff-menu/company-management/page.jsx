import Marty from 'marty';
import React from 'react';

import containerUtils from 'utilities/containers';
import { getIdFromApiUrl } from 'utilities/generic';

import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';
import CompaniesState from 'state/companies';
import CompanySettingsState from 'state/companysettings';
import UsersState from 'state/users';

import { CompanyInfoPage } from './company-info';
import { CompanySearchableSelect } from 'components/common/company-searchable-select';
import { Page as SubscriptionsManagementPage } from './subscription-management.jsx';

class CompanyManagementTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      companyId: null
    };
  }

  onCompanySelect = val => {
    let id;
    if (val) {
      id = getIdFromApiUrl(val);
    }
    this.setState({
      companyId: id
    });
  };

  render() {
    return (
      <Box>
        <BoxHeader>
          <h1>COMPANY MANAGEMENT TOOL</h1>
          <div className="ui blue message" style={{ marginBottom: 20 }}>
            <b>What is this tool used for?</b>
            <br />
            <p>
              You this tool to modify a company's details, settings, its subscription status and any
              other company related details.
            </p>
          </div>
        </BoxHeader>

        <BoxContent>
          <div>
            <CompanySearchableSelect
              ref="coSelect"
              name="coURL"
              onChange={this.onCompanySelect}
              internalUse
            />
          </div>
        </BoxContent>
        <BoxContent>
          <LoadingContainer
            loadingProps={[this.props.currentUser]}
            createComponent={() => {
              if (this.state.companyId) {
                return (
                  <div>
                    <SubscriptionsManagementPage companyId={this.state.companyId} />
                    <h2>Company Settings</h2>
                    <CompanyInfoPage
                      data={this.state.companyId}
                      currentUser={this.props.currentUser}
                    />
                  </div>
                );
              }
              return null;
            }}
          />
        </BoxContent>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(CompanyManagementTool, {
  listenTo: [CompanySettingsState.Store, CompaniesState.Store, UsersState.Store],

  fetch: {
    currentUser() {
      const fetch = UsersState.Store.getCurrent();
      return fetch;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, CompanyManagementTool);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, CompanyManagementTool, errors);
  }
});
