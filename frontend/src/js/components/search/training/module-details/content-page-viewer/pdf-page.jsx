import Marty from 'marty';
import React from 'react';
import Style from 'style/index';

import containerUtils from 'utilities/containers';

import PDFPagesState from 'state/pdf-pages';

import { LoadingContainer } from 'components/common/loading';
import PDF from 'components/common/pdf';

class PDFPageInner extends React.Component {
  static data = {};

  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.pdfPage]}
        createComponent={() => <PDF url={this.props.pdfPage.get('pdf_file')} />}
      />
    );
  }
}

export const PDFPage = Marty.createContainer(PDFPageInner, {
  listenTo: [PDFPagesState.Store],

  fetch: {
    pdfPage() {
      return PDFPagesState.Store.getItem(this.props.page.get('id'), { fields: ['pdf_file'] });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, PDFPageInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, PDFPageInner, errors);
  }
});
