import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import Style from 'style';

import { Form, TextInput, SubmitButton, FieldHeader } from 'components/common/form';

import LinksState from 'state/links';

import { Modal } from 'components/common/modal/index';
import { ScrollableDataTable } from 'components/common/table';
import { SlideToggle } from 'components/common/form';
import { Info } from 'components/common/info';
import { NeutralMessage } from 'components/common/message';
import { SHARELINK_BLACKLIST } from 'core/constants';

const SHARELINK_URL = 'https://myagi.com/s/';

const styles = {
  noChanges: {
    color: Style.vars.colors.get('xDarkGrey'),
    margin: '10px 0 0 0',
    width: '100%',
    display: 'inline-block',
    textAlign: 'center'
  }
};

export class SharelinkModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedChannels: this.props.sharelink
        ? this.props.sharelink.get('channels').map(c => c.url)
        : [],
      possibleInitialChannels: this.props.sharelink
        ? this.props.sharelink.get('channels').map(c => ({ value: c.url, label: c.name }))
        : [],
      initialChannel:
        this.props.sharelink && this.props.sharelink.get('initial_channel')
          ? this.props.sharelink.get('initial_channel').url
          : 'set to default',
      shortName: this.props.sharelink ? this.props.sharelink.get('name') : '',
      showError: false,
      errorText: '',
      editing: false
    };
  }

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  show = () => {
    // disabling submit button when editing sharelink but no changes have been made yet
    if (this.state.shortName) {
      this.refs.modal.show();
      this.setState({ editing: true });
    }
    this.refs.modal.show();
  };

  hide = () => {
    this.setState({
      selectedChannels: [],
      possibleInitialChannels: [],
      initialChannel: null,
      editing: false
    });
    this.refs.modal.hide();
  };

  onNameChange = e => {
    const name = e.target.value.replace(/\s/g, '');
    this.setState({
      shortName: name
    });
  };

  showNameTakenError = () => {
    this.setState({
      showError: true,
      errorText: t('sharelink_name_taken')
    });
  };

  onSubmitAndValid = data => {
    this.setState({ showError: false });
    if (this.state.selectedChannels.length) {
      const name = data.shortName
        .toLowerCase()
        .trim()
        .replace(/[^A-Z0-9]/gi, '');
      if (SHARELINK_BLACKLIST.indexOf(name) > -1) {
        this.showNameTakenError();
        return;
      }

      // only way to get the value of select to be 'set to default' as having the state = null does not work
      const initialChannel =
        this.state.initialChannel === 'set to default' ? null : this.state.initialChannel;

      const saveData = {
        name,
        channels: this.state.selectedChannels,
        initial_channel: initialChannel,
        company: this.context.currentUser.get('learner').company.url
      };

      const promise = this.props.sharelink
        ? LinksState.ActionCreators.update(this.props.sharelink.get('id'), saveData)
        : LinksState.ActionCreators.create(saveData);

      promise
        .then(res => {
          // Reset state
          this.setState({ selectedChannels: [], initialChannel: null, shortName: '' });
          this.hide();
        })
        .catch(err => {
          this.showNameTakenError();
        });
    } else {
      this.setState({ showError: true });
    }
  };

  onToggle = (channelName, channelUrl) => {
    if (_.includes(this.state.selectedChannels, channelUrl)) {
      const index = this.state.selectedChannels.indexOf(channelUrl);
      const newState = {
        selectedChannels: this.state.selectedChannels.filter((_, channelUrl) => channelUrl !== index),
        possibleInitialChannels: this.state.possibleInitialChannels.filter((_, channelUrl) => channelUrl !== index)
      };
      if (this.state.initialChannel === channelUrl) {
        this.setState({
          ...newState,
          initialChannel: 'set to default'
        });
      }
      this.setState(newState);
    } else {
      this.setState({
        selectedChannels: [...this.state.selectedChannels, channelUrl],
        possibleInitialChannels: [
          ...this.state.possibleInitialChannels,
          { value: channelUrl, label: channelName }
        ]
      });
    }
  };

  static tableDataMapping = {
    Channel: x => x.get('name'),
    '': (x, cxt) => (
      <SlideToggle
        initialValue={
          cxt.props.sharelink
            ? cxt.props.sharelink.get('channels').findIndex(c => c.id === x.get('id')) != -1
            : false
        }
        onChange={function () {
          cxt.onToggle(x.get('name'), x.get('url'));
        }}
      />
    )
  };

  getDataMapping() {
    const mapping = SharelinkModal.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    const channels = this.props.channels;
    if (channels) {
      return channels.map(x => Im.List(funcs.map(f => f(x, this))));
    }
    // empty list to satisfy prop types
    return Im.List.of();
  }

  onInitialChannelSelect = e => {
    this.setState({
      initialChannel: e.target.value
    });
  };

  onHideModal = () => {
    this.setState({
      selectedChannels: this.props.sharelink
        ? this.props.sharelink.get('channels').map(c => c.url)
        : [],
      possibleInitialChannels: this.props.sharelink
        ? this.props.sharelink.get('channels').map(c => ({ value: c.url, label: c.name }))
        : [],
      initialChannel: this.props.sharelink ? this.props.sharelink.get('initial_channel') : null,
      shortName: this.props.sharelink ? this.props.sharelink.get('name') : '',
      editing: false
    });
  };

  checkDisable = () => {
    if (this.state.editing) {
      const channelsChanged = this.props.sharelink
        ? _.isEqual(
          this.props.sharelink.get('channels').map(c => c.url),
          this.state.selectedChannels
        )
        : false;
      const nameChanged = this.props.sharelink
        ? this.props.sharelink.get('name') === this.state.shortName
        : false;
      const initialChannel =
        this.props.sharelink &&
        this.props.sharelink.get('initial_channel') &&
        this.props.sharelink.get('initial_channel').url;
      const initialChannelChanged = initialChannel
        ? _.isEqual(initialChannel, this.state.initialChannel)
        : false;
      const checkEdited =
        channelsChanged &&
        nameChanged &&
        (initialChannelChanged ||
          (this.props.sharelink.get('initial_channel') === null &&
            this.state.initialChannel === 'set to default'));
      return this.state.selectedChannels.length === 0 || !this.state.shortName || checkEdited;
    }
    return this.state.selectedChannels.length === 0 || !this.state.shortName;
  };

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();
    return (
      <Modal
        ref="modal"
        closeOnDimmerClick
        header={t('create_sharelink')}
        onHidden={this.onHideModal}
      >
        <div className="content">
          <NeutralMessage>
            <p>{`${t('create_sharelink_info')}`}</p>
          </NeutralMessage>
          <Form onSubmitAndValid={this.onSubmitAndValid}>
            <FieldHeader required>{`${t('name_your_sharelink')}`}</FieldHeader>
            <TextInput
              name="shortName"
              required
              initialIsAcceptable
              initialValue={this.state.shortName}
              onChange={this.onNameChange}
              placeholder={t('enter_a_name')}
              maxLength={30}
            />
            {this.state.showError && (
              <span style={{ color: 'red' }}>
                {this.state.errorText || `${t('please_select_channel')}`}
              </span>
            )}
            <div className="ui center aligned segment">
              <p>{`${SHARELINK_URL}${this.state.shortName}`}</p>
            </div>

            <FieldHeader required>{`${t('select_channels')}`}</FieldHeader>
            <ScrollableDataTable
              name="channels"
              headers={headers}
              rows={rows}
              bodyHeight={null}
              reformatForMobile={false}
            />
            <FieldHeader explanation={t('select_initial_channel_info')}>
              {`${t('select_initial_channel')}`}
            </FieldHeader>
            {/* Couldn't use the DropdownSelect select component as I cannot reset on componentDidUpdate in the jQueryMixin without breaking the component elsewhere */}
            <div className="field">
              <span>
                <select
                  className="ui dropdown"
                  id="dropdown"
                  value={this.state.initialChannel}
                  onChange={this.onInitialChannelSelect}
                >
                  {this.state.possibleInitialChannels.map((opt, i) => (
                    <option key={i} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="set to default" style={{ color: '#ccc' }}>
                    {t('set_default')}
                  </option>
                </select>
              </span>
            </div>
            <SubmitButton text={t('create')} disabled={this.checkDisable()} />
          </Form>
        </div>
      </Modal>
    );
  }
}
