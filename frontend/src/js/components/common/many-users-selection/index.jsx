import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';

import Style from 'style';

import containerUtils from 'utilities/containers';

import UsersState from 'state/users';
import TeamsState from 'state/teams';
import EnrollmentGroupsState from 'state/teams';
import ListComponentState from './component-state';

import { TabsMixin } from '../tabs';
import { LoadingContainer } from 'components/common/loading';
import { LearnerSearchableSelect } from 'components/common/user-searchable-select';
import { Form, SubmitButton, InfiniteInputs, HiddenTextInput } from 'components/common/form';
import { Hoverable } from '../hover';
import { TeamsList } from './teams-list';
import { EnrollmentGroupsList } from './enrollment-groups-list';
import { Search } from './search';
import reactMixin from 'react-mixin';

@reactMixin.decorate(TabsMixin)
export class ManyUsersSelectionInner extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    teams: TeamsState.Types.many,
    enrollmentGroups: EnrollmentGroupsState.Types.many
  };

  getSearchComponent = () => this.refs.search;

  getTabContentMap = () => {
    const learner = this.props.currentUser.get('learner');
    const tabs = {
      teams: <TeamsList currentUser={this.props.currentUser} teams={this.props.teams} />,
      groups: (
        <EnrollmentGroupsList
          currentUser={this.props.currentUser}
          enrollmentGroups={this.props.enrollmentGroups}
        />
      ),
      search: (
        <Search
          currentUser={this.props.currentUser}
          fetchOpts={this.props.searchFilter}
          noDataText={this.props.noDataText}
          ref="search"
        />
      )
    };
    if (this.props.hideEnrollmentGroups) {
      delete tabs.groups;
    }
    if (learner.is_learner_group_admin && !learner.is_company_admin) {
      delete tabs.groups;
      delete tabs.search;
    }
    if (this.props.searchOnly) {
      delete tabs.teams;
      delete tabs.groups;
    }
    return tabs;
  };

  render() {
    return (
      <div>
        {this.getTabs()}
        <div style={{ height: 20, clear: 'both' }} />
        {this.getTabContent()}
      </div>
    );
  }
}

export const ManyUsersSelection = Marty.createContainer(ManyUsersSelectionInner, {
  /*
    An interface for selecting many users grouped by teams. If `returnLearners` is True,
    then component will return a list of learner URLs instead of user URLs when getNameAndValue
    is called.

    If getTeamUsers prop is truthy, the users for the current user's team will
    be fetched rather than just a list of teams.
  */
  propTypes: {
    returnLearners: React.PropTypes.bool
  },
  getDefaultProps() {
    // This `name` value is not actually used. It just
    // signifies to the `Form` component that this is a form
    // input.
    return { name: '_' };
  },
  listenTo: [TeamsState.Store, ListComponentState.Store, EnrollmentGroupsState.Store],
  fetch: {
    teams() {
      const q = {
        limit: 0,
        ordering: 'name',
        fields: ['name', 'id', 'url', 'members', 'members.user']
      };
      const learner = this.props.currentUser.get('learner');
      if (!learner.is_company_admin) {
        if (learner.is_area_manager) {
          q.areas__managers = this.props.currentUser.get('id');
        } else {
          q.has_user = this.props.currentUser.get('id');
        }
      }
      return ListComponentState.Store.getTeams(q);
    },
    enrollmentGroups() {
      const enrollmentGroups = ListComponentState.Store.getEnrollmentGroups({
        limit: 0,
        ordering: 'name',
        fields: ['name', 'id', 'url', 'members']
      });
      return enrollmentGroups;
    }
  },
  componentWillMount() {
    ListComponentState.Store.resetState(this.props.currentUser);
    if (this.props.onChange) {
      this._listener = ListComponentState.Store.addChangeListener(this.props.onChange);
    }
  },
  componentWillUnmount() {
    if (this._listener) {
      this._listener.dispose();
      this._listener = undefined;
    }
  },
  isValid() {
    if (this.props.required) {
      const teams = ListComponentState.Store.getSelectedTeamURLs();
      const enrollmentGroups = ListComponentState.Store.getSelectedEnrollmentGroupURLs();
      const learners = ListComponentState.Store.getSelectedLearnerURLs();
      if (!teams.length && !learners.length && !enrollmentGroups.length) {
        return false;
      }
    }
    return true;
  },
  getNameAndValue() {
    let teams = ListComponentState.Store.getSelectedTeamURLs();
    const enrollmentGroups = ListComponentState.Store.getSelectedEnrollmentGroupURLs();
    let learners = ListComponentState.Store.getSelectedLearnerURLs();
    let users = ListComponentState.Store.getSelectedUserURLs();
    const usersObj = ListComponentState.Store.getSelectedUsers();
    if (teams && this.props.getTeamUsers) {
      const usersFromTeams = ListComponentState.Store.getUsersFromSelectedTeams();
      users = _.uniq(users.concat(usersFromTeams));
    }
    learners = _.uniq(learners);
    teams = _.uniq(teams);
    if (this.props.returnUsersObj) {
      return {
        users: usersObj
      };
    }
    if (!this.props.returnLearners) {
      return {
        users,
        teams,
        enrollment_groups: enrollmentGroups
      };
    }
    return {
      learners,
      teams,
      enrollment_groups: enrollmentGroups
    };
  },
  pending() {
    return containerUtils.defaultPending(this, ManyUsersSelectionInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, ManyUsersSelectionInner, errors);
  }
});
