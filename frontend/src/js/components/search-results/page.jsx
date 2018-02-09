import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import Radium from 'radium';
import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import ModulesState from 'state/modules';
import TrainingPlansState from 'state/training-plans';
import ChannelsState from 'state/channels';
import TeamsState from 'state/teams';
import UsersState from 'state/users';
import ModulesPageState from '../content-management/lessons-tab/page-state';
import TrainingPlansPageState from '../training/plans/page-state';
import ChannelsPageState from '../content-management/channels-tab/page-state';
import TeamsPageState from '../people/teams/state';
import UsersPageState from '../people/users/state';

import createPaginatedStateContainer from 'state/pagination';
import { LoadingSpinner } from 'components/common/loading';
import { RouterTabs } from 'components/common/router-tabs';
import { LoadingContainer, NoData } from 'components/common/loading';
import { SearchBarContainer } from 'components/common/universal-search-bar';
import { MOBILE_WIDTH } from 'components/navbar';

const styles = {
  title: {
    textAlign: 'center',
    margin: '1em'
  },
  tabs: {
    justifyContent: 'center'
  },
  tabContentContainer: {
    padding: '0 2.5em'
  },
  search: {
    display: 'none',
    [MOBILE_WIDTH]: {
      width: '55vw',
      display: 'block',
      margin: '0 auto 20px auto'
    },
    [Style.vars.media.get('mobile')]: {
      width: '70vw'
    },
    [Style.vars.media.get('xSmall')]: {
      width: '80vw'
    }
  }
};

@Radium
export class PageInner extends React.Component {
  static contextTypes = {
    location: React.PropTypes.object.isRequired
  };

  static LESSONS_ROUTE = '/views/search/lessons/';
  static PLANS_ROUTE = '/views/search/plans/';
  static CHANNELS_ROUTE = '/views/search/channels/';
  static TEAMS_ROUTE = '/views/search/teams/';
  static USERS_ROUTE = '/views/search/users/';

  routerTabs = () => {
    const learner = this.props.currentUser.get('learner');
    const lessonsCount = this.props.lessonsCount ? `(${this.props.lessonsCount})` : '';
    const trainingPlansCount = this.props.trainingPlansCount
      ? `(${this.props.trainingPlansCount})`
      : '';
    const channelsCount = this.props.channelsCount ? `(${this.props.channelsCount})` : '';
    const teamsCount = this.props.teamsCount ? `(${this.props.teamsCount})` : '';
    const usersCount = this.props.usersCount ? `(${this.props.usersCount})` : '';
    const routerTabs = [
      {
        name: `${t('lessons')} ${lessonsCount}`,
        to: `${PageInner.LESSONS_ROUTE}?search=${this.context.location.query.search}`
      },
      {
        name: `${t('plans')} ${trainingPlansCount}`,
        to: `${PageInner.PLANS_ROUTE}?search=${this.context.location.query.search}`
      },
      {
        name: `${t('channels')} ${channelsCount}`,
        to: `${PageInner.CHANNELS_ROUTE}?search=${this.context.location.query.search}`
      }
    ];
    if (learner.is_company_admin) {
      routerTabs.push.apply(routerTabs, [
        {
          name: `${t('teams')} ${teamsCount}`,
          to: `${PageInner.TEAMS_ROUTE}?search=${this.context.location.query.search}`
        },
        {
          name: `${t('users')} ${usersCount}`,
          to: `${PageInner.USERS_ROUTE}?search=${this.context.location.query.search}`
        }
      ]);
    }
    return routerTabs;
  };

  componentWillUpdate() {
    const searchQuery = this.context.location.query.search;
    // Checks on behalf of all stores
    if (UsersPageState.Store.getSearch() !== searchQuery) {
      ModulesPageState.ActionCreators.onSetLessonSearch(searchQuery);
      TrainingPlansPageState.ActionCreators.setTrainingPlanSearch(searchQuery);
      ChannelsPageState.ActionCreators.onSetChannelSearch(searchQuery);
      TeamsPageState.ActionCreators.setSearch(searchQuery);
      UsersPageState.ActionCreators.setSearch(searchQuery);
    }
  }

  render() {
    const searchQuery = this.context.location.query.search;
    const tabs = this.routerTabs();
    const childWithProps = React.cloneElement(this.props.children, {
      searchQuery
    });
    return (
      <div>
        <h1 style={styles.title}>
          {t('showing_search_results_for')} "{searchQuery}"
        </h1>
        <SearchBarContainer style={styles.search} />
        <RouterTabs tabs={tabs} itemActiveStyle={null} style={styles.tabs} />
        <div style={styles.tabContentContainer}>{childWithProps}</div>
      </div>
    );
  }
}

export const Page = Marty.createContainer(PageInner, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [
    ModulesState.Store,
    ModulesPageState.Store,
    TrainingPlansState.Store,
    TrainingPlansPageState.Store,
    ChannelsState.Store,
    ChannelsPageState.Store,
    TeamsState.Store,
    TeamsPageState.Store,
    UsersState.Store,
    UsersPageState.Store
  ],

  fetch: {
    lessons() {
      const search = ModulesPageState.Store.getLessonSearch();
      const query = {
        limit: 1,
        fields: ['id'],
        is_attemptable: true,
        deactivated__is_null: true,
        viewable_by_user: this.context.currentUser.get('id'),
        search
      };
      return ModulesState.Store.getItems(query);
    },
    lessonsCount() {
      const search = ModulesPageState.Store.getLessonSearch();
      const query = {
        is_attemptable: true,
        deactivated__is_null: true,
        viewable_by_user: this.context.currentUser.get('id'),
        search
      };
      return ModulesState.Store.getKnownCountForQuery(query);
    },
    trainingPlans() {
      const search = TrainingPlansPageState.Store.getTrainingPlanSearch();
      const learner = this.context.currentUser.get('learner');
      const query = {
        limit: 1,
        fields: ['id'],
        search
      };
      if (!learner.is_company_admin) {
        query.is_published = true;
        query.has_modules = true;
        query.deactivated__isnull = true;
      } else {
        query.show_all = true;
      }
      return TrainingPlansState.Store.getItems(query);
    },
    trainingPlansCount() {
      const search = TrainingPlansPageState.Store.getTrainingPlanSearch();
      const learner = this.context.currentUser.get('learner');
      const query = {
        search
      };
      if (!learner.is_company_admin) {
        query.is_published = true;
        query.has_modules = true;
        query.deactivated__isnull = true;
      } else {
        query.show_all = true;
      }
      return TrainingPlansState.Store.getKnownCountForQuery(query);
    },
    channels() {
      const search = ChannelsPageState.Store.getChannelSearch();
      return ChannelsState.Store.getItems({
        connected_to_company: this.context.currentUser.get('learner').company.id,
        deactivated__isnull: true,
        has_content: true,
        limit: 1,
        search,
        fields: ['id']
      });
    },
    channelsCount() {
      const search = ChannelsPageState.Store.getChannelSearch();
      const query = _.extend({
        connected_to_company: this.context.currentUser.get('learner').company.id,
        deactivated__isnull: true,
        has_content: true,
        search
      });
      return ChannelsState.Store.getKnownCountForQuery(query);
    },
    teams() {
      const search = TeamsPageState.Store.getSearch();
      return TeamsState.Store.getItems({
        search,
        limit: 1,
        fields: ['name']
      });
    },
    teamsCount() {
      const search = TeamsPageState.Store.getSearch();
      const query = _.extend({
        search
      });
      return TeamsState.Store.getKnownCountForQuery(query);
    },
    users() {
      const search = UsersPageState.Store.getSearch();
      const learner = this.context.currentUser.get('learner');
      return UsersState.Store.getItems({
        search,
        limit: 1,
        learner__company: learner.company.id,
        fields: ['first_name']
      });
    },
    usersCount() {
      const search = UsersPageState.Store.getSearch();
      const learner = this.context.currentUser.get('learner');
      const query = _.extend({
        search,
        learner__company: learner.company.id
      });
      return UsersState.Store.getKnownCountForQuery(query);
    }
  },

  done(results) {
    return <PageInner ref="innerComponent" {...this.props} {...results} />;
  },

  pending() {
    return containerUtils.defaultPending(this, PageInner, {
      isFetching: true
    });
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, PageInner, errors);
  }
});
