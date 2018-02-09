import React from 'react';
import Im from 'immutable';
import cx from 'classnames';
import { t } from 'i18n';

import Style from 'style';

import ChannelSharesState from 'state/channel-shares';
import ChannelsState from 'state/channels';

import { Modal } from 'components/common/modal/index.jsx';

export class InfoLabels extends React.Component {
  render() {
    const labelClass = cx('ui', 'bottom', 'right', 'attached', 'label');
    const containerStyle = {
      backgroundColor: Style.vars.colors.get('white'),
      padding: 0,
      marginRight: -1
    };

    return (
      <div className={labelClass} style={containerStyle}>
        <AutoEnrollLabel
          entity={this.props.entity}
          currentUser={this.props.currentUser}
          toggleAutoEnroll={this.props.toggleAutoEnroll}
        />
        {this.props.children}
      </div>
    );
  }
}

export class AutoEnrollLabel extends React.Component {
  static data = {
    entity: {
      required: true,
      fields: ['auto_add_plans_to_auto_enroll_set', 'company.id']
    }
  };

  render() {
    const autoEnrollTurnedOn = this.props.entity.get('auto_add_plans_to_auto_enroll_set');
    const incoming =
      this.props.entity.get('company').id === this.props.currentUser.get('learner').company.id;
    // If the connection is outgoing, we don't need to let the producing company
    // know if the consuming company has auto enroll on or off.
    if (!incoming) return null;
    let autoEnrollText = 'Auto enroll off';
    if (autoEnrollTurnedOn) {
      autoEnrollText = 'Auto enroll on';
    }

    const labelStyle = {
      opacity: 1,
      borderRadius: '0.21428571rem 0.21428571rem 0em 0em'
    };

    const labelClass = cx('ui', 'label', { green: autoEnrollTurnedOn, red: !autoEnrollTurnedOn });
    return (
      <a onClick={this.props.toggleAutoEnroll} style={labelStyle} className={labelClass}>
        {autoEnrollText}
      </a>
    );
  }
}

export class AutoEnrollConfirmModal extends React.Component {
  autoEnrollTurnedOn = () => this.props.entity.get('auto_add_plans_to_auto_enroll_set');

  getConsumingChannel = () => {
    let channel;
    if (this.props.entity.get('training_unit')) {
      channel = Im.Map(this.props.entity.get('training_unit'));
    } else {
      channel = this.props.entity;
    }
    return channel;
  };

  show = () => {
    this.refs.autoEnrollModal.show();
  };

  hide = () => {
    this.refs.autoEnrollModal.hide();
  };

  addOrRemoveFromAutoEnroll = () => {
    const channel = this.getConsumingChannel();
    let ChannelsStateModule;
    if (channel.get('company').id === this.props.currentUser.get('learner').company.id) {
      // Use ChannelsState
      ChannelsStateModule = ChannelsState;
    } else {
      // Use ChannelSharesState
      ChannelsStateModule = ChannelSharesState;
    }
    ChannelsStateModule.ActionCreators.update(this.props.entity.get('id'), {
      auto_add_plans_to_auto_enroll_set: !this.props.entity.get('auto_add_plans_to_auto_enroll_set')
    });
  };

  render() {
    const channel = this.getConsumingChannel();
    const channelName = channel.get('name');
    let autoEnrollConfirmTxt,
      autoEnrollConfirmModalHeaderTxt;

    if (this.autoEnrollTurnedOn()) {
      autoEnrollConfirmTxt = t('channel_no_autoenrol_info');
      // TODO
      autoEnrollConfirmModalHeaderTxt = `Remove "${channelName}" channel from auto enroll?`;
    } else {
      autoEnrollConfirmTxt = t('channel_autoenrol_info');
      autoEnrollConfirmModalHeaderTxt = `Add "${channelName}" channel to auto enroll?`;
    }

    return (
      <Modal
        ref="autoEnrollModal"
        header={autoEnrollConfirmModalHeaderTxt}
        content={autoEnrollConfirmTxt}
        onConfirm={this.addOrRemoveFromAutoEnroll}
        basic
      />
    );
  }
}
