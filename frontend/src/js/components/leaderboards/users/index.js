import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import UsersState from 'state/users';
import PageState from './state';

import { Info } from 'components/common/info';
import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';
import { AvatarImage } from 'components/common/avatar-images';
import {
  ALL_TIME,
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
  noLgName: {
    color: Style.vars.colors.get('darkGrey'),
    fontStyle: 'italic'
  },
  explanation: {
    textAlign: 'center'
  }
};

class UsersCollection extends React.Component {
  static data = {
    users: {
      many: true,
      fields: [
        'id',
        'url',
        'first_name',
        'last_name',
        'learner.training_score',
        'learner.training_score_for_past_month',
        'learner.training_score_for_past_week',
        'learner.training_score_for_competition_period',
        'learner.learnergroup_name',
        'learner.profile_photo'
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static propTypes = $y.propTypesFromData(UsersCollection);

  static tableDataMapping = {
    Name: (u, cxt) => {
      const userName = `${u.get('first_name')} ${u.get('last_name')}`;
      return (
        <div
          key={userName}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          user={u}
        >
          <AvatarImage size="2.5em" style={styles.avatarImage} user={u} />
          <div>
            {u.get('first_name')} {u.get('last_name')}
          </div>
        </div>
      );
    },
    Team: (u, cxt) => {
      let lgName = u.get('learner').learnergroup_name;
      const lgNameStyle = lgName ? undefined : styles.noLgName;
      lgName = lgName || 'No Team';
      return (
        <div key={lgName} style={lgNameStyle}>
          {lgName}
        </div>
      );
    },
    'Training Score': (u, cxt) => cxt.getTrainingScore(u),
    Rank: u => u.get('company_rank')
  };

  getTrainingScore(u) {
    const filter = PageState.Store.getFilter();
    const learner = u.get('learner');
    if (filter === PAST_MONTH) {
      return learner.training_score_for_past_month;
    } else if (filter === PAST_WEEK) {
      return learner.training_score_for_past_week;
    } else if (filter === COMPETITION_PERIOD) {
      return learner.training_score_for_competition_period;
    }
    return learner.training_score;
  }

  getDataMapping() {
    const mapping = UsersCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    const info = (
      <Info content="Training score is the number of unique questions you have answered correctly." />
    );

    return Im.List(['Name', 'Team', <div key="Training Score">Training Score {info}</div>, 'Rank']);
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    let users = this.props.users;
    users = users.sortBy(u => -this.getTrainingScore(u));
    let idx = 0;
    return users.map(u => {
      idx += 1;
      // Rank is not returned from the server, instead we calculate it here.
      // All users are fetched at once, so this works.
      u = u.set('company_rank', idx);
      return Im.List(funcs.map(f => f(u, this)));
    });
  }

  onRowClick = (row, dataNum) => {
    const user = row.first().props.user;
    this.context.router.push(resolve('profile', {
      userId: user.get('id')
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
            initialSortHeader="Rank"
            reformatForMobile={false}
            onRowClick={this.onRowClick}
            exportEnabled
            exportIgnoreHeaders={['']}
            ref="table"
          />
        </InfiniteScroll>
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
export class UsersPage extends React.Component {
  static data = {
    users: $y.getData(UsersCollection, 'users', { required: false })
  };

  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = $y.propTypesFromData(UsersPage);

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
          loadingProps={[this.props.users]}
          createComponent={() => (
            <UsersCollection
              users={this.props.users}
              loadMore={this.props.loadMore}
              moreDataAvailable={this.props.moreDataAvailable}
              dataIsLoading={this.props.dataIsLoading}
            />
          )}
          noDataText="There are no users in this company"
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(UsersPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, UsersState.Store],

  paginate: {
    store: UsersState.Store,
    propName: 'users',
    limit: 50,
    getQuery() {
      const query = {
        is_active: true,
        learner__company: this.context.currentUser.get('learner').company.id,
        fields: $y.getFields(UsersPage, 'users')
      };
      const filter = PageState.Store.getFilter();
      const search = PageState.Store.getSearch();
      if (search) {
        query.search = search;
      }
      if (filter === PAST_MONTH) {
        query.ordering = '-learner__training_score_for_past_month';
      } else if (filter === PAST_WEEK) {
        query.ordering = '-learner__training_score_for_past_week';
      } else if (filter === COMPETITION_PERIOD) {
        query.ordering = '-learner__training_score_for_competition_period';
      } else {
        query.ordering = '-learner__training_score';
      }
      return query;
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, UsersPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, UsersPage, errors);
  }
});
