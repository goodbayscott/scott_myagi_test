import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';

import { t } from 'i18n';
import Style from 'style/index';
import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import UsersState from 'state/users';
import TeamsState from 'state/teams';

import { PrimaryButton } from 'components/common/buttons';
import { Form, SubmitButton } from 'components/common/form/index';
import { Modal } from 'components/common/modal';
import { UsersList } from 'components/common/many-users-selection/common';
import ComponentState from 'components/common/many-users-selection/component-state';
import { ManyUsersSelection } from 'components/common/many-users-selection/index';

const styles = {
  usersContainer: {
    maxHeight: '40vh',
    overflowX: 'hidden',
    overflowY: 'auto',
    marginTop: 10
  }
};

class AddUsersModal extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  };

  onSubmitAndValid = data => {
    let mems = this.props.team.get('members');
    data.users.map(user => {
      mems = _.union(mems, [user.get('learner')]);
      UsersState.ActionCreators.doDetailAction(user.get('id'), 'set_learner_group', {
        learner_group: this.props.team.get('url')
      })
        .then(() => {
          // Fixes the unique constraint bug and allows team members to update -> updates UI
          TeamsState.ActionCreators.resetLocalData();
          UsersState.ActionCreators.resetLocalData();
        })
        .catch(err => {
          console.log(err);
        });
    });
    this.context.displayTempPositiveMessage({ heading: 'changes_saved' });
    this.hide();
  };

  show() {
    this.refs.modal.show();
  }

  hide() {
    this.refs.modal.hide();
  }

  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('add_users')}>
        <div className="content">
          <Form onSubmitAndValid={this.onSubmitAndValid}>
            <ManyUsersSelection
              currentUser={this.props.currentUser}
              required
              returnUsersObj
              searchOnly
              noDataText={t('no_available_users_matching_search')}
              searchFilter={{ has_no_team: true }}
            />
            <SubmitButton text={t('submit')} />
          </Form>
        </div>
      </Modal>
    );
  }
}

export class AddUsersModalContainer extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  showModal = () => {
    this.refs.addModal.show();
  };
  render() {
    return (
      <div>
        <PrimaryButton style={{ float: 'right' }} onClick={this.showModal}>
          {t('add_users')}
        </PrimaryButton>
        <AddUsersModal
          ref="addModal"
          currentUser={this.context.currentUser}
          users={this.props.users}
          team={this.props.team}
        />
      </div>
    );
  }
}
