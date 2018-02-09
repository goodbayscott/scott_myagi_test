import Marty from 'marty';
import React from 'react';

import { getIdFromApiUrl } from 'utilities/generic';

import { Box, BoxHeader, BoxContent } from 'components/common/box';

import CompaniesState from 'state/companies';
import UsersState from 'state/users';

import { CompanySearchableSelect } from 'components/common/company-searchable-select';
import { Page as ChannelDetails } from './channel-details';

export class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      companyChannelId: null,
      companyId: null
    };
  }

  onCompanyChannelSelect = val => {
    let id;
    if (val) {
      id = getIdFromApiUrl(val);
    }
    this.setState({
      companyChannelId: id
    });
  };

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
          <h2>Bulk create channel connection</h2>
          <div className="ui blue message" style={{ marginBottom: 20 }}>
            <b>What is this tool used for?</b>
            <p style={{ lineHeight: 1.5 }}>
              <b>
                NOTE: Due to recent updates, this will only show a list of channels (on the left
                hand side) <u>if you selected a company that your current user belongs to</u>. For
                example, if you need to connect "The Nike Runners" channel to a handful of
                retailers, visit:{' '}
                <a href="https://myagi.com/views/myagi-staff/user-management/">
                  <u>https://myagi.com/views/myagi-staff/user-management/</u>
                </a>{' '}
                and transfer yourself in the the Nike Company, then revisit this tool. This isn't
                ideal, but as this tool isn't being used very often we don't intend to fix this
                issue. Speak to Denny if you think otherwise :)
              </b>
            </p>
            <br />
            <p>
              This tool will allow you to connect multiple channels (from one company) to multiple
              companies simultaneously, bypassing the "connection request" process. The <b>left</b>{' '}
              search bar will allow you to search for any company and will generate a list of their
              channels. The <b>right</b> search bar will allow you to search any company in Myagi
              and add them to the right table. (Make sure you click the blue "Add Company" button).{' '}
              <b>
                All of the channels on the left hand side of the table will be connected to all of
                the companies on the right hand side once you press the yellow 'Connect' button!
              </b>
            </p>
          </div>
        </BoxHeader>
        <BoxContent>
          <div className="ui grid">
            <div className="eight wide column">
              <CompanySearchableSelect
                ref="coSelect"
                name="coURL"
                onChange={this.onCompanyChannelSelect}
                internalUse
              />
            </div>
            <div className="eight wide column">
              <CompanySearchableSelect
                ref="coSelect"
                name="coURL"
                onChange={this.onCompanySelect}
                internalUse
              />
            </div>
          </div>
        </BoxContent>
        <BoxContent>
          <h3>Channels</h3>
          {this.state.companyChannelId && (
            <ChannelDetails
              companyChannelId={this.state.companyChannelId}
              companyId={this.state.companyId}
            />
          )}
        </BoxContent>
      </Box>
    );
  }
}
