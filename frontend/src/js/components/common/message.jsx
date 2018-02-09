import React from 'react';
import UsersState from 'state/users';
import { local } from 'utilities/storage';

const styles = {
  messageContainer: {
    position: 'absolute',
    width: 350,
    right: 50,
    top: 200
  },
  '@media screen and (max-width: 1350px)': {
    messageContainer: {
      width: 'auto',
      right: 'auto',
      top: 'auto',
      position: 'static'
    }
  }
};

class ContentConciergeMessage extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      hideMessage: false
    };
  }

  sendSlackMessage = () => {
    this.context.displayTempPositiveMessage({
      heading: 'Request sent',
      body: 'Someone will be in contact with you shortly.'
    });
    const userId = this.props.currentUser.get('id');
    UsersState.ActionCreators.doDetailAction(userId, 'register_feature_interest', {
      feature_name: 'Content Concierge'
    }).then(() => {
      local.set('myagicontentconcierge', true);
      this.setState({ hideMessage: true });
    });
  };

  close = () => {
    local.set('myagicontentconcierge', true);
    this.setState({ hideMessage: true });
  };

  render() {
    if (local.get('myagicontentconcierge') || this.state.hideMessage) {
      return null;
    }

    return (
      <div className="ui info message" style={styles.messageContainer}>
        <i className="close icon" onClick={this.close} />
        <div className="header">Need more great content?</div>
        <p>
          Find out how Myagi's Content Concierge can help you supercharge your content production.
          <br />
          <u style={{ cursor: 'pointer' }} onClick={this.sendSlackMessage}>
            Click here to find out more!
          </u>
        </p>
      </div>
    );
  }
}

class NeutralMessage extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/collections/message.html
  */
  static propTypes = {
    style: React.PropTypes.object
  };

  render() {
    return (
      <div className="ui info message" style={this.props.style}>
        {this.props.children}
      </div>
    );
  }
}

class PositiveMessage extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/collections/message.html
  */
  static propTypes = {
    style: React.PropTypes.object
  };

  render() {
    return (
      <div className="ui positive message" style={this.props.style}>
        {this.props.children}
      </div>
    );
  }
}

class NegativeMessage extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/collections/message.html
  */
  static propTypes = {
    style: React.PropTypes.object
  };

  render() {
    return (
      <div className="ui negative message" style={this.props.style}>
        {this.props.children}
      </div>
    );
  }
}

export { ContentConciergeMessage, NeutralMessage, PositiveMessage, NegativeMessage };
