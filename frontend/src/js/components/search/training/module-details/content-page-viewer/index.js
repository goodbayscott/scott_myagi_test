import Marty from 'marty';
import React from 'react';
import Style from 'style/index';

import { VIDEO_PAGE_TYPE, PDF_PAGE_TYPE } from 'core/constants';

import { LoadingContainer } from 'components/common/loading';
import { VideoPage } from './video-page';
import { PDFPage } from './pdf-page';

const TYPE_TO_COMPONENT = {
  [VIDEO_PAGE_TYPE]: VideoPage,
  [PDF_PAGE_TYPE]: PDFPage
};

export class ContentPageViewer extends React.Component {
  render() {
    const type = this.props.page.get('type');
    const Component = TYPE_TO_COMPONENT[type];
    if (!Component) return null;
    return <Component page={this.props.page} />;
  }
}
