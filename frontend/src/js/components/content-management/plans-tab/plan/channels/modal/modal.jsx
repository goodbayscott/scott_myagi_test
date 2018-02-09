import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import reactMixin from 'react-mixin';

import TrainingPlanTrainingUnitsState from 'state/training-plan-training-units';

import { DescriptionBox } from 'components/settings/common/';
import { ScrollableDataTable } from 'components/common/table';
import { SlideToggle } from 'components/common/form';

import { SearchInput, searchMixinFactory } from 'components/common/search';

const styles = {
  container: {},
  slideToggle: {
    marginLeft: 10,
    verticalAlign: 'bottom'
  },
  toggleItem: {
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 400
  },
  channelTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    display: 'inline-block'
  }
};

class ChannelsCollection extends React.Component {
  static data = {
    channels: {
      required: true,
      fields: [
        'id',
        'name',
        'url',
        'training_plans.url',
        'training_plans.training_units',
        'subscribed_companies_count'
      ]
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {};
  }

  planInChannel = channel => {
    const planURLS = channel.get('training_plans').map(plan => plan.url);
    return planURLS.indexOf(this.props.plan.get('url')) > -1;
  };

  toggleChannel = channel => {
    if (this.planInChannel(channel)) {
      TrainingPlanTrainingUnitsState.ActionCreators.doListAction(
        'delete_for_plan_and_training_unit',
        {
          training_plan: this.props.plan.get('url'),
          training_unit: channel.get('url')
        }
      );
    } else {
      TrainingPlanTrainingUnitsState.ActionCreators.create({
        training_plan: this.props.plan.get('url'),
        training_unit: channel.get('url'),
        order: 0
      });
    }
    this.context.displayTempPositiveMessage({
      heading: 'changes_saved'
    });
  };

  createSlideToggle = (label, initial, onChange, disabled = false) => (
    <SlideToggle key={initial} initialValue={initial} onChange={onChange} disabled={disabled} />
  );

  static tableDataMapping = {
    Name: c => c.get('name'),
    'Connected companies': c => c.get('subscribed_companies_count'),
    'Plan connected': (c, cxt) => {
      const onChange = () => {
        cxt.toggleChannel(c);
      };
      const planInChannel = cxt.planInChannel(c);
      const slideToggle = cxt.createSlideToggle('Connected', planInChannel, onChange);
      return slideToggle;
    }
  };

  getDataMapping() {
    const mapping = ChannelsCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  getRows() {
    const funcs = _.values(this.getDataMapping());
    return this.props.channels.map(c => Im.List(funcs.map(f => f(c, this))));
  }

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();

    return (
      <div>
        <ScrollableDataTable
          headers={headers}
          rows={rows}
          bodyHeight={null}
          ref="table"
          // Disabled sort when user is searching, because table will be sorted according to
          // search rank
          sortDisabled={Boolean(this.props.search)}
        />
      </div>
    );
  }
}

@reactMixin.decorate(searchMixinFactory('channels', {
  keys: ['name']
}))
export class ChannelsModal extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <DescriptionBox
          style={{ marginBottom: 20 }}
          // TODO
          info={`Which channels should include the "${this.props.plan.get('name')}" plan?`}
        />
        {this.props.channels ? (
          <SearchInput
            {...this.getSearchInputProps()}
            style={{ container: { width: 260, marginBottom: 20 } }}
          />
        ) : null}

        <ChannelsCollection
          channels={this.state.searchResults.channels}
          plan={this.props.plan}
          currentUser={this.props.currentUser}
        />
      </div>
    );
  }
}
