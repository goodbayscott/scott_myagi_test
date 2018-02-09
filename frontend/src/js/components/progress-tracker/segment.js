import cx from 'classnames';
import Im from 'immutable';
import Marty from 'marty';
import moment from 'moment-timezone';
import React from 'react';
import _ from 'lodash';

import containerUtils from 'utilities/containers.js';
import ProgressTrackerState from './state.js';

import Style from 'style/index.js';
import TrainingPlansState from 'state/training-plans.js';

import { GoalFormStateContainer } from 'components/progress-tracker/form.jsx';
import { MultiSelectSearchWidget } from 'components/common/semantic/widgets.jsx';

const goalStyle = {
  noPadding: {
    padding: '0px'
  },
  slim: {
    padding: '5px'
  }
};

const GoalMessage = [
  <p>Instructions:</p>,
  <ol>
    <li>Name your goal.</li>
    <li>Select plans that need to be complete in order to complete the goal.</li>
    <li>Set an optional end date by when the plans must be completed.</li>
  </ol>,
  <p>
    It is worth noting, learners will not see goals. They are just a means of gauging progress, not
    assigning work.
  </p>
];

const ProgressSummaryDisplay = React.createClass({
  render() {
    const counts = this.props.report.get('counts');
    const baseClasses = ['ui', 'basic', 'segment'];
    return (
      <div className={cx(baseClasses)} style={goalStyle.noPadding}>
        <div className="ui three column grid">
          <div className="column">
            Pending<br /> {counts.get('pending')}
          </div>
          <div className="column">
            In Process<br /> {counts.get('in_process')}
          </div>
          <div className="column">
            Complete<br /> {counts.get('complete')}
          </div>
        </div>
      </div>
    );
  }
});

const ProgressSummary = Marty.createContainer(ProgressSummaryDisplay, {
  listenTo: [ProgressTrackerState.Store],
  fetch: {
    report() {
      const teamId = this.props.team.get('id');
      return ProgressTrackerState.Store.getTeamReport(teamId);
    }
  },
  pending() {
    return (
      <div className="ui basic loading segment">
        <div className="ui inverted inline text loader" />
      </div>
    );
  },
  failed(errors) {
    return (
      <div className="ui basic segment">
        <p>Something unexpected happened!</p>
      </div>
    );
  }
});

const GoalSummary = React.createClass({
  render() {
    return (
      <div>
        {this.getDueDate()}
        <ul>{this.getPlanListItems()}</ul>
      </div>
    );
  },
  getDueDate() {
    const endDate = this.props.goal.get('end_date');
    let content;
    if (endDate) {
      const formattedEndDate = moment(endDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
      content = (
        <p>
          A team member will be considered complete if following plans are complete by{' '}
          {formattedEndDate}.
        </p>
      );
    } else {
      content = <p>No Due Date</p>;
    }
    return content;
  },
  getPlanListItems() {
    const plans = this.props.goal.get('plans');
    return plans.map(item => <li key={item.get('id')}>{item.get('name')}</li>);
  }
});

const GoalEditor = Marty.createContainer(GoalFormStateContainer, {
  listenTo: [TrainingPlansState.Store],
  fetch: {
    plans() {
      return TrainingPlansState.Store.getItems({
        ordering: 'name',
        fields: ['name', 'id', 'url', 'thumbnail_url'],
        limit: 0
      });
    }
  },
  pending() {
    return <div> Loading </div>;
  },
  failed(errors) {
    return <div> Failed </div>;
  }
});

const ProgressReportDisplay = React.createClass({
  render() {
    const goals = this.props.goals.map(x => ({ display: x.get('name'), value: x.get('id') }));
    const goalOptions = goals.unshift({ display: 'Create new goal...', value: -1 }).toJS();

    let content;
    if (goals.size === 0 && !this.props.loading) {
      content = (
        <div className="ui segment">
          <h4 className="ui header">Progress Tracker</h4>
          <div className="ui stackable grid">
            <div className="sixteen wide column">
              <p>Progress tracker allows you to track the plan progress of your team.</p>
              {GoalMessage}
              <GoalEditor />
            </div>
          </div>
        </div>
      );
    } else {
      content = (
        <div className="ui segment">
          <h4 className="ui header">Progress Tracker</h4>
          <div className="ui stackable grid">
            <div className="sixteen wide column">
              <MultiSelectSearchWidget
                name="goal"
                placeholder="Select or create new..."
                options={goalOptions}
                value={this.getSelected()}
                onUpdate={this.setGoal}
                fluid
              />
            </div>
            {this.getGoalDetailSegment()}
          </div>
        </div>
      );
    }
    return content;
  },
  getSelected() {
    const goalId = ProgressTrackerState.Store.state.get('goalId');
    const goalIds = [];
    if (goalId) {
      goalIds.push(goalId);
    }
    return goalIds;
  },
  setGoal(goalId) {
    if (goalId === -1) {
      ProgressTrackerState.ActionCreators.activateNewPanel();
    } else {
      ProgressTrackerState.ActionCreators.activateExistingGoal(goalId);
    }
  },
  deactivatePanel() {
    this.setActivePanel();
  },
  setActivePanel(slug) {
    this.setState({
      activePanel: slug
    });
  },
  getGoalDetailSegment() {
    const goalId = ProgressTrackerState.Store.state.get('goalId');
    let goal;
    if (goalId) {
      goal = this.props.goals.filter(x => x.get('id') === goalId).first();
    }
    const activePanel = ProgressTrackerState.Store.getActivePanel();
    let content;
    if (goal) {
      content = (
        <div className="sixteen wide column" key={goalId}>
          <div className="ui three tiny basic buttons fluid" style={{ marginTop: '5px' }}>
            <button
              className="ui button"
              onClick={ProgressTrackerState.ActionCreators.activateProgressPanel}
            >
              Progress Summary
            </button>
            <button
              className="ui button"
              onClick={ProgressTrackerState.ActionCreators.activateGoalPanel}
            >
              Goal Details
            </button>
            <button
              className="ui button"
              onClick={ProgressTrackerState.ActionCreators.activateEditorPanel}
            >
              Goal Editor
            </button>
          </div>
          <div className="ui divider" />
          {this.getGoalDetailContent(goal)}
        </div>
      );
    } else if (activePanel === 'new') {
      content = (
        <div className="sixteen wide column">
          {GoalMessage}
          <GoalEditor />
        </div>
      );
    }
    return content;
  },
  getGoalDetailContent(goal) {
    const activePanel = ProgressTrackerState.Store.getActivePanel();
    if (activePanel === 'detail') {
      return <GoalSummary goal={goal} />;
    } else if (activePanel === 'editor') {
      return <GoalEditor goal={goal} />;
    }
    return <ProgressSummary team={this.props.team} />;
  }
});

export const ProgressReportSegment = Marty.createContainer(ProgressReportDisplay, {
  listenTo: [ProgressTrackerState.Store],
  fetch: {
    goals() {
      return ProgressTrackerState.Store.getGoals();
    }
  },
  getDefaultProps() {
    return {
      goals: Im.List()
    };
  },
  pending() {
    return containerUtils.defaultPending(this, ProgressReportDisplay);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, ProgressReportDisplay, errors);
  }
});

export const ProgressLabel = React.createClass({
  propTypes: {
    status: React.PropTypes.string
  },
  getStatus() {
    const status = this.props.status;
    return status;
  },
  getLabelText() {
    return _.startCase(this.getStatus());
  },
  getLabelClassNames() {
    const status = this.getStatus();
    const baseClasses = ['ui', 'small', 'label'];
    if (status === 'pending') {
      baseClasses.push('red');
    } else if (status === 'in_process') {
      baseClasses.push('yellow');
    } else if (status === 'complete') {
      baseClasses.push('green');
    }
    return baseClasses;
  },
  render() {
    const labelClasses = cx(this.getLabelClassNames());
    const labelText = this.getLabelText();
    return <div className={labelClasses}>{labelText}</div>;
  }
});
