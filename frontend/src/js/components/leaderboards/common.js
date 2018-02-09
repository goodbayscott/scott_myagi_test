import React from 'react';
import Marty from 'marty';

const autoDispatch = Marty.autoDispatch;

import _ from 'lodash';
import Im from 'immutable';

import app from 'core/application';
import { FilterSet } from 'components/common/filter-set';

export function Explanation(props) {
  return (
    <div className="ui message" style={{ textAlign: 'center' }}>
      {props.children}
    </div>
  );
}

export const ALL_TIME = 'all_time';
export const PAST_MONTH = 'past_month';
export const PAST_WEEK = 'past_week';
export const COMPETITION_PERIOD = 'competition_period';

const INITIAL = PAST_MONTH;

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  }
};

export function showCompetitionFilter(currentUser) {
  const companySettings = currentUser.get('learner').company.companysettings;
  const competitionStart = companySettings.competition_start;
  const competitionEnd = companySettings.competition_end;
  if (competitionStart && competitionEnd) {
    return true;
  }
  return false;
}

export const FilterAndSearch = props => {
  const filterNames = [PAST_MONTH, PAST_WEEK, ALL_TIME];
  if (props.showCompetition) {
    filterNames.push(COMPETITION_PERIOD);
  }
  return (
    <div style={styles.container}>
      <FilterSet
        filterNames={filterNames}
        setFilter={props.setFilter}
        containerStyle={{ marginBottom: 20 }}
      />
      {props.searchInput}
    </div>
  );
};

export function generateLeaderboardState(name) {
  name = name.toUpperCase();

  const setSearch = `LEADERBOARD_${name}_SET_SEARCH`;
  const setFilter = `LEADERBOARD_${name}_SET_FILTER`;

  const Constants = Marty.createConstants([setSearch, setFilter]);

  class ActionCreators extends Marty.ActionCreators {
    setSearch = str => this.dispatch(Constants[setSearch], str);
    setFilter = str => this.dispatch(Constants[setFilter], str);
  }

  class Store extends Marty.Store {
    constructor(opts) {
      super(opts);
      this.handlers = {
        onSetSearch: Constants[setSearch],
        onSetFilter: Constants[setFilter]
      };
      this.resetState();
    }

    resetState() {
      const state = {
        search: '',
        filter: INITIAL
      };
      this.setState(state);
      this.hasChanged();
    }

    onSetSearch(search) {
      this.setState({ search });
      this.hasChanged();
    }

    onSetFilter(filter) {
      this.setState({ filter });
      this.hasChanged();
    }

    getSearch() {
      return this.state.search;
    }

    getFilter() {
      return this.state.filter;
    }
  }

  const storeName = `Leaderboard${_.capitalize(name)}Store`;
  const acName = `Leaderboard${_.capitalize(name)}ActionCreators`;

  app.register(storeName, Store);
  app.register(acName, ActionCreators);

  return {
    Store: app[storeName],
    ActionCreators: app[acName]
  };
}
