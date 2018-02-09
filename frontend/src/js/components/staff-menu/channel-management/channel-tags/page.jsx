import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Style from 'style';
import containerUtils from 'utilities/containers';
import _ from 'lodash';

import { getIdFromApiUrl } from 'utilities/generic';
import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';

import CompaniesState from 'state/companies';
import UsersState from 'state/users';
import ChannelsState from 'state/channels';
import ChannelSharesState from 'state/channel-shares';

import { CompanySearchableSelect } from 'components/common/company-searchable-select';
import { Page as ChannelsListPage } from './channels-list';

class ChannelDetails extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

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
        <h2>Channel Tags</h2>
        <div>
          <div className="ui blue message" style={{ width: '50%', marginBottom: 20 }}>
            <p>
              <b>What is this tool used for?</b>
              <br />
              <p>
                Search any company and it will generate a list of all the channels that belong to
                this company. It will also allow you to tag each channel.
              </p>
            </p>
          </div>
        </div>
        <CompanySearchableSelect ref="coSelect" name="coURL" onChange={this.onCompanySelect} />
        {this.state.companyId ? <ChannelsListPage companyId={this.state.companyId} /> : null}
      </Box>
    );
  }
}

export const Page = Marty.createContainer(ChannelDetails, {
  listenTo: [UsersState.Store, ChannelsState.Store, CompaniesState.Store, ChannelSharesState.Store],

  fetch: {
    channels() {
      if (this.props.companyChannelId) {
        return ChannelsState.Store.getItems({
          fields: ['id', 'name'],
          limit: 0,
          company: this.props.companyChannelId,
          ordering: 'name'
        });
      }
      return null;
    },
    company() {
      if (this.props.companyId) {
        return CompaniesState.Store.getItem(this.props.companyId, {
          fields: ['id', 'company_name']
        });
      }
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelDetails);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelDetails, errors);
  }
});
