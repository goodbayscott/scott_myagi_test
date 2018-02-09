import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';

import containerUtils from 'utilities/containers';
import LinksState from 'state/links';
import ChannelsState from 'state/channels';

import { PrimaryButton } from 'components/common/buttons';
import { LoadingContainer } from 'components/common/loading';

import { SharelinkItem } from './sharelink-item';
import { SharelinkModal } from './sharelink-modal';

const SHARELINK_URL = 'https://myagi.com/s/';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    marginTop: 40,
    borderRadius: 2,
    border: '1px solid #e5e5e5',
    boxShadow: 'rgba(0,0,0,0.18) 4px 3px 20px'
  },
  noDataContainer: {
    margin: 30
  },
  createBtn: {
    alignSelf: 'flex-end',
    display: 'flex',
    marginTop: -70,
    marginBottom: 30
  },
  createTxt: { textDecoration: 'underline', cursor: 'pointer' }
};

class LinksTabContent extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  showSharelinkModal = () => {
    this.refs.createSharelinkModal.show();
  };

  render() {
    return (
      <div style={styles.container}>
        <PrimaryButton onClick={this.showSharelinkModal} style={styles.createBtn}>
          <i className="external share icon" />
          {` ${t('create_link')}`}
        </PrimaryButton>
        <LoadingContainer
          loadingProps={[this.props.links, this.props.channels]}
          createComponent={() => (
            <div>
              {this.props.links.map(link => (
                <SharelinkItem
                  key={link.get('id')}
                  sharelink={link}
                  allChannels={this.props.channels}
                />
              ))}
            </div>
          )}
        />
        {this.props.links &&
          this.props.links.size == 0 && (
            <div style={styles.noDataContainer}>
              <strong>{t('what_are_sharelinks')}</strong>
              <br />
              <span onClick={this.showSharelinkModal}>{t('sharelinks_info')}</span>
              <br />
              <br />
              <span style={{ fontWeight: 'bold' }}>Eg. {SHARELINK_URL}acme-channel</span>
              <br />
              <br />
              <span onClick={this.showSharelinkModal} style={styles.createTxt}>
                {`${t('create_one_now')}.`}
              </span>
            </div>
          )}
        <SharelinkModal ref="createSharelinkModal" channels={this.props.channels} />
      </div>
    );
  }
}

export const SharelinkSection = Marty.createContainer(LinksTabContent, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [LinksState.Store, ChannelsState.Store],

  fetch: {
    links() {
      const query = {
        fields: [
          'active',
          'name',
          'url',
          'channels',
          'channels.url',
          'channels.id',
          'channels.name',
          'channels.logo',
          'initial_channel',
          'initial_channel.id',
          'initial_channel.url',
          'initial_channel.name'
        ],
        limit: 0,
        company: this.context.currentUser.get('learner').company.id,
        active: true
      };
      return LinksState.Store.getItems(query);
    },
    channels() {
      return ChannelsState.Store.getItems({
        fields: ['name', 'id', 'logo'],
        limit: 0,
        // Get channels owned by current company
        company: this.context.currentUser.get('learner').company.id,
        learner_group__isnull: true,
        ordering: 'name'
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, LinksTabContent);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, LinksTabContent, errors);
  }
});
