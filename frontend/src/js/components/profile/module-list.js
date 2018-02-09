import React from 'react';
import { t } from 'i18n';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getHeaders, getRows } from 'utilities/table';

import createPaginatedStateContainer from 'state/pagination';
import ModulesState from 'state/modules';
import TrainingPlansState from 'state/training-plans';

import { LoadingContainer } from 'components/common/loading';
import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';

const styles = {
  container: {
    marginTop: 60
  }
};

class ModuleList extends React.Component {
  static data = {
    modules: {
      fields: ['name', 'training_plans.name', 'personal_best_score_for_user']
    },
    trainingPlans: {
      fields: ['name']
    }
  };

  static tableDataMapping = {
    Name: i => `${i.get('name')}`,
    Plans: (i, cxt) => {
      const availablePlanNames = cxt.props.trainingPlans.map(tp => tp.get('name')).toArray();
      let names = i.get('training_plans').map(plan => plan.name);
      names = names.filter(n => _.includes(availablePlanNames, n));
      names = _.uniq(names);
      return names.join(', ');
    },
    'Best Score': i => {
      const score = i.get('personal_best_score_for_user');
      let key;
      let txt;
      if (score === null) {
        txt = 'None';
        key = -1.0;
      } else {
        txt = `${score.toFixed(1)}%`;
        key = parseFloat(score);
      }
      return <span key={key}>{txt}</span>;
    }
  };

  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.modules, this.props.trainingPlans]}
        createComponent={() => {
          const headers = getHeaders(this.constructor.tableDataMapping);
          const rows = getRows(this.constructor.tableDataMapping, this.props.modules, this);
          return (
            <div style={styles.container}>
              <InfiniteScroll
                loadMore={this.props.loadMore}
                moreDataAvailable={this.props.moreDataAvailable}
                dataIsLoading={this.props.dataIsLoading}
              >
                <ScrollableDataTable
                  headers={headers}
                  rows={rows}
                  bodyHeight={null}
                  exportEnabled
                />
              </InfiniteScroll>
            </div>
          );
        }}
      />
    );
  }
}

export default createPaginatedStateContainer(ModuleList, {
  listenTo: [TrainingPlansState.Store],

  paginate: {
    store: ModulesState.Store,
    propName: 'modules',
    limit: 500,
    getQuery() {
      return {
        viewable_by_user: this.props.user.get('id'),
        field_arg__personal_best_score_for_user__user: this.props.user.get('id'),
        fields: $y.getFields(ModuleList, 'modules'),
        ordering: 'name'
      };
    }
  },

  fetch: {
    trainingPlans() {
      return TrainingPlansState.Store.getItems({
        fields: $y.getFields(ModuleList, 'trainingPlans'),
        limit: 500,
        viewable_by_user: this.props.user.get('id'),
        deactivated__isnull: true
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ModuleList);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ModuleList, errors);
  }
});
