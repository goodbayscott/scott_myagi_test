import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import TeamsState from 'state/teams';
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

class TeamsCollection extends React.Component {
  static data = {
    teams: {
      many: true,
      fields: [
        'id',
        'name',
        'manager_names',
        'average_training_score',
        'average_training_score_for_past_month',
        'average_training_score_for_past_week',
        'average_training_score_for_competition_period',
        'num_users'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(TeamsCollection);

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static tableDataMapping = {
    Name: (t, cxt) => (
      <div team={t} key={t.get('name')}>
        {t.get('name')}
      </div>
    ),
    'Manager(s)': t => {
      const managerNames = t.get('manager_names').join(', ');
      const txt = managerNames || 'No managers';
      const style = managerNames ? undefined : styles.noManagers;
      return (
        <div key={txt} style={style}>
          {txt}
        </div>
      );
    },
    'Number of Users': t => t.get('num_users'),
    'Average Training Score': (t, cxt) => parseFloat(cxt.getTrainingScore(t)).toFixed(1),
    Rank: t => t.get('company_rank')
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
    const mapping = TeamsCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    let teams = this.props.teams;
    teams = teams.sortBy(t => -this.getTrainingScore(t));
    let idx = 0;
    return teams.map(t => {
      idx += 1;
      // Rank is not returned from the server, instead we calculate it here.
      // All teams are fetched at once, so this works
      t = t.set('company_rank', idx);
      return Im.List(funcs.map(f => f(t, this)));
    });
  }

  onRowClick = (row, dataNum) => {
    const team = row.first().props.team;
    this.context.router.push(resolve('team', {
      teamId: team.get('id')
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
            initialSortHeader="Rank"
            onRowClick={this.onRowClick}
            exportEnabled
            ref="table"
          />
        </InfiniteScroll>
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
export class TeamsPage extends React.Component {
  static data = {
    teams: $y.getData(TeamsCollection, 'teams', { required: false })
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = $y.propTypesFromData(TeamsPage);

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
          loadingProps={[this.props.teams]}
          createComponent={() => (
            <TeamsCollection
              teams={this.props.teams}
              loadMore={this.props.loadMore}
              moreDataAvailable={this.props.moreDataAvailable}
              dataIsLoading={this.props.dataIsLoading}
            />
          )}
          noDataText="There are no teams in this company"
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(TeamsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, TeamsState.Store],

  paginate: {
    store: TeamsState.Store,
    propName: 'teams',
    limit: 0,
    getQuery() {
      const query = {
        ordering: 'id',
        company: this.context.currentUser.get('learner').company.id,
        fields: $y.getFields(TeamsPage, 'teams')
      };
      const search = PageState.Store.getSearch();
      if (search) {
        query.search = search;
      }
      return query;
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, TeamsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TeamsPage, errors);
  }
});
