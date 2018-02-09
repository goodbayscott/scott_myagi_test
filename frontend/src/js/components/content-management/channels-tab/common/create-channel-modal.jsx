import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import { resolve } from 'react-router-named-routes';

import { Modal } from 'components/common/modal/index.jsx';
import { ChannelDetailsForm } from './channel-details-form.jsx';

export const CreateChannelModal = React.createClass({
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },

  show() {
    this.refs.modal.show();
  },

  hide() {
    this.refs.modal.hide();
  },

  onChannelSaved(channel) {
    this.hide();
    this.context.router.push(resolve('channel', {
      channelId: channel.get('id')
    }));
  },

  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('create_channel')}>
        <div className="content">
          <ChannelDetailsForm
            onChannelSaved={this.onChannelSaved}
            currentUser={this.props.currentUser}
          />
        </div>
      </Modal>
    );
  }
});
