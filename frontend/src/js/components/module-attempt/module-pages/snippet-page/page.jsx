import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import cx from 'classnames';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';
import { t } from 'i18n';

import { FLIP_CARD_PAGE_TYPE } from 'core/constants';

import SnippetPagesState from 'state/snippet-pages';
import ModuleAttemptPageState from '../../state';

import containerUtils from 'utilities/containers';
import { LoadingContainer } from 'components/common/loading';

import { SnippetContainer } from './snippet-containers';
import { NextPageButton } from '../common';

const styles = {
  desc: {
    margin: 20,
    fontSize: 18,
    color: Style.vars.colors.get('xxDarkGrey'),
    textAlign: 'center'
  }
};

@Radium
export class PageContent extends React.Component {
  static propTypes = {
    page: SnippetPagesState.Types.one.isRequired,
    module: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  render() {
    const nextBtn = (
      <NextPageButton
        module={this.props.module}
        page={this.props.page}
        goToNextPage={this.props.goToNextPage}
      />
    );
    const desc = this.props.page.get('description');
    return (
      <div className="ui segment" style={Style.common.attemptPageContent}>
        {desc && <p style={styles.desc}>{desc}</p>}
        <SnippetContainer {...this.props} />
        {nextBtn}
      </div>
    );
  }
}

export class SnippetPage extends React.Component {
  static propTypes = {
    page: SnippetPagesState.Types.one,
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

export const Page = Marty.createContainer(SnippetPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    nextPageType: React.PropTypes.string.isRequired,
    goToNextPage: React.PropTypes.func.isRequired
  },

  listenTo: [SnippetPagesState.Store],

  fetch: {
    page() {
      return SnippetPagesState.Store.getItem(this.props.pageId, {
        fields: ['snippet_url', 'snippet_type', 'data', 'description']
      });
    }
  },

  componentDidMount() {
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  },

  pending() {
    return containerUtils.defaultPending(this, SnippetPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, SnippetPage, errors);
  }
});
