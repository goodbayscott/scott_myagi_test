import React from 'react';
import Im from 'immutable';
import Radium from 'radium';
import { Link } from 'react-router';

import Style from 'style';
import { t } from 'i18n';
import { Panel } from 'components/common/box';
import { AvatarImage } from 'components/common/avatar-images';
import { DEFAULT_COVER_IMAGE } from 'core/constants';
import placeholder from 'img/placeholder.svg';

const CHANGE_COMPANY_IMG_PATH = {
  pathname: '/views/settings/',
  query: { tab: 'Company' }
};

const MAX_LOGO_HEIGHT = 100;
const COVER_PHOTO_HEIGHT = 400;
const AVATAR_IMAGE_SIZE = '100px';

const logoStyles = {
  logoOuter: {
    height: MAX_LOGO_HEIGHT,
    backgroundColor: 'transparent',
    marginTop: -80,
    borderRadius: 5,
    cursor: 'pointer',
    zIndex: 99,
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
    marginTop: 30
  }
};

@Radium
class CompanyLogo extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  constructor(props) {
    super(props);
    this.state = {
      // the padding is rendered before the image is loaded and looks trash
      // only show when image is loaded
      loaded: false
    };
  }
  goToEdit = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    this.context.router.push(CHANGE_COMPANY_IMG_PATH);
  };
  render() {
    const co = this.props.learner.company;
    const logo = co && co.company_logo ? co.company_logo : placeholder;
    const hover =
      Radium.getState(this.state, 'logoHover', ':hover') &&
      this.props.learner.is_company_admin &&
      this.props.edit;
    return (
      <div
        key="logoHover"
        style={{
          ...logoStyles.logoOuter,
          visibility: this.state.loaded ? 'visible' : 'hidden'
        }}
        onClick={this.goToEdit}
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
    alignItems: 'center',
    justifyContent: 'center',
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
      color: 'black'
    }
  },
  nameText: {
    fontSize: '2.1em',
    lineHeight: '28px',
    padding: '5px 0'
  },
  teamText: {
    fontSize: '1.5em'
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
        'learner.company.company_logo',
        'learner.company.companysettings.large_cover_photo'
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  render() {
    const learner = this.props.user.get('learner');

    // NOTE: We are deprecating large_cover_photo, so it shouldn't really be used any more
    const companyCover = learner.company
      ? learner.company.companysettings.large_cover_photo || learner.company.cover_image
      : null;
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
          <CompanyLogo learner={learner} edit={this.props.edit} />
        </div>
      </div>
    );
  }
}
