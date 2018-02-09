import React from 'react';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import Style from 'style';
import { t } from 'i18n';
import { momentToISO } from 'utilities/time';
import { getIdFromApiUrl } from 'utilities/generic';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import TrainingPlansState from 'state/training-plans';
import TrainingSchedulesState from 'state/training-schedules';
import PageState from './page-state';
import ModulesState from 'state/modules';

import { resolve } from 'react-router-named-routes';
import { LessonCard } from './lesson-card';
import { FilterSet } from 'components/common/filter-set';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { LoadingContainer, NoData } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';

const styles = {
  background: {
    backgroundColor: Style.vars.colors.get('white'),
    marginLeft: 20,
    marginTop: 20,
    marginRight: 20
  },
  searchInputStyle: {
    border: 'none',
    width: 120,
    container: {
      margin: '5px 0px 5px 5px'
    }
  },
  filterSetContainer: {
    marginTop: -12,
    marginBottom: 25,
    padding: '5px 0px',
    borderBottom: `1px solid ${Style.vars.colors.get('fadedOffBlack')}`,
    borderTop: `1px solid ${Style.vars.colors.get('fadedOffBlack')}`,
    color: Style.vars.colors.get('xxDarkGrey'),
    clear: 'both',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  filterButtonContainer: {
    margin: '5px 0 5px 0',
    display: 'inline-block'
  },
  searchAndSortContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 20
  }
};

export class LessonsCollection extends React.Component {
  static propTypes = {
    lessons: React.PropTypes.instanceOf(Im.List).isRequired
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  archiveConfirmClick = lesson => {
    if (lesson.get('deactivated') !== null) return;
    const now = momentToISO(moment());
    ModulesState.ActionCreators.update(lesson.get('id'), { deactivated: now }).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'Lesson archived'
      });
    });
  };

  render() {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {this.props.lessons.map(lesson => (
          <LessonCard
            key={lesson.get('id')}
            lesson={lesson}
            currentUser={this.context.currentUser}
            onTransition={_.noop}
            archiveConfirmClick={this.archiveConfirmClick}
            editable
          />
        ))}
        {!this.props.lessons.size ? <NoData>{t('your_search_did_not_match')}</NoData> : null}
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.onSetLessonSearch.bind(PageState.ActionCreators)))
class LessonsTabPage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor(props) {
    super();
    this.state = {
      selectedPlan: null
    };
  }

  componentWillUnmount() {
    // Clear the search on unmount so if you're switching between tabs,
    // the search results will refresh.
    this.clearSearch();
  }

  showSelectPlanModal = () => {
    this.refs.LoadingContainer.refs.selectPlanModal.show();
  };

  createNewLesson = () => {
    this.context.router.push(resolve('create-module-no-plan'));
  };

  onPlanSelect = data => {
    this.setState({ selectedPlan: data });
  };

  onPlanSelectConfirm = () => {
    const selectedPlan = this.state.selectedPlan;
    const selectedPlanId = getIdFromApiUrl(selectedPlan);
    this.refs.LoadingContainer.refs.selectPlanModal.hide();
    this.context.router.push(resolve('create-module', { planId: selectedPlanId }));
  };

  setFilter = newFilter => {
    this.clearSearch();
    PageState.ActionCreators.onSetLessonSearch('');
    PageState.ActionCreators.onSetFilter(newFilter);
  };

  render() {
    return (
      <div style={styles.background}>
        <div style={styles.filterSetContainer}>
          <FilterSet
            ref="filterSet"
            filterNames={PageState.Store.getFilterNames()}
            setFilter={this.setFilter}
            createButton={(filterName, defaultProps) => (
              <div style={styles.filterButtonContainer} key={filterName}>
                <div {...defaultProps}>{t(filterName)}</div>
              </div>
            )}
          />
          <div style={styles.searchAndSortContainer}>
            {this.getSearchInput({
              borderless: true
            })}
          </div>
        </div>

        <div style={Style.common.clearBoth} />
        <LoadingContainer
          ref="LoadingContainer"
          loadingProps={{
            lessons: this.props.lessons,
            plans: this.props.plans
          }}
          createComponent={props => (
            <div>
              <InfiniteScroll
                loadMore={this.props.loadMore}
                moreAvailable={this.props.moreAvailable}
                isLoading={this.props.isLoading}
              >
                <LessonsCollection lessons={props.lessons} currentUser={this.context.currentUser} />
              </InfiniteScroll>
            </div>
          )}
          createNoDataComponent={() => (
            <NoData style={{ padding: 20 }}>{t('no_lessons_available')}</NoData>
          )}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(LessonsTabPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [
    PageState.Store,
    TrainingPlansState.Store,
    TrainingSchedulesState.Store,
    ModulesState.Store
  ],

  paginate: {
    store: ModulesState.Store,
    propName: 'lessons',
    storeOpts: {
      dependantOn: TrainingSchedulesState.Store
    },

    getQuery() {
      const curFilterQuery = PageState.Store.getCurrentFilterQuery(this.context.currentUser);
      const query = _.extend(
        {
          belongs_to_user_company: this.context.currentUser.get('id'),
          limit: 10,
          ordering: 'name',
          fields: ['training_plans.owner.url', $y.getFields(LessonCard, 'lesson')]
        },
        curFilterQuery
      );
      const search = PageState.Store.getLessonSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },

  fetch: {
    plans() {
      const learner = this.context.currentUser.get('learner');
      if (!learner) return null;
      const co = learner.company;
      if (!co) return null;
      return TrainingPlansState.Store.getItems({
        owner: co.id,
        fields: ['id', 'url', 'name'],
        limit: 0,
        ordering: 'name'
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, LessonsTabPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, LessonsTabPage, errors);
  }
});
