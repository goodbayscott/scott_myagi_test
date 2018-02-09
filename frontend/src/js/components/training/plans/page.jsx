import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';
import Select from 'react-select';
import Style from 'style';

import $y from 'utilities/yaler';

import CompaniesState from 'state/companies';
import TrainingPlansState from 'state/training-plans';
import ChannelsState from 'state/channels';
import TrainingSchedulesState from 'state/training-schedules';
import PageState from './page-state';
import ModulesState from 'state/modules';
import ModuleTrainingPlansState from 'state/module-training-plans';

import createPaginatedStateContainer from 'state/pagination';

import containerUtils from 'utilities/containers';

import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer, NoData } from 'components/common/loading';
import { FilterSet, FilterItem } from 'components/common/filter-set';
import { Dropdown } from 'components/common/dropdown';
import { PrimaryButton } from 'components/common/buttons';

import { CreatePlanModal } from 'components/content-management/plans-tab/create-plan-modal';
import { ViewTrainingPlanModal } from './plan-modal';
import { TrainingPlanCard, TrainingPlansCollection } from './plan-card';

import { constants } from 'utilities/component-helpers/training-page';

const pageStyle = {
  containerOuter: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: 30
  },
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  searchAndSortContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 20
  },
  actionBtn: {
    height: 37,
    marginRight: 3,
    padding: 'none'
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
  actionContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    height: 75,
    marginTop: -75,
    '@media screen and (max-width: 500px)': {
      marginTop: -24,
      marginBottom: 20,
      height: 'auto',
      justifyContent: 'center'
    }
  },
  actionDropdownContainer: {
    height: 37,
    background: Style.vars.colors.get('primary'),
    color: Style.vars.colors.get('primaryFontColor'),
    borderRadius: 3,
    fontSize: '1.2rem'
  },
  actionDropdownMenu: {
    zIndex: 9999
  },
  noContentText: {
    fontSize: 16
  },
  sorting: {
    width: 114,
    border: 'none',
    cursor: 'pointer',
    height: 20
  },
  sortingPlaceholder: {
    display: 'flex',
    justifyContent: 'flex-end',
    color: '#c7c7c7',
    marginRight: 45
  },
  sortingValue: {
    display: 'flex',
    justifyContent: 'flex-end',
    color: Style.vars.colors.get('textBlack'),
    marginRight: 25
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  noDataBtns: Style.funcs.merge(
    {
      display: 'inline-block',
      left: '50%'
    },
    Style.funcs.makeTransform("translateX('-50%')")
  )
};

class TrainingActionButton extends React.Component {
  static propTypes = {
    label: React.PropTypes.string,
    onBtnClick: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <Dropdown className="ui pointing dropdown">
        <div className="ui buttons">
          <PrimaryButton
            style={pageStyle.actionBtn}
            className="ui button create-plan-btn"
            onClick={this.props.onBtnClick}
            onTouchEnd={this.props.onBtnClick}
          >
            {this.props.label}
          </PrimaryButton>
          {this.props.children}
        </div>
      </Dropdown>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setTrainingPlanSearch.bind(PageState.ActionCreators)))
@Radium
export class TrainingPlansTabContent extends React.Component {
  static data = {
    trainingPlans: {
      many: true,
      required: false,
      fields: [
        'training_units.name',
        'training_units.url',
        'training_units.id',
        'created',
        $y.getFields(TrainingPlansCollection, 'trainingPlans'),
        $y.getFields(TrainingPlanCard, 'trainingPlan')
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  setFilter = newFilter => {
    // Clear plan search on filter change
    this.clearSearch();
    PageState.ActionCreators.setTrainingPlanSearch('');
    PageState.ActionCreators.setFilter(newFilter);
  };

  constructor(props) {
    super();
    this.state = {
      renderKey: 0,
      selectedPlan: null
    };
  }

  createPlan = () => {
    if (!this.refs.createPlanModal) return;
    this.refs.createPlanModal.show();
  };

  discoverContent = () => {
    this.context.router.push('/views/content/discover/');
  };

  createTrainingPlanCard = plan => (
    <TrainingPlanCard
      key={plan.get('id') + this.state.renderKey.toString()}
      trainingPlan={plan}
      currentUser={this.props.currentUser}
      openTrainingPlanModal={this.openTrainingPlanModal}
      hoverIcon="play"
    />
  );

  requestContent = () => {
    const content = 'Hi Myagi team. Could you please help me get access to training?';
    if (window.Intercom) {
      window.Intercom('showNewMessage', content);
    }
  };

  getNoDataComponent = () => {
    const learner = this.context.currentUser.get('learner');
    const learnerCompanyIsBrand = learner.company.company_type === 'brand';
    if (PageState.Store.state.filterKey === constants.ALL_PLANS) {
      if (learner.can_manage_training_content) {
        return (
          <div style={pageStyle.noDataContainer}>
            <NoData>
              {learnerCompanyIsBrand ? t('create_content') : t('create_or_go_to_discover')}
            </NoData>
            <div style={pageStyle.noDataBtns}>
              <PrimaryButton onClick={this.createPlan}>{t('create_plan')}</PrimaryButton>
              {!learnerCompanyIsBrand && (
                <PrimaryButton onClick={this.discoverContent}>{t('find_content')}</PrimaryButton>
              )}
            </div>
          </div>
        );
      }
      return <NoData>{t('get_access_to_content')}</NoData>;
    }
    return <NoData>{t('try_choosing_another_filter')}</NoData>;
  };

  viewEnrollments = () => {
    this.context.router.push(resolve('enrollments'));
  };

  showContentModal = () => {
    this.refs.contentModal.show();
  };

  getFilter() {
    const SORTING_OPTIONS = [
      { value: 'name', label: t('name_az') },
      { value: '-name', label: t('name_za') },
      { value: 'created', label: t('newest') },
      { value: '-created', label: t('oldest') },
      { value: 'owner__company_name', label: t('company') }
    ];

    return (
      <Select
        style={pageStyle.sorting}
        options={SORTING_OPTIONS}
        placeholder={<div style={pageStyle.sortingPlaceholder}>{t('sort_by')}</div>}
        arrowRenderer={({ isOpen }) => (
          <i
            className="ui icon sort content descending"
            style={{ color: isOpen ? 'black' : 'grey' }}
          />
        )}
        clearable={false}
        valueRenderer={o => <div style={pageStyle.sortingValue}>{o.label}</div>}
        searchable={false}
        onChange={v => PageState.ActionCreators.setTrainingPlanOrder(v.value)}
        value={PageState.Store.getTrainingPlanOrder()}
      />
    );
  }

  isLoading = () => this.props.dataIsLoading;

  openTrainingPlanModal = plan => {
    this.setState({ selectedPlan: plan });
    this.refs.viewTrainingPlanModal.show();
  };

  render() {
    const { currentUser } = this.props;
    let hasContent = false;
    if (currentUser && currentUser.get('learner').company) {
      hasContent = currentUser.get('learner').company.has_content;
    }
    return (
      <div style={pageStyle.containerOuter}>
        <div style={pageStyle.container}>
          {hasContent && (
            <div style={pageStyle.filterSetContainer}>
              <FilterSet
                ref="filterSet"
                filterNames={PageState.Store.getFilterNames()}
                setFilter={this.setFilter}
                createButton={defaultProps => (
                  <FilterItem {...defaultProps} renderFilterName={name => t(name)} />
                )}
              />
              <div style={pageStyle.searchAndSortContainer}>
                {!PageState.Store.getTrainingPlanSearch() && this.getFilter()}
                {this.getSearchInput({
                  borderless: true
                })}
              </div>
            </div>
          )}

          <div style={Style.common.clearBoth} />
          <LoadingContainer
            loadingProps={{
              trainingPlans: this.props.trainingPlans
            }}
            createComponent={props => (
              <div>
                <TrainingPlansCollection
                  trainingPlans={this.props.trainingPlans}
                  loadMore={this.props.loadMore}
                  moreAvailable={this.props.moreAvailable}
                  isLoading={this.isLoading}
                  createCard={this.createTrainingPlanCard}
                />
              </div>
            )}
            createNoDataComponent={this.getNoDataComponent}
          />
          <ViewTrainingPlanModal
            ref="viewTrainingPlanModal"
            trainingPlan={this.state.selectedPlan}
            currentUser={this.props.currentUser}
            editable
          />
          <CreatePlanModal ref="createPlanModal" currentUser={this.context.currentUser} />
        </div>
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(TrainingPlansTabContent, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired,
    location: React.PropTypes.object.isRequired
  },

  componentDidMount() {
    if (this.context.currentUser && !this.context.currentUser.get('learner').company) {
      // redirect to join or create company if user has no company
      this.context.router.push(resolve('join-or-create-company'));
    }
    if (
      this.context &&
      this.context.location &&
      this.context.location.query &&
      this.context.location.query.plans
    ) {
      // set filter for training plan id in query string if it exists
      const plans = this.context.location.query.plans;
      if (plans.length) {
        PageState.ActionCreators.setTrainingPlanIdFilter(plans);
      }
    }
  },

  componentWillUnmount() {
    if (this.context.location.query && this.context.location.query.plans) {
      PageState.Store.clearTrainingPlanFilter();
      delete this.context.location.query.plans;
    }
  },

  listenTo: [
    PageState.Store,
    TrainingSchedulesState.Store,
    ModulesState.Store,
    TrainingPlansState.Store,
    ModuleTrainingPlansState.Store
  ],

  paginate: {
    store: TrainingPlansState.Store,

    propName: 'trainingPlans',

    storeOpts: {
      dependantOn: TrainingSchedulesState.Store
    },

    getQuery() {
      const curFilterQuery = PageState.Store.getCurrentFilterQuery(this.props.currentUser);
      const ordering = PageState.Store.getTrainingPlanOrder();

      const query = {
        deactivated__isnull: true,
        limit: 10,
        fields: $y.getFields(TrainingPlansTabContent, 'trainingPlans'),
        has_modules: true,
        is_published: true,
        ...curFilterQuery,
        ...(ordering ? { ordering } : {})
      };
      const search = PageState.Store.getTrainingPlanSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      const planIds = PageState.Store.getTrainingPlanIDFilter();
      if (planIds) {
        query.id__in = planIds;
      }
      return query;
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
    PageState.Store.setupFiltersForUser(this.props.currentUser);
  },

  pending() {
    return containerUtils.defaultPending(this, TrainingPlansTabContent);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TrainingPlansTabContent, errors);
  }
});
