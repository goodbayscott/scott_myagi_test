import React from 'react';
import { t } from 'i18n';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getHeaders, getRows } from 'utilities/table';

import ModuleFeedbackSurveyResultsState from 'state/module-feedback-survey-results';
import createPaginatedStateContainer from 'state/pagination';

import { LoadingContainer, NoData } from 'components/common/loading';
import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';

const styles = {
  container: {
    padding: '13px 10px'
  }
};

class FeedbackResults extends React.Component {
  static tableDataMapping = {
    'Like rating': r => r.get('like_rating'),
    'Learn rating': r => r.get('learn_rating'),
    Comments: r => r.get('extra_comments')
  };

  static data = {
    results: {
      required: false,
      fields: ['learn_rating', 'like_rating', 'extra_comments']
    }
  };

  render() {
    return (
      <div style={styles.container}>
        <LoadingContainer
          loadingProps={[this.props.results]}
          noDataText={t('no_comments_for_this_lesson')}
          createComponent={() => {
            const headers = getHeaders(this.constructor.tableDataMapping);
            const rows = getRows(this.constructor.tableDataMapping, this.props.results, this);
            return (
              <InfiniteScroll
                loadMore={this.props.loadMore}
                moreDataAvailable={this.props.moreDataAvailable}
                dataIsLoading={this.props.dataIsLoading}
              >
                <ScrollableDataTable
                  initialSortDirection="descending"
                  headers={headers}
                  rows={rows}
                />
              </InfiniteScroll>
            );
          }}
        />
      </div>
    );
  }
}

export default createPaginatedStateContainer(FeedbackResults, {
  paginate: {
    store: ModuleFeedbackSurveyResultsState.Store,
    propName: 'results',
    limit: 150,
    getQuery() {
      return {
        fields: $y.getFields(FeedbackResults, 'results'),
        ordering: '-id',
        has_extra_comments: true,
        module: this.props.lesson.get('id')
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
