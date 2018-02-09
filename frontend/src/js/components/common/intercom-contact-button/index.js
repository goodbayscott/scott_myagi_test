import React from 'react';
import Im from 'immutable';

import UsersState from 'state/users';

import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';

const styles = {
  btn: {
    padding: 20,
    position: 'relative',
    margin: '20px auto',
    fontSize: 18,
    borderRadius: 10
  },
  container: {
    display: 'flex'
  }
};

export default class IntercomContactButton extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map),
    btnText: React.PropTypes.string.isRequired,
    modalHeader: React.PropTypes.string.isRequired,
    modalContent: React.PropTypes.string
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  showModal = () => {
    this.refs.modal.show();
  };

  sendIntercomMessage = () => {
    this.refs.modal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'Request sent',
      body: 'Someone will be in contact with you shortly.'
    });
    const userId = this.props.currentUser.get('id');
    UsersState.ActionCreators.doDetailAction(userId, 'send_intercom_message', {
      message: this.props.message
    }).then(() => {
      if (this.props.onMessageSent) this.props.onMessageSent();
    });
  };

  render() {
    return (
      <div>
        <PrimaryButton className="ui button" onClick={this.showModal} onTouchEnd={this.showModal}>
          <i className="add circle icon" />
          {this.props.btnText}
        </PrimaryButton>

        <Modal
          ref="modal"
          onConfirm={this.sendIntercomMessage}
          noClose
          leftText="Cancel"
          rightText="Get Started"
          header={this.props.modalHeader}
        >
          <div className="content" style={{ fontSize: 18 }}>
            {this.props.modalContent}
          </div>
        </Modal>
      </div>
    );
  }
}
