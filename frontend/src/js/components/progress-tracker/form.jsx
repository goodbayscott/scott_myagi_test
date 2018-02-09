import Im from 'immutable';
import React from 'react';
import moment from 'moment-timezone';
import _ from 'lodash';

import containerUtils from 'utilities/containers.js';
import ProgressTrackerState from './state.js';

import { FormState } from 'components/common/semantic/forms.jsx';
import { InputBoxField, MultiSelectSearchField } from 'components/common/semantic/fields.jsx';

const CollectionField = React.createClass({
  propTypes: {
    items: React.PropTypes.instanceOf(Im.List).isRequired,
    action: React.PropTypes.func,
    name: React.PropTypes.string.isRequired,
    value: React.PropTypes.array
  },
  handleUpdate(value) {
    if (value) {
      let valueArray = _.clone(this.props.value);
      valueArray = _.filter(valueArray, x => x != value);
      if (this.props.onUpdate) {
        const updates = {
          name: this.props.name,
          value: valueArray
        };
        this.props.onUpdate(updates);
      }
    }
  },
  render() {
    const content = this.props.items
      .map(item => <CollectionItem key={item.get('id')} item={item} action={this.handleUpdate} />)
      .toArray();
    return <div className="ui divided list">{content}</div>;
  }
});

const CollectionItem = React.createClass({
  propTypes: {
    item: React.PropTypes.instanceOf(Im.Map).isRequired,
    action: React.PropTypes.func
  },
  takeAction() {
    this.props.action(this.props.item.get('id'));
  },
  render() {
    return (
      <div className="item">
        <button className="right floated compact ui button" onClick={this.takeAction}>
          Remove
        </button>
        <img className="ui avatar image" src={this.props.item.get('thumbnail_url')} />
        <div className="content">
          <div className="">{this.props.item.get('name')}</div>
        </div>
      </div>
    );
  }
});

const GoalForm = React.createClass({
  propTypes: {
    plans: React.PropTypes.instanceOf(Im.List).isRequired,
    formState: React.PropTypes.object.isRequired,
    onUpdate: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      planQuery: null
    };
  },
  submit() {
    const result = this.props.submit();
  },
  handleQuery(value) {
    this.setState({
      planQuery: value
    });
  },
  getCommonFormProps(name) {
    return {
      name,
      value: this.props.formState.fields.get(name).value,
      valid: this.props.formState.fields.get(name).valid,
      onUpdate: this.props.onUpdate
    };
  },
  getDeleteButton() {
    const goal = this.props.goal;
    if (goal) {
      const onClick = () => {
        ProgressTrackerState.ActionCreators.deleteGoal(goal.get('id'));
      };
      return (
        <button className="ui submit button" onClick={onClick}>
          Delete Goal
        </button>
      );
    }
  },
  render() {
    const queryText = this.state.planQuery;
    let plans = this.props.plans;
    if (queryText) {
      plans = plans.filter(x =>
        x
          .get('name')
          .toLowerCase()
          .includes(queryText.toLowerCase()));
    }
    const planOptions = plans.map(x => ({ display: x.get('name'), value: x.get('id') })).toJS();
    const planField = this.props.formState.fields.get('plans');
    let selectedPlans = Im.List();
    if (planField) {
      selectedPlans = plans.filter(x => _.includes(planField.value, x.get('id')));
    }
    return (
      <div className="ui form">
        <InputBoxField
          placeholder="Goal Name (ex. Initial Training)"
          {...this.getCommonFormProps('name')}
        />
        <MultiSelectSearchField
          label="Plans"
          placeholder="Select or search..."
          onQuery={this.handleQuery}
          options={planOptions}
          {...this.getCommonFormProps('plans')}
        />
        <CollectionField items={selectedPlans} {...this.getCommonFormProps('plans')} />
        <InputBoxField
          placeholder="yyyy-mm-dd"
          label="End date (optional)"
          {...this.getCommonFormProps('end_date')}
        />
        <div className="ui divider" />
        <div style={{ textAlign: 'right' }}>
          {this.getDeleteButton()}
          <button className="ui submit button" onClick={this.submit}>
            Save
          </button>
        </div>
      </div>
    );
  }
});

const validateName = obj => {
  let valid = false;
  if (_.has(obj, 'value')) {
    const value = obj.value;
    if (value) {
      const regex = /^[\S\s]{1,30}$/;
      valid = regex.test(value);
    }
  }
  obj.valid = valid;
  return obj;
};

const validateDate = obj => {
  let valid = false;
  if (_.has(obj, 'value')) {
    const value = obj.value;
    valid = true;
    if (value) {
      const timeZoneAdjustedValue = `${value} 00:00 +0000`;
      const parsedDate = moment(timeZoneAdjustedValue, 'YYYY-MM-DD HH:mm Z', true);
      obj.cleanedValue = parsedDate.toISOString();
      valid = parsedDate.isValid();
    }
  }
  obj.valid = valid;
  return obj;
};

export const GoalFormStateContainer = React.createClass({
  getInitialState() {
    let key,
      name,
      endDate;
    let planIds = [];

    if (this.props.goal) {
      const goal = this.props.goal;
      key = goal.get('id');
      name = goal.get('name');
      endDate = goal.get('end_date');
      if (endDate) {
        endDate = moment(endDate, 'YYYY-MM-DD HH:mm Z').format('YYYY-MM-DD');
      }
      planIds = Im.fromJS(this.props.goal.get('plans'))
        .map(x => x.get('id'))
        .toArray();
    } else {
      key = -Math.floor(Math.random() * 1000);
    }

    const formState = new FormState();
    formState.register('name', [validateName], name);
    formState.register('end_date', [validateDate], endDate);
    formState.register('plans', [], planIds);

    return {
      formState,
      key
    };
  },
  isValid() {
    return this.state.formState.fields.map(x => x.valid).reduce((r, x) => x && r, true);
  },
  buildRequestPayload() {
    const formState = this.state.formState;
    const name = formState.fields.get('name').value;
    const plansField = formState.fields.get('plans');

    const plans = this.props.plans
      .filter(x => _.includes(plansField.value, x.get('id')))
      .map(x => x.get('url'))
      .toArray();

    const goal = {
      name,
      plans,
      end_date: null
    };

    const endDate = formState.fields.get('end_date').cleanedValue;
    if (endDate) {
      goal.end_date = endDate;
    }

    if (this.props.goal) {
      goal.id = this.props.goal.get('id');
    }

    return goal;
  },
  submit() {
    if (this.isValid()) {
      const data = this.buildRequestPayload();
      if (data.id) {
        ProgressTrackerState.ActionCreators.updateGoal(data);
      } else {
        ProgressTrackerState.ActionCreators.createGoal(data);
      }
    }
  },
  handleUpdate(updates) {
    this.state.formState.update(updates.name, updates.value);
    this.forceUpdate();
  },
  render() {
    return (
      <GoalForm
        key={this.state.key}
        goal={this.props.goal}
        plans={this.props.plans}
        formState={this.state.formState}
        onUpdate={this.handleUpdate}
        submit={this.submit}
      />
    );
  }
});
