import Im from 'immutable';
import Marty from 'marty';
import querystring from 'querystring';

import app from 'core/application';

import {
  getWriteHeaders,
  getReadHeaders,
  parseQueryOpt,
  generateQueryString,
  getFullUrl,
  getActionConstants,
  wrapApiGet,
  wrapApiPatch,
  wrapApiPost
} from 'state/common/utils.js';

const Constants = Marty.createConstants([
  'PROGRESSTRACKER_SET_GOAL_ID',
  'PROGRESSTRACKER_RECEIVE_REPORT',
  'PROGRESSTRACKER_SET_ACTIVE_PANEL',
  'PROGRESSTRACKER_RECEIVE_GOALS',
  'PROGRESSTRACKER_UPDATE_GOAL',
  'PROGRESSTRACKER_CREATE_GOAL',
  'PROGRESSTRACKER_DELETE_GOAL'
]);

class ProgressTrackerAPI extends Marty.HttpStateSource {
  endpoint = '/api/v1/goals';
  fields = ['*', 'plans.name', 'plans.id', 'plans.url', 'plans.thumbnail_url'];

  createItem = (data, opts) => {
    const qs = generateQueryString({ fields: this.fields });
    const url = `${this.endpoint}/?${qs}`;
    return this.post({
      url,
      credentials: 'include',
      headers: getWriteHeaders(),
      body: JSON.stringify(data)
    });
  };

  getItem = id => {
    const qs = generateQueryString({ fields: this.fields });
    const url = `${this.endpoint}/${id}/?${qs}`;
    return this.get({
      url,
      credentials: 'include',
      headers: getReadHeaders()
    });
  };

  getItems = query => {
    const opts = Im.Map({ fields: this.fields });
    const url = getFullUrl(this.endpoint, opts);
    return this.get({
      url,
      credentials: 'include',
      headers: getReadHeaders()
    });
  };

  updateItem = data => {
    const id = data.id;
    const qs = generateQueryString({ fields: this.fields });
    const url = `${this.endpoint}/${id}/?${qs}`;
    return this.patch({
      url,
      credentials: 'include',
      headers: getWriteHeaders(),
      body: JSON.stringify(data)
    });
  };

  deleteItem = id => {
    const url = `${this.endpoint}/${id}/`;
    return this.delete({
      url,
      credentials: 'include',
      headers: getWriteHeaders()
    });
  };

  getReport = (goalId, queryParams) => {
    const qs = querystring.stringify(queryParams);
    const url = `${this.endpoint}/${goalId}/report/?${qs}`;
    return this.get({
      url,
      headers: getReadHeaders()
    });
  };
}

app.register('ProgressTrackerAPI', ProgressTrackerAPI);
const progressTrackerAPI = app.ProgressTrackerAPI;

class ProgressTrackerActionCreators extends Marty.ActionCreators {
  setGoalId = goalId => {
    this.dispatch(Constants.PROGRESSTRACKER_SET_GOAL_ID, goalId);
  };

  clearGoalId = () => {
    this.dispatch(Constants.PROGRESSTRACKER_CLEAR_GOAL_ID);
  };

  setActivePanel = slug => {
    this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL, slug);
  };

  activateProgressPanel = () => {
    this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL, 'progress');
  };

  activateGoalPanel = () => {
    this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL, 'detail');
  };

  activateEditorPanel = () => {
    this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL, 'editor');
  };

  activateNewPanel = () => {
    this.dispatch(Constants.PROGRESSTRACKER_SET_GOAL_ID);
    this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL, 'new');
  };

  activateExistingGoal = goalId => {
    this.dispatch(Constants.PROGRESSTRACKER_SET_GOAL_ID, goalId);
    this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL);
  };

  createGoal(goal) {
    const actionConstants = getActionConstants(Constants.PROGRESSTRACKER_CREATE_GOAL);
    this.dispatch(actionConstants.starting, goal);
    progressTrackerAPI
      .createItem(goal)
      .then(response => {
        const goalFromServer = Im.fromJS(response.body);
        this.dispatch(actionConstants.base, goalFromServer, response.headers, goal);
        this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL, null);
      })
      .catch(err => this.dispatch(actionConstants.failed, goal, err));
  }

  updateGoal(goal) {
    const actionConstants = getActionConstants(Constants.PROGRESSTRACKER_UPDATE_GOAL);
    this.dispatch(actionConstants.starting, goal);
    progressTrackerAPI
      .updateItem(goal)
      .then(response => {
        const goalFromServer = Im.fromJS(response.body);
        this.dispatch(actionConstants.base, goalFromServer, response.headers, goal);
        this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL);
      })
      .catch(err => this.dispatch(actionConstants.failed, goal, err));
  }

  deleteGoal(goalId) {
    const actionConstants = getActionConstants(Constants.PROGRESSTRACKER_DELETE_GOAL);
    this.dispatch(actionConstants.starting, goalId);
    progressTrackerAPI
      .deleteItem(goalId)
      .then(response => {
        this.dispatch(Constants.PROGRESSTRACKER_SET_GOAL_ID);
        this.dispatch(Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL);
        this.dispatch(actionConstants.base, goalId, response.body, response.headers);
      })
      .catch(err => {
        console.log(err);
        this.dispatch(actionConstants.failed, goalId, err);
      });
  }
}

class ProgressTrackerQueries extends Marty.Queries {
  @wrapApiGet(Constants.PROGRESSTRACKER_RECEIVE_REPORT)
  getReport(goalId, queryParams) {
    return progressTrackerAPI.getReport(goalId, queryParams);
  }

  @wrapApiGet(Constants.PROGRESSTRACKER_RECEIVE_GOALS)
  getGoals() {
    return progressTrackerAPI.getItems();
  }
}

app.register('ProgressTrackerQueries', ProgressTrackerQueries);
const progressTrackerQueries = app.ProgressTrackerQueries;

const Store = Marty.createStore({
  id: 'ProgressTrackerStore',

  handlers: {
    setGoalId: Constants.PROGRESSTRACKER_SET_GOAL_ID,

    receiveGoals: Constants.PROGRESSTRACKER_RECEIVE_GOALS,
    receiveGoal: [Constants.PROGRESSTRACKER_UPDATE_GOAL, Constants.PROGRESSTRACKER_CREATE_GOAL],
    removeGoal: Constants.PROGRESSTRACKER_DELETE_GOAL,
    setActiveGoal: Constants.PROGRESSTRACKER_CREATE_GOAL,

    receiveReport: Constants.PROGRESSTRACKER_RECEIVE_REPORT,

    setActivePanel: Constants.PROGRESSTRACKER_SET_ACTIVE_PANEL
  },

  getInitialState() {
    return Im.Map({
      goalId: null
    });
  },

  reset() {
    this.state = this.getInitialState();
  },

  setGoalId(goalId) {
    this.state = this.state.set('goalId', goalId);
    this.state = this.state.delete('report');
    this.hasChanged();
  },
  receiveReport(report) {
    this.state = this.state.set('report', report);
    this.hasChanged();
  },

  receiveGoals(goals) {
    this.state = this.state.set('goals', goals);
    this.hasChanged();
  },

  receiveGoal(goal) {
    let goals = this.state.get('goals');
    goals = goals.filter(x => x.get('id') != goal.get('id')).push(goal);
    this.state = this.state.set('goals', goals);
    this.hasChanged();
  },

  removeGoal(goalId) {
    let goals = this.state.get('goals');
    goals = goals.filter(x => x.get('id') != goalId);
    this.state = this.state.set('goals', goals);
    this.hasChanged();
  },

  setActiveGoal(goal) {
    this.setGoalId(goal.get('id'));
  },

  setActivePanel(slug) {
    this.state = this.state.set('activePanel', slug);
    this.hasChanged();
  },

  getActivePanel() {
    return this.state.get('activePanel');
  },

  getTeamReport(teamId) {
    const query = Im.Map({
      learnergroup: teamId
    });
    return this.getReport(query);
  },

  getCompanyReport(companyId) {
    const query = Im.Map({
      company: companyId
    });
    return this.getReport(query);
  },

  getGoals() {
    return this.fetch({
      id: 'goals',
      locally() {
        const companies = this.state.get('goals');
        return companies;
      },
      remotely() {
        return progressTrackerQueries.getGoals();
      }
    });
  },

  getReport(query) {
    this.resetStateIfNewQuery(query);
    return this.fetch({
      id: 'progress-report',
      locally() {
        const companies = this.state.get('report');
        return companies;
      },
      remotely() {
        return progressTrackerQueries.getReport(this.state.get('goalId'), query.toJS());
      }
    });
  },

  resetStateIfNewQuery(query) {
    const query_different = this.state.get('query_hash') != query.hashCode();
    if (query_different) {
      this.state = this.state.delete('report');
    }
    this.state = this.state.set('query_hash', query.hashCode());
  },

  getUserStatus(userId) {
    const report = Im.Map(this.state.get('report'));
    if (!report) {
      return null;
    }
    const userResults = Im.Map(report.get('users'));
    const statusMap = userResults.map(value => {
      const userList = Im.List(value);
      return userList.includes(userId);
    });
    return statusMap
      .filter(x => x)
      .keySeq()
      .first();
  }
});

app.register('ProgressTrackerActionCreators', ProgressTrackerActionCreators);
app.register('ProgressTrackerStore', Store);

export default {
  Constants,
  ActionCreators: app.ProgressTrackerActionCreators,
  Store: app.ProgressTrackerStore
};
