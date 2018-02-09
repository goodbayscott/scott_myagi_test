import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import Radium from 'radium';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import UsersState from 'state/users';
import TeamsState from 'state/teams';
import PageState from '../../people/users/state';

import createPaginatedStateContainer from 'state/pagination';
import { LoadingContainer, NoData } from 'components/common/loading';
import { UsersCollection } from '../../people/users/page';

import Style from 'style';

const styles = {
  container: {
    margin: '0px 15px'
  },
  countSortingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  searchCount: {
    display: 'inline-block',
    margin: 0
  }
};

export class UsersResultPage extends React.Component {
  static data = {
    user: {
      required: false,
      fields: $y.getFields(UsersCollection, 'users')
    }
  };

  componentWillUpdate() {
    if (PageState.Store.getSearch() !== this.props.searchQuery) {
      PageState.ActionCreators.setSearch(this.props.searchQuery);
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <LoadingContainer
          loadingProps={{
            users: this.props.users
          }}
          createComponent={props => (
            <div>
              <UsersCollection
                users={this.props.users}
                teams={this.props.teams}
                loadMore={this.props.loadMore}
                moreDataAvailable={this.props.moreDataAvailable}
                dataIsLoading={this.props.dataIsLoading}
                search={false}
              />
            </div>
          )}
          createNoDataComponent={() => (
            <NoData style={{ padding: 20 }}>{t('no_search_results')}</NoData>
          )}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(UsersResultPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, UsersState.Store],

  paginate: {
    store: UsersState.Store,
    propName: 'users',
    limit: 24,
    getQuery() {
      const learner = this.context.currentUser.get('learner');
      const search = PageState.Store.getSearch();
      const query = _.extend({
        limit: 24,
        ordering: 'first_name',
        learner__company: learner.company.id,
        fields: [$y.getFields(UsersResultPage, 'user')],
        ordering: 'first_name'
      });
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },

  fetch: {
    teams() {
      const query = {
        ordering: 'name',
        limit: 0,
        fields: $y.getFields(UsersCollection, 'teams')
      };
      return TeamsState.Store.getItems(query);
    }
  },

  pending() {
    return containerUtils.defaultPending(this, UsersResultPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, UsersResultPage, errors);
  }
});
