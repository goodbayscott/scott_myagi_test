import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import UsersState from 'state/users';

import { Modal } from 'components/common/modal/index';
import { FieldHeader, SlideToggle } from 'components/common/form/index';

const pageStyle = {
  requireHeader: {
    marginTop: '1em'
  }
};

export class UserPermissionsModal extends React.Component {
  static propTypes = {
    selectedUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    showIsActiveToggle: React.PropTypes.bool
  };

  static defaultProps = {
    showIsActiveToggle: true
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  toggleGroupMembership(u, isMember, groupName) {
    const method = isMember ? 'remove_from_group' : 'add_to_group';
    UsersState.ActionCreators.doDetailAction(u.get('id'), method, { name: groupName })
      .then(() => {
        this.context.displayTempPositiveMessage({
          heading: 'User permissions updated'
        });
      })
      .catch(err => {
        const message = err.response.body.message;
        this.context.displayTempNegativeMessage({
          heading: 'Error',
          body: `<b>${message}</b>`
        });
        this.refs.managerToggle.toggleNoAction();
      });
  }

  hide = () => {
    this.refs.modal.hide();
    // navigate back since the user is no longer on the team
    this.context.displayTempPositiveMessage({
      heading: `${this.props.selectedUser.get('first_name')}'s settings successfully updated`
    });
  };

  show = () => {
    this.refs.modal.show();
  };

  onManagerToggleChange = () => {
    const isAdmin = this.props.selectedUser.get('learner').is_learner_group_admin;
    this.toggleGroupMembership(this.props.selectedUser, isAdmin, 'team_managers');
  };

  onToggleIsActive = () => {
    const u = this.props.selectedUser;
    if (u.get('id') === this.props.currentUser.get('id')) {
      _.defer(() => {
        this.refs.activeToggle.toggleNoAction();
      });
      this.context.displayTempNegativeMessage({
        heading: 'Error',
        body: '<b>This action cannot be performed on your own account</b>'
      });

      return;
    }
    UsersState.ActionCreators.update(u.get('id'), {
      is_active: !u.get('is_active')
    })
      .then(res => {
        const status = res.body.is_active ? 'activated' : 'deactivated';
        this.context.displayTempPositiveMessage({
          heading: `User ${status}`
        });
      })
      .catch(err => {
        this.context.displayTempNegativeMessage({
          heading: 'Error',
          body: "<b>You do not have permission deactivate a company admin's account</b>"
        });
        this.refs.activeToggle.toggleNoAction();
      });
  };

  render() {
    const user = this.props.selectedUser;
    const userIsManager = user.get('learner').is_learner_group_admin;
    const activeStatus = user.get('is_active') ? 'deactivate' : 're-activate';
    const activeInfo = `Toggling this switch will ${activeStatus} this user\'s account.`;
    return (
      <div>
        <Modal ref="modal" header="User Details" closeOnDimmerClick>
          <div className="content">
            <FieldHeader style={pageStyle.requireHeader} required>
              Team manager
            </FieldHeader>
            <SlideToggle
              ref="managerToggle"
              initialValue={userIsManager}
              onChange={this.onManagerToggleChange}
            />
            {this.props.showIsActiveToggle && (
              <div>
                <FieldHeader style={pageStyle.requireHeader} explanation={activeInfo} required>
                  Active
                </FieldHeader>
                <SlideToggle
                  ref="activeToggle"
                  initialValue={user.get('is_active')}
                  onChange={this.onToggleIsActive}
                  style={{ marginBottom: '2em' }}
                />
              </div>
            )}
            {/* <EditUserTeamForm
                teams={this.props.teams}
                user={this.props.selectedUser}
                onFinishUpdate={this.hide}
              /> */}
          </div>
        </Modal>
      </div>
    );
  }
}
