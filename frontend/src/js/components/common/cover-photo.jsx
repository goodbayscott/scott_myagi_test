import React from 'react';
import Im from 'immutable';
import Radium from 'radium';
import { Link } from 'react-router';

import Style from 'style';
import { t } from 'i18n';
import { Panel } from 'components/common/box';
import { AvatarImage } from 'components/common/avatar-images';
import { DEFAULT_COVER_IMAGE } from 'core/constants';

const CHANGE_COMPANY_IMG_PATH = {
  pathname: '/views/settings/',
  query: { tab: 'Company' }
};

const MAX_LOGO_HEIGHT = 70;
const COVER_PHOTO_HEIGHT = 400;
const AVATAR_IMAGE_SIZE = '100px';

const logoStyles = {
  logoOuter: {
    height: MAX_LOGO_HEIGHT,
    backgroundColor: 'black',
    borderRadius: 5,
    ':hover': {},
    [Style.vars.media.get('mobile')]: {
      display: 'none'
    }
  },
  logo: {
    borderRadius: 5,
    padding: 6,
    backgroundColor: 'white',
    height: MAX_LOGO_HEIGHT
  },
  editContainer: {
    height: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  edit: {
    zIndex: 11,
    color: 'white',
    opacity: 1,
    left: 3,
    position: 'relative',
    fontSize: '2rem',
    lineHeight: '2rem',
    marginTop: 20
  }
};

@Radium
class CompanyLogo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // the padding is rendered before the image is loaded and looks trash
      // only show when image is loaded
      loaded: false
    };
  }
  render() {
    const logo = this.props.learner.company ? this.props.learner.company.company_logo : null;
    const hover =
      Radium.getState(this.state, 'logoHover', ':hover') &&
      this.props.learner.is_company_admin &&
      this.props.edit;
    return (
      <div
        key="logoHover"
        style={{
          ...logoStyles.logoOuter,
          visibility: this.state.loaded ? 'visible' : 'hidden',
          pointer: hover ? 'cursor' : 'inherit'
        }}
      >
        {hover && (
          <Link to={CHANGE_COMPANY_IMG_PATH}>
            <div style={logoStyles.editContainer}>
              <div style={logoStyles.edit}>
                <i className="photo icon" />
              </div>
            </div>
          </Link>
        )}
        <img
          src={logo}
          style={{ ...logoStyles.logo, opacity: hover ? 0.6 : 1 }}
          onLoad={() => this.setState({ loaded: true })}
        />
      </div>
    );
  }
}

const styles = {
  userInfoBox: {
    background: '#ffffff'
  },
  panelStyle: {
    backgroundColor: 'rgba(0,0,0,0)',
    padding: '15px 30px 15px 20px',
    zIndex: 10,
    [Style.vars.media.get('mobile')]: {
      padding: '10px 5px'
    }
  },
  detailsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    [Style.vars.media.get('mobile')]: {
      justifyContent: 'space-around'
    }
  },
  avatarContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  avatarImage: {
    border: '3px solid white',
    height: AVATAR_IMAGE_SIZE,
    width: AVATAR_IMAGE_SIZE,
    marginBottom: 0
  },
  coverPhotoGradientContainer: {
    height: 0,
    width: '100%',
    [Style.vars.media.get('mobile')]: {
      display: 'none'
    }
  },
  coverPhotoGradient: {
    position: 'relative',
    height: COVER_PHOTO_HEIGHT,
    width: '100%',
    backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.4), rgba(0,0,0,0.0))'
  },
  editContainer: {
    height: 0,
    float: 'right'
  },
  edit: {
    zIndex: 5,
    color: 'white',
    float: 'right',
    fontSize: '2rem',
    position: 'relative',
    cursor: 'pointer',
    right: 10,
    top: 15,
    opacity: 0.5,
    ':hover': {
      opacity: 1
    }
  },
  coverImage: {
    height: COVER_PHOTO_HEIGHT,
    width: '100%',
    display: 'flex',
    backgroundColor: '#ccc',
    alignItems: 'flex-end',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    [Style.vars.media.get('mobile')]: {
      backgroundImage: 'none',
      height: 'auto',
      backgroundColor: 'white'
    }
  },
  nameContainer: {
    zIndex: 10,
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: AVATAR_IMAGE_SIZE,
    padding: '0 15px',
    position: 'relative',
    color: 'white',
    [Style.vars.media.get('mobile')]: {
      color: Style.vars.colors.get('textBlack')
    }
  },
  nameText: {
    fontSize: '2.1em',
    lineHeight: '28px',
    padding: '5px 0'
  },
  teamText: {
    fontSize: '1.5em',
    [Style.vars.media.get('mobile')]: {
      color: Style.vars.colors.get('xDarkGrey')
    }
  }
};

@Radium
export default class CoverPhoto extends React.Component {
  static data = {
    user: {
      fields: [
        'first_name',
        'last_name',
        'learner.profile_photo',
        'learner.company.cover_image',
        'learner.is_company_admin',
        'learner.learnergroup_name',
        'learner.company.company_name',
        'learner.company.company_logo'
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  render() {
    const learner = this.props.user.get('learner');

    const companyCover = learner.company ? learner.company.cover_image : null;
    const coverPhotoUrl = companyCover || DEFAULT_COVER_IMAGE;

    const teamName = learner.learnergroup_name ? learner.learnergroup_name : t('no_team');

    return (
      <div style={styles.userInfoBox}>
        <div style={styles.coverPhotoGradientContainer}>
          {learner.is_company_admin &&
            this.props.edit && (
              <Link to={CHANGE_COMPANY_IMG_PATH}>
                <div style={styles.editContainer}>
                  <div style={styles.edit}>
                    <i className="photo icon" />
                  </div>
                </div>
              </Link>
            )}
          <div style={styles.coverPhotoGradient} />
        </div>

        <div
          style={{
            backgroundImage: `url(${coverPhotoUrl})`,
            ...styles.coverImage
          }}
        >
          <Panel innerStyle={styles.panelStyle}>
            <div style={styles.detailsRow}>
              <div style={styles.avatarContainer}>
                <AvatarImage
                  user={this.props.user}
                  style={styles.avatarImage}
                  size={AVATAR_IMAGE_SIZE}
                  large
                  edit={this.props.edit}
                />
                <div style={styles.nameContainer}>
                  <div style={styles.nameText}>
                    {this.props.user.get('first_name')} {this.props.user.get('last_name')}
                  </div>
                  <div style={styles.teamText}>
                    {teamName} - {learner.company && learner.company.company_name}
                  </div>
                </div>
              </div>

              <CompanyLogo learner={learner} edit={this.props.edit} />
            </div>
          </Panel>
        </div>
      </div>
    );
  }
}
