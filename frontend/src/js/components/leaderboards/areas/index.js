import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import AreasState from 'state/areas';
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

const styles = {
  headingContainer: {
    paddingBottom: 0,
    // Overflow visible and minHeight required for
    // export dropdown to be visible.
    overflow: 'visible',
    minHeight: '4.2em'
  },
  heading: {
    display: 'none'
  },
  avatarImage: {
    marginRight: 15,
    cursor: 'pointer'
  },
  noManagers: {
    color: Style.vars.colors.get('darkGrey'),
    fontStyle: 'italic'
  },
  explanation: {
    textAlign: 'center'
  }
};

class AreasCollection extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static data = {
    areas: {
      many: true,
      fields: [
        'id',
        'name',
        'managers.first_name',
        'managers.last_name',
        'average_training_score',
        'average_training_score_for_past_month',
        'average_training_score_for_past_week',
        'average_training_score_for_competition_period',
        'num_users'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(AreasCollection);

  static tableDataMapping = {
    Name: (a, cxt) => (
      <div area={a} key={a.get('name')}>
        {a.get('name')}
      </div>
    ),
    Managers: a => {
      const managers = a.get('managers');
      const managerNames = [];
      managers.forEach(manager => {
        managerNames.push(`${manager.first_name} ${manager.last_name}`);
      });
      const managerNamesStr = managerNames.join(', ');
      const txt = managerNames.length ? managerNamesStr : 'No managers';
      const style = managerNames.length ? undefined : styles.noManagers;
      return (
        <div key={txt} style={style}>
          {txt}
        </div>
      );
    },
    'Number of Users': a => a.get('num_users'),
    'Average Training Score': (a, cxt) => parseFloat(cxt.getTrainingScore(a)).toFixed(1),
    Rank: a => a.get('company_rank')
  };

  onRowClick = (row, dataNum) => {
    const area = row.first().props.area;
    this.context.router.push(resolve('area', {
      areaId: area.get('id')
    }));
  };

  navigateToTeamLeaderboard(id) {
    this.context.router.push(resolve('area-team-leaderboard', { areaId: id }));
  }

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
    const mapping = AreasCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    let areas = this.props.areas;
    areas = areas.sortBy(a => -this.getTrainingScore(a));
    let idx = 0;
    return areas.map(a => {
      idx += 1;
      // Rank is not returned from the server, instead we calculate it here.
      // All areas are fetched at once, so this works
      a = a.set('company_rank', idx);
      return Im.List(funcs.map(f => f(a, this)));
    });
  }

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
            onRowClick={this.onRowClick}
            bodyHeight={null}
            reformatForMobile={false}
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
export class AreasPage extends React.Component {
  static data = {
    areas: $y.getData(AreasCollection, 'areas', { required: false })
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = $y.propTypesFromData(AreasPage);

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
          loadingProps={[this.props.areas]}
          createComponent={() => (
            <AreasCollection
              areas={this.props.areas}
              loadMore={this.props.loadMore}
              moreDataAvailable={this.props.moreDataAvailable}
              dataIsLoading={this.props.dataIsLoading}
            />
          )}
          noDataText={t('there_are_no_areas')}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(AreasPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, AreasState.Store],

  paginate: {
    store: AreasState.Store,
    propName: 'areas',
    limit: 0,
    getQuery() {
      const query = {
        ordering: 'name',
        company: this.context.currentUser.get('learner').company.id,
        fields: $y.getFields(AreasPage, 'areas')
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
    return containerUtils.defaultPending(this, AreasPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, AreasPage, errors);
  }
});
