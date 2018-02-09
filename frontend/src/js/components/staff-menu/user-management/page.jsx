import Marty from 'marty';
import React from 'react';

import containerUtils from 'utilities/containers';
import { getIdFromApiUrl } from 'utilities/generic';
import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';

import UsersState from 'state/users';

import { Page as UserDetails } from './user-details';
import { AsyncSearchableSelect } from 'components/common/form/select';

class UserSearchableSelect extends React.Component {
  fetch(search) {
    if (!search) return null;
    return UsersState.Store.getItems({
      limit: 20,
      search,
      ordering: '-search_rank',
      fields: ['first_name', 'last_name', 'url', 'id', 'email', 'search_rank']
    });
  }

  makeOption(u) {
    const label = `${u.get('full_name')} - ${u.get('email')} - ${u.get('id')}`;
    return {
      value: u.get('url'),
      label
    };
  }

  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  }

  render() {
    return (
      <AsyncSearchableSelect
        {...this.props}
        placeholder={this.props.placeholder || 'Search for a User...'}
        fetch={this.fetch}
        makeOption={this.makeOption}
        name={this.props.name || 'userURL'}
        ref="searchableSelection"
        required
      />
    );
  }
}

class UserManagementTool extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    location: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      userId: null
    };
  }

  componentWillMount() {
    // The `move_to` and `next` are convenient ways to allow the creation of links
    // which move admin / staff users between accounts. In particular, this is used
    // by Metabase questions to simplify the process of company connection creation.
    const newCo = this.context.location.query ? this.context.location.query.move_to : null;
    const nxt = this.context.location.query ? this.context.location.query.next : null;
    if (newCo) {
      const origin = window.location.origin;
      const coURL = `${origin}/api/v1/companies/${newCo}/`;
      UsersState.ActionCreators.doDetailAction(
        this.props.currentUser.get('id'),
        'change_user_to_new_company',
        {
          company_url: coURL
        }
      ).then(() => {
        if (nxt) this.context.router.push(nxt);
      });
    }
  }

  onUserSelect = val => {
    let id;
    if (val) {
      id = getIdFromApiUrl(val);
    }
    this.setState({
      userId: id
    });
  };

  setYourself = () => {
    this.setState({
      userId: this.props.currentUser.get('id')
    });
  };

  resetYourself = () => {
    const origin = window.location.origin;
    const coURL = `${origin}/api/v1/companies/1584/`;

    UsersState.ActionCreators.doDetailAction(
      this.props.currentUser.get('id'),
      'change_user_to_new_company',
      {
        company_url: coURL
      }
    ).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'Success',
        body: 'You have changed back to Myagi! Woo!'
      });
    });
  };

  render() {
    return (
      <Box>
        <BoxHeader>
          <h1>USER MANAGEMENT TOOL</h1>
        </BoxHeader>
        <BoxContent>
          <div>
            <div className="ui blue message" style={{ width: '50%' }}>
              <p>
                <b>What is this tool used for?</b>
                <br />
                <p>
                  Use this tool to easily move yourself between different companies or find any user
                  in Myagi and change the company that they belong to, their team, permission levels
                  or reset their password.
                </p>
              </p>
            </div>
          </div>
          <br />
          <br />
          <div>
            <h4>Search for any user and their details will apppear below</h4>
            <UserSearchableSelect ref="coSelect" name="userURL" onChange={this.onUserSelect} />
          </div>
        </BoxContent>
        <BoxContent>
          <h2>User Details</h2>
          <button
            className="ui blue button"
            onClick={this.setYourself}
            style={{ marginBottom: 50 }}
          >
            <i className="icon child" /> Select Yourself
          </button>
          <button
            className="ui button"
            onClick={this.resetYourself}
            style={{ marginBottom: 50, background: '#FF3A05', color: 'white' }}
          >
            <i className="pied piper alternate icon" style={{ fontSize: 20 }} /> Move me back to
            Myagi
          </button>
          <LoadingContainer
            loadingProps={[this.props.currentUser]}
            createComponent={() => {
              if (this.state.userId) {
                return (
                  <div>
                    <UserDetails userId={this.state.userId} />
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

export const Page = Marty.createContainer(UserManagementTool, {
  listenTo: [UsersState.Store],

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
