import React from 'react';
import Im from 'immutable';
import Style from 'style';
import Radium from 'radium';
import { Link } from 'react-router';

import ChannelSharesState from 'state/channel-shares';
import ChannelShareRequestsState from 'state/channel-share-requests';
import { t } from 'i18n';
import { Modal } from 'components/common/modal/index.jsx';
import { LoadingSpinner } from 'components/common/loading';
import { Dropdown } from 'components/common/dropdown';
import { resolve } from 'react-router-named-routes';
import { PrimaryButton } from 'components/common/buttons';
import PLACEHOLDER_IMAGE from 'img/placeholder.svg';
import MENU from '../common/menu.svg';

const DECIDER_IS_CONSUMER = 1;
const DECIDER_IS_PRODUCER = 2;

const styles = {
  containerOuter: {
    margin: '10px 5px',
    paddingBottom: 10
  },
  container: {
    display: 'flex',
    alignItems: 'center'
  },
  pendingRequestTitle: {
    padding: '5px 10px'
  },
  actionButton: {
    marginRight: 10
  },
  img: {
    marginLeft: 10,
    height: 45,
    width: 60,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  largeIcon: {
    fontSize: '3rem',
    lineHeight: '3rem'
  },
  channelLink: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    ':hover': {
      transform: 'scale(1.1)'
    }
  },
  disabledChannelLink: {
    pointerEvents: 'none'
  },
  rejected: {
    color: Style.vars.colors.get('red'),
    marginLeft: 10
  },
  accepted: {
    color: Style.vars.colors.get('green'),
    marginLeft: 10
  },
  name: {
    marginLeft: 10,
    flexGrow: 1
  },
  menu: {
    height: 25,
    margin: '0 10px'
  }
};

@Radium
export class ShareRow extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      recentlyAccepted: false,
      recentlyRejected: false,
      loading: false
    };
  }

  accept = () => {
    this.setState({ ...this.state, loading: true });
    ChannelShareRequestsState.ActionCreators.doDetailAction(this.props.share.id, 'accept').then(this.setAccepted);
    // remove from collection so it doesn't appear anywhere else now
    ChannelShareRequestsState.Store.onDelete(this.props.share.id);
  };

  delete = () => {
    this.refs.deleteModal.hide();
    const isRequest = !!this.props.share.direction;
    this.setState({ ...this.state, loading: true });
    if (isRequest) {
      ChannelShareRequestsState.ActionCreators.delete(this.props.share.id).then(this.setRejected);
      // remove from collection so it doesn't appear anywhere else now
      ChannelShareRequestsState.Store.onDelete(this.props.share.id);
    } else {
      ChannelSharesState.ActionCreators.delete(this.props.share.id).then(this.setRejected);
    }
  };

  setRejected = () => {
    this.setState({ ...this.state, loading: false, recentlyRejected: true });
  };

  setAccepted = () => {
    this.setState({ ...this.state, loading: false, recentlyAccepted: true });
  };

  getImage() {
    if (this.state.loading) {
      return (
        <div style={styles.img}>
          <LoadingSpinner />
        </div>
      );
    } else if (this.state.recentlyRejected) {
      return (
        <div style={styles.img}>
          <i style={{ ...styles.rejected, ...styles.largeIcon }} className="ui icon remove" />
        </div>
      );
    } else if (this.state.recentlyAccepted) {
      return (
        <div style={styles.img}>
          <i style={{ ...styles.accepted, ...styles.largeIcon }} className="ui icon check circle" />
        </div>
      );
    }
    return (
      <div
        style={{
          ...styles.img,
          backgroundImage: `url(${this.props.share.training_unit.logo ||
            this.context.currentUser.get('learner').company.company_logo ||
            PLACEHOLDER_IMAGE})`
        }}
      />
    );
  }

  render() {
    const { share } = this.props;
    const isRequest = !!share.direction;
    const awaitingDecision =
      isRequest && !this.state.recentlyRejected && !this.state.recentlyAccepted;

    return (
      <div
        style={{
          ...styles.containerOuter
        }}
      >
        {isRequest &&
          awaitingDecision && (
            <div style={styles.pendingRequestTitle}>
              {share.direction === DECIDER_IS_CONSUMER ? (
                <div>
                  <i className="ui icon wait" />
                  Waiting for <b>{share.company.company_name}</b> to accept
                </div>
              ) : (
                <div>
                  <i className="ui icon wait" />
                  Waiting for your approval
                </div>
              )}
            </div>
          )}
        <div style={styles.container}>
          <Link
            key="link"
            to={resolve('channel', { channelId: share.training_unit.id })}
            style={{
              ...styles.channelLink,
              ...(isRequest ? styles.disabledChannelLink : {})
            }}
          >
            {this.getImage()}

            <div
              style={{
                ...styles.name,
                color: isRequest && !this.state.recentlyAccepted ? '#999' : 'black'
              }}
            >
              {share.training_unit.name}
              {this.state.recentlyRejected && <span style={styles.rejected}>(Removed)</span>}
              {this.state.recentlyAccepted && <span style={styles.accepted}>(Accepted)</span>}
            </div>
          </Link>

          {share.direction === DECIDER_IS_PRODUCER &&
            awaitingDecision && (
              <PrimaryButton style={styles.actionButton} onClick={this.accept}>
                Approve
              </PrimaryButton>
            )}

          {!this.state.loading &&
            !this.state.recentlyRejected && (
              <Dropdown className="ui pointing top right dropdown" style={styles.dropdown}>
                <img
                  src={MENU}
                  style={{
                    ...styles.menu,
                    opacity: isRequest ? 1 : 1
                  }}
                  key="dropdownIcon"
                />
                <div className="menu">
                  <div key="delete" className="item" onClick={() => this.refs.deleteModal.show()}>
                    Delete
                  </div>
                </div>
              </Dropdown>
            )}
          <Modal
            ref="deleteModal"
            header="Are you sure you want to delete this outgoing connection?"
            content={`The company consuming your content will no
              longer have access to the channel: ${share.training_unit.name}.
            `}
            onConfirm={this.delete}
            basic
          />
        </div>
      </div>
    );
  }
}
