import React from 'react';

import { Modal } from 'components/common/modal';
import COVER_PHOTO_GUIDE from './cover-photo-guide.svg';
import COVER_PHOTO_EXAMPLE_1 from './cover-photo-1.jpg';
import COVER_PHOTO_EXAMPLE_2 from './cover-photo-2.jpg';

export class CoverPhotoGuideModal extends React.Component {
  show() {
    this.coverImageGuide.show();
  }

  render() {
    return (
      <Modal ref={c => (this.coverImageGuide = c)}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          <div style={{ maxWidth: 300, margin: 20 }}>
            Recommended resolution: <b>2500 x 600px</b>
            <br />
            <br />
            The cover photo will get cropped to fit the screen nicely.<br />
            Try to avoid using photos with text, faces or logos where cropping would be undesirable.<br />
            <br />
            Examples:
            <img src={COVER_PHOTO_EXAMPLE_1} style={{ width: 300, margin: '10px 0' }} />
            <img src={COVER_PHOTO_EXAMPLE_2} style={{ width: 300 }} />
          </div>
          <img src={COVER_PHOTO_GUIDE} style={{ width: 300, height: 400 }} />
        </div>
      </Modal>
    );
  }
}
