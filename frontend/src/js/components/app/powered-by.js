import React from 'react';
import Radium from 'radium';

import Style from 'style';

import MYAGI_LOGO from 'img/logo-white.svg';

const styles = {
  container: {
    zIndex: '3',
    position: 'fixed',
    bottom: 0,
    left: 0,
    borderTopRightRadius: 22,
    padding: '10px 18px 10px 7px',
    backgroundColor: Style.vars.colors.get('navBackground'),
    opacity: 0.8,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    [Style.vars.media.get('mobile')]: {
      display: 'none'
    }
  },
  img: {
    height: 22,
    marginLeft: 4
  }
};

@Radium
export default class AvatarImage extends React.Component {
  render() {
    return (
      <div>
        <a style={styles.container} href="https://myagi.com" target="_blank">
          Powered by <img src={MYAGI_LOGO} style={styles.img} />
        </a>
      </div>
    );
  }
}
