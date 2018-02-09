import React from 'react';
import _ from 'lodash';
import { t } from 'i18n';
import Radium from 'radium';

import { FLIP_CARD_PAGE_TYPE } from 'core/constants';

import Style from 'style';

import ModuleCreationState from 'state/module-creation';

import { Modal } from 'components/common/modal';
import { TextInput, ImageCropper, SubmitButton } from 'components/common/form';
import { NeutralMessage } from 'components/common/message';

import { FlipCard, CARD_WIDTH } from 'components/module-attempt/module-pages/flip-card-page';

const styles = {
  previewContainer: {
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    [Style.vars.media.get('mobile')]: {
      flexDirection: 'column'
    }
  },
  singleCardPreviewContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  },
  sideNameTxt: {
    textAlign: 'center',
    fontSize: 18
  },
  formContainer: { width: CARD_WIDTH },
  imageSelect: {
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'center'
  },
  imageSelectCropContainer: {
    justifyContent: 'center'
  },
  previewHeader: {
    color: Style.vars.colors.get('xDarkGrey')
  }
};

@Radium
export default class DetailsModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      page: props.page
    };
  }

  show() {
    this.refs.modal.show();
  }

  onSubmit = () => {
    if (!this.isValid()) return;
    this.refs.modal.hide();
    const data = this.state.page.toJS();
    if (this.props.page.get('id')) {
      ModuleCreationState.ActionCreators.updatePage(this.props.page.get('id'), {
        ...data
      });
    } else {
      ModuleCreationState.ActionCreators.createPage({
        ...data,
        type: FLIP_CARD_PAGE_TYPE
      });
    }
    this.props.onSave && this.props.onSave();
  };

  onTextInputChange = (sideName, evt, newVal) => {
    this.setState({ page: this.state.page.set(`${sideName}_text`, newVal) });
  };

  onImageChange = (sideName, imgData) => {
    this.setState({ page: this.state.page.set(`${sideName}_image`, imgData || null) });
  };

  renderSidePreview(sideName, flipped) {
    const onImageChange = _.partial(this.onImageChange, sideName);
    const initText = this.state.page.get(`${sideName}_text`);
    const initImg = this.state.page.get(`${sideName}_image`);
    return (
      <div style={styles.singleCardPreviewContainer}>
        <p style={styles.sideNameTxt}>{t(sideName)}</p>
        <div style={styles.formContainer}>
          <ImageCropper
            aspectRatio={null}
            height={200}
            width={CARD_WIDTH - 20}
            onCrop={onImageChange}
            onImageRemove={onImageChange}
            containerStyle={styles.imageSelect}
            cropContainerStyle={styles.imageSelectCropContainer}
            initialValue={initImg}
          />
          <TextInput
            initialValue={initText || t('card_text')}
            initialIsAcceptable={Boolean(initText)}
            onChange={_.partial(this.onTextInputChange, sideName)}
          />
        </div>
        <p style={styles.previewHeader}>{t('preview')}</p>
        <FlipCard page={this.state.page} flipped={flipped} />
      </div>
    );
  }

  isValid() {
    return (
      Boolean(this.state.page.get('front_text')) || Boolean(this.state.page.get('front_image'))
    );
  }

  render() {
    return (
      <Modal ref="modal" header={t('flip_card')}>
        <NeutralMessage style={{ marginTop: 0, borderRadius: 0 }}>
          <div className="header">{t('flip_card_explaination_header')}</div>
          <div>{t('flip_card_explaination')}</div>
        </NeutralMessage>
        <div style={styles.previewContainer}>
          {this.renderSidePreview('front', false)}
          {this.renderSidePreview('back', true)}
        </div>
        <SubmitButton formIsValid={this.isValid()} onClick={this.onSubmit} />
      </Modal>
    );
  }
}
