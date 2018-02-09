import React from 'react';
import _ from 'lodash';

import { BLANK_IMAGE } from 'core/constants';

const imageStyle = {
  height: '12em',
  width: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'contain',
  backgroundColor: 'white'
};

export const Image = React.createClass({
  /*
    Can be used to render images as background images to a
    div. This allows for more control over how image responds
    to changes in container size.
  */
  propTypes: {
    src: React.PropTypes.string,
    style: React.PropTypes.object
  },
  render() {
    const style = _.extend({}, imageStyle, this.props.style);
    style.backgroundImage = `url(${this.props.src || BLANK_IMAGE})`;
    return <div style={style} />;
  }
});
