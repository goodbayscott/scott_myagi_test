import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';

import { t } from 'i18n';
import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import UsersState from 'state/users';
import ComponentState from './component-state';

import { LoadingContainer, NoData } from 'components/common/loading';
import { HiddenTextInput } from 'components/common/form';
import { remoteSearchMixinFactory } from 'components/common/search';
import { UsersList } from './common';

const SEARCH_MIN_CHARS = 2;

const styles = {
  resultsContainer: {
    height: '20em',
    overflow: 'auto'
  },
  usersContainer: {
    maxHeight: '16em',
    overflowX: 'hidden',
    overflowY: 'auto',
    border: `1px solid ${Style.vars.colors.get('mediumGrey')}`,
    marginTop: 10
  }
};

@reactMixin.decorate(remoteSearchMixinFactory(ComponentState.ActionCreators.setUserSearch.bind(ComponentState.ActionCreators)))
class SearchInner extends React.Component {
  static data = {
    users: {
      required: false,
      many: true,
      fields: ['id', 'url', 'first_name', 'last_name', 'learner']
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      allSelected: false
    };
  }

  componentWillMount() {
    // Makes sure users recently added to a team cannot be added to another team
    UsersState.ActionCreators.resetLocalData();
  }

  componentDidMount() {
    this.state.listener = ComponentState.Store.addChangeListener(this.onStoreChange);
  }

  componentWillUnmount() {
    this.state.listener.dispose();
  }

  componentWillUpdate(newProps) {
    if (this.props.search !== newProps.search) {
      this.setState({ allSelected: false });
    }
  }

  onStoreChange = () => {
    if (!this.props.users) return;
    const allSelected = ComponentState.Store.usersAreSelected(this.props.users);
    this.setState({ allSelected });
  };

  toggleAllSelected = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    if (this.state.allSelected) {
      // Select none
      ComponentState.ActionCreators.setSelectedForManyUsers(this.props.users, false);
    } else {
      // Select all
      ComponentState.ActionCreators.setSelectedForManyUsers(this.props.users, true);
    }
  };

  renderSearchHint() {
    return <NoData>Please enter a search term</NoData>;
  }

  renderSearchResults() {
    const noDataText = this.props.noDataText
      ? this.props.noDataText
      : t('no_users_matching_search');
    return (
      <LoadingContainer
        loadingProps={{
          users: this.props.users
        }}
        spinnerProps={{
          containerStyle: {
            backgroundColor: 'transparent'
          }
        }}
        createComponent={props => {
          const selectText = this.state.allSelected ? 'Select None' : 'Select All';
          return (
            <div>
              <button className="ui basic button" onClick={this.toggleAllSelected}>
                {selectText}
              </button>
              <UsersList
                users={this.props.users}
                currentUser={this.props.currentUser}
                style={styles.usersContainer}
              />
            </div>
          );
        }}
        noDataText={noDataText}
      />
    );
  }
  render() {
    const company = Im.Map(this.props.currentUser.get('learner').company);
    return (
      <div>
        <HiddenTextInput />
        {this.getSearchInput()}
        <div style={styles.resultsContainer}>
          {this.props.searchIsValid ? this.renderSearchResults() : this.renderSearchHint()}
        </div>
      </div>
    );
  }
}

function searchIsValid() {
  const search = ComponentState.Store.getUserSearch();
  if (!search || search.length < SEARCH_MIN_CHARS) return false;
  return true;
}

export const Search = Marty.createContainer(SearchInner, {
  listenTo: [ComponentState.Store, UsersState.Store],
  fetch: {
    users() {
      const learner = this.props.currentUser.get('learner');
      if (!searchIsValid()) return null;
      const query = {
        limit: 0,
        search: ComponentState.Store.getUserSearch(),
        learner__company: learner.company.id,
        ordering: '-search_rank',
        fields: $y.getFields(SearchInner, 'users')
      };
      if (learner.is_area_manager && !learner.is_company_admin) {
        query.learner__learnergroups__areas__managers = this.props.currentUser.get('id');
      }
      if (this.props.fetchOpts) {
        _.extend(query, this.props.fetchOpts);
      }
      return UsersState.Store.getItems(query);
    }
  },
  done(results) {
    return (
      <SearchInner
        {...this.props}
        {...results}
        searchIsValid={searchIsValid()}
        search={ComponentState.Store.getUserSearch()}
      />
    );
  },
  pending() {
    return containerUtils.defaultPending(this, SearchInner, { searchIsValid: searchIsValid() });
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, SearchInner, errors);
  }
});
