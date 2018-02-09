import React from 'react';
import Cropper from 'react-cropper';
import Radium from 'radium';
import 'cropperjs/dist/cropper.css';

import { t } from 'i18n';
import { validateImage } from 'utilities/validators';
import { MAX_FILE_SIZE } from 'core/constants';
import { humanFileSize } from 'utilities/generic';

const DEFAULT_PLAN_IMAGE = '/static/img/empty_placeholder.png';

const styles = {
  input: {
    display: 'none'
  },
  noImageContainer: {
    backgroundColor: '#f4f4f4',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectImageContainer: {
    color: '#666',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      color: 'black',
      cursor: 'pointer'
    }
  },
  selectImageIcon: {
    fontSize: '3rem',
    lineHeight: '54px',
    margin: 0,
    height: 'auto'
  },
  resetButton: {
    color: '#666',
    marginLeft: 5,
    marginTop: 5,
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0)'
  },
  cropContainer: {
    display: 'flex',
    alignItems: 'flex-start'
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionButton: {
    color: 'grey',
    position: 'relative',
    right: 0,
    zIndex: 2,
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0)'
  },
  loadingContainer: {
    backgroundColor: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999'
  }
};

@Radium
export class ImageCropper extends React.Component {
  static contextTypes = {
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      value: null,
      cancelled: false,
      inputRef: `input${Math.random()}` // for when there are multiple ImageCroppers in the sa
    };
  }

  readImage(file) {
    const reader = new FileReader();
    reader.onload = readFile => {
      if (reader.readyState == FileReader.DONE) {
        this.setState({
          ...this.state,
          value: readFile.target.result,
          cancelled: false
        });
      }
    };
    this.props.onChange && this.props.onChange(this.getValue());
    reader.readAsDataURL(file);
    if (this.props.showError) {
      this.props.showError(false);
    }
  }

  onInputChange = e => {
    const file = e.target.files[0];
    if (!validateImage(file)) {
      this.context.displayTempNegativeMessage({
        heading: t('error_png_jpg')
      });
      if (this.props.showError) {
        this.props.showError('error_png_jpg');
      }
      return;
    } else if (file.size > MAX_FILE_SIZE) {
      this.context.displayTempNegativeMessage({
        heading: t('error_file_too_large')
      });
      if (this.props.showError) {
        this.props.showError('error_file_too_large');
      }
      return;
    }
    this.readImage(file);
  };

  cancelImage = () => {
    this.setState({ ...this.state, cancelled: true, value: null });
    this.props.onChange && this.props.onChange();
    this.props.onImageRemove && this.props.onImageRemove();
  };

  enableCrop = () => {
    this.setState({ value: this.props.initialValue });
    this.props.onChange && this.props.onChange();
  };

  getValue() {
    if (this.state.cancelled) return null;
    return this.cropper && this.cropper.getCroppedCanvas().toDataURL();
  }

  getNameAndValue() {
    // only used for <Form> components
    return { [this.props.name]: this.getValue() };
  }

  isValid() {
    // only used for <Form> components
    return this.props.required ? this.hasValue() : true;
  }

  hasValue() {
    const initialValue = this.props.initialValue && this.props.initialValue != DEFAULT_PLAN_IMAGE;
    return !(this.state.cancelled || !(this.state.value || initialValue));
  }

  onCrop = () => {
    if (this.props.onCrop) {
      this.props.onCrop(this.getValue());
    }
  };

  render() {
    return (
      <div style={this.props.containerStyle}>
        {this.hasValue() ? (
          <div style={[styles.cropContainer, this.props.cropContainerStyle]}>
            {this.state.value ? (
              <div>
                <div style={{ height: 0 }}>
                  <div
                    style={{
                      width: this.props.width,
                      height: this.props.height,
                      ...styles.loadingContainer
                    }}
                  >
                    loading...
                  </div>
                </div>
                <Cropper
                  style={{ width: this.props.width, height: this.props.height }}
                  autoCropArea={1}
                  zoomable={false}
                  viewMode={1}
                  ref={c => (this.cropper = c)}
                  src={this.state.value || this.props.initialValue}
                  aspectRatio={this.props.aspectRatio}
                  guides={false}
                  center={false}
                  crop={this.onCrop}
                />
              </div>
            ) : (
              <img
                src={this.props.initialValue}
                style={{
                  maxWidth: this.props.width,
                  maxHeight: this.props.height,
                  backgroundColor: '#eee'
                }}
              />
            )}
            <div style={styles.buttonRow}>
              <button type="button" style={styles.actionButton} onClick={this.cancelImage}>
                <i className="ui icon remove" />
              </button>
              {!this.state.cancelled &&
                this.props.initialValue &&
                !this.state.value && (
                  <button type="button" style={styles.actionButton} onClick={this.enableCrop}>
                    <i className="ui icon crop" />
                  </button>
                )}
            </div>
          </div>
        ) : (
          <div
            style={{
              width: this.props.width,
              height: this.props.height,
              ...styles.noImageContainer
            }}
          >
            <label htmlFor={this.state.inputRef} style={styles.selectImageContainer}>
              <i style={styles.selectImageIcon} className="ui icon file image outline" />
              <div style={styles.selectImageText}>Select image</div>
            </label>
            <input
              style={styles.input}
              type="file"
              id={this.state.inputRef}
              onChange={this.onInputChange}
            />

            {this.props.initialValue && (
              <button
                type="button"
                style={styles.resetButton}
                onClick={() => this.setState({ ...this.state, cancelled: false, value: null })}
              >
                <i className="ui icon repeat" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
}
