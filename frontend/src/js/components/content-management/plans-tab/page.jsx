import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import Style from 'style';
import Radium from 'radium';
import { t } from 'i18n';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import UsersState from 'state/users';
import TrainingPlansState from 'state/training-plans';
import ChannelsState from 'state/channels';
import TrainingSchedulesState from 'state/training-schedules';
import PageState, { filterNames } from './page-state';
import ModulesState from 'state/modules';

import { PlanCard } from './plan-card';
import { resolve } from 'react-router-named-routes';
import { LessonCard } from 'components/common/lesson-card';
import { FilterSet, FilterItem } from 'components/common/filter-set';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { LoadingContainer, NoData } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';
import { constants as TRAINING_PLAN_CONSTANTS } from 'utilities/component-helpers/training-page';

const styles = {
  background: {
    backgroundColor: Style.vars.colors.get('white'),
    marginLeft: 20,
    marginTop: 20,
    marginRight: 20
  },
  topButton: {
    float: 'right'
  },
  actionAndSearchContainer: {
    float: 'left'
  },
  filterSetContainer: {
    marginTop: -12,
    marginBottom: 25,
    padding: '5px 0px',
    color: Style.vars.colors.get('xxDarkGrey'),
    clear: 'both',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  noContentText: {
    fontSize: 16
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
  },
  logo: {
    height: 80,
    float: 'left',
    marginRight: 20
  },
  grid: {
    marginTop: '0 !important',
    marginBottom: 6
  },
  listItemLabel: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 4,
    fontSize: '0.9em',
    color: Style.vars.colors.get('white'),
    borderRadius: '0.21428571rem 0rem 0.21428571em 0em'
  }
};

export class PlansCollection extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static data = {
    trainingPlans: {
      many: true,
      required: true,
      fields: ['id']
    }
  };

  static propTypes = $y.propTypesFromData(PlansCollection, {
    loadMore: React.PropTypes.func.isRequired,
    moreAvailable: React.PropTypes.func.isRequired,
    isLoading: React.PropTypes.func.isRequired,
    enrollModeEnabled: React.PropTypes.bool,
    createCard: React.PropTypes.func.isRequired
  });

  requestContent = () => {
    const content = 'Hi Myagi team. Could you please help me get access to training?';
    if (window.Intercom) {
      window.Intercom('showNewMessage', content);
    }
  };

  discoverContent = () => {
    this.context.router.push(resolve('channel-discovery'));
  };

  getNoContentComponent = () => {
    const learner = this.context.currentUser.get('learner');
    let noContent = t('your_search_did_not_match_any');
    if (PageState.Store.state.filterKey === TRAINING_PLAN_CONSTANTS.ALL_PLANS) {
      if (learner.can_manage_training_content) {
        noContent = (
          <span style={styles.noContentText}>
            No content?&nbsp; Create some now by clicking the "Create Plan" button above
            <br />
            Or {this.getChannelDiscoveryComponent()}
          </span>
        );
      } else {
        noContent = (
          <span style={styles.noContentText}>
            No content?&nbsp;
            <u style={{ cursor: 'pointer' }} onClick={this.requestContent}>
              Click here
            </u>
            &nbsp;to get access ...
          </span>
        );
      }
    }
    return noContent;
  };

  getChannelDiscoveryComponent = (noData = false) => {
    const learner = this.context.currentUser.get('learner');
    if (!learner.can_make_new_channel_connections) return null;
    const discoverLink = (
      <span style={styles.noContentText}>
        <u style={{ cursor: 'pointer' }} onClick={this.discoverContent}>
          {t('click_here')}
        </u>{' '}
        {t('to_find_and_use_great_content')}
      </span>
    );
    if (noData) {
      return <NoData style={{ padding: 20 }}>{discoverLink}</NoData>;
    }
    return discoverLink;
  };

  render() {
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreAvailable={this.props.moreAvailable}
        isLoading={this.props.isLoading}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {this.props.trainingPlans.map(tp => this.props.createCard(tp))}
          {!this.props.trainingPlans.size ? <NoData>{this.getNoContentComponent()}</NoData> : null}
        </div>
      </InfiniteScroll>
    );
  }
}

function NoPlans({ curFilter }) {
  let txt;
  if (curFilter === filterNames.COMPANY_PLANS) {
    txt = 'You have not created any plans yet. Create some and they will appear here.';
  } else if (curFilter === filterNames.PLANS_FROM_CHANNELS) {
    txt = 'Plans from any channels you connect to will appear here.';
  } else if (curFilter === filterNames.ARCHIVED_PLANS) txt = 'Any archived plans will appear here.';
  else txt = 'No plans available.';
  return <NoData style={{ padding: 20 }}>{txt}</NoData>;
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setTrainingPlanSearch.bind(PageState.ActionCreators)))
class PlansTabPage extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor(props) {
    super();
    this.state = {
      newPlan: null
    };
  }

  componentWillUnmount() {
    // Clear the search on unmount so if you're switching between tabs,
    // the search results will refresh.
    this.clearSearch();
    PageState.Store.clearTrainingPlanFilter();
  }

  setFilter = newFilter => {
    if (newFilter) {
      this.context.router.push(`${this.context.location.pathname}?filter=${newFilter}`);
    }

    // Clear plan search on filter change
    this.clearSearch();
    PageState.ActionCreators.setTrainingPlanSearch('');
    PageState.ActionCreators.setFilter(newFilter);
  };

  showCreatePlanModal = () => {
    this.refs.createPlanModal.show();
  };

  onModuleUpdate = () => {
    if (this.state.newPlan) {
      this.context.router.push(`${resolve('plan-management', { planId: this.state.newPlan.get('id') })}?tab=Plan Lessons`);
    }
  };

  startEnrollment = () => {
    this.refs.enrollModal.show();
  };

  createPlanCard = plan => (
    <PlanCard
      key={plan.get('id')}
      trainingPlan={plan}
      currentUser={this.context.currentUser}
      channels={this.props.channels}
      openTrainingPlanModal={this.onPlanItemClick}
    />
  );

  onPlanItemClick = plan => {
    if (plan.get('deactivated')) {
      return;
    }
    this.context.router.push(resolve('plan-management', {
      planId: plan.get('id')
    }));
  };

  render() {
    return (
      <div style={styles.background}>
        <div style={styles.filterSetContainer}>
          <FilterSet
            ref="filterSet"
            filterNames={PageState.Store.getFilterNames()}
            setFilter={this.setFilter}
            initial={this.context.location.query.filter}
            createButton={defaultProps => <FilterItem {...defaultProps} />}
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
            plans: this.props.plans
          }}
          createComponent={props => (
            <div>
              <PlansCollection
                trainingPlans={this.props.plans}
                loadMore={this.props.loadMore}
                moreAvailable={this.props.moreAvailable}
                isLoading={this.props.isLoading}
                currentUser={this.context.currentUser}
                createCard={this.createPlanCard}
              />
            </div>
          )}
          createNoDataComponent={() => <NoPlans curFilter={this.props.curFilter} />}
        />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(PlansTabPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    routeParams: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  },

  listenTo: [
    PageState.Store,
    TrainingPlansState.Store,
    TrainingSchedulesState.Store,
    ChannelsState.Store,
    ModulesState.Store,
    UsersState.Store
  ],

  componentWillMount() {
    PageState.Store.resetState();
    PageState.Store.getCurrentFilterQuery(
      this.context.currentUser,
      this.context.location.query.filter
    );
  },

  paginate: {
    store: TrainingPlansState.Store,
    propName: 'plans',
    storeOpts: {
      dependantOn: [TrainingSchedulesState.Store, UsersState.Store]
    },

    getQuery() {
      const curFilterQuery = PageState.Store.getCurrentFilterQuery(
        this.context.currentUser,
        this.context.location.query.filter
      );
      const query = _.extend(
        {
          ordering: 'name',
          limit: 10,
          fields: [
            'owner.url',
            'company.company_name',
            $y.getFields(LessonCard, 'module', 'modules'),
            $y.getFields(PlanCard, 'trainingPlan')
          ]
        },
        curFilterQuery
      );
      const search = PageState.Store.getTrainingPlanSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },

  fetch: {
    curFilter() {
      return PageState.Store.getCurrentFilterName();
    }
  },

  pending() {
    return containerUtils.defaultPending(this, PlansTabPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, PlansTabPage, errors);
  }
});
