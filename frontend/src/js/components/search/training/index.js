import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Style from 'style/index';

import { ANALYTICS_EVENTS } from 'core/constants';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { qs } from 'utilities/http';

import { t, getNavigatorLocale } from 'i18n';

import createPaginatedStateContainer from 'state/pagination';
import ModulesState from 'state/modules';
import AppState from 'components/app/state';

import { LoadingContainer } from 'components/common/loading';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { Title, Description, ListItem, ListItemCollection } from 'components/common/list-items';
import { Image } from 'components/common/image';
import { ModuleDetails } from './module-details';

class ModuleResult extends React.Component {
  static data = {
    module: {
      fields: [
        'name',
        'thumbnail_url',
        'search_rank',
        'training_plans.name',
        'training_plans.training_unit.name',
        'training_plans.owner.company_name',
        $y.getFields(ModuleDetails, 'module')
      ]
    }
  };

  constructor() {
    super();
    this.state = {
      showDetails: false
    };
  }

  toggle = () => {
    const newVal = !this.state.showDetails;
    this.setState({ showDetails: newVal });
    if (newVal) {
      analytics.track(ANALYTICS_EVENTS.VIEWED_MODULE_SEARCH_RESULT, {
        'Module name': this.props.module.get('name')
      });
    }
  };

  render() {
    const { module } = this.props;
    const image = module.get('thumbnail_url');
    const trainingPlans = module.get('training_plans');
    if (!trainingPlans.length) return null;
    const trainingPlan = trainingPlans[0];
    // There's occassionally an error that occurs when the plan owner is null.
    // Haven't been able to replicate, but this has been occurring fairly
    // regularly for some time.
    let ownerName;
    if (trainingPlan.owner && trainingPlan.owner.company_name) {
      ownerName = trainingPlan.owner.company_name;
    }
    const tuName = trainingPlan.training_unit ? trainingPlan.training_unit.name : '';
    return (
      <ListItem onClick={_.noop}>
        <div className="ui two column grid" onClick={this.toggle}>
          <div className="ui column">
            <Title>{module.get('name')}</Title>
            <Description>{trainingPlan.name}</Description>
            <Description>{tuName}</Description>
            {ownerName ? <Description>{ownerName}</Description> : null}
          </div>
          <div className="ui column">
            <Image src={image} style={{ height: '6em' }} />
          </div>
        </div>
        {this.state.showDetails && <ModuleDetails module={module} />}
      </ListItem>
    );
  }
}

class ModuleResults extends React.Component {
  static data = {
    modules: $y.getData(ModuleResult, 'module', { many: true, required: false })
  };

  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.modules]}
        noDataText="We could not find any lessons matching that search term"
        createComponent={() => (
          <InfiniteScroll
            loadMore={this.props.loadMore}
            moreDataAvailable={this.props.moreDataAvailable}
            dataIsLoading={this.props.dataIsLoading}
          >
            <ListItemCollection
              entities={this.props.modules}
              createListItem={module => <ModuleResult key={module.get('id')} module={module} />}
            />
          </InfiniteScroll>
        )}
      />
    );
  }
}

export const TrainingSearch = createPaginatedStateContainer(ModuleResults, {
  listenTo: [ModulesState.Store, AppState.Store],

  paginate: {
    store: ModulesState.Store,
    propName: 'modules',
    limit: 20,
    getQuery() {
      // NOTE - The `query` prop SHOULD be used, however for
      // some reason that is not getting updated correctly here (even
      // though it is being past down correctly by the parent component).
      // This is just a quick fix in the meantime.
      const q = AppState.Store.getSearch();
      if (!q) return undefined;
      return {
        fields: $y.getFields(ModuleResults, 'modules'),
        viewable_by_user: this.props.currentUser.get('id'),
        search: q,
        ordering: '-search_rank'
      };
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ModuleResults);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ModuleResults, errors);
  }
});
