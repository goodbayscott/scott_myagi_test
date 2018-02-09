import React from 'react';
import ReactStyleTransitionGroup from 'react-style-transition-group';

import { t } from 'i18n';

export const NEGATIVE_MESSAGE = 'negative';
export const POSITIVE_MESSAGE = 'positive';

const NOTIFICATION_WIDTH = 300;

const styles = {
  notificationsContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    zIndex: 99999
  },

  notification: {
    margin: '3px 3px 3px',
    color: 'white',
    padding: '15px 25px',
    borderRadius: 5,
    cursor: 'pointer',
    maxWidth: NOTIFICATION_WIDTH
  },

  positive: {
    backgroundColor: 'rgba(40,160,40,0.9)'
  },
  negative: {
    backgroundColor: 'rgba(160,40,40,0.9)'
  }
};

const transitionStyles = {
  enter: {
    transition: 'all .5s ease-in-out',
    transform: `translate(${NOTIFICATION_WIDTH + 100}, 0)`,
    opacity: 0
  },
  enterActive: {
    transform: 'translate(0,0)',
    opacity: 1
  },
  leave: {
    transition: 'all .5s ease-in-out',
    maxHeight: 120,
    opacity: 1
  },
  leaveActive: {
    maxHeight: 0,
    opacity: 0
  }
};

export class TempMessages extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: []
    };
  }

  displayMessage({ type, heading, body }) {
    const id = Math.floor(Math.random() * 9999999);
    const message = {
      type,
      heading,
      body,
      id
    };
    this.setState({ ...this.state, messages: [message, ...this.state.messages] });
    setTimeout(() => this.removeMessage(id), 3000);
  }

  removeMessage(id) {
    this.setState({
      ...this.state,
      messages: this.state.messages.filter(n => n.id !== id)
    });
  }

  displayGenericRequestFailure(requestAction, err) {
    //  Shortcut for displaying standard error message when
    //  a particular action fails unexpectedly.
    const noti = {
      type: NEGATIVE_MESSAGE,
      heading: `Failed to ${requestAction}`
    };
    if (err && err.response && err.response.status === 403) {
      this.displayMessage({
        ...noti,
        body: 'An error occurred. You do not have permission to perform this action.'
      });
    } else {
      this.displayMessage({
        ...noti,
        body: 'An error occurred. Please contact support if this issue persists.'
      });
    }
  }

  render() {
    return (
      <div style={styles.notificationsContainer}>
        <ReactStyleTransitionGroup>
          {this.state.messages.map(n => (
            <div
              key={n.id}
              styles={styles.notificationContainer}
              transitionStyles={transitionStyles}
              onClick={() => this.removeMessage(n.id)}
            >
              <div
                style={{
                  ...styles.notification,
                  ...(n.type == POSITIVE_MESSAGE ? styles.positive : styles.negative)
                }}
              >
                {n.heading && (
                  <b>
                    {n.heading && t(n.heading)}
                    <br />
                  </b>
                )}
                <span dangerouslySetInnerHTML={{ __html: (n.body && t(n.body)) || '' }} />
              </div>
            </div>
          ))}
        </ReactStyleTransitionGroup>
      </div>
    );
  }
}
