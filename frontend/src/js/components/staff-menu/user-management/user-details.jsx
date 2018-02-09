import Marty from 'marty';
import React from 'react';

import containerUtils from 'utilities/containers';
import { Box } from 'components/common/box';

import PublicCompanies from 'state/public-companies';
import UsersState from 'state/users';
import AdminTeamsState from 'state/admin-teams';

import { Modal } from 'components/common/modal/index';
import { AsyncSearchableSelect } from 'components/common/form/select';
import { ButtonToggle } from 'components/common/form';

const YES = 'Yes';
const NO = 'No';

export class CompanySearchableSelect extends React.Component {
  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  }

  fetch = search => {
    if (!search) return null;
    return PublicCompanies.Store.getItems({
      limit: 0,
      search,
      ordering: '-search_rank',
      fields: ['url', 'id', 'company_name']
    });
  };

  makeOption = u => {
    const label = `${u.get('id')} - ${u.get('company_name')}`;
    return {
      value: u.get('url'),
      label
    };
  };

  isValid() {
    return this.refs.searchableSelection.isValid();
  }

  render() {
    return (
      <AsyncSearchableSelect
        placeholder="Search for a company..."
        {...this.props}
        fetch={this.fetch}
        makeOption={this.makeOption}
        name={this.props.name || 'coURL'}
        ref="searchableSelection"
        required
      />
    );
  }
}

export class TeamSearchableSelect extends React.Component {
  getNameAndValue() {
    return this.refs.searchableSelection.getNameAndValue();
  }

  fetch = search => {
    if (!search) return null;
    return AdminTeamsState.Store.getItems({
      limit: 0,
      search,
      company: this.props.companyId,
      ordering: 'name',
      fields: ['name', 'url', 'id', 'company']
    });
  };

  makeOption = u => ({
    value: u.get('url'),
    label: u.get('name')
  });

  isValid() {
    return this.refs.searchableSelection.isValid();
  }

  render() {
    return (
      <AsyncSearchableSelect
        placeholder="Search for a team..."
        {...this.props}
        fetch={this.fetch}
        makeOption={this.makeOption}
        name={this.props.name || 'teamURL'}
        ref="searchableSelection"
        required
      />
    );
  }
}

class UserDetails extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      companyURL: null,
      teamURL: null,
      isLoading: false,
      newPassword: ''
    };
  }

  onCompanySelect = val => {
    this.setState({ companyURL: val });
  };

  onTeamChange = val => {
    this.setState({ teamURL: val });
  };

  changeCompany = () => {
    this.setState({ isLoading: true });
    if (!this.state.companyURL) return;
    UsersState.ActionCreators.doDetailAction(
      this.props.user.get('id'),
      'change_user_to_new_company',
      {
        company_url: this.state.companyURL
      }
    )
      .then(res => {
        this.setState({ isLoading: false });
      })
      .catch(err => {
        console.log(err);
      });
    this.hideModal();
    this.context.displayTempPositiveMessage({
      heading: 'Changing company...',
      body: 'It may take a minute before changes take effect.'
    });
  };

  changeTeam = () => {
    this.setState({
      isLoading: true
    });
    UsersState.ActionCreators.doDetailAction(this.props.user.get('id'), 'set_learner_group', {
      learner_group: this.state.teamURL
    })
      .then(res => {
        this.setState({ isLoading: false });
        this.hideTeamModal();
      })
      .catch(err => {
        console.log(err);
      });
  };

  changePassword = () => {
    UsersState.ActionCreators.doDetailAction(this.props.user.get('id'), 'admin_reset_password', {
      user_id: this.props.user.get('id'),
      new_password: this.state.newPassword
    })
      .then(res => {
        this.hideChangePasswordModal();
      })
      .catch(err => {
        this.setState({
          new_password: 'Error! Try refreshing the page!'
        });
      });
  };

  showModal = () => {
    this.refs.modal.show();
  };

  hideModal = () => {
    this.refs.modal.hide();
  };

  showTeamModal = () => {
    this.refs.teamChange.show();
  };

  hideTeamModal = () => {
    this.refs.teamChange.hide();
  };

  showChangePasswordModal = () => {
    this.refs.passwordChange.show();
  };

  hideChangePasswordModal = () => {
    this.refs.passwordChange.hide();
  };

  passwordText = e => {
    this.setState({
      newPassword: e.target.value
    });
  };

  toggleGroupMembership(u, isMember, groupName) {
    const method = isMember ? 'remove_from_group' : 'add_to_group';
    UsersState.ActionCreators.doDetailAction(
      u.get('id'),
      method,
      { name: groupName },
      { query: { fields: ['*'] } }
    ).catch(err => {
      const message = err.response.body.message;
      this.context.displayTempNegativeMessage({
        heading: 'Error',
        body: `<b>${message}</b>`
      });
    });
  }

  toggleTeamManagerStatus = () => {
    const u = this.props.user;
    this.toggleGroupMembership(u, u.get('learner').is_learner_group_admin, 'team_managers');
  };

  toggleCompanyAdminStatus = () => {
    const u = this.props.user;
    this.toggleGroupMembership(u, u.get('learner').is_company_admin, 'company_admins');
  };

  sendDemoNotification = () => {
    UsersState.ActionCreators.doDetailAction(
      this.props.user.get('id'),
      'demo_send_daily_digest_notification'
    );
    this.context.displayTempPositiveMessage({
      heading: 'Sent notification'
    });
  };

  render() {
    const user = this.props.user;
    let company;
    let companyId;
    let userDetails = [];

    if (user) {
      company = user.get('learner').company;
      if (company) companyId = company.id;
      userDetails = [
        { ID: user.get('id') },
        { Name: `${user.get('first_name')} ${user.get('last_name')}` },
        { Email: user.get('email') },
        { 'Company ID': company && companyId },
        {
          Company: company ? user.get('learner').company.company_name : 'No Company'
        },
        {
          Team: user.get('learner').learnergroup_name
            ? user.get('learner').learnergroup_name
            : 'No Team'
        },
        {
          'Team Manager': (
            <ButtonToggle
              name="learner_group_admin"
              leftLabel={YES}
              rightLabel={NO}
              initialValue={user.get('learner').is_learner_group_admin ? YES : NO}
              onChange={this.toggleTeamManagerStatus}
              initialIsAcceptable
            />
          )
        },
        {
          'Company Admin': (
            <ButtonToggle
              name="company_admin"
              leftLabel={YES}
              rightLabel={NO}
              initialValue={user.get('learner').is_company_admin ? YES : NO}
              onChange={this.toggleCompanyAdminStatus}
              initialIsAcceptable
            />
          )
        }
      ];
    }

    return (
      <Box>
        {userDetails.map(i => {
          const key = Object.keys(i)[0];
          const val = i[key];
          return (
            <div key={key} style={{ marginBottom: 25 }}>
              {key}: {val}
            </div>
          );
        })}

        <button className="ui blue button" onClick={this.showModal}>
          Change Company
        </button>
        <button className="ui green button" onClick={this.showTeamModal}>
          Change Team
        </button>
        <button className="ui button" onClick={this.showChangePasswordModal}>
          Change Password
        </button>
        <button className="ui button" onClick={this.sendDemoNotification}>
          Send Demo Notification
        </button>

        <Modal ref="modal" header="Change User Company" closeOnDimmerClick={false}>
          <div className="content">
            <CompanySearchableSelect ref="coSelect" name="coURL" onChange={this.onCompanySelect} />
            <button className="ui blue button" onClick={this.changeCompany}>
              Save {this.state.isLoading && <div className="ui active small inline loader" />}
            </button>
          </div>
        </Modal>

        <Modal
          ref="teamChange"
          style={{ minHeight: 450 }}
          header="Change User Team"
          closeOnDimmerClick={false}
        >
          <div className="content">
            <TeamSearchableSelect
              name="teamURL"
              companyId={companyId}
              onChange={this.onTeamChange}
            />
            <button className="ui blue button" onClick={this.changeTeam}>
              Save {this.state.isLoading && <div className="ui active small inline loader" />}
            </button>
          </div>
        </Modal>

        <Modal ref="passwordChange" header="Change User Password" closeOnDimmerClick={false}>
          <div className="content">
            <div>
              <label>New Password (min. 6 characters): {this.state.newPassword}</label>
              <input
                type="text"
                placeholder="Search..."
                onChange={this.passwordText}
                style={{
                  width: 325,
                  height: 40,
                  marginBottom: 25,
                  fontSize: 18
                }}
              />
            </div>
            <button
              className="ui blue button"
              onClick={this.changePassword}
              disabled={!(this.state.newPassword.length > 5)}
            >
              Save
            </button>
          </div>
        </Modal>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(UserDetails, {
  listenTo: [UsersState.Store, AdminTeamsState.Store],

  fetch: {
    user() {
      if (this.props.userId) {
        return UsersState.Store.getItem(this.props.userId, {
          fields: [
            'first_name',
            'last_name',
            'id',
            'email',
            'learner.company.id',
            'learner.company.company_name',
            'learner.learnergroup_name',
            'learner.is_learner_group_admin',
            'learner.is_company_admin'
          ]
        });
      }
      return null;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, UserDetails);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, UserDetails, errors);
  }
});
