import Marty from 'marty';
import React from 'react';

import { getIdFromApiUrl } from 'utilities/generic';

import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';

import CompaniesState from 'state/companies';
import UsersState from 'state/users';

import { CompanySearchableSelect } from 'components/common/company-searchable-select';
import { Page as ConnectionList } from './connection-list';

export class Page extends React.Component {
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
          <h2>Connection list</h2>
          <div>
            <div className="ui blue message" style={{ width: '50%' }}>
              <p>
                <b>What is this tool used for?</b>
                <br />
                <p>
                  Search any company and it will generate a list of all the companies that are
                  connected to the searched company.
                </p>
              </p>
            </div>
          </div>
        </BoxHeader>
        <BoxContent>
          <div className="ui grid">
            <div className="eight wide column">
              <CompanySearchableSelect
                ref="coSelect"
                name="coURL"
                onChange={this.onCompanySelect}
              />
            </div>
          </div>
        </BoxContent>
        <BoxContent>
          <ConnectionList companyId={this.state.companyId} />
        </BoxContent>
      </Box>
    );
  }
}
