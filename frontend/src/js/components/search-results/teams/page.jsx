import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Radium from 'radium';
import { t } from 'i18n';
import Select from 'react-select';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import TeamsState from 'state/teams';
import PageState from '../../people/teams/state';

import createPaginatedStateContainer from 'state/pagination';
import { LoadingContainer, NoData } from 'components/common/loading';
import { TeamsCollection } from '../../people/teams/page';

import Style from 'style';

const styles = {
  countSortingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  searchCount: {
    display: 'inline-block',
    margin: 0
  },
  sorting: {
    width: 114,
    border: 'none',
    cursor: 'pointer',
    height: 20,
    container: {
      display: 'inline-block'
    }
  }
};
export class TeamResultsPage extends React.Component {
  static data = {
    team: {
      required: false,
      fields: [
        'id',
        'url',
        'name',
        'created',
        'description',
        'members.id',
        'members.profile_photo',
        'members.user.id',
        'members.user.first_name',
        'members.user.last_name'
      ]
    }
  };

  componentWillUpdate() {
    if (PageState.Store.getSearch() !== this.props.searchQuery) {
      PageState.ActionCreators.setSearch(this.props.searchQuery);
    }
  }

  render() {
    const SORTING_OPTIONS = [
      { value: '-search_rank', label: t('relevance') },
      { value: 'name', label: t('name_az') },
      { value: '-name', label: t('name_za') },
      { value: '-created', label: t('newest') },
      { value: 'created', label: t('oldest') }
    ];
    return (
      <div>
        <LoadingContainer
          loadingProps={{
            teams: this.props.teams
          }}
          createComponent={props => (
            <div>
              <div style={styles.countSortingContainer}>
                <Select
                  style={styles.sorting}
                  options={SORTING_OPTIONS}
                  placeholder={<div>{t('sort_by')}</div>}
                  arrowRenderer={({ isOpen }) => (
                    <i
                      className="ui icon sort content descending"
                      style={{ color: isOpen ? 'black' : 'grey' }}
                    />
                  )}
                  clearable={false}
                  valueRenderer={o => <div>{o.label}</div>}
                  searchable={false}
                  onChange={v => PageState.ActionCreators.setTeamOrder(v.value)}
                  value={PageState.Store.getTeamOrder()}
                />
              </div>
              <TeamsCollection
                teams={this.props.teams}
                loadMore={this.props.loadMore}
                moreDataAvailable={this.props.moreDataAvailable}
                dataIsLoading={this.props.dataIsLoading}
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

export const Page = createPaginatedStateContainer(TeamResultsPage, {
  listenTo: [PageState.Store, TeamsState.Store],

  paginate: {
    store: TeamsState.Store,
    propName: 'teams',
    limit: 24,
    getQuery() {
      const search = PageState.Store.getSearch();
      const ordering = PageState.Store.getTeamOrder();
      const query = _.extend({
        limit: 24,
        ordering: 'name',
        fields: [$y.getFields(TeamResultsPage, 'team')],
        search,
        ...(ordering ? { ordering } : { ordering: '-search_rank' })
      });
      return query;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, TeamResultsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TeamResultsPage, errors);
  }
});
