import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { PivotTableProcessor } from 'utilities/dataframe';
import { getHeaders, getRows } from 'utilities/table';

import ModuleFeedbackSurveyResultsState from 'state/module-feedback-survey-results';
import createPaginatedStateContainer from 'state/pagination';

import { LoadingContainer, NoData } from 'components/common/loading';
import { PrimaryButton } from 'components/common/buttons';
import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';

class ResultsTable extends React.Component {
  static tableDataMapping = {
    'Like rating': r => r.get('like_rating'),
    'Learn rating': r => r.get('learn_rating'),
    Comments: r => r.get('extra_comments')
  };

  render() {
    const headers = getHeaders(this.constructor.tableDataMapping);
    const rows = getRows(this.constructor.tableDataMapping, this.props.results, this);
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreDataAvailable={this.props.moreDataAvailable}
        dataIsLoading={this.props.dataIsLoading}
      >
        <ScrollableDataTable initialSortDirection="descending" headers={headers} rows={rows} />
      </InfiniteScroll>
    );
  }
}

class FeedbackResults extends React.Component {
  static data = {
    results: {
      required: false,
      fields: ['learn_rating', 'like_rating', 'extra_comments']
    }
  };

  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.results]}
        noDataText="No feedback with comments for this lesson"
        createComponent={() => <ResultsTable {...this.props} />}
      />
    );
  }
}

export default createPaginatedStateContainer(FeedbackResults, {
  paginate: {
    store: ModuleFeedbackSurveyResultsState.Store,
    propName: 'results',
    limit: 100,
    getQuery() {
      return {
        fields: $y.getFields(FeedbackResults, 'results'),
        ordering: '-id',
        has_extra_comments: true,
        module: this.props.module.get('id')
      };
    }
  },
  pending() {
    return containerUtils.defaultPending(this, FeedbackResults);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, FeedbackResults, errors);
  }
});
