import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import reactMixin from 'react-mixin';
import Marty from 'marty';
import _ from 'lodash';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import PublicChannels from 'state/public-channels';
import ChannelShareRequestsState from 'state/channel-share-requests';

import { LoadingContainer } from 'components/common/loading';
import { ChannelCardList } from 'components/channel-discovery/channel-cards/page';
import { Modal } from 'components/common/modal';

const styles = {
  desc: {
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center'
  }
};

class ExistingCompanyDetailsModal extends React.Component {
  static data = {
    company: {
      required: true,
      fields: ['id', 'name', 'company_url']
    },
    channels: {
      required: false,
      fields: $y.getFields(ChannelCardList, 'channels')
    }
  };

  show = () => {
    this.modal.show();
  };

  render() {
    const co = this.props.company;
    return (
      <Modal
        ref={el => (this.modal = el)}
        header={co.get('company_name')}
        currentUser={this.props.currentUser}
      >
        <div className="content">
          <p style={styles.desc}>
            This company is already part of the Myagi network. Follow some of these channels to
            access their content.
          </p>
          <LoadingContainer
            loadingProps={[this.props.channels]}
            noDataText="No channels available"
            createComponent={() => (
              <ChannelCardList
                increaseChannelsSelected={() => {}}
                channels={this.props.channels}
                currentUser={this.props.currentUser}
                onChannelDetailsHidden={this.show}
              />
            )}
          />
        </div>
      </Modal>
    );
  }
}

export default Marty.createContainer(ExistingCompanyDetailsModal, {
  statics: {
    data: {
      company: $y.getData(ExistingCompanyDetailsModal, 'company')
    }
  },
  listenTo: [PublicChannels.Store],
  fetch: {
    channels() {
      return PublicChannels.Store.getItems(
        {
          fields: $y.getFields(ExistingCompanyDetailsModal, 'channels'),
          company: this.props.company.get('id')
        },
        {
          dependantOn: ChannelShareRequestsState.Store
        }
      );
    }
  },
  show() {
    this.refs.innerComponent.show();
  },
  pending() {
    return containerUtils.defaultPending(this, ExistingCompanyDetailsModal);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ExistingCompanyDetailsModal, errors);
  }
});
