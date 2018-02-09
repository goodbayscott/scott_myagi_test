import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';

import Style from 'style';
import { t } from 'i18n';
import { Modal } from 'components/common/modal/index.jsx';
import { getIdFromApiUrl } from 'utilities/generic';
import ChannelSharesState from 'state/channel-shares';
import ChannelShareRequestsState from 'state/channel-share-requests';
import { PrimaryButton } from 'components/common/buttons';
import { CHANNEL_CARD_HEIGHT, CHANNEL_CARD_WIDTH } from 'components/common/channel-card';

const DECIDER_IS_CONSUMER = 1;

const styles = {
  container: {
    margin: '0px 10px 34px 10px',
    borderRadius: 2,
    border: `5px solid ${Style.vars.colors.get('primary')}`
  },
  backGroundContainer: {
    height: 0,
    width: 0
  },
  background: {
    height: CHANNEL_CARD_HEIGHT,
    width: CHANNEL_CARD_WIDTH,
    backgroundColor: '#eee',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  containerInner: {
    height: CHANNEL_CARD_HEIGHT,
    width: CHANNEL_CARD_WIDTH,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  infoContainer: {
    width: '100%',
    textAlign: 'center',
    color: 'white',
    padding: '4px 7px',
    borderBottom: '1px solid white'
  },
  channelDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20
  },
  logo: {
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: 50,
    height: 50,
    margin: 10
  },
  name: {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: '1.6rem',
    textAlign: 'center',
    maxHeight: 80,
    margin: '0px 10px'
  },
  buttonContainer: {
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  primaryButton: {
    boxShadow: 'rgba(255,255,255,0.7) 0px 0px 18px',
    display: 'inline-block'
  },
  cancel: {
    textAlign: 'center',
    color: 'white',
    margin: '8px',
    cursor: 'pointer'
  },
  cancelled: {
    textAlign: 'center',
    margin: '8px',
    color: Style.vars.colors.get('red')
  },
  accepted: {
    textAlign: 'center',
    fontSize: '1.3rem',
    color: Style.vars.colors.get('green'),
    margin: 8
  },
  viewChannel: {
    borderRadius: 4,
    padding: '4px 10px',
    backgroundColor: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor')
  }
};

@Radium
export class RequestItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cancelled: false,
      accepted: false,
      sharedTrainingUnitId: null
    };
  }

  componentWillUnmount() {
    if (this.state.accepted) {
      // When returning to this screen, don't show request again, it will appear with channels
      ChannelShareRequestsState.Store.onDelete(this.props.request.get('id'));
    }
  }

  cancel = () => {
    ChannelShareRequestsState.ActionCreators.delete(this.props.request.get('id'));
    this.setState({ ...this.state, cancelled: true });
  };

  accept = () => {
    ChannelShareRequestsState.ActionCreators.doDetailAction(
      this.props.request.get('id'),
      'accept'
    ).then(res => {
      const body = res.body;
      const sharedTrainingUnitId = getIdFromApiUrl(body.sharedtrainingunit_set[0]);
      this.setState({ sharedTrainingUnitId });
      if (body && body.sharedtrainingunit_set && body.sharedtrainingunit_set.length) {
        this.addChannelToAutoEnrollModal.show();
      }
    });
    this.setState({ accepted: true });
  };

  showAutoEnrollModal = () => {
    if (!this.context.currentUser.get('learner').company.subscription.groups_and_areas_enabled) {
      this.addToAutoEnroll();
      return;
    }
    this.refs.addChannelToAutoEnrollConfirmModal.show();
  };

  addToAutoEnroll = () => {
    ChannelSharesState.ActionCreators.update(this.state.sharedTrainingUnitId, {
      auto_add_plans_to_auto_enroll_set: true
    });
  };

  render() {
    const request = this.props.request;
    const channel = request.get('training_unit');
    const coverImage = channel.cover_image || channel.company.cover_image;
    const logo = channel.logo || channel.company.company_logo;
    const deciderIsConsumer = request.get('direction') === DECIDER_IS_CONSUMER;
    return (
      <div style={styles.container}>
        <div style={styles.backGroundContainer}>
          <div
            style={{
              ...styles.background,
              backgroundImage: `url('${coverImage}')`
            }}
          />
        </div>
        <div style={styles.containerInner}>
          <div style={{ width: '100%' }}>
            {deciderIsConsumer ? (
              <div style={styles.infoContainer}>Waiting for your approval</div>
            ) : (
              <div style={styles.infoContainer}>
                Waiting for {channel.company.company_name} to accept
              </div>
            )}
            <div style={styles.channelDetails}>
              <div
                style={{
                  ...styles.logo,
                  backgroundImage: `url('${logo}')`
                }}
              />
              <div style={styles.name}>{channel.name}</div>
            </div>
          </div>
          {this.state.accepted && (
            <div style={styles.buttonContainer}>
              <div style={styles.accepted}>Accepted</div>
              <Link style={styles.viewChannel} to={resolve('channel', { channelId: channel.id })}>
                View Channel
              </Link>
            </div>
          )}
          {this.state.cancelled && (
            <div style={styles.buttonContainer}>
              <div style={styles.cancelled}>Cancelled</div>
            </div>
          )}
          {!this.state.cancelled &&
            !this.state.accepted && (
              <div style={styles.buttonContainer}>
                {deciderIsConsumer && (
                  <PrimaryButton style={styles.primaryButton} onClick={this.accept}>
                    Accept
                  </PrimaryButton>
                )}
                <div style={styles.cancel} onClick={() => this.confirmDeleteModal.show()}>
                  {t('cancel_request')}
                </div>
              </div>
            )}
        </div>
        <Modal
          ref={c => (this.confirmDeleteModal = c)}
          header="Are you sure?"
          content={`
            Are you sure you would like to cancel the
            request from ${channel.company.company_name}?
          `}
          onConfirm={this.cancel}
          basic
        />
        <Modal
          ref={c => (this.addChannelToAutoEnrollModal = c)}
          header={t('connection_accepted')}
          content={t('channel_autoenrol_info')}
          onConfirm={this.addToAutoEnroll}
          basic
        />
      </div>
    );
  }
}
