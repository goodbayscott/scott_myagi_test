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

export default class FeatureRequestButton extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map),
    featureName: React.PropTypes.string.isRequired,
    btnText: React.PropTypes.string.isRequired,
    modalHeader: React.PropTypes.string.isRequired,
    modalContent: React.PropTypes.string
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  static defaultProps = {
    modalContent:
      "Click 'Get Started' below and your account manager will be in touch to get you set up."
  };

  showModal = () => {
    this.refs.modal.show();
  };

  makeRequest = () => {
    const user = this.props.currentUser;
    analytics.track(`Requested ${this.props.featureName}`);
    UsersState.ActionCreators.doDetailAction(user.get('id'), 'register_feature_interest', {
      feature_name: this.props.featureName
    });
    this.refs.modal.hide();
    this.context.displayTempPositiveMessage({
      heading: 'Request sent',
      body: 'Someone will be in contact with you shortly.'
    });
  };

  render() {
    return (
      <div style={Object.assign({}, styles.container, this.props.containerStyle)}>
        <PrimaryButton style={styles.btn} onClick={this.showModal}>
          <i className="add circle icon" /> {this.props.btnText}
        </PrimaryButton>
        <Modal
          ref="modal"
          onConfirm={this.makeRequest}
          noClose
          leftText="Cancel"
          rightText="Get Started"
          header={this.props.modalHeader}
          basic
        >
          <div className="content" style={{ fontSize: 18 }}>
            {this.props.modalContent}
          </div>
        </Modal>
      </div>
    );
  }
}
