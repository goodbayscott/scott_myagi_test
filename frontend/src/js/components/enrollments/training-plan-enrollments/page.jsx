import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import reactMixin from 'react-mixin';

import { t } from 'i18n';
import Style from 'style/index';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { getIdFromApiUrl } from 'utilities/generic';

import createPaginatedStateContainer from 'state/pagination';

import TrainingPlansState from 'state/training-plans';
import TrainingSchedulesState from 'state/training-schedules';

import PageState from './state';

import { LoadingContainer } from 'components/common/loading';
import { Panel, BoxHeader, BoxContent } from 'components/common/box';
import { Modal } from 'components/common/modal/index';
import { EnrollWithSelectedPlansModal } from '../enroll-modal';
import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { remoteSearchMixinFactory } from 'components/common/search';
import { PrimaryButton } from 'components/common/buttons';

const styles = {
  table: {
    marginTop: '1em'
  }
};

class EnrollmentsCollection extends React.Component {
  static data = {
    enrollments: {
      many: true,
      fields: [
        'id',
        'plan_due_date',
        'completed',
        'progress',
        'completed_date',
        'training_plan.name',
        'learner.profile_photo',
        'learner.user.first_name',
        'learner.user.last_name',
        'learner.learnergroup_name',
        'learner.company.company_name'
      ]
    },
    trainingPlan: {
      fields: ['name']
    }
  };

  static propTypes = $y.propTypesFromData(EnrollmentsCollection);

  static tableDataMapping = {
    User: e => `${e.get('learner').user.first_name} ${e.get('learner').user.last_name}`,
    Company: e => {
      let co = e.get('learner').company;
      co = co ? co.company_name : 'No team';
      return <span key={co}>{co}</span>;
    },
    Team: e => {
      const val = e.get('learner').learnergroup_name || 'No team';
      return <span key={val}>{val}</span>;
    },
    'Due Date': e =>
      (e.get('plan_due_date')
        ? t('due_from_now', { date: moment(e.get('plan_due_date')).fromNow() })
        : t('no_due_date')),
    Progress: e => {
      let progress = e.get('progress') * 100;
      progress = progress.toFixed(1);

      const completed = progress >= 100;
      const col = completed ? Style.vars.colors.get('green') : Style.vars.colors.get('red');
      const progressStyle = { color: col };

      // Key is used for sorting
      return (
        <span key={progress} style={progressStyle}>
          {progress}
        </span>
      );
    }
  };

  constructor() {
    super();
    this.state = {
      deleteModalCallback: null
    };
  }

  showDeleteModal = confirmCallback => {
    this.setState({ deleteModalCallback: confirmCallback });
    this.refs.deleteModal.show();
  };

  deleteConfirmClick = () => {
    this.state.deleteModalCallback();
    this.refs.deleteModal.hide();
  };

  getHeaders() {
    return Im.List(_.keys(EnrollmentsCollection.tableDataMapping));
  }

  getRows() {
    const funcs = _.values(EnrollmentsCollection.tableDataMapping);
    return this.props.enrollments.map(e => Im.List(funcs.map(f => f(e))));
  }

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();
    const name = this.props.trainingPlan.get('name');
    return (
      <div>
        <InfiniteScroll
          loadMore={this.props.loadMore}
          moreAvailable={this.props.moreAvailable}
          isLoading={this.props.isLoading}
        >
          <ScrollableDataTable
            headers={headers}
            rows={rows}
            bodyHeight={null}
            ref="table"
            style={styles.table}
            exportEnabled
          />
        </InfiniteScroll>
        <Modal
          ref="deleteModal"
          onConfirm={this.deleteConfirmClick}
          header="Are you sure you want to remove this enrollment?"
          basic
        />
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
export class TrainingPlanEnrollmentsPage extends React.Component {
  static data = {
    enrollments: {
      required: false,
      many: true,
      fields: ['id', $y.getFields(EnrollmentsCollection, 'enrollments')]
    },
    trainingPlan: {
      required: false,
      fields: ['id', 'url', 'name', 'thumbnail_url']
    }
  };

  static propTypes = $y.propTypesFromData(TrainingPlanEnrollmentsPage, {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    loading: React.PropTypes.bool
  });

  showEnrollModal = () => {
    this.refs.enrollModal.show();
  };

  render() {
    const plan = this.props.trainingPlan;
    return (
      <Panel>
        <BoxHeader
          heading={plan ? `${plan.get('name')}` : ''}
          imgSrc={plan ? plan.get('thumbnail_url') : null}
          backOpts={{
            text: 'Back'
          }}
        />
        <BoxContent>
          {this.getSearchInput()}
          <LoadingContainer
            loadingProps={[this.props.trainingPlan, this.props.enrollments]}
            createComponent={() => (
              <EnrollmentsCollection
                user={this.props.user}
                trainingPlan={this.props.trainingPlan}
                enrollments={this.props.enrollments}
                loadMore={this.props.loadMore}
                moreAvailable={this.props.moreAvailable}
                isLoading={this.props.isLoading}
              />
            )}
            shouldRenderNoData={() => !this.props.enrollments.count()}
            noDataText="This plan has no enrollments"
          />
        </BoxContent>
        <EnrollWithSelectedPlansModal
          ref="enrollModal"
          currentUser={this.props.currentUser}
          selectedTrainingPlans={[this.props.trainingPlan]}
        />
      </Panel>
    );
  }
}

export const Page = createPaginatedStateContainer(TrainingPlanEnrollmentsPage, {
  mixins: [],

  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [TrainingPlansState.Store, PageState.Store],

  paginate: {
    store: TrainingSchedulesState.Store,
    propName: 'enrollments',
    limit: 100,
    getQuery() {
      let query = {
        training_plan: this.context.routeParams.planId,
        fields: $y.getFields(TrainingPlanEnrollmentsPage, 'enrollments'),
        ordering: 'learner__user__first_name',
        distinct_for_user: true,
        learner__user__is_active: true,
        has_company: true,
        // Don't show staff enrollments...otherwise people see staff enrollments when
        // we have jumped between companies.
        exclude_is_staff: true
      };
      const search = PageState.Store.getSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      const learner = this.props.currentUser.get('learner');
      const isCompanyAdmin = learner.is_company_admin;
      const isTeamManager = learner.is_learner_group_admin;
      const isAreaManager = learner.is_area_manager;
      if (isCompanyAdmin) {
        // Is company admin, so do not limit the query
      } else if (isAreaManager) {
        // Only show area manager members from their area
        query.learner__learnergroups__areas__managers = this.props.currentUser.get('id');
      } else if (isTeamManager && learner.learner_group) {
        // Only show team manager their team members
        query.learner__learnergroups = getIdFromApiUrl(learner.learner_group);
      } else {
        // If regular user, do not show anything
        query = null;
      }
      if (!query) return query;
      return query;
    }
  },

  fetch: {
    trainingPlan() {
      return TrainingPlansState.Store.getItem(this.context.routeParams.planId, {
        fields: $y.getFields(TrainingPlanEnrollmentsPage, 'trainingPlan')
      });
    }
  },

  componentDidMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, TrainingPlanEnrollmentsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TrainingPlanEnrollmentsPage, errors);
  }
});
