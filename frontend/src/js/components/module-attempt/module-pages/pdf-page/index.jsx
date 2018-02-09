import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';

import { t } from 'i18n';

import PDFPagesState from 'state/pdf-pages';
import ModuleAttemptPageState from '../../state';

import containerUtils from 'utilities/containers';

import { LoadingContainer } from 'components/common/loading';
import { NextPageButton } from '../common';

import PDF from 'components/common/pdf';

const ppStyle = {
  nextBtn: {
    marginTop: '10px',
    marginLeft: 0,
    background: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor'),
    [Style.vars.media.get('mobile')]: {
      width: '100%'
    }
  },
  troubleSpan: {
    fontSize: '.9em'
  }
};

@Radium
export class PageContent extends React.Component {
  render() {
    // Useful for testing in development
    // var url = 'https://myagi-production.s3.amazonaws.com/modules/resource-615088b6-a7fd-4e7b-8d2f-c9e7c2d7abe2.pdf';
    const url = this.props.page.get('pdf_file');
    return (
      <div className="ui segment" style={Style.common.attemptPageContent}>
        <PDF url={url} />
        <span style={ppStyle.troubleSpan}>
          {t('please_click')}
          <a href={url} target="_blank">
            {' '}
            {t('here')}{' '}
          </a>
          {t('if_you_are_having_trouble_viewing')}
        </span>
        <br />
        <NextPageButton
          module={this.props.module}
          page={this.props.page}
          goToNextPage={this.props.goToNextPage}
        />
      </div>
    );
  }
}

export class PDFPage extends React.Component {
  static propTypes = {
    page: PDFPagesState.Types.one,
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

export const Page = Marty.createContainer(PDFPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    goToNextPage: React.PropTypes.func.isRequired
  },

  listenTo: [PDFPagesState.Store],

  fetch: {
    page() {
      return PDFPagesState.Store.getItem(this.props.pageId);
    }
  },

  componentDidMount() {
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  },

  pending() {
    return containerUtils.defaultPending(this, PDFPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, PDFPage, errors);
  }
});
