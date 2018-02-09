import React from 'react';
import { t } from 'i18n';
import _ from 'lodash';

import { Modal } from 'components/common/modal';
import { PrimaryButton } from 'components/common/buttons';
import { ButtonToggle } from 'components/common/form';
import ModuleCreationState from 'state/module-creation';

import { getVideoContainer } from 'components/module-attempt/module-pages/video-page/video-containers';

const YES = 'Yes';
const NO = 'No';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  },
  form: {
    marginTop: 40,
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  submitButton: {
    display: 'inline-block',
    marginLeft: 0,
    marginTop: 20
  }
};

export class EditModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      requireVideoView: props.page.get('require_video_view')
    };
  }

  show() {
    // Ensure page content is set to correct
    // initial position
    this.refs.modal.show();
  }

  onRequireToggleChange = newVal => {
    this.setState({ requireVideoView: newVal === YES });
  };

  onSubmit = () => {
    this.refs.modal.hide();
    ModuleCreationState.ActionCreators.updatePage(this.props.page.get('id'), {
      require_video_view: this.state.requireVideoView
    });
  };

  render() {
    const toggleInitValue = this.props.page.get('require_video_view') ? YES : NO;

    return (
      <Modal ref="modal" header={t('video')}>
        <div className="content" style={styles.container}>
          {getVideoContainer(this.props.page.get('video_url'), {
            ref: 'videoContainer',
            onEnd: () => {},
            width: 500,
            height: 500 * 9 / 16,
            allowControl: true
          })}
          <div style={styles.form}>
            <div>
              <h4>{t('require_entire_video_watched')}</h4>
              <ButtonToggle
                onChange={this.onRequireToggleChange}
                name="require_view_view"
                initialValue={toggleInitValue}
                leftLabel={NO}
                rightLabel={YES}
              />
              <br />
              <PrimaryButton
                style={styles.submitButton}
                onClick={this.onSubmit}
                disabled={this.props.page.get('require_video_view') == this.state.requireVideoView}
              >
                {t('save')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
