import React from 'react';
import Im from 'immutable';
import Style from 'style';
import Radium from 'radium';
import { t } from 'i18n';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';

import ChannelShareRequestsState from 'state/channel-share-requests';
import PLACEHOLDER_IMAGE from 'img/placeholder.svg';
import ARROW from '../common/arrow.svg';

export const DECIDER_IS_PRODUCER = 2;

const COMPRESS_LAYOUT = '@media screen and (max-width: 600px)';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px 0',
    borderTop: '1px solid #eee',
    padding: '30px 0'
  },
  requestContainer: {
    backgroundColor: 'white'
  },
  pendingRequestTitle: {
    fontWeight: 600,
    fontSize: '1.2rem',
    marginBottom: 10
  },
  containerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  channel: {
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      transform: 'scale(1.05)',
      transition: 'all 0.2s'
    }
  },
  channelLogo: {
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    marginRight: 10,
    width: 80,
    height: 80,
    [COMPRESS_LAYOUT]: {
      display: 'none'
    }
  },
  channelName: {
    width: 100,
    color: 'black'
  },
  arrow: {
    width: '25px',
    margin: '0px 20px'
  },
  company: {
    display: 'flex',
    alignItems: 'center'
  },
  companyLogo: {
    display: 'flex',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: 80,
    height: 80,
    marginRight: 10,
    [COMPRESS_LAYOUT]: {
      display: 'none'
    }
  },
  companyName: {
    width: 100
  },

  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 9
  },
  actionButton: {
    display: 'block',
    width: 100
  },

  acceptedRejectedText: {
    display: 'flex',
    justifyContent: 'center',
    fontSize: '1.4rem',
    margin: '15px 0 4px'
  },
  accepted: {
    color: Style.vars.colors.get('green')
  },
  rejected: {
    color: '#888'
  }
};

@Radium
export class PendingShareItem extends React.Component {
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
    ChannelShareRequestsState.ActionCreators.doDetailAction(
      this.props.connection.get('id'),
      'accept'
    ).then(() => {
      this.setState({ ...this.state, loading: false });
    });
    this.setState({ ...this.state, recentlyAccepted: true, loading: true });
    this.props.shareAccepted(
      this.props.connection.get('company').id,
      this.props.connection.get('id')
    );
  };

  reject = () => {
    ChannelShareRequestsState.ActionCreators.doDetailAction(
      this.props.connection.get('id'),
      'reject'
    ).then(() => {
      this.setState({ ...this.state, loading: false });
    });
    this.setState({ ...this.state, recentlyRejected: true, loading: true });
    this.props.shareRejected(
      this.props.connection.get('company').id,
      this.props.connection.get('id')
    );
  };

  render() {
    const channel = this.props.connection.get('training_unit');
    const company = this.props.connection.get('company');
    const deciderIsProducer = this.props.connection.get('direction') == DECIDER_IS_PRODUCER;

    return (
      <div style={styles.container}>
        <div style={styles.pendingRequestTitle}>
          {t(deciderIsProducer ? 'request_from_company' : 'waiting_for_company', {
            company: company.company_name
          })}
        </div>

        <div style={styles.containerInner}>
          <Link to={resolve('channel', { channelId: channel.id })}>
            <div key={channel.id} style={styles.channel}>
              <div
                style={{
                  ...styles.channelLogo,
                  backgroundImage: `url(${channel.logo ||
                    this.context.currentUser.get('learner').company.company_logo ||
                    PLACEHOLDER_IMAGE})`
                }}
              />
              <div style={styles.channelName}>{channel.name}</div>
            </div>
          </Link>

          <img src={ARROW} style={styles.arrow} />

          <div style={styles.company}>
            <div
              style={{
                ...styles.companyLogo,
                backgroundImage: `url(${company.company_logo || PLACEHOLDER_IMAGE})`
              }}
            />
            <div style={styles.companyName}>{company.company_name}</div>
          </div>
        </div>
        {!this.state.recentlyAccepted &&
          !this.state.recentlyRejected &&
          (deciderIsProducer ? (
            <div style={styles.buttonContainer}>
              <PrimaryButton style={styles.actionButton} onClick={this.reject}>
                Reject
              </PrimaryButton>
              <PrimaryButton style={styles.actionButton} onClick={this.accept}>
                Approve
              </PrimaryButton>
            </div>
          ) : (
            <div style={styles.buttonContainer}>
              <SecondaryButton style={styles.actionButton} onClick={this.reject}>
                Cancel
              </SecondaryButton>
            </div>
          ))}

        {this.state.recentlyAccepted && (
          <div style={{ ...styles.acceptedRejectedText, ...styles.accepted }}>
            <i className="ui icon checkmark" /> Accepted
          </div>
        )}
        {this.state.recentlyRejected && (
          <div style={{ ...styles.acceptedRejectedText, ...styles.rejected }}>
            <i className="ui icon remove" /> Rejected
          </div>
        )}
      </div>
    );
  }
}
