import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import Style from 'style/index.js';

import ChannelsState from 'state/channels';
import { BordelessButton } from 'components/common/buttons';
import { Info } from 'components/common/info.jsx';
import { ChannelAnalyticsBox } from './analytics';
import { Modal } from 'components/common/modal/index.jsx';
import _ from 'lodash';
import { GatedFeatureModal, CONTENT_SHARING } from 'components/common/gated-feature';
import ChannelSharesState from 'state/channel-shares';
import { PublicPage as PublicChannelPage } from 'components/training/channels/page';
import { EnrollModal } from './enroll-users-modal';
import {
  Form,
  SubmitButton,
  SearchableSelect,
  ButtonToggle,
  HiddenTextInput
} from 'components/common/form';

const PUBLIC = 'Public';
const PUBLIC_WITH_REQUEST = 'Request to access';
const PRIVATE = 'Private';
const ON = 'On';
const OFF = 'Off';

const ACCESSIBILITY_MAPPING = {
  [PUBLIC]: { public: true, request_to_access: false },
  [PUBLIC_WITH_REQUEST]: { public: true, request_to_access: true },
  [PRIVATE]: { public: false, request_to_access: true }
};

const styles = {
  topButton: {
    marginTop: 5,
    minWidth: 100
  },
  smallTopButton: {
    marginTop: 5,
    minWidth: 50
  },
  buttonsContainer: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  extraOptionButtonIcon: {
    fontSize: 15
  }
};

const ACCESSIBILITY_OPTS = [
  {
    label: PUBLIC,
    value: PUBLIC
  },
  {
    label: PUBLIC_WITH_REQUEST,
    value: PUBLIC_WITH_REQUEST
  },
  {
    label: PRIVATE,
    value: PRIVATE
  }
];

const getAccessibilityText = channel => {
  let accessibility = PUBLIC;
  if (channel.get('public') !== undefined) {
    if (channel.get('public')) {
      if (channel.get('request_to_access')) {
        accessibility = PUBLIC_WITH_REQUEST;
      } else {
        accessibility = PUBLIC;
      }
    } else {
      accessibility = PRIVATE;
    }
  }
  return accessibility;
};

export class ButtonsRow extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  onAutoEnrollFormSubmit = data => {
    if (this.props.ownCompanyConnection) {
      ChannelSharesState.ActionCreators.update(this.props.ownCompanyConnection.get('id'), data);
    } else {
      ChannelsState.ActionCreators.update(this.props.channel.get('id'), data);
    }
    this.context.displayTempPositiveMessage({ heading: 'changes_saved' });
    this.autoEnrollModal.hide();
  };

  onAccessibilityFormSubmit = data => {
    const accessData = ACCESSIBILITY_MAPPING[data.accessibility];
    if (accessData.request_to_access && this.props.channel.get('price')) {
      this.paidChanelRequestToAccessError.show()
      this.accessibilityModal.hide()
      return
    }
    const newChannelData = {
      public: accessData.public,
      request_to_access: accessData.request_to_access
    };
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), newChannelData);
    this.context.displayTempPositiveMessage({ heading: 'changes_saved' });
    _.delay(() => {
      if (this.accessibilityModal) this.accessibilityModal.hide();
    }, 500);
  };

  removeConnection = () => {
    ChannelSharesState.ActionCreators.delete(this.props.ownCompanyConnection.get('id'));
    ChannelsState.Store.onDelete(this.props.channel.get('id'));
    this.context.router.push('/views/content/channels/?filter=external_channels');
  };

  onAccessibilityClick = () => {
    if (this.context.currentUser.get('learner').company.subscription.shared_content_enabled) {
      this.accessibilityModal.show();
    } else {
      this.sharingGatedModal.show();
    }
  };

  cleanAutoEnrollTurnedOn = val => val === ON;

  getButtons = () => {
    let lockIconClass = 'lock';
    if (this.props.channel.get('public') && !this.props.channel.get('request_to_access')) {
      lockIconClass = 'unlock';
    }

    const enableGroupsAndAreas = this.context.currentUser.get('learner').company.subscription
      .groups_and_areas_enabled;

    const buttons = [];

    if (enableGroupsAndAreas) {
      let autoEnrollStatus = this.props.channel.get('auto_add_plans_to_auto_enroll_set');
      if (this.props.ownCompanyConnection) {
        autoEnrollStatus = this.props.ownCompanyConnection.get('auto_add_plans_to_auto_enroll_set');
      }
      if (this.props.isExternalChannel && this.props.channel.get('price')) {
        buttons.push({
          name: 'enrollUsers',
          onClick: () => this.enrollUsersModal.show(),
          icon: 'student',
          text: t('enroll_users')
        });
      } else {
        buttons.push({
          name: 'autoEnrollBtn',
          onClick: () => this.autoEnrollModal.show(),
          icon: 'student',
          text: autoEnrollStatus ? t('auto_enroll_on') : t('auto_enroll_off')
        });
      }
    }

    if (!this.props.isExternalChannel) {
      buttons.push({
        name: 'accessibilityBtn',
        onClick: this.onAccessibilityClick,
        icon: lockIconClass,
        text: getAccessibilityText(this.props.channel)
      });
      buttons.push({
        name: 'statsBtn',
        onClick: () => this.statsModal.show(),
        icon: 'bar chart',
        text: t('analytics')
      });
    }
    if (this.props.isExternalChannel) {
      buttons.push({
        name: 'cancelConnectionBtn',
        onClick: () => this.cancelConnectionModal.show(),
        icon: 'remove',
        text: t('remove_connection')
      });
    }
    buttons.push({
      name: 'previewBtn',
      onClick: () => this.previewModal.show(),
      icon: 'eye',
      text: t('preview')
    });
    return buttons;
  };

  render() {
    const autoAddPlansToAutoEnrollSet =
      this.props.channel.get('auto_enroll_turned_on_for_current_user_company') !== false ? ON : OFF;
    return (
      <div style={styles.buttonsContainer}>
        {this.getButtons().map(b => (
          <BordelessButton key={b.name} name={b.name} style={styles.topButton} onClick={b.onClick}>
            <i className={`${b.icon} icon`} style={styles.extraOptionButtonIcon} />
            {b.text}
          </BordelessButton>
        ))}

        <Modal ref={c => (this.previewModal = c)} size="large" contentStyle={{ padding: 0 }}>
          <PublicChannelPage
            channelId={this.props.channel.get('id')}
            showConnectToChannel={false}
            viewerHasChannelConnection
            isPublicPage
          />
        </Modal>

        <Modal
          ref={c => (this.autoEnrollModal = c)}
          header={t('auto_enroll')}
          basic
          message
          noConfirm
        >
          <div className="content">
            {t('auto_enroll_info')}
            <Form onSubmitAndValid={this.onAutoEnrollFormSubmit} style={{ marginTop: 15 }}>
              <ButtonToggle
                name="auto_add_plans_to_auto_enroll_set"
                leftLabel={ON}
                rightLabel={OFF}
                initialValue={autoAddPlansToAutoEnrollSet}
                clean={this.cleanAutoEnrollTurnedOn}
                style={{
                  button: { width: '8em' }
                }}
                initialIsAcceptable
                required
              />
              <SubmitButton />
            </Form>
          </div>
        </Modal>
        {this.props.isExternalChannel && (
          <EnrollModal
            ref={c => (this.enrollUsersModal = c)}
            channel={this.props.channel}
            ownCompanyConnection={this.props.ownCompanyConnection}
          />
        )}
        <Modal
          ref={c => (this.accessibilityModal = c)}
          header={
            <div>
              {t('accessibility')}{' '}
              <Info style={styles.infoIcon} content={t('accessibility_info')} />
            </div>
          }
          basic
          message
          noConfirm
        >
          <div className="content">
            <Form onSubmitAndValid={this.onAccessibilityFormSubmit}>
              <HiddenTextInput />
              <SearchableSelect
                name="accessibility"
                initialSelection={getAccessibilityText(this.props.channel)}
                options={ACCESSIBILITY_OPTS}
              />
              <SubmitButton />
            </Form>
          </div>
        </Modal>
        <Modal
          ref={c => (this.paidChanelRequestToAccessError = c)}
          content={t('paid_channel_request_to_access_error')}
          basic
          message
          noConfirm
        />
        <Modal ref={c => (this.statsModal = c)} header={t('channel_stats')} size="large" noConfirm>
          <div className="content">
            <ChannelAnalyticsBox {...this.props} />
          </div>
        </Modal>
        <GatedFeatureModal
          ref={sharingGatedModal => (this.sharingGatedModal = sharingGatedModal)}
          headerText="Upgrade to Pro — Share Your Content"
          descriptionText="Ready to get your training material into the hands of sales associates? Upgrade to Pro today and start training your frontline workforce directly within seconds. Go ahead, calculate that ROI."
          featureType={CONTENT_SHARING}
        />
        <Modal
          ref={c => (this.cancelConnectionModal = c)}
          header={t('are_you_sure')}
          content={t('you_will_no_longer_have_access_to_this_content')}
          onConfirm={this.removeConnection}
          basic
        />
      </div>
    );
  }
}
