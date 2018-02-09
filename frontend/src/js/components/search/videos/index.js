import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import { resolve } from 'react-router-named-routes';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import Style from 'style';
import querystring from 'querystring';

import { ANALYTICS_EVENTS } from 'core/constants';

import createPaginatedStateContainer from 'state/pagination';
import VideosState from 'state/videos';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { InfiniteScroll } from 'components/common/infinite-scroll';
import { LoadingContainer } from 'components/common/loading';
import { Modal } from 'components/common/modal';
import { getVideoContainer } from 'components/module-attempt/module-pages/video-page/video-containers';
import FeatureRequestButton from 'components/common/feature-request-button';

const SUPPORT_PUBLISHERS = ['YouTube', 'Vimeo'];

const styles = {
  resultsContainer: {
    marginTop: 10
  },
  resultContainer: {
    width: 495
  }
};

class VideoResultsInner extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  isFromSupportedPublished(video) {
    // Disabled this because we are now just
    // pulling YT videos
    return true;
    let publisher;
    if (video.publisher && video.publisher[0]) {
      publisher = video.publisher[0].name;
    }
    if (_.includes(SUPPORT_PUBLISHERS, publisher)) return true;
    return false;
  }

  goToCreateMod = video => {
    if (!this.isFromSupportedPublished(video)) {
      analytics.track(ANALYTICS_EVENTS.UNSUPPORTED_PUBLISHER, {
        'Video name': video.name,
        'Video URL': video.contentUrl
      });
      this.refs.unsupportedPublisherMessage.show();
      return;
    }
    analytics.track(ANALYTICS_EVENTS.CREATED_MODULE_FROM_VIDEO_RESULT, {
      'Video name': video.name,
      'Video URL': video.contentUrl
    });
    let createModLink = resolve('create-module-no-plan');
    createModLink = `${createModLink}?${querystring.stringify({
      name: video.name,
      videoURL: video.contentUrl
    })}`;
    this.context.router.push(createModLink);
    if (this.props.onModCreate) {
      this.props.onModCreate();
    }
  };

  onVideoPlay = video => {
    analytics.track(ANALYTICS_EVENTS.VIEWED_VIDEO_RESULT, {
      'Video name': video.name,
      'Video URL': video.contentUrl,
      'Videos Count': this.props.videos.count()
    });
  };

  renderYTResult = video => {
    const canCreateContent = this.props.currentUser.get('learner').can_manage_training_content;

    return (
      <div className="card" style={styles.resultContainer} key={video.id}>
        <div className="content">
          {getVideoContainer(video.contentUrl, {
            height: 400,
            width: '100%',
            showInfo: true,
            allowControl: true,
            onPlay: () => this.onVideoPlay(video)
          })}
          <p
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              marginTop: 10,
              fontSize: 16
            }}
          >
            {video.name}
          </p>
          <p style={{ textAlign: 'center' }}>{video.snippet.channelTitle}</p>
        </div>

        {canCreateContent && (
          <a className="ui bottom attached button" onClick={() => this.goToCreateMod(video)}>
            <i className="add icon" />
            Create Lesson
          </a>
        )}
      </div>
    );
  };

  renderBingResult = video => {
    let embedHtml = video.embedHtml;
    if (!embedHtml) return null;
    embedHtml = embedHtml.replace('autoplay=1', 'autoplay=0');
    embedHtml = embedHtml.replace(/height="[0-9]+"/g, 'height="300"');
    embedHtml = embedHtml.replace(/width="[0-9]+"/g, 'width="100%"');

    const canCreateContent = this.props.currentUser.get('learner').can_manage_training_content;

    return (
      <div className="card" style={styles.resultContainer} key={video.id}>
        <div className="content" dangerouslySetInnerHTML={{ __html: embedHtml }} />
        {/* <video controls name="media" height="300" width="100%">
          <source src={video.motionThumbnailUrl} type="video/mp4" />
        </video> */}
        {canCreateContent && (
          <a className="ui bottom attached button" onClick={() => this.goToCreateMod(video)}>
            <i className="add icon" />
            Create Lesson
          </a>
        )}
      </div>
    );
  };

  renderResults() {
    const videos = this.props.videos;
    const moreAvailable = this.props.moreDataAvailable;
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreDataAvailable={moreAvailable}
        dataIsLoading={this.props.dataIsLoading}
      >
        <div className="ui cards" style={styles.resultsContainer}>
          {_.map(videos.toJS(), this.renderYTResult)}
        </div>
      </InfiniteScroll>
    );
  }

  render() {
    if (!this.props.currentUser.get('learner').company.companysettings.product_search_enabled) {
      return (
        <FeatureRequestButton
          currentUser={this.props.currentUser}
          featureName="video search"
          btnText="Enable video search"
          modalHeader="Empower you and your team by opening up access to informative videos from across the web"
        />
      );
    }
    return (
      <div>
        <LoadingContainer
          loadingProps={[this.props.videos]}
          noDataText="We could not find any related videos for this product"
          createComponent={() => this.renderResults()}
        />
        <Modal
          ref="unsupportedPublisherMessage"
          header="Unsupported source"
          content="
            Unfortunately, you cannot use this video to create a lesson because
             it is from an unsupported source. We have registered your interest
             in using this source, however. In future, we will use this information
             to determine which new sources to support.
          "
          message
        />
      </div>
    );
  }
}

export const VideoSearch = Marty.createContainer(VideoResultsInner, {
  listenTo: [VideosState.Store],

  fetch: {
    videos() {
      return VideosState.Store.getItems({
        limit: this.props.maxToDisplay,
        q: this.props.query
      });
    }
  },

  done(results) {
    return (
      <VideoResultsInner
        {...this.props}
        {...results}
        loadMore={_.noop}
        moreDataAvailable={false}
        dataIsLoading={false}
      />
    );
  },

  pending() {
    return containerUtils.defaultPending(this, VideoResultsInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, VideoResultsInner, errors);
  }
});

export const PaginatedVideoSearch = createPaginatedStateContainer(VideoResultsInner, {
  listenTo: [VideosState.Store],

  paginate: {
    store: VideosState.Store,
    propName: 'videos',
    limit: 16,
    getQuery() {
      return {
        q: this.props.query
      };
    }
  },

  pending() {
    return containerUtils.defaultPending(this, VideoResultsInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, VideoResultsInner, errors);
  }
});
