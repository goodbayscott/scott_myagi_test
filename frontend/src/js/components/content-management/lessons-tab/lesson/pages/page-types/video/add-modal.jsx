import React from 'react';
import { t } from 'i18n';
import _ from 'lodash';
import reactMixin from 'react-mixin';

import Style from 'style';

import { Modal } from 'components/common/modal';
import { URLInput, FieldHeader, SubmitButton, ButtonToggle } from 'components/common/form';
import { TabsMixin } from 'components/common/tabs';
import { WistiaVideoUpload } from './wistia-upload';
import { VIDEO_PAGE_TYPE } from 'core/constants';
import ModuleCreationState from 'state/module-creation';

const LINK = 'Link';
const UPLOAD = 'Upload';
const INIT_TAB = UPLOAD;
const VIMEO_URL_REGEX = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
const YOUTUBE_URL_REGEX = /^(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch(?:\.php)?\?.*v=)[a-zA-Z0-9\-_]+/;
const WISTIA_URL_REGEX = /https?:\/\/(.+)?(wistia\.com|wi\.st)\/(medias|embed)\/(.*)/;
const YES = 'Yes';
const NO = 'No';

export class Upload extends React.Component {
  render() {
    return (
      <div style={{ marginBottom: 20 }}>
        <FieldHeader required>{t('upload_your_video')}</FieldHeader>
        <WistiaVideoUpload onChange={this.props.onChange} />
      </div>
    );
  }
}

export class Link extends React.Component {
  validateURL = url => {
    if (!url) return false;
    let match = false;
    const regexes = [VIMEO_URL_REGEX, YOUTUBE_URL_REGEX, WISTIA_URL_REGEX];
    regexes.forEach(regex => {
      if (url.match(regex)) match = true;
    });
    return match;
  };
  onChange = evt => {
    const url = this.refs.input.clean(evt.target.value);
    if (this.validateURL(url)) this.props.onChange(url);
    else this.props.onChange(null);
  };
  render() {
    return (
      <div className="ui form">
        <FieldHeader required>{t('enter_video_link')}</FieldHeader>
        <URLInput
          ref="input"
          onChange={this.onChange}
          isValid={this.validateURL}
          initialValue={this.props.initialValue}
          initialIsAcceptable
          required
        />
      </div>
    );
  }
}

const vpdStyle = {
  buttonToggle: {
    container: {
      marginBottom: 30,
      marginLeft: '50%',
      ...Style.funcs.makeTransform('translateX(-50%)')
    },
    button: {
      width: '6em'
    }
  },
  requireHeader: {
    marginTop: '1em'
  }
};

@reactMixin.decorate(TabsMixin)
export class AddModal extends React.Component {
  constructor(props) {
    super();
    this.state = {};
  }

  componentWillReceiveProps(nextProps) {
    // Make sure these values get reset
    if (!nextProps.page) {
      this.setState({
        videoURL: this.props.page ? this.props.page.get('video_url') : null,
        requireVideoView: this.props.page ? this.props.page.get('require_video_view') : false
      });
    }
  }

  show() {
    // Ensure page content is set to correct
    // initial position
    this.setTab(INIT_TAB);
    this.refs.modal.show();
  }

  getTabContentMap = () => ({
    [UPLOAD]: <Upload onChange={this.onURLChange} />,
    [LINK]: <Link onChange={this.onURLChange} onURLChange={this.onURLChange} />
  });

  onURLChange = videoURL => {
    this.setState({
      videoURL
    });
  };

  onRequireToggleChange = newVal => {
    this.setState({ requireVideoView: newVal === YES });
  };

  onSubmit = () => {
    if (!this.state.videoURL) return;
    this.refs.modal.hide();
    ModuleCreationState.ActionCreators.createPage({
      type: VIDEO_PAGE_TYPE,
      module: this.props.lesson.get('url'),
      video_url: this.state.videoURL,
      require_video_view: this.state.requireVideoView
    });
    this.props.onSave();
  };

  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('video')}>
        <div className="content">
          <ButtonToggle
            leftLabel={UPLOAD}
            rightLabel={LINK}
            initialValue={INIT_TAB}
            onChange={this.onTabChange.bind(this)}
            style={vpdStyle.buttonToggle}
          />
          {this.getTabContent()}
          <FieldHeader style={vpdStyle.requireHeader} required>
            {t('require_entire_video_watched')}
          </FieldHeader>
          <ButtonToggle
            onChange={this.onRequireToggleChange}
            name="require_view_view"
            initialValue={NO}
            leftLabel={NO}
            rightLabel={YES}
          />
          <SubmitButton formIsValid={Boolean(this.state.videoURL)} onClick={this.onSubmit} />
        </div>
      </Modal>
    );
  }
}
