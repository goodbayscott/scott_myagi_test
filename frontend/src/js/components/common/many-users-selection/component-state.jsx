const Marty = require('marty');

const autoDispatch = Marty.autoDispatch;
const _ = require('lodash');
const Im = require('immutable');

import TeamsState from 'state/teams';
import EnrollmentGroupsState from 'state/enrollment-groups';
import UsersState from 'state/users';

import app from 'core/application';
import { getIdFromApiUrl } from 'utilities/generic';

const NO_TEAM_ID = -1;
const ENROLLMENT_GROUP_ENDPOINT = 'enrollment_groups';
const TEAM_ENDPOINT = 'learner_groups';
const ENTITY_MAP = {
  ENROLLMENT_GROUP_ENDPOINT: 'enrollmentGroups',
  TEAM_ENDPOINT: 'teams'
};

const Constants = Marty.createConstants([
  'MANY_USER_SELECTION_TOGGLE_USER_SELECTED',
  'MANY_USER_SELECTION_TOGGLE_TEAM_SELECTED',
  'MANY_USER_SELECTION_TOGGLE_ENROLLMENT_GROUP_SELECTED',
  'MANY_USER_SELECTION_SET_TEAM_SELECTED',
  'MANY_USER_SELECTION_SET_ENROLLMENT_GROUP_SELECTED',
  'MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_USERS',
  'MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_TEAMS',
  'MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_ENROLLMENT_GROUPS',
  'SET_USER_SEARCH'
]);

const ManyUserSelectionActionCreators = Marty.createActionCreators({
  id: 'ManyUserSelectionActionCreators',
  toggleUserSelected: autoDispatch(Constants.MANY_USER_SELECTION_TOGGLE_USER_SELECTED),
  toggleTeamSelected: autoDispatch(Constants.MANY_USER_SELECTION_TOGGLE_TEAM_SELECTED),
  toggleEnrollmentGroupSelected: autoDispatch(Constants.MANY_USER_SELECTION_TOGGLE_ENROLLMENT_GROUP_SELECTED),
  setTeamSelected: autoDispatch(Constants.MANY_USER_SELECTION_SET_TEAM_SELECTED),
  setEnrollmentGroupSelected: autoDispatch(Constants.MANY_USER_SELECTION_SET_ENROLLMENT_GROUP_SELECTED),
  setSelectedForManyUsers: autoDispatch(Constants.MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_USERS),
  setSelectedForManyTeams: autoDispatch(Constants.MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_TEAMS),
  setSelectedForManyEnrollmentGroups: autoDispatch(Constants.MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_ENROLLMENT_GROUPS),
  setUserSearch: autoDispatch(Constants.SET_USER_SEARCH)
});

const ManyUserSelectionStore = Marty.createStore({
  id: 'ManyUserSelectionStore',
  handlers: {
    onToggleUser: Constants.MANY_USER_SELECTION_TOGGLE_USER_SELECTED,
    onToggleTeam: Constants.MANY_USER_SELECTION_TOGGLE_TEAM_SELECTED,
    onToggleEnrollmentGroup: Constants.MANY_USER_SELECTION_TOGGLE_ENROLLMENT_GROUP_SELECTED,
    onSetTeamSelected: Constants.MANY_USER_SELECTION_SET_TEAM_SELECTED,
    onSetEnrollmentGroupSelected: Constants.MANY_USER_SELECTION_SET_ENROLLMENT_GROUP_SELECTED,
    onSetSelectedForManyUsers: Constants.MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_USERS,
    onSetSelectedForManyTeams: Constants.MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_TEAMS,
    onSetSelectedForManyEnrollmentGroups:
      Constants.MANY_USER_SELECTION_SET_SELECTED_FOR_MANY_ENROLLMENT_GROUPS,
    onSetUserSearch: Constants.SET_USER_SEARCH
  },
  getInitialState() {
    return {
      selectedUsers: Im.Map(),
      selectedTeams: Im.Map(),
      selectedEnrollmentGroups: Im.Map(),
      teams: Im.Map(),
      enrollmentGroups: Im.Map(),
      userSearch: '',
      currentUser: Im.Map()
    };
  },
  resetState(currentUser) {
    const teams = this.state.teams;
    const enrollmentGroups = this.state.enrollmentGroups;
    this.state = this.getInitialState();
    // Keep teams value. Otherwise there will be errors if
    // enrollment modal is opened twice without changing page,
    // as state is reset after teams value gets set when
    // teams are available in local memory.
    this.state.teams = teams;
    this.state.enrollmentGroups = enrollmentGroups;
    this.state.currentUser = currentUser;
  },
  _addOrRemove(map, key, val) {
    if (map.get(key)) {
      return map.delete(key);
    }
    return map.set(key, val);
  },
  onToggleUser(user) {
    this.state.selectedUsers = this._addOrRemove(this.state.selectedUsers, user.get('url'), user);
    this.hasChanged();
  },
  onToggleTeam(team) {
    const storedTeam = this.state.teams.get(team.get('id'));
    if (!storedTeam.get('__users')) {
      this.state.selectedTeams = this._addOrRemove(this.state.selectedTeams, team.get('url'), true);
    } else {
      // Remove team from selectedTeams, as now selection state for team is determined by
      // it's users
      this.state.selectedTeams = this.state.selectedTeams.delete(team.get('url'));
      const users = storedTeam.get('__users');
      this.selectUsersFromEntity(users);
    }
    this.hasChanged();
  },
  getEntityTypeFromURL(url) {
    if (url.indexOf(ENROLLMENT_GROUP_ENDPOINT) > -1) return ENTITY_MAP.ENROLLMENT_GROUP_ENDPOINT;
    if (url.indexOf(TEAM_ENDPOINT) > -1) return ENTITY_MAP.TEAM_ENDPOINT;
  },
  onToggleEntity(entity) {
    const entityType = this.getEntityTypeFromURL(entity.get('url'));
  },
  selectUsersFromEntity(users) {
    let anyNotSelected = false;
    users.forEach(user => {
      if (anyNotSelected) return;
      if (!this.isSelectedUser(user)) {
        anyNotSelected = true;
      }
    });
    if (anyNotSelected) {
      // Select all
      this.onSetSelectedForManyUsers(users, true);
    } else {
      // Select none
      this.onSetSelectedForManyUsers(users, false);
    }
  },
  onToggleEnrollmentGroup(enrollmentGroup) {
    this.onToggleEntity(enrollmentGroup);
    const storedEnrollmentGroup = this.state.enrollmentGroups.get(enrollmentGroup.get('id'));
    if (!storedEnrollmentGroup.get('__users')) {
      this.state.selectedEnrollmentGroups = this._addOrRemove(
        this.state.selectedEnrollmentGroups,
        enrollmentGroup.get('url'),
        true
      );
    } else {
      // Remove enrollment group from selectedEnrollmentGroups, as now selection state for enrollment group is determined by
      // it's users
      this.state.selectedEnrollmentGroups = this.state.selectedEnrollmentGroups.delete(enrollmentGroup.get('url'));
      const users = storedEnrollmentGroup.get('__users');
      this.selectUsersFromEntity(users);
    }
    this.hasChanged();
  },
  onSetTeamSelected(team, val) {
    const storedTeam = this.state.teams.get(team.get('id'));
    // If users are loaded, use them to determine selection state
    if (storedTeam && storedTeam.get('__users')) {
      return this.onSetSelectedForManyUsers(storedTeam.get('__users'), val);
    }
    this.state.selectedTeams = this.state.selectedTeams.set(team.get('url'), val);
    this.hasChanged();
  },
  onSetEnrollmentGroupSelected(enrollmentGroup, val) {
    const storedEnrollmentGroup = this.state.enrollmentGroups.get(enrollmentGroup.get('id'));
    // If users are loaded, use them to determine selection state
    if (storedEnrollmentGroup && storedEnrollmentGroup.get('__users')) {
      return this.onSetSelectedForManyUsers(storedEnrollmentGroup.get('__users'), val);
    }
    this.state.selectedEnrollmentGroups = this.state.selectedEnrollmentGroups.set(
      enrollmentGroup.get('url'),
      val
    );
    this.hasChanged();
  },
  onSetSelectedForManyUsers(users, val) {
    let valChanged = false;
    users.forEach(user => {
      if (this.state.selectedUsers.get(user.get('url')) !== val) valChanged = true;
      if (val) {
        this.state.selectedUsers = this.state.selectedUsers.set(user.get('url'), user);
      } else {
        this.state.selectedUsers = this.state.selectedUsers.delete(user.get('url'));
      }
    });
    if (valChanged) this.hasChanged();
  },
  onSetSelectedForManyTeams(teams, val) {
    teams.forEach(team => {
      this.onSetTeamSelected(team, val);
    });
    this.hasChanged();
  },
  onSetSelectedForManyEnrollmentGroups(enrollmentGroups, val) {
    enrollmentGroups.forEach(enrollmentGroup => {
      this.onSetEnrollmentGroupSelected(enrollmentGroup, val);
    });
    this.hasChanged();
  },
  onSetUserSearch(val) {
    this.setState({ userSearch: val });
  },
  isSelectedUser(user) {
    return Boolean(this.state.selectedUsers.get(user.get('url')));
  },
  isSelectedEntity(entity, type) {
    let selectedEntity;
    if (type === ENTITY_MAP.ENROLLMENT_GROUP_ENDPOINT) {
      selectedEntity = this.state.selectedEnrollmentGroups;
    }
    if (type === ENTITY_MAP.TEAM_ENDPOINT) {
      selectedEntity = this.state.selectedTeams;
    }
    const storedEntity = this.state[type].get(entity.get('id'));
    if (storedEntity && storedEntity.get('__users')) {
      let allSelected = true;
      storedEntity.get('__users').forEach(user => {
        if (!this.isSelectedUser(user)) allSelected = false;
      });
      return allSelected;
    }
    return Boolean(selectedEntity.get(entity.get('url')));
  },
  makeNoTeam() {
    // Team which represents users without a team
    return Im.Map({
      id: NO_TEAM_ID,
      url: null,
      name: 'No Team'
    });
  },
  isNoTeam(t) {
    return t.get('id') === NO_TEAM_ID;
  },
  allEntitiesAreSelected(entities) {
    entities.forEach(entity => {
      if (anyNotSelected) return;
      if (!this.isSelectedEntity(entity)) {
        anyNotSelected = true;
      }
    });
    return !anyNotSelected;
  },
  allTeamsAreSelected() {
    // TODO - This func is similar to the toggleSelectedUsers method
    let anyNotSelected = false;
    this.state.teams.forEach(team => {
      if (anyNotSelected) return;
      if (!this.isSelectedEntity(team, ENTITY_MAP.TEAM_ENDPOINT)) {
        anyNotSelected = true;
      }
    });
    return !anyNotSelected;
  },
  allEnrollmentGroupsAreSelected() {
    let anyNotSelected = false;
    this.state.enrollmentGroups.forEach(enrollmentGroup => {
      if (anyNotSelected) return;
      if (!this.isSelectedEntity(enrollmentGroup, ENTITY_MAP.ENROLLMENT_GROUP_ENDPOINT)) {
        anyNotSelected = true;
      }
    });
    return !anyNotSelected;
  },
  usersAreSelected(users) {
    let anyNotSelected = false;
    users.forEach(user => {
      if (anyNotSelected) return;
      if (!this.isSelectedUser(user)) {
        anyNotSelected = true;
      }
    });
    return !anyNotSelected;
  },
  // FETCHING
  getTeams(q) {
    return this.fetchEntities(q, 'teams');
  },
  getEnrollmentGroups(q) {
    return this.fetchEntities(q, 'enrollmentGroups');
  },
  fetchEntities(q, type) {
    let store;
    if (type === ENTITY_MAP.ENROLLMENT_GROUP_ENDPOINT) {
      store = EnrollmentGroupsState.Store;
    }
    if (type === ENTITY_MAP.TEAM_ENDPOINT) {
      store = TeamsState.Store;
    }
    const fetch = store.getItems(q);
    if (fetch.result) {
      if (
        type === ENTITY_MAP.TEAM_ENDPOINT &&
        // Don't add the no team group to team manager results
        !this.state.currentUser.get('learner').is_learner_group_admin
      ) {
        // Add `noTeam` team (i.e. team for users without a team)
        const noTeam = this.makeNoTeam();
        fetch.result = fetch.result.push(noTeam);
      }
      this.state[type] = this.state[type].withMutations(map => {
        fetch.result.forEach(entity => {
          map.set(entity.get('id'), entity);
        });
        return map;
      });
    }
    return fetch;
  },
  getUsersForTeam(team) {
    const q = {
      limit: 0,
      ordering: 'first_name',
      is_active: true,
      fields: ['id', 'url', 'first_name', 'last_name', 'learner']
    };
    if (this.isNoTeam(team)) {
      q.has_no_team = true;
    } else {
      q.learner__learnergroups = team.get('id');
    }
    const fetch = UsersState.Store.getItems(q);
    this.userFetchPromise(fetch, 'teams', team);
    return fetch;
  },
  getUsersForEnrollmentGroup(enrollmentGroup, currentUser) {
    const learner = currentUser.get('learner');
    const q = {
      limit: 0,
      is_active: true,
      ordering: 'first_name'
    };
    if (
      !learner.is_company_admin &&
      !learner.is_area_manager &&
      !learner.is_training_unit_admin &&
      learner.is_learner_group_admin
    ) {
      _.extend(q, { learner__learnergroups: getIdFromApiUrl(learner.learner_group) });
    }

    q.enrollment_groups = enrollmentGroup.get('id');

    const fetch = UsersState.Store.getItems(q);
    this.userFetchPromise(fetch, 'enrollmentGroups', enrollmentGroup);
    return fetch;
  },
  userFetchPromise(fetch, endpoint, entity) {
    // shared logic between fetch for users in team / enrollment group
    let selectedEntities;
    if (endpoint === ENTITY_MAP.ENROLLMENT_GROUP_ENDPOINT) {
      selectedEntities = this.state.selectedEnrollmentGroups;
    }
    if (endpoint === ENTITY_MAP.TEAM_ENDPOINT) {
      selectedEntities = this.state.selectedTeams;
    }
    fetch.toPromise().then(results => {
      let storedEntity = this.state[endpoint].get(entity.get('id'));
      storedEntity = storedEntity.set('__users', results);
      this.state[endpoint] = this.state[endpoint].set(storedEntity.get('id'), storedEntity);
      if (this.state.selectedEnrollmentGroups.get(entity.get('url'))) {
        this.onSetSelectedForManyUsers(storedEntity.get('__users'), true);
      }
      // Remove team from selectedEnrollmentGroups, as now selection state for
      // enrollment group is determined by it's users
      selectedEntities = selectedEntities.delete(entity.get('url'));
    });
  },
  // RETRIEVAL
  getSelectedUsers() {
    return this.state.selectedUsers;
  },
  getSelectedUserURLs() {
    return this.state.selectedUsers
      .toSeq()
      .keySeq()
      .toArray();
  },
  getSelectedLearnerURLs() {
    return this.state.selectedUsers
      .toSeq()
      .valueSeq()
      .map(user => user.get('learner'))
      .toArray();
  },
  getSelectedTeamURLs() {
    return this.state.selectedTeams
      .toSeq()
      .keySeq()
      .toArray();
  },
  getSelectedEnrollmentGroupURLs() {
    return this.state.selectedEnrollmentGroups
      .toSeq()
      .keySeq()
      .toArray();
  },
  getUsersFromSelectedTeams() {
    // to avoid creating another endpoint that accepts teams, instead create
    // an array of all users in selected teams.
    const teams = this.state.teams;
    const selectedTeams = this.getSelectedTeamURLs();
    const teamIds = selectedTeams.map(team => parseInt(getIdFromApiUrl(team)));
    const teamObjs = teamIds.map(id => teams.get(id));
    const members = [];
    teamObjs.forEach(team => {
      const teamMembers = team.get('members');
      teamMembers.forEach(member => {
        members.push(member.user);
      });
    });
    return members;
  },
  getUserSearch() {
    return this.state.userSearch;
  }
});

app.register('ManyUserSelectionStore', ManyUserSelectionStore);
app.register('ManyUserSelectionActionCreators', ManyUserSelectionActionCreators);
const ActionCreators = app.ManyUserSelectionActionCreators;
const Store = app.ManyUserSelectionStore;

export default {
  Constants,
  ActionCreators,
  Store
};
