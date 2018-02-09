import React from 'react';

import wistiaUtil from 'utilities/wistia';

const WISTIA_VIDEO_URL = 'https://myagi-2.wistia.com/medias/';

export class WistiaVideoUpload extends React.Component {
  componentDidMount() {
    wistiaUtil.onUploaderReady(W => {
      this.uploader = new W.Uploader(wistiaUtil.mergeWithBaseConfig({
        dropIn: 'wistia-uploader'
      }));

      this.uploader.bind('uploadembeddable', (file, media, embedCode, oembedResponse) => {
        if (this.props.onChange) this.props.onChange(`${WISTIA_VIDEO_URL}${media.id}`);
      });
    });
  }

  render() {
    return <div id="wistia-uploader" />;
  }
}
