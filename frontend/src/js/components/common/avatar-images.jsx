import React from 'react';
import Im from 'immutable';
import Radium from 'radium';
import _ from 'lodash';
import { Link } from 'react-router';

import Style from 'style';

@Radium
export class AvatarImage extends React.Component {
  /*
    Given a `user` prop, renders a circular image
    for that user. Assumes that user has a `profile_photo`
    attr or an attached learner with a `profile_photo` attr.
    If `profile_photo` has not been set, will render initials
    of given user instead. Initials is determine using the
    `first_name` and `last_name` attrs of the user, OR by
    looking for an `initials` attr on the user.
  */

  static data = {
    user: {
      fields: ['first_name', 'last_name', 'learner.profile_photo']
    }
  };
  static propTypes = {
    user: React.PropTypes.instanceOf(Im.Map).isRequired,
    size: React.PropTypes.string,
    style: React.PropTypes.object,
    useDefaultImage: React.PropTypes.bool
  };

  constructor(props) {
    super(props);
    const size = props.size || '2.5em';

    this.state = {
      style: {
        circular: {
          backgroundColor: Style.vars.colors.get('darkGrey'),
          marginBottom: '.25em',
          color: 'white',
          fontSize: Style.vars.fontSizes.get('medium'),
          lineHeight: size,
          borderRadius: '50%',
          width: size,
          height: size,
          textAlign: 'center',
          display: 'block',
          ...props.style
        },
        overlay: {
          position: 'absolute',
          backgroundColor: 'black',
          borderRadius: '50%',
          opacity: 0.8,
          textAlign: 'center',
          color: 'white',
          marginTop: `-${size}`,
          cursor: 'pointer'
        },
        image: {
          width: size,
          height: size,
          border: '3px solid white'
        },
        noBorder: {
          border: 'none',
          borderRadius: '50%'
        },
        photoIcon: {
          fontSize: 20,
          marginLeft: 5
        },
        userIcon: {
          fontSize: 70,
          marginLeft: 5,
          marginTop: -3,
          color: 'rgba(255,255,255,0.6)'
        }
      },
      onHover: false
    };
  }

  getSrc() {
    let src = this.props.user.get('profile_photo');
    if (!src) {
      const learner = this.props.user.get('learner');
      if (learner) src = learner.get ? learner.get('profile_photo') : learner.profile_photo;
    }
    return src;
  }

  getInitials() {
    if (this.props.user.get('initials') !== undefined) return this.props.user.get('initials');
    const firstChar = this.props.user.get('first_name').charAt(0) || '';
    const lastChar = this.props.user.get('last_name').charAt(0) || '';
    return firstChar.toUpperCase() + lastChar.toUpperCase();
  }

  render() {
    const { style, onHover } = this.state;
    const { onClick, edit, large } = this.props;
    const src = this.getSrc();

    const hover = Radium.getState(this.state, 'hoverImage', ':hover') && edit;

    if (large) {
      return (
        <Link
          to={{ pathname: '/views/settings/', query: { tab: 'Profile' } }}
          style={{ pointerEvents: edit ? 'all' : 'none' }}
        >
          <div
            key="hoverImage"
            style={{
              ...style.circular,
              ...style.noBorder,
              lineHeight: 'inherit',
              ':hover': {}
            }}
          >
            {src ? (
              <img className="ui avatar image" src={src} style={style.image} />
            ) : (
              <div style={style.circular}>
                <i className="icon user" style={style.userIcon} />
              </div>
            )}
            <div
              style={{
                ...style.circular,
                ...style.overlay,
                visibility: hover ? 'visible' : 'hidden'
              }}
            >
              <i className="icon photo" style={style.photoIcon} />
            </div>
          </div>
        </Link>
      );
    } else if (src) {
      return (
        <img className="ui avatar image" src={src} style={style.circular} onClick={onClick}>
          {this.props.children}
        </img>
      );
    }

    return (
      <div className="ui avatar image" style={style.circular} onClick={onClick}>
        {this.getInitials()}
        {/* Margin is added because initials push children across. This does not happen when
          an image is used, so we just add it here. */}
        <div style={{ marginLeft: -38 }}>{this.props.children}</div>
      </div>
    );
  }
}

const avatarCollectionStyles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap'
  }
};

export class AvatarImageCollection extends React.Component {
  /*
    Renders a grid of avatar images. If `maxImages`
    prop is reached, then final image in grid will be
    a count of remaining, undisplayed images.
  */
  static propTypes = {
    users: React.PropTypes.instanceOf(Im.List).isRequired,
    containerStyle: React.PropTypes.object,
    maxImages: React.PropTypes.number
  };

  static defaultProps = {
    maxImages: 999
  };

  constructor(props) {
    super(props);
    this.state = {
      style: {
        container: _.extend(avatarCollectionStyles.container, this.props.containerStyle)
      }
    };
  }

  render() {
    const i = 0;
    let imagesToShow = null;
    const fullCount = this.props.users.count();
    let undisplayedCount = 0;
    let undisplayedCountAvatar = null;
    if (fullCount <= this.props.maxImages) {
      imagesToShow = this.props.users;
    } else {
      imagesToShow = this.props.users.slice(0, this.props.maxImages - 1);
      undisplayedCount = fullCount - this.props.maxImages + 1;
      const pseudoUser = Im.Map({
        initials: `+${undisplayedCount}`
      });
      undisplayedCountAvatar = <AvatarImage key="undisplayed" user={pseudoUser} />;
    }
    return (
      <div style={this.state.style.container}>
        {imagesToShow.map(user => <AvatarImage key={user.get('id')} user={user} />).toArray()}
        {undisplayedCountAvatar}
      </div>
    );
  }
}
