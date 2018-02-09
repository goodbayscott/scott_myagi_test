import React from 'react';
import { t } from 'i18n';
import ChannelsState from 'state/channels';
import { Modal } from 'components/common/modal/index';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';
import { Input } from 'semantic-ui-react';

const styles = {
  price: {
    marginLeft: 10
  }
};

export class Price extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      price: this.props.channel.get('price')
    };
  }

  onChange = e => {
    // regex to match $XXX.XX
    const regex = /^[0-9]{1,3}(\.[0-9]{0,2})?$/;
    if (e.target.value.match(regex) || !e.target.value) {
      this.setState({ ...this.state, price: e.target.value });
    }
  };

  show = () => {
    this.editModal.show();
  };

  save = () => {
    if (this.props.channel.get('request_to_access')) {
      this.paidChanelRequestToAccessError.show()
      this.editModal.hide()
      return
    }
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), { price: this.state.price || null });
    this.editModal.hide();
  };

  render() {
    return (
      <div>
        <div>
          $
          <span style={styles.price}>
            {this.props.channel.get('price') ? this.props.channel.get('price') : t('free')}
          </span>
        </div>
        <Modal ref={c => (this.editModal = c)} header={t('price')} basic message noConfirm>
          <div className="content">
            <div>{t('price_change_info')}</div>
            <Input
              placeholder={t('price')}
              type="text"
              value={this.state.price}
              onChange={this.onChange}
            />
            <PrimaryButton onClick={this.save}>{t('save')}</PrimaryButton>
          </div>
        </Modal>
        <Modal
          ref={c => (this.paidChanelRequestToAccessError = c)}
          content={t('paid_channel_request_to_access_error')}
          basic
          message
          noConfirm
        />
      </div>
    );
  }
}
