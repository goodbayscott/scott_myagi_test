import Marty from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import moment from 'moment-timezone';
import reactMixin from 'react-mixin';

import YouTube from 'react-youtube';
import { Froogaloop as $f } from 'vendor/vimeo/froogaloop';

import Color from 'color';

import Style from 'style';

import wistiaUtils from 'utilities/wistia';

const VIMEO_URL_REGEX = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
const VIMEO_ID_GROUP = 3;
const YOUTUBE_URL_REGEX = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
const YOUTUBE_ID_GROUP = 7;
const WISTIA_URL_REGEX = /https?:\/\/(.+)?(wistia\.com|wi\.st)\/(medias|embed)\/(.*)/;
const WISTIA_ID_GROUP = 4;

const VIDEO_HEIGHT = 500;
const VIDEO_WIDTH = '100%';
const WATCH_TIME_LEWAY = 5;

const VideoContainerMixin = {
  getInitialState() {
    return {
      startTime: null,
      endTime: null,
      duration: null
    };
  },

  defaultProps: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT
  },

  startTimer() {
    // If user pauses, don't want to reset timer
    // when they hit play again.
    if (this.state.startTime) return;
    this.state.startTime = moment();
  },

  stopTimer() {
    this.state.endTime = moment();
  },

  commonOnPlay() {
    this.startTimer();
  },

  commonOnEnd() {
    this.stopTimer();
    if (this.props.onEnd) this.props.onEnd();
  },

  videoWasSkipped() {
    if (!this.state.duration) return false;
    if (!this.state.endTime || !this.state.startTime) return true;
    const watchedTime = this.state.endTime.diff(this.state.startTime, 'seconds');
    return watchedTime < this.state.duration - WATCH_TIME_LEWAY;
  }
};

@reactMixin.decorate(VideoContainerMixin)
export class YouTubeContainer extends React.Component {
  static propTypes = {
    url: React.PropTypes.string.isRequired,
    showInfo: React.PropTypes.bool,
    allowControl: React.PropTypes.bool
  };

  constructor() {
    super();
    this.state = {
      player: null
    };
  }

  onReady = evt => {
    this.setState({
      player: evt.target,
      // In some as yet unreproducible situations, target does not have
      // a getDuration value. In that case, just set to 0 so other parts
      // of the page still work.
      duration: evt.target.getDuration ? evt.target.getDuration() : 0
    });
  };

  onPlay = () => {
    this.commonOnPlay();
    if (this.props.onPlay) {
      this.props.onPlay();
    }
  };

  onEnd = () => {
    this.commonOnEnd();
  };

  getPlayer() {
    if (!this.state.player) console.warn('`getPlayer` called before player initialized.');
    return this.state.player;
  }

  stopVideo() {
    const player = this.getPlayer();
    if (!player) return;
    this.getPlayer().stopVideo();
  }

  getVideoID() {
    const match = this.props.url.match(YOUTUBE_URL_REGEX);
    // Will return empty string if video id does not exist.
    return match && match[YOUTUBE_ID_GROUP].length == 11 ? match[YOUTUBE_ID_GROUP] : '';
  }

  render() {
    // See https://www.npmjs.com/package/react-youtube
    // for other props
    return (
      <YouTube
        videoId={this.getVideoID()}
        onReady={this.onReady}
        onEnd={this.onEnd}
        onPlay={this.onPlay}
        opts={{
          width: this.props.width,
          height: this.props.height,
          playerVars: {
            autoplay: 0,
            rel: 0,
            showinfo: this.props.showInfo ? 1 : 0,
            controls: this.props.allowControl ? 1 : 0
          }
        }}
      />
    );
  }
}

@reactMixin.decorate(VideoContainerMixin)
export class VimeoContainer extends React.Component {
  static propTypes = {
    url: React.PropTypes.string.isRequired
  };

  constructor() {
    super();
    this.state = {
      player: null
    };
  }

  static defaultProps = {
    onEnd: _.noop
  };

  componentDidMount() {
    this.setupPlayer();
  }

  componentDidUpdate() {
    this.setupPlayer();
  }

  setupPlayer() {
    this.state.player = $f(ReactDOM.findDOMNode(this));
    this.state.player.addEvent('ready', this.onReady);
  }

  onReady = () => {
    this.state.player.addEvent('finish', this.onFinish);
    this.state.player.api('getDuration', dur => (this.state.duration = dur));
    this.state.player.addEvent('play', this.onPlay);
  };

  onPlay = () => {
    this.commonOnPlay();
  };

  onFinish = () => {
    this.commonOnEnd();
  };

  getPlayer() {
    return this.state.player;
  }

  stopVideo() {
    this.getPlayer().api('pause');
  }

  getVideoID() {
    // Assuming that URL is valid, regex group 3 should be video ID.
    return this.props.url.match(VIMEO_URL_REGEX)[VIMEO_ID_GROUP];
  }

  render() {
    return (
      <iframe
        id="player1"
        src={`https://player.vimeo.com/video/${this.getVideoID()}?api=1&player_id=player1`}
        width={this.props.width}
        height={this.props.height}
        frameBorder="0"
        frameBorder="0"
        webkitallowfullscreen
        mozallowfullscreen
        allowFullScreen
        allowFullScreen
      />
    );
  }
}

@reactMixin.decorate(VideoContainerMixin)
export class WistiaContainer extends React.Component {
  static propTypes = {
    url: React.PropTypes.string.isRequired
  };

  static defaultProps = {
    onEnd: _.noop
  };

  constructor() {
    super();
    this.state = {
      duration: null
    };
  }

  componentDidMount() {
    this.setupPlayer();
  }

  componentDidUpdate() {
    this.setupPlayer();
  }

  setupPlayer() {
    // Because Wistia JS manipulates the DOM, we need to render the container in a separate
    // tree or React will complain.
    ReactDOM.render(this.renderContainer(), ReactDOM.findDOMNode(this.refs.el));
    wistiaUtils.onPlayerReady({
      [this.getVideoID()]: p => {
        this.player = p;
        this.player.bind('play', this.onPlay);
        this.player.bind('end', this.onFinish);
        this.player.hasData(() => {
          this.state.duration = this.player.duration();
        });
      }
    });
  }

  onPlay = () => {
    this.commonOnPlay();
  };

  onFinish = () => {
    this.commonOnEnd();
  };

  getPlayer() {
    return this.player;
  }

  stopVideo() {
    if (!this.player) return;
    this.player.pause();
  }

  getVideoID() {
    return this.props.url.match(WISTIA_URL_REGEX)[WISTIA_ID_GROUP];
  }

  renderContainer() {
    // Note: Do not set video foam property to true, or else the container will
    // stretch to a very large height
    const col = Color(Style.vars.colors.get('primary').toString());
    return (
      <div
        className={`wistia_embed wistia_async_${this.getVideoID()} videoFoam=false autoPlay=${!!this
          .props.autoPlay} playerColor=${col.hex().toString()}`}
        style={{ width: this.props.width, height: this.props.height }}
      />
    );
  }

  render() {
    return <span ref="el" />;
  }
}

export const URL_TO_VIDEO_CONTAINER = {
  'youtube.com': YouTubeContainer,
  'youtu.be': YouTubeContainer,
  'vimeo.com': VimeoContainer,
  'wistia.com': WistiaContainer
};

export function getVideoContainer(u, props = {}) {
  let videoContainer;
  _.forEach(URL_TO_VIDEO_CONTAINER, (component, key) => {
    if (_.includes(u, key)) {
      videoContainer = component;
    }
  });
  if (!videoContainer) throw new Error(`Could not find video container for video URL ${u}`);
  props.url = u;
  return React.createFactory(videoContainer)(props);
}
