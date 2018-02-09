import React from 'react';
import Im from 'immutable';
import $y from 'utilities/yaler';
import Radium from 'radium';
import { t } from 'i18n';

import Style from 'style';
import { Modal } from 'components/common/modal/index';
import { ChannelCard } from 'components/common/channel-card';
import { PublicPage as ChannelPage } from 'components/training/channels/page';
import { PrimaryButton } from 'components/common/buttons';
import { getConnectionStatusText } from 'components/channel-discovery/channel-directory/page';
import ChannelAccessUserState from 'state/channel-access-users';
import ChannelShareRequestsState from 'state/channel-share-requests';
import { CardCollection } from 'components/common/cards';

const styles = {
  channelCardContainer: {
    padding: 10,
    transition: 'all .2s ease',
    ':hover': {
      transform: 'scale(1.02)'
    }
  },
  connectBtn: {
    display: 'block',
    width: '100%',
    marginLeft: 0,
    borderRadius: '0 0 3px 3px'
  },
  channelStats: {
    paddingTop: 10,
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10
  },
  likeRatingText: {
    color: 'gray'
  },
  star: {
    fontSize: 16,
    color: Style.vars.colors.get('myagiOrange'),
    marginBottom: 5
  },
  priceText: {
    color: Style.vars.colors.get('green')
  },
  extraContentBase: {
    cursor: 'pointer',
    overflow: 'visible',
    display: 'flex'
  },
  extraContentSelected: {
    backgroundColor: Style.vars.colors.get('white'),
    color: Style.vars.colors.get('green'),
    zIndex: 9,
    width: 250,
    height: 45,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    cursor: 'pointer',
    borderRight: `1px solid ${Style.vars.colors.get('green')}`,
    borderLeft: `1px solid ${Style.vars.colors.get('green')}`,
    borderBottom: `1px solid ${Style.vars.colors.get('green')}`,
    borderTop: 'none'
  },
  extraContentNotConnected: {
    backgroundColor: Style.vars.colors.get('white'),
    color: Style.vars.colors.get('myagiOrange'),
    zIndex: 9,
    width: 250,
    height: 45,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    borderRight: `1px solid ${Style.vars.colors.get('myagiOrange')}`,
    borderLeft: `1px solid ${Style.vars.colors.get('myagiOrange')}`,
    borderBottom: `1px solid ${Style.vars.colors.get('myagiOrange')}`,
    borderTop: 'none'
  },
  requestInfoIcon: {
    cursor: 'pointer',
    color: Style.vars.colors.get('darkGrey')
  }
};

@Radium
class CardExtraContent extends React.Component {
  static propTypes = {
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  onIgnoreClick = () => {
    this.props.rejectChannel();
  };

  onConnectClick = () => {
    // if already connected or existing request, show info modal.
    if (this.props.isFollowed && !this.props.channel.get('price')) {
      this.modal.show();
    } else {
      this.props.connect();
    }
  };

  render() {
    const {
      channel, isFollowed, curated, style
    } = this.props;
    const isSubscribed = channel.get('is_subscribed_to_by_current_company');
    const requestToAccess = channel.get('request_to_access');
    const connectionStatusText = getConnectionStatusText(channel, isFollowed);

    const followIcon = isFollowed ? 'checkmark icon white' : 'add circle icon white';
    const hasAccessToChannel = isSubscribed || (isFollowed && !requestToAccess);
    const modalHeader = hasAccessToChannel ? t('connected') : t('connection_requested');
    const modalContentText = hasAccessToChannel
      ? t('you_are_already_connected')
      : t('we_let_company_name_know_channel_requested', {
        companyName: channel.get('company').company_name
      });
    const btnStyle = curated ? Style.funcs.merge(style, { width: 125 }) : style;
    return (
      <div
        className="extra content"
        style={Style.funcs.merge(Style.common.ellipsisOverflow, styles.extraContentBase)}
        key={`extra-content-${channel.get('id')}`}
      >
        {curated ? (
          <a
            style={Style.funcs.merge(btnStyle, {
              borderRight: 'none',
              color: Style.vars.colors.get('myagiOrange')
            })}
            title={channel.get('name')}
            onClick={this.onIgnoreClick}
          >
            <span>
              <i className="remove icon white" />
              {t('ignore')}
            </span>
          </a>
        ) : null}
        <a
          style={Style.funcs.merge(btnStyle, {
            color: Style.vars.colors.get('green'),
            borderColor: Style.vars.colors.get('green')
          })}
          title={channel.get('name')}
          onClick={this.onConnectClick}
        >
          <span>
            <i className={followIcon} />
            {connectionStatusText}
          </span>
        </a>
        <Modal ref={modal => (this.modal = modal)} header={modalHeader} basic message>
          <div>{modalContentText}</div>
        </Modal>
      </div>
    );
  }
}

@Radium
export class ChannelCardContainer extends React.Component {
  static data = {
    channel: {
      fields: [
        'id',
        'name',
        'description',
        'url',
        'logo',
        'price',
        'cover_image',
        'cover_image_thumbnail',
        'request_to_access',
        'avg_like_rating',
        'is_subscribed_to_by_current_company',
        'existing_request_for_current_company',
        'company.company_name',
        'company.deactivated',
        'company.cover_image',
        'company.cover_image_thumbnail',
        'company.company_logo',
        'training_plans.id',
        'training_plans.name',
        'training_plans.description',
        'training_plans.thumbnail_url'
      ]
    }
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object
  };

  static propTypes = {
    channel: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isFollowed:
        props.channel.get('is_subscribed_to_by_current_company') ||
        props.channel.get('existing_request_for_current_company'),
      showConnectToChannel: false,
      renderKey: 0,
      ignored: false
    };
  }

  onPlanCardClick = () => {
    this.setState({ showConnectToChannel: true });
    this.channelDetailsModal.hide();
    this.connect();
  };

  showChannelDetailsModal = () => {
    this.channelDetailsModal.show();
  };

  startTrial = () => {
    ChannelAccessUserState.ActionCreators.doListAction('create_paid_channel_trial', {
      channel: this.props.channel.get('id')
    })
      .then(r => {
        this.trialStartedModal.show();
      })
      .catch((r, b) => {
        this.props.displayTempNegativeMessage({
          heading: t('channel_trial_creation_failed'),
          body: t('channel_trial_creation_failed_info')
        });
      });
  };

  connect = evt => {
    if (evt && evt.stopPropagation) evt.stopPropagation();

    if (this.state.isFollowed) return;

    if (this.props.channel.get('price')) {
      this.confirmTrialStartModal.show();
      return;
    }
    this.createConnection();
  };

  createConnection = () => {
    this.setState({ isFollowed: true });
    const companyURL = this.context.currentUser.get('learner').company.url;

    this.channelDetailsModal.hide();
    ChannelShareRequestsState.ActionCreators.create({
      company: companyURL.replace('/companies', '/public/companies'),
      training_unit: this.props.channel
        .get('url')
        .replace('/public/training_unit', '/training_units'),
      requester: this.context.currentUser.get('url')
    })
      .then(dat => {
        if (this.props.channel.get('price')) {
          return this.startTrial();
        }
        let message;
        this.props.incrementNumChannelsConnected();
        if (!this.props.channel.get('request_to_access')) {
          message = {
            heading: 'connected',
            body: 'you_can_now_access_content'
          };
        } else {
          message = {
            heading: 'connection_requested',
            body: 'we_let_company_know_channel_requested'
          };
        }
        this.props.displayTempPositiveMessage(message);
      })
      .catch(err => {
        this.props.displayTempNegativeMessage({
          heading: t('request_failed'),
          body: t('failed_to_create_request')
        });
      });
  };

  rejectChannel = () => {
    this.props.rejectChannel(this.props.channel, this.props.companyConnectionRequest);
    this.setState({ ignored: true });
  };

  updateParentModal = () => {
    // Refresh parent modal so it's scrollable once video is closed. This is
    // a hack that's needed because if there's a modal on top of another modal,
    // the 1st modal will lose ability to scroll after the 2nd modal is closed.
    // Bumping the modal's key fixes this problem.
    this.setState({ renderKey: this.state.renderKey + 1 });
  };

  viewChannel = () => {
    this.context.router.push(`/views/channel-content/${this.props.channel.get('id')}/`);
  };

  buyLicences = () => {
    this.context.router.push(`/views/channels/${this.props.channel.get('id')}/licences/`);
  };

  render() {
    // If channel is ignored, don't render the card. Done this way so we don't
    // have to re-fetch the entire qs of curated channels.
    if (this.state.ignored) return null;
    const channelPage = (
      <ChannelPage
        channelId={this.props.channel.get('id')}
        onPlanCardClick={this.onPlanCardClick}
        showConnectToChannel={this.state.showConnectToChannel}
        updateParentModal={this.updateParentModal}
        isPublicPage
      />
    );
    const connectionStatusText = getConnectionStatusText(this.props.channel, this.props.isFollowed);
    return (
      <div style={styles.channelCardContainer}>
        <div>
          <ChannelCard
            channel={this.props.channel}
            onClick={this.showChannelDetailsModal}
            isPublicPage
          />
          <CardExtraContent
            isFollowed={this.state.isFollowed}
            key={`extra-${this.props.channel.get('id')}`}
            style={
              this.state.isFollowed ? styles.extraContentSelected : styles.extraContentNotConnected
            }
            channel={this.props.channel}
            connect={this.connect}
            curated={this.props.curated}
            rejectChannel={this.rejectChannel}
          />
        </div>
        <Modal
          header=""
          key={this.state.renderKey}
          showOnInit={this.state.renderKey > 0}
          size="large"
          ref={c => (this.channelDetailsModal = c)}
          contentStyle={{ padding: 0 }}
        >
          <div>{channelPage}</div>

          {!this.state.isFollowed &&
          !this.props.channel.get('is_subscribed_to_by_current_company') &&
          !this.props.channel.get('existing_request_for_current_company') ? (
            <div className="actions">
                <PrimaryButton onClick={this.connect} style={styles.connectBtn}>
                {connectionStatusText}
              </PrimaryButton>
              </div>
            ) : null}
        </Modal>
        <Modal
          ref={c => (this.confirmTrialStartModal = c)}
          header={t('channel_trial_start_warning')}
          content={
            <div>
              <p>{t('channel_trial_start_warning_info_1')}</p>
              <p>{t('channel_trial_start_warning_info_2')}</p>
            </div>
          }
          onConfirm={this.createConnection}
          basic
        />
        <Modal ref={c => (this.trialStartedModal = c)} header={t('youre_all_set')}>
          <div style={{ margin: '10px 0px 30px' }}>
            <p>{t('trial_period_started_info_1')}</p>
            <p>{t('trial_period_started_info_2')}</p>
          </div>
          <PrimaryButton onClick={() => this.trialStartedModal.hide()}>
            {t('continue_browsing')}
          </PrimaryButton>
          <PrimaryButton onClick={this.viewChannel}>{t('view_content')}</PrimaryButton>
          <PrimaryButton onClick={this.buyLicences}>{t('buy_licences')}</PrimaryButton>
        </Modal>
      </div>
    );
  }
}

export class ChannelCardList extends React.Component {
  static data = {
    channels: {
      many: true,
      required: false,
      fields: [$y.getFields(ChannelCardContainer, 'channel'), 'company.url']
    }
  };

  static propTypes = {
    channels: React.PropTypes.instanceOf(Im.List).isRequired
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  getConnectionRequest = channel => {
    if (!this.props.companyConnectionRequests) return null;
    const request = this.props.companyConnectionRequests.find(obj => obj.get('to_company') === channel.get('company').url);
    return request;
  };

  createCard = channel => (
    <ChannelCardContainer
      key={channel.get('id')}
      channel={channel}
      incrementNumChannelsConnected={this.props.incrementNumChannelsConnected}
      displayTempPositiveMessage={this.context.displayTempPositiveMessage}
      displayTempNegativeMessage={this.context.displayTempNegativeMessage}
      currentUser={this.props.currentUser}
      renderKey={this.props.renderKey}
      curated={this.props.curated}
      rejectChannel={this.props.rejectChannel}
      companyConnectionRequest={this.getConnectionRequest(channel)}
    />
  );

  render() {
    return <CardCollection entities={this.props.channels} createCard={this.createCard} centered />;
  }
}
