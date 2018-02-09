import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import reactMixin from 'react-mixin';

import { ANALYTICS_EVENTS } from 'core/constants';

import containerUtils from 'utilities/containers';

import PageState from './state';

import { Box, BoxHeaderTabs, BoxContent } from 'components/common/box';

import { HeaderTabs, TabsMixin } from 'components/common/tabs';
import { PaginatedVideoSearch } from './videos';
import { ProductSearch } from './products';
import { TrainingSearch } from './training';

const SEARCH_TRACK_THROTTLE_TIME = 3000;

const styles = {
  description: {
    textAlign: 'center',
    marginTop: 25
  }
};

@reactMixin.decorate(TabsMixin)
class SearchPage extends React.Component {
  static data = {};

  constructor() {
    super();
    const throttledTrackSearch = _.throttle(
      this.trackCurrentSearch.bind(this),
      SEARCH_TRACK_THROTTLE_TIME,
      { leading: false, trailing: true }
    );
    this.state = {
      throttledTrackSearch
    };
  }

  componentDidUpdate() {
    this.state.throttledTrackSearch();
  }

  trackCurrentSearch() {
    if (!this.props.query) return;
    analytics.track(ANALYTICS_EVENTS.EXECUTED_SEARCH, { Search: this.props.query });
  }

  getSearch() {
    return this.props.query;
  }

  getTabContentMap() {
    const search = this.getSearch();
    return {
      Lessons: <TrainingSearch currentUser={this.props.currentUser} query={search} />
      // 'Products': <ProductSearch {...this.props} query={search} currentUser={this.props.currentUser} onModCreate={this.props.onBack} />,
      // 'Videos': <PaginatedVideoSearch query={search} currentUser={this.props.currentUser} onModCreate={this.props.onBack} />
    };
  }

  render() {
    const search = this.getSearch();
    return (
      <Box>
        <BoxHeaderTabs
          heading={`Search results for '${search}'`}
          backOpts={{
            text: 'Back',
            onClick: this.props.onBack
          }}
          containerStyle={{ minHeight: '9.1em' }}
        >
          <HeaderTabs {...this.getTabsProps()} />
        </BoxHeaderTabs>
        <BoxContent>{search && this.getTabContent({ renderWhenActive: true })}</BoxContent>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(SearchPage, {
  listenTo: [PageState.Store],

  fetch: {},

  pending() {
    return containerUtils.defaultPending(this, SearchPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, SearchPage, errors);
  }
});
