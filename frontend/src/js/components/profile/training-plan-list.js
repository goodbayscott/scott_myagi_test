import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import moment from 'moment-timezone';
import _ from 'lodash';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getHeaders, getRows } from 'utilities/table';

import createPaginatedStateContainer from 'state/pagination';
import TrainingPlansState from 'state/training-plans';

import { LoadingContainer } from 'components/common/loading';
import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { Dropdown } from 'components/common/dropdown';

const styles = {
  container: {
    marginTop: 60
  },
  dropdownMenu: {
    width: '140px'
  },
  settings: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    fontSize: '18px'
  },
  removeTraining: {
    color: Style.vars.colors.get('darkGrey'),
    fontSize: '16px',
    marginLeft: '10px'
  }
};

const PROGRESS_COLORS = {
  0.0: Style.vars.colors.get('red'),
  100.0: Style.vars.colors.get('oliveGreen')
};

export function getColorForProgress(progress) {
  let progColor;
  _.each(PROGRESS_COLORS, (color, val) => {
    if (progress >= parseFloat(val)) {
      progColor = color;
    }
  });
  return progColor;
}

class TrainingPlanList extends React.Component {
  static data = {
    trainingPlans: {
      fields: [
        'name',
        'next_due_date_for_user',
        'progress_for_user',
        'owner.company_name',
        'user_is_enrolled'
      ]
    },
    user: {
      fields: ['learner.can_view_all_training_content']
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  static tableDataMapping = {
    Name: i => `${i.get('name')}`,
    'Created By': i => i.get('owner').company_name,
    'Due Date': i =>
      (i.get('next_due_date_for_user')
        ? t('due_from_now', { date: moment(i.get('next_due_date_for_user')).fromNow() })
        : t('no_due_date')),
    Progress: i => {
      let progress = i.get('progress_for_user') * 100;
      progress = progress.toFixed(1);
      const col = getColorForProgress(progress);
      return (
        <div style={{ color: col }} key={progress}>
          {progress}%
        </div>
      );
    },
    Actions: (i, cxt) => {
      const removeEnrollment = () => cxt.removeEnrollmentsForPlan(i);
      let action;
      if (!i.get('user_is_enrolled')) return (action = <span>None available</span>);
      action = (
        <div className="ui item" onClick={removeEnrollment}>
          Remove Enrollment
          <i className="remove icon" style={styles.removeTraining} />
        </div>
      );
      return (
        <Dropdown className="ui top left pointing dropdown">
          <i className="setting icon" style={styles.settings} />
          <div className="menu" style={styles.dropdownMenu}>
            {action}
          </div>
        </Dropdown>
      );
    }
  };

  constructor() {
    super();
    this._disenrolledPlans = [];
  }

  removeEnrollmentsForPlan(plan) {
    TrainingPlansState.ActionCreators.doDetailAction(plan.get('id'), 'disenroll_user', {
      user: this.props.user.get('url')
    });
    this.context.displayTempPositiveMessage({
      heading: `Enrollment removed for ${plan.get('name')}`
    });
    this._disenrolledPlans.push(plan.get('id'));
  }

  render() {
    return (
      <LoadingContainer
        loadingProps={[this.props.trainingPlans]}
        createComponent={() => {
          let trainingPlans = this.props.trainingPlans;
          // Filter out disenrolled plans if user cannot view all training
          // content
          if (!this.props.user.get('learner').can_view_all_training_content) {
            trainingPlans = trainingPlans.filter(p => !_.includes(this._disenrolledPlans, p.get('id')));
          }
          const headers = getHeaders(this.constructor.tableDataMapping);
          const rows = getRows(this.constructor.tableDataMapping, trainingPlans, this);
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
                  exportIgnoreHeaders={['Actions']}
                />
              </InfiniteScroll>
            </div>
          );
        }}
      />
    );
  }
}

export default createPaginatedStateContainer(TrainingPlanList, {
  statics: {
    data: {
      user: $y.getData(TrainingPlanList, 'user')
    }
  },

  paginate: {
    store: TrainingPlansState.Store,
    propName: 'trainingPlans',
    limit: 500,
    getQuery() {
      const userId = this.props.user.get('id');
      return {
        viewable_by_user: userId,
        modules__deactivated__isnull: true,
        has_modules: true,
        field_arg__user_is_enrolled__user: userId,
        field_arg__progress_for_user__user: userId,
        field_arg__next_due_date_for_user__user: userId,
        fields: $y.getFields(TrainingPlanList, 'trainingPlans'),
        ordering: 'name'
      };
    }
  },

  pending() {
    return containerUtils.defaultPending(this, TrainingPlanList);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TrainingPlanList, errors);
  }
});
