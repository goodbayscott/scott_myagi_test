import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';
import moment from 'moment-timezone';
import { momentToISO } from 'utilities/time';

import VideoPagesState from 'state/video-pages';

import Im from 'immutable';
import Style from 'style';

import { IMAGE_WIDTH, IMAGE_HEIGHT, DeleteButton } from '../common';
import { EditModal } from './edit-modal';

const styles = {
  containerOuter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    transition: 'all .2s ease',
    ':hover': {
      transform: 'scale(1.02)'
    }
  },
  image: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#eee',
    marginRight: 10,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT
  }
};

@Radium
export class VideoListItem extends React.Component {
  render() {
    const page = this.props.page;
    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <div style={{ ...styles.image, backgroundImage: `url(${page.get('thumbnail_url')})` }} />
          <div>
            <div>Video</div>
            <div>Required viewing: {this.props.page.get('require_video_view') ? 'Yes' : 'No'}</div>
          </div>
        </div>
        <EditModal ref="details" page={this.props.page} />
        <DeleteButton page={this.props.page} />
      </div>
    );
  }
}
