import Marty from 'marty';
import React from 'react';

import Style from 'style';
import containerUtils from 'utilities/containers';
import _ from 'lodash';

import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';

import CompaniesState from 'state/companies';
import UsersState from 'state/users';
import ChannelsState from 'state/channels';
import ChannelSharesState from 'state/channel-shares';

import { SlideToggle } from 'components/common/form';

class ChannelsTable extends React.Component {
  render() {
    return (
      <table className="ui very basic table">
        <thead>
          <tr>
            <th />
            <th>Channel Id</th>
            <th>Channel Name</th>
          </tr>
        </thead>
        <tbody>
          {this.props.channels.map(channel => (
            <tr key={channel.get('id')}>
              <td>
                <SlideToggle
                  initialValue={false}
                  onChange={evt => this.props.onToggle(channel.get('id'))}
                />
              </td>
              <td>{channel.get('id')}</td>
              <td>{channel.get('name')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

class CompaniesTable extends React.Component {
  render() {
    return (
      <table className="ui very basic table">
        <thead>
          <tr>
            <th>Company Id</th>
            <th>Company Name</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {this.props.companies &&
            this.props.companies.map(i => (
              <tr key={i.id}>
                <td>{i.id}</td>
                <td>{i.name}</td>
                <td>
                  <i
                    style={{ cursor: 'pointer' }}
                    className="icon remove"
                    onClick={evt => this.props.removeCompany(i.id)}
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  }
}

class ChannelDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      companies: [],
      channels: [],
      success: ''
    };
  }

  onToggle = id => {
    if (_.includes(this.state.channels, id)) {
      const index = this.state.channels.indexOf(id);
      this.setState({
        channels: this.state.channels.filter((_, id) => id !== index)
      });
    } else {
      this.setState({
        channels: this.state.channels.concat(id)
      });
    }
  };

  addCompany = () => {
    const id = this.props.company.get('id');
    const name = this.props.company.get('company_name');

    // TODO: Prevent duplicates from being pushed
    this.setState({
      companies: this.state.companies.concat({ id, name })
    });
  };

  removeCompany = id => {
    const COMPANIES = [];
    const index = COMPANIES.indexOf(id);

    // TODO: Find React-way of doing this
    this.state.companies.forEach(company => {
      COMPANIES.push(company.id);
    });
    this.setState({
      companies: COMPANIES.filter((_, id) => id !== index)
    });
  };

  makeConnection = () => {
    this.state.companies.forEach(company => {
      this.state.channels.forEach(channel => {
        ChannelSharesState.ActionCreators.doDetailAction(
          this.props.currentUser.get('id'),
          'create_new_connection',
          {
            channel_id: channel,
            company_id: company.id
          }
        )
          .then(res => {
            this.setState({
              success: 'You have successfully connected these channels to these companies!'
            });
          })
          .catch(err => {
            // this.setState({ success: 'An error has occurred!' });
          });
      });
    });
  };

  render() {
    let companiesTable;
    let channelsTable;

    if (this.state.companies) {
      companiesTable = (
        <CompaniesTable companies={this.state.companies} removeCompany={this.removeCompany} />
      );
    }

    if (this.props.channels) {
      channelsTable = <ChannelsTable channels={this.props.channels} onToggle={this.onToggle} />;
    }

    return (
      <Box>
        <button
          className="ui right floated blue button"
          onClick={this.addCompany}
          style={{ marginTop: -50, marginRight: 130 }}
        >
          Add Company
        </button>
        <button
          className="ui right floated yellow button"
          onClick={this.makeConnection}
          style={{ marginTop: -50 }}
        >
          <i className="lightning icon" /> Connect
        </button>
        <div style={{ float: 'right' }}>{this.state.success}</div>
        <LoadingContainer
          loadingProps={[this.props.currentUser]}
          createComponent={() => (
            <div className="ui grid">
              <div className="eight wide column">{channelsTable}</div>
              <div className="eight wide column">{companiesTable}</div>
            </div>
          )}
        />
      </Box>
    );
  }
}

export const Page = Marty.createContainer(ChannelDetails, {
  listenTo: [UsersState.Store, ChannelsState.Store, CompaniesState.Store, ChannelSharesState.Store],

  fetch: {
    currentUser() {
      const fetch = UsersState.Store.getCurrent();
      return fetch;
    },
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
