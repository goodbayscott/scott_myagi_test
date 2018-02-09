import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import EnrollmentGroupsState from 'state/enrollment-groups';
import PageState from './state';

import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';
import {
  PAST_WEEK,
  PAST_MONTH,
  COMPETITION_PERIOD,
  FilterAndSearch,
  showCompetitionFilter
} from '../common';

class EnrollmentGroupsCollection extends React.Component {
  static data = {
    enrollmentGroups: {
      many: true,
      fields: [
        'name',
        'average_training_score',
        'average_training_score_for_past_month',
        'average_training_score_for_past_week',
        'average_training_score_for_competition_period',
        'num_viewable_users',
        'members'
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static propTypes = $y.propTypesFromData(EnrollmentGroupsCollection);

  static tableDataMapping = {
    Name: e => (
      <div enrollmentGroup={e} key={e.get('name')}>
        {e.get('name')}
      </div>
    ),
    'Number of Users': e => e.get('members').length,
    'Average Training Score': (e, cxt) => parseFloat(cxt.getTrainingScore(e)).toFixed(1),
    Rank: e => e.get('company_rank')
  };

  getTrainingScore(e) {
    const filter = PageState.Store.getFilter();
    if (filter === PAST_MONTH) {
      return e.get('average_training_score_for_past_month');
    } else if (filter === PAST_WEEK) {
      return e.get('average_training_score_for_past_week');
    } else if (filter === COMPETITION_PERIOD) {
      return e.get('average_training_score_for_competition_period');
    }
    return e.get('average_training_score');
  }

  getDataMapping() {
    const mapping = EnrollmentGroupsCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    let enrollmentGroups = this.props.enrollmentGroups;
    enrollmentGroups = enrollmentGroups.sortBy(a => -this.getTrainingScore(a));
    let idx = 0;
    return enrollmentGroups.map(a => {
      idx += 1;
      // Rank is not returned from the server, instead we calculate it here.
      // All enrollment groups are fetched at once, so this works
      a = a.set('company_rank', idx);
      return Im.List(funcs.map(f => f(a, this)));
    });
  }

  onRowClick = (row, dataNum) => {
    const enrollmentGroup = row.first().props.enrollmentGroup;
    this.context.router.push(resolve('enrollment-groups', {
      enrollmentGroupId: enrollmentGroup.get('id')
    }));
  };

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();
    return (
      <div>
        <InfiniteScroll
          loadMore={this.props.loadMore}
          moreDataAvailable={this.props.moreDataAvailable}
          dataIsLoading={this.props.dataIsLoading}
        >
          <ScrollableDataTable
            headers={headers}
            rows={rows}
            bodyHeight={null}
            reformatForMobile={false}
            onRowClick={this.onRowClick}
            initialSortHeader="Rank"
            exportEnabled
            ref="table"
          />
        </InfiniteScroll>
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
export class EnrollmentGroupsPage extends React.Component {
  static data = {
    enrollmentGroups: $y.getData(EnrollmentGroupsCollection, 'enrollmentGroups', {
      required: false
    })
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = $y.propTypesFromData(EnrollmentGroupsPage);

  setFilter = filter => {
    PageState.ActionCreators.setFilter(filter);
  };

  render() {
    return (
      <div>
        <FilterAndSearch
          showCompetition={showCompetitionFilter(this.context.currentUser)}
          searchInput={this.getSearchInput()}
          setFilter={this.setFilter}
        />
        <LoadingContainer
          loadingProps={[this.props.enrollmentGroups]}
          createComponent={() => (
            <EnrollmentGroupsCollection
              enrollmentGroups={this.props.enrollmentGroups}
              loadMore={this.props.loadMore}
              moreDataAvailable={this.props.moreDataAvailable}
              dataIsLoading={this.props.dataIsLoading}
            />
          )}
          noDataText={t('there_are_no_groups')}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(EnrollmentGroupsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, EnrollmentGroupsState.Store],

  paginate: {
    store: EnrollmentGroupsState.Store,
    propName: 'enrollmentGroups',
    limit: 0,
    getQuery() {
      const query = {
        ordering: 'name',
        company: this.context.currentUser.get('learner').company.id,
        fields: $y.getFields(EnrollmentGroupsPage, 'enrollmentGroups')
      };
      const search = PageState.Store.getSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, EnrollmentGroupsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, EnrollmentGroupsPage, errors);
  }
});
