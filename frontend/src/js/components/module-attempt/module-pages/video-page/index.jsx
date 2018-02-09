import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import cx from 'classnames';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';
import { t } from 'i18n';

import VideoPagesState from 'state/video-pages';
import ModuleAttemptPageState from '../../state';

import containerUtils from 'utilities/containers';

import { LoadingContainer } from 'components/common/loading';
import { getVideoContainer } from './video-containers';
import { Info } from 'components/common/info';
import { NextPageButton } from '../common';

const VIDEO_WIDTH = '100%';
const VIDEO_HEIGHT = 480;
const VIDEO_SKIP_MESSAGE =
  'You must watch the entire video from start to finish (without skipping ahead) before you can move forward. Please do not watch the video outside of this page or you will have to rewatch it here.';

const vpStyle = {
  tooltip: {
    wrapper: { display: 'inherit' }
  }
};

@Radium
export class PageContent extends React.Component {
  static propTypes = {
    page: VideoPagesState.Types.one.isRequired,
    module: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor() {
    super();
    this.state = {
      videoWatched: false
    };
  }

  getVideoContainer() {
    return getVideoContainer(this.props.page.get('video_url'), {
      ref: 'videoContainer',
      onEnd: this.onVideoEnd,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      allowControl: !this.requireView()
    });
  }

  getVideoWatched() {
    return this.state.videoWatched;
  }

  onVideoEnd = () => {
    if (this.requireView()) {
      // Have experienced errors where either `videoContainer` or `refs` is not defined.
      // Have not been able to replicate, however, issue can be seen here
      // https://www.fullstory.com/ui/1deW/session/5736495272951808:5736495272951808!5629499534213120.
      // For now, do not want to prevent user moving forward, so setting `videoWatched` to true
      // if cannot find `videoContainer`.
      if (this.refs && this.refs.videoContainer) {
        if (!this.refs.videoContainer.videoWasSkipped()) {
          this.setState({ videoWatched: true });
        }
      } else {
        this.setState({ videoWatched: true });
      }
    }
  };

  goToNextPage = () => {
    if (this.refs.videoContainer) this.refs.videoContainer.stopVideo();
    this.props.goToNextPage();
  };

  requireView = () => {
    if (this.props.module.get('completed_by_current_user')) {
      return false;
    }
    const learner = this.props.currentUser.get('learner');
    if (learner.is_myagi_staff) {
      return false;
    }
    return this.props.page.get('require_video_view') || learner.must_watch_videos_in_full;
  };

  render() {
    const requireView = this.requireView();
    const disableBtn = requireView && !this.state.videoWatched;
    const nextBtn = (
      <NextPageButton
        module={this.props.module}
        page={this.props.page}
        goToNextPage={this.goToNextPage}
        disabled={disableBtn}
      />
    );
    let videoSkipMsg;
    if (requireView) {
      videoSkipMsg = <div className="ui message">{t(VIDEO_SKIP_MESSAGE)}</div>;
    }
    let nextBtnContainer = nextBtn;
    if (disableBtn) {
      nextBtnContainer = (
        <Info content={t(VIDEO_SKIP_MESSAGE)} tooltipStyle={vpStyle.tooltip}>
          <div style={{ overflow: 'auto' }}>{nextBtn}</div>
        </Info>
      );
    }

    const { module } = this.props;
    return (
      <div className="ui segment" style={Style.common.attemptPageContent}>
        {this.getVideoContainer()}
        {videoSkipMsg}
        {nextBtnContainer}
      </div>
    );
  }
}

export class VideoPage extends React.Component {
  static propTypes = {
    page: VideoPagesState.Types.one,
    goToNextPage: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <LoadingContainer
        loadingProps={{ page: this.props.page }}
        createComponent={() => <PageContent {...this.props} />}
      />
    );
  }
}

export const Page = Marty.createContainer(VideoPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    goToNextPage: React.PropTypes.func.isRequired
  },

  listenTo: [VideoPagesState.Store],

  fetch: {
    page() {
      return VideoPagesState.Store.getItem(this.props.pageId, {
        fields: ['*']
      });
    }
  },

  componentDidMount() {
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  },

  pending() {
    return containerUtils.defaultPending(this, VideoPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, VideoPage, errors);
  }
});
