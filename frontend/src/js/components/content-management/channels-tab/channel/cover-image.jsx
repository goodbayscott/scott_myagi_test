import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';

import { t } from 'i18n';
import Style from 'style/index.js';
import Textarea from 'react-autosize-textarea';
import { RouterBackButton } from 'components/common/box';
import { Form, ImageCropper, SubmitButton } from 'components/common/form';
import { YOUR_CHANNELS, EXTERNAL_CHANNELS, TEAM_CHANNELS } from '../page-state';

import ChannelsState from 'state/channels';

import { Modal } from 'components/common/modal/index.jsx';

const MAX_LOGO_HEIGHT = 150;

const styles = {
  logoOuter: {
    cursor: 'pointer',
    height: MAX_LOGO_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.5)',
    transition: 'all 0.3s ease',
    borderRadius: 5,
    ':hover': {}
  },
  editableTextArea: {
    border: '1px solid rgba(0,0,0,0)',
    borderRadius: 10,
    color: 'white',
    outline: 'none',
    transition: 'all 0.3s ease',
    width: '100%',
    resize: 'none',
    backgroundColor: 'inherit',
    ':hover': {}
  },
  textAreaHover: {
    border: '1px solid #ddd'
  },
  nameAndDesc: {
    ':hover': {}
  },
  editPencil: {
    color: Style.vars.colors.get('white'),
    fontSize: '1rem',
    position: 'absolute',
    right: -15,
    top: -20
  },
  channelName: {
    fontSize: '2rem',
    fontWeight: 200,
    lineHeight: '30px',
    textAlign: 'center'
  },
  channelDisplayName: {
    fontSize: '1rem',
    width: 270,
    textAlign: 'left',
    verticalAlign: 'middle',
    overflow: 'visible',
    marginBottom: 2,
    marginLeft: 10
  },
  channelDescription: {
    fontSize: '1rem',
    width: '100%',
    textAlign: 'center',
    marginTop: 15
  },
  hoverableLogo: {
    borderRadius: 5,
    padding: 5,
    transition: 'all 0.3s ease',
    backgroundColor: 'black',
    height: MAX_LOGO_HEIGHT
  },
  editContainer: {
    height: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  editIcon: {
    zIndex: 11,
    color: 'white',
    transition: 'all 0.3s ease',
    opacity: 1,
    position: 'relative',
    fontSize: '2rem',
    lineHeight: '2rem',
    marginTop: MAX_LOGO_HEIGHT / 2 - 14
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 450,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: '50% 50%',
    backgroundColor: Style.vars.colors.get('navBackground'),
    display: 'flex',
    alignContent: 'center',
    alignItems: 'center'
  },
  channelDetailText: {
    display: 'inline',
    marginLeft: 10
  },
  coverInnerContainer: {
    width: '100%',
    maxWidth: Style.vars.widths.get('mainContentMaxWidth'),
    height: '100%',
    display: 'flex',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '80px 0 80px 0'
    // position: 'relative'
  },
  coverDetailsContainer: {
    display: 'inline-block',
    margin: '0 auto',
    justifySelf: 'center',
    alignSelf: 'center'
  },
  editCoverImageContainer: {
    height: 0,
    display: 'block',
    position: 'absolute',
    transition: 'all 0.3s ease',
    right: 20,
    top: 0,
    zIndex: 10,
    cursor: 'pointer',
    opacity: 0.5,
    ':hover': {
      opacity: 1
    }
  },
  edit: {
    zIndex: 11,
    color: 'white',
    opacity: 1,
    left: 3,
    position: 'relative',
    fontSize: '2rem',
    lineHeight: '2rem',
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    paddingLeft: 3,
    height: 33,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  borderedNameContainer: {
    borderRadius: 5,
    marginTop: 10,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    maxWidth: 500,
    [Style.vars.media.get('mobile')]: {
      maxWidth: '100%'
    }
  },
  nameContainer: {
    position: 'relative',
    textAlign: 'center',
    fontSize: 30,
    marginBottom: 10,
    lineHeight: '1em'
  },
  coverBackIconContainer: {
    position: 'absolute',
    color: 'white',
    cursor: 'pointer',
    fontSize: 14,
    top: 18,
    left: 18,
    borderRadius: 5,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },

  back: {
    color: Style.vars.colors.get('mediumGrey')
  },

  backHover: {
    color: 'white'
  }
};

@Radium
class ChannelLogo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // the padding is rendered before the image is loaded and looks trash
      // only show when image is loaded
      loaded: !this.props.channel.get('logo') || this.props.channel.get('company').company_logo
    };
  }
  render() {
    const logo = this.props.channel.get('logo') || this.props.channel.get('company').company_logo;
    const hover = Radium.getState(this.state, 'logoHover', ':hover');
    return (
      <div
        key="logoHover"
        style={{
          ...styles.logoOuter,
          visibility: this.state.loaded ? 'visible' : 'hidden',
          pointer: hover ? 'cursor' : 'inherit',
          pointerEvents: this.props.isExternalChannel ? 'none' : 'auto',
          width: logo ? 'inherit' : MAX_LOGO_HEIGHT
        }}
        onClick={this.props.onClick}
      >
        {(hover || !logo) && (
          <div style={styles.editContainer}>
            <div style={styles.editIcon}>
              <i className="photo icon" />
            </div>
          </div>
        )}
        {logo && (
          <img
            src={logo}
            style={{ ...styles.hoverableLogo, opacity: hover ? 0.6 : 1 }}
            onLoad={() => this.setState({ loaded: true })}
          />
        )}
      </div>
    );
  }
}

@Radium
export class ChannelPageCoverImage extends React.Component {
  static propTypes = {
    channel: React.PropTypes.object.isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  static data = {
    channel: {
      required: true,
      fields: [
        'name',
        'display_name',
        'description',
        'logo',
        'cover_image',
        'company.cover_image',
        'company.company_logo',
        'video',
        'avg_like_rating',
        'avg_learn_rating'
      ]
    }
  };

  updateFields = data => {
    _.forOwn(data, (value, key) => {
      data[key] = _.trim(value);
    });
    if (!data.name) data.name = this.props.channel.get('name');
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), data).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'changes_saved'
      });
    });
  };

  keyPress = (e, data) => {
    // If user presses enter, save changes
    if (e.charCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      this.updateFields(data);
    }
  };

  focusChannelNameInput = () => {
    this.channelNameInput.focus();
  };

  onCoverImageCropSubmit = () => {
    const thumbnail = this.coverImage.getValue();
    const data = {
      cover_image: thumbnail
    };
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), data).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'Upload complete'
      });
    });
    this.context.displayTempPositiveMessage({
      heading: 'Image uploading...'
    });
    this.refs.cropCoverImageModal.hide();
  };

  onLogoImageCropSubmit = () => {
    const thumbnail = this.logoImage.getValue();
    const data = {
      logo: thumbnail
    };
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), data).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'Upload complete'
      });
    });
    this.context.displayTempPositiveMessage({
      heading: 'Image uploading...'
    });
    this.refs.cropLogoImageModal.hide();
  };

  render() {
    const { cover_image, company } = this.props.channel.toJS();
    const coverImage = cover_image || company.cover_image;
    const imageURL = `url('${coverImage}')`;

    const displayName = this.props.channel.get('display_name') || this.props.channel.get('name');
    const noDataStyle = { fontStyle: 'italic', opacity: 0.5 };
    const normalFont = { opacity: 1, fontStyle: 'normal' };
    // Have to do this because the styles object properties are set to noDataStyle
    // when the relevant prop changes.
    const displayNameStyle = this.props.channel.get('display_name')
      ? Object.assign(styles.channelDisplayName, normalFont)
      : Object.assign(styles.channelDisplayName, noDataStyle);

    const textAreaHover = Radium.getState(this.state, 'nameAndDesc', ':hover');

    return (
      <div>
        <div
          style={Style.funcs.merge(styles.coverContainer, {
            backgroundImage: imageURL
          })}
        >
          {!this.props.isExternalChannel && (
            <div
              ref="editCoverImage"
              style={styles.editCoverImageContainer}
              onClick={() => this.refs.cropCoverImageModal.show()}
            >
              <div style={styles.edit}>
                <i className="photo icon" />
              </div>
            </div>
          )}

          <div style={styles.coverInnerContainer}>
            <div style={styles.coverBackIconContainer} onClick={this.createSession}>
              <RouterBackButton
                text="Channels"
                style={styles.back}
                hoverStyle={styles.backHover}
                route="content-channels"
                query={{
                  filter: this.props.isExternalChannel
                    ? EXTERNAL_CHANNELS
                    : this.props.channel.get('learner_group') ? TEAM_CHANNELS : YOUR_CHANNELS
                }}
              />
            </div>
            <div style={styles.coverDetailsContainer}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChannelLogo
                  channel={this.props.channel}
                  onClick={() => this.refs.cropLogoImageModal.show()}
                  isExternalChannel={this.props.isExternalChannel}
                />
              </div>

              <div style={styles.borderedNameContainer}>
                <div
                  style={{
                    ...styles.nameAndDesc,
                    pointerEvents: this.props.isExternalChannel ? 'none' : 'auto'
                  }}
                  key="nameAndDesc"
                >
                  <div style={styles.nameContainer}>
                    <Textarea
                      style={{
                        ...styles.editableTextArea,
                        ...styles.channelName,
                        ...(textAreaHover ? styles.textAreaHover : {})
                      }}
                      placeholder={this.props.channel.get('name')}
                      type="text"
                      key="channelName"
                      innerRef={n => (this.channelNameInput = n)}
                      defaultValue={this.props.channel.get('name')}
                      onBlur={e => {
                        this.updateFields({ name: e.target.value });
                      }}
                      onKeyPress={e => {
                        this.keyPress(e, { name: e.target.value });
                      }}
                      rows={1}
                    />
                    {!this.props.isExternalChannel && (
                      <i
                        style={styles.editPencil}
                        onClick={this.focusChannelNameInput}
                        className="icon pencil"
                      />
                    )}
                  </div>
                  <div style={styles.channelDetailText}>
                    <b>{`${t('displayed_as')}: `}</b>
                    <Textarea
                      style={{
                        ...styles.editableTextArea,
                        ...displayNameStyle,
                        ...(textAreaHover ? styles.textAreaHover : {})
                      }}
                      placeholder={displayName}
                      type="text"
                      key="channelDisplayName"
                      innerRef={d => (this.channelDisplayNameInput = d)}
                      defaultValue={displayName}
                      onBlur={e => {
                        this.updateFields({ display_name: e.target.value });
                      }}
                      onKeyPress={e => {
                        this.keyPress(e, { display_name: e.target.value });
                      }}
                      rows={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal
          ref="cropCoverImageModal"
          size="large"
          header={`${t('cover_image')} (${t('optional')})`}
        >
          <div className="content" style={{ display: 'flex', justifyContent: 'center' }}>
            <Form ref="coverImageCropForm" onSubmitAndValid={this.onCoverImageCropSubmit}>
              <ImageCropper
                ref={i => (this.coverImage = i)}
                name="cover_image"
                aspectRatio={1200 / 300}
                height={180}
                width={1200 / 300 * 180}
                initialValue={this.props.channel.get('cover_image')}
              />
              <SubmitButton />
            </Form>
          </div>
        </Modal>
        <Modal ref="cropLogoImageModal" header={`${t('logo')} (${t('optional')})`}>
          <div className="content" style={{ display: 'flex', justifyContent: 'center' }}>
            <Form ref="coverImageCropForm" onSubmitAndValid={this.onLogoImageCropSubmit}>
              <ImageCropper
                ref={i => (this.logoImage = i)}
                name="cover_image"
                height={200}
                width={200}
                initialValue={this.props.channel.get('logo')}
              />
              <SubmitButton />
            </Form>
          </div>
        </Modal>
      </div>
    );
  }
}
