import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import Radium from 'radium';
import { t } from 'i18n';
import Select from 'react-select';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import TrainingPlansState from 'state/training-plans';
import PageState from '../../training/plans/page-state';

import createPaginatedStateContainer from 'state/pagination';
import { LoadingContainer, NoData } from 'components/common/loading';
import { TrainingPlanCard, TrainingPlansCollection } from '../../training/plans/plan-card';
import { PlanCard } from 'components/content-management/plans-tab/plan-card';

import Style from 'style';

const styles = {
  countSortingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  searchCount: {
    display: 'inline-block',
    margin: 0
  },
  sorting: {
    width: 114,
    border: 'none',
    cursor: 'pointer',
    height: 20,
    container: {
      display: 'inline-block'
    }
  },
  unpublishedContainer: {
    height: 0
  },
  unpublished: {
    position: 'relative',
    top: 0,
    display: 'inline-block',
    padding: '6px 20px 7px 10px',
    backgroundColor: 'rgba(236, 21, 21, 0.72)',
    color: '#fff',
    borderBottomRightRadius: 27,
    margin: '12px 12px 25px 12px',
    zIndex: 1
  }
};
export class PlansResultsPage extends React.Component {
  static data = {
    plan: {
      required: false,
      fields: ['created', $y.getFields(TrainingPlanCard, 'trainingPlan')]
    }
  };
  static contextTypes = {
    currentUser: React.PropTypes.object.isRequired
  };

  componentWillUpdate() {
    if (PageState.Store.getTrainingPlanSearch() !== this.props.searchQuery) {
      PageState.ActionCreators.setTrainingPlanSearch(this.props.searchQuery);
    }
  }

  createTrainingPlanCard = plan => {
    const learner = this.context.currentUser.get('learner');
    const attemptablePlan = plan.get('is_published') && !plan.get('deactivated');
    const icon = attemptablePlan ? 'play' : 'write';
    return (
      <div>
        {!plan.get('is_published') &&
          !plan.get('deactivated') && (
            <div style={styles.unpublishedContainer}>
              <div style={styles.unpublished}>{t('unpublished')}</div>
            </div>
          )}
        {plan.get('deactivated') ? (
          <PlanCard
            key={plan.get('id')}
            trainingPlan={plan}
            currentUser={this.context.currentUser}
            channels={plan.get('training_units')}
            openTrainingPlanModal={() => {}}
          />
        ) : (
          <TrainingPlanCard
            key={plan.get('id')}
            trainingPlan={plan}
            currentUser={this.context.currentUser}
            linkTo={attemptablePlan ? null : `/views/content/plans/${plan.get('id')}/`}
            hoverIcon={icon}
          />
        )}
      </div>
    );
  };

  render() {
    const SORTING_OPTIONS = [
      { value: '-search_rank', label: t('relevance') },
      { value: 'name', label: t('name_az') },
      { value: '-name', label: t('name_za') },
      { value: '-created', label: t('newest') },
      { value: 'created', label: t('oldest') }
    ];
    return (
      <div>
        <LoadingContainer
          loadingProps={{
            trainingPlans: this.props.plans
          }}
          createComponent={props => (
            <div>
              <div style={styles.countSortingContainer}>
                <Select
                  style={styles.sorting}
                  options={SORTING_OPTIONS}
                  placeholder={<div>{t('sort_by')}</div>}
                  arrowRenderer={({ isOpen }) => (
                    <i
                      className="ui icon sort content descending"
                      style={{ color: isOpen ? 'black' : 'grey' }}
                    />
                  )}
                  clearable={false}
                  valueRenderer={o => <div>{o.label}</div>}
                  searchable={false}
                  onChange={v => PageState.ActionCreators.setTrainingPlanOrder(v.value)}
                  value={PageState.Store.getTrainingPlanOrder()}
                />
              </div>
              <TrainingPlansCollection
                trainingPlans={this.props.plans}
                loadMore={this.props.loadMore}
                moreAvailable={this.props.moreAvailable}
                isLoading={this.props.isLoading}
                createCard={this.createTrainingPlanCard}
              />
            </div>
          )}
          createNoDataComponent={() => (
            <NoData style={{ padding: 20 }}>{t('no_search_results')}</NoData>
          )}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(PlansResultsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, TrainingPlansState.Store],

  paginate: {
    store: TrainingPlansState.Store,
    propName: 'plans',
    limit: 24,
    getQuery() {
      const curFilterQuery = PageState.Store.getCurrentFilterQuery(this.context.currentUser);
      const ordering = PageState.Store.getTrainingPlanOrder();
      const search = PageState.Store.getTrainingPlanSearch();
      const learner = this.context.currentUser.get('learner');

      const query = {
        limit: 24,
        fields: [
          'is_published',
          'deactivated',
          'training_units',
          'training_units.learner_group',
          'created_by',
          'created_by.learner',
          'created_by.learner.id',
          'created_by.learner.learner_group',
          'created_by.learner.is_learner_group_admin',
          $y.getFields(PlansResultsPage, 'plan')
        ],
        ...curFilterQuery,
        search,
        ...(ordering ? { ordering } : { ordering: '-search_rank' })
      };
      if (!learner.is_company_admin) {
        query.is_published = true;
        query.has_modules = true;
        query.deactivated__isnull = true;
      } else {
        query.show_all = true;
      }
      return query;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, PlansResultsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, PlansResultsPage, errors);
  }
});
