import React from 'react';
import Style from 'style';
import Radium from 'radium';
import { t } from 'i18n';
import _ from 'lodash';
import Im from 'immutable';
import Marty from 'marty';
import ChannelsState from 'state/channels';
import containerUtils from 'utilities/containers';
import { LoadingContainer } from 'components/common/loading';
import ChannelShareRequestsState from 'state/channel-share-requests';

import { Modal } from 'components/common/modal';
import { FieldHeader } from 'components/common/form';
import { CompanySelect } from './company-select';
import { ChannelSelect } from './channel-select';
import { PrimaryButton } from 'components/common/buttons';
import { LoadingSpinner } from 'components/common/loading';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  section: {
    margin: '0px 0px 20px'
  }
};

@Radium
export class ConnectionModalInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showError: false,
      saving: false
    };
  }
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  onCompanySelect = c => {
    if (c) {
      this.setState({ ...this.state, companies: [...this.state.companies, c] });
      this.companySelect.getInput().reset();
    }
  };

  onSubmit = () => {
    const companiesObject = this.companySelect.getCompanies();

    const companies = Object.keys(companiesObject).map(id => companiesObject[id]);

    let channels = [];
    if (this.props.channel) {
      channels = [this.props.channel];
    } else {
      const channelsObject = this.channelSelect.getChannels();
      channels = Object.keys(channelsObject).map(id => channelsObject[id]);
    }

    if (companies.length == 0 || channels.length == 0) {
      this.setState({ ...this.state, showError: true });
      return;
    }
    this.setState({ ...this.state, showError: false, saving: true });

    const promises = [];

    companies.forEach(company => {
      channels.forEach(channel => {
        const p = ChannelShareRequestsState.ActionCreators.create({
          company: company.url,
          training_unit: channel.get('url'),
          requester: this.context.currentUser.get('url')
        });
        promises.push(p);
      });
    });

    Promise.all(promises)
      .then(() => {
        if (this.props.onConnectionsCreated) {
          this.props.onConnectionsCreated();
        }
        this.context.displayTempPositiveMessage({
          heading: t('connection_requested')
        });
        this.setState({ ...this.state, saving: false });
      })
      .catch(() => {
        this.context.displayTempPositiveMessage({
          heading: t('connection_requested_if_not_exists')
        });
        this.setState({ ...this.state, saving: false });
      });
  };

  render() {
    const company = this.props.company;
    return (
      <div className="content" style={styles.container}>
        <div style={styles.section}>
          <FieldHeader
            required
            headerStyle={styles.title}
            explanation={t('select_companies_explanation')}
          >
            Companies
          </FieldHeader>
          <CompanySelect ref={c => (this.companySelect = c)} />
        </div>
        {!this.props.channel && (
          <div style={styles.section}>
            <FieldHeader
              required
              headerStyle={styles.title}
              explanation={t('select_channels_explanation')}
            >
              Channels
            </FieldHeader>
            <ChannelSelect ref={c => (this.channelSelect = c)} channels={this.props.channels} />
            {this.state.showError && (
              <div className="ui red message">
                You must select at least one channel and one company
              </div>
            )}
          </div>
        )}
        {this.state.saving ? (
          <LoadingSpinner />
        ) : (
          <PrimaryButton onClick={this.onSubmit}>{t('create')}</PrimaryButton>
        )}
      </div>
    );
  }
}

export const ConnectionModal = Marty.createContainer(ConnectionModalInner, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [ChannelsState.Store],

  fetch: {
    channels() {
      return ChannelsState.Store.getItems({
        fields: ['name', 'id', 'logo', 'url'],
        limit: 0,
        // Get channels owned by current company
        company: this.context.currentUser.get('learner').company.id,
        learner_group__isnull: true,
        ordering: 'name'
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ConnectionModalInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ConnectionModalInner, errors);
  }
});
