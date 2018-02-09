import Marty from 'marty';
import React from 'react';
import Style from 'style/index';

import containerUtils from 'utilities/containers';

import VideoPagesState from 'state/video-pages';

import { LoadingContainer } from 'components/common/loading';
import { getVideoContainer } from 'components/module-attempt/module-pages/video-page/video-containers';

class VideoPageInner extends React.Component {
  static data = {};

  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.videoPage]}
        createComponent={() => (
          <div style={{ height: 360, width: '100%', maxWidth: 640 }}>
            {getVideoContainer(this.props.videoPage.get('video_url'), {
              height: '100%',
              width: '100%',
              allowControl: true
            })}
          </div>
        )}
      />
    );
  }
}

export const VideoPage = Marty.createContainer(VideoPageInner, {
  listenTo: [VideoPagesState.Store],

  fetch: {
    videoPage() {
      return VideoPagesState.Store.getItem(this.props.page.get('id'), {
        fields: ['video_url']
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, VideoPageInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, VideoPageInner, errors);
  }
});
