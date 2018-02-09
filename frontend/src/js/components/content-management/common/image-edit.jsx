import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import Style from 'style';
import cx from 'classnames';
import ReactStyleTransitionGroup from 'react-style-transition-group';

import { Modal } from 'components/common/modal';

import { Form, ImageCropper, SubmitButton } from 'components/common/form';
import PLACEHOLDER_IMAGE from 'img/placeholder.svg';

const IMG_RATIO = 9 / 16;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  text: {
    padding: 10
  },
  img: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#eee',
    ':hover': {}
  },
  tickContainer: {
    height: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tick: {
    height: '50px',
    width: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    color: Style.vars.colors.get('primaryFontColor'),
    zIndex: '3',
    backgroundColor: Style.vars.colors.get('primary')
  }
};

const transitionStyles = {
  enter: {
    transition: 'all .2s ease-in-out',
    transform: 'scale(0.7)',
    opacity: 0
  },
  enterActive: {
    transform: 'scale(1)',
    opacity: 1
  },
  leave: {
    transition: 'all .2s ease-in-out',
    transform: 'scale(1)',
    opacity: 1
  },
  leaveActive: {
    transform: 'scale(0.7)',
    opacity: 0
  }
};

@Radium
export class ImageEdit extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      error: false
    };
  }

  onError = err => {
    this.setState({
      error: err
    });
  };

  onImageCropSubmit = () => {
    const thumbnail = this.image.getValue();
    this.props.onSave(thumbnail);
    this.cropModal.hide();
  };

  showCropModal = () => {
    if (this.props.editable) {
      this.cropModal.show();
    }
  };

  render() {
    const { error } = this.state;
    const imgHover = Radium.getState(this.state, 'img', ':hover');
    const width = this.props.width;
    const height = width * IMG_RATIO;
    return (
      <div
        ref="img"
        className="thumbnail"
        style={Object.assign(
          {
            ...styles.img,
            width,
            height,
            backgroundImage: `url(${this.props.image || PLACEHOLDER_IMAGE})`
          },
          this.props.editable && { cursor: 'pointer' }
        )}
        onClick={this.showCropModal}
      >
        {this.props.editable && (
          <div key="play" style={{ ...styles.tickContainer, width }}>
            <ReactStyleTransitionGroup>
              {imgHover && (
                <i
                  transitionStyles={transitionStyles}
                  style={{ ...styles.tick, top: height / 2 }}
                  className={cx('ui', 'icon', 'write')}
                />
              )}
            </ReactStyleTransitionGroup>
          </div>
        )}
        <Modal ref={ref => (this.cropModal = ref)} header={t('crop_photo')}>
          <div className="content" style={{ display: 'flex', justifyContent: 'center' }}>
            <Form
              ref="imageCropForm"
              onSubmitAndValid={this.onImageCropSubmit}
              style={styles.container}
            >
              <ImageCropper
                ref={i => (this.image = i)}
                clearError={this.clearError}
                showError={err => this.onError(err)}
                name="custom_thumbnail"
                aspectRatio={16 / 9}
                height={height}
                width={width}
                initialValue={this.props.image}
              />
              {error && <span style={{ color: Style.vars.colors.get('darkRed') }}>{t(error)}</span>}
              <div style={{ width: this.props.width + 35, marginTop: 10 }}>
                {t('leave_thumbnail_blank')}
              </div>
              <SubmitButton disabled={error} />
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}
