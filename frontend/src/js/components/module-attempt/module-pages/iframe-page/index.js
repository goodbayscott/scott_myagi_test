import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';

import { t } from 'i18n';

import IFramePagesState from 'state/iframe-pages';
import IFramePageAttemptsState from 'state/iframe-page-attempts';
import ModuleAttemptPageState from '../../state';

import containerUtils from 'utilities/containers';

import IFramePageHelper from 'utilities/component-helpers/iframe-page';

import { LoadingContainer } from 'components/common/loading';

const styles = {
  border: 'none',
  width: '100%',
  overflow: 'hidden'
};

export class PageContent extends React.Component {
  constructor(props) {
    super();
    this.pageHelper = new IFramePageHelper({
      pageAttemptId: props.pageAttempt.get('id'),
      iFramePageAttemptsState: IFramePageAttemptsState,
      goToNextPage: props.goToNextPage,
      suspendData: props.pageAttempt.get('previous_suspend_data')
    });
  }
  componentDidMount() {
    window.API = this.pageHelper.lmsAPI;
  }

  componentWillUnmount() {
    delete window.API;
  }

  _isLastPage() {
    const last = _.last(this.props.module.get('pages'));
    return last.id === this.props.page.get('id');
  }

  render() {
    return (
      <iframe
        src={this.props.page.get('proxied_website_url')}
        style={styles.iframe}
        width="100%"
        height="700px"
        frameBorder="0"
      />
    );
  }
}

export class IFramePage extends React.Component {
  static propTypes = {
    page: IFramePagesState.Types.one,
    goToNextPage: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <LoadingContainer
        loadingProps={{
          page: this.props.page,
          pageAttempt: this.props.pageAttempt
        }}
        createComponent={() => <PageContent {...this.props} />}
      />
    );
  }
}

export const Page = Marty.createContainer(IFramePage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    goToNextPage: React.PropTypes.func.isRequired
  },

  listenTo: [IFramePagesState.Store],

  fetch: {
    page() {
      return IFramePagesState.Store.getItem(this.props.pageId, {
        fields: ['proxied_website_url']
      });
    }
  },

  componentDidMount() {
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);

    // Generate a new page attempt entity to pass down
    const pageURL = IFramePagesState.Store.getURLForItemWithID(this.props.pageId);
    IFramePageAttemptsState.ActionCreators.create({
      page: pageURL,
      module_attempt: this.props.moduleAttempt.get('url')
    }).then(res => {
      this.setState({ pageAttempt: Im.Map(res.body) });
    });
  },

  done(results) {
    return (
      <IFramePage
        ref="innerComponent"
        {...this.props}
        {...results}
        pageAttempt={this.state.pageAttempt}
      />
    );
  },

  pending() {
    return containerUtils.defaultPending(this, IFramePage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, IFramePage, errors);
  }
});
