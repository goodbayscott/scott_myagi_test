import Marty from 'marty';
import React from 'react';
import cx from 'classnames';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import createPaginatedStateContainer from 'state/pagination';
import { getIdFromApiUrl } from 'utilities/generic';

import UsersState from 'state/users';
import PageState from './page-state';

import { Panel, BoxHeader, BoxContent, InfoHeader } from 'components/common/box';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer, NoData } from 'components/common/loading';
import { CardCollection, CardImage, CornerDropdown, Card } from 'components/common/cards';
import { InfiniteScroll } from 'components/common/infinite-scroll';

export class UserCard extends React.Component {
  static data = {
    user: {
      fields: [
        'id',
        'first_name',
        'last_name',
        'learner.profile_photo',
        'learner.learnergroup_name'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(UserCard);

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  navigateToUser = () => {
    // Navigate to user profile and default to their
    // "Training plans" tab
    this.context.router.push(`${resolve('profile', { userId: this.props.user.get('id') })}?tab=Training%20Plans`);
  };

  render() {
    const learner = this.props.user.get('learner');
    return (
      <Card onClick={this.navigateToUser}>
        <CardImage src={learner.profile_photo} />
        <div className="content">
          <div className="header">
            {this.props.user.get('first_name')} {this.props.user.get('last_name')}
          </div>
          <div className="meta">{learner.learnergroup_name}</div>
        </div>
      </Card>
    );
  }
}

export class UsersCollection extends React.Component {
  static data = {
    users: {
      many: true,
      fields: [$y.getFields(UserCard, 'user')]
    }
  };

  static propTypes = $y.propTypesFromData(UsersCollection, {
    loadMore: React.PropTypes.func.isRequired,
    moreAvailable: React.PropTypes.func.isRequired,
    enrollModeEnabled: React.PropTypes.bool
  });

  createCard = user => <UserCard user={user} key={user.get('id')} />;

  render() {
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreAvailable={this.props.moreAvailable}
        isLoading={this.props.isLoading}
      >
        <CardCollection entities={this.props.users} createCard={this.createCard} />
      </InfiniteScroll>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setUserSearch))
export class EnrollmentsPage extends React.Component {
  static data = {
    users: {
      many: true,
      required: false,
      fields: ['id', 'url', $y.getFields(UsersCollection, 'users')]
    }
  };

  static propTypes = $y.propTypesFromData(EnrollmentsPage, {
    loadMore: React.PropTypes.func.isRequired,
    moreAvailable: React.PropTypes.func.isRequired
  });

  constructor() {
    super();
  }

  render() {
    return (
      <Panel>
        <BoxHeader
          heading="Enrollments"
          backOpts={{
            text: 'Training',
            route: 'training'
          }}
        />
        <BoxContent>
          <InfoHeader>Select a user to view the plans they have access to</InfoHeader>
          {this.getSearchInput()}
          <LoadingContainer
            loadingProps={{
              users: this.props.users
            }}
            createComponent={() => (
              <UsersCollection
                users={this.props.users}
                loadMore={this.props.loadMore}
                moreAvailable={this.props.moreAvailable}
                isLoading={this.props.isLoading}
              />
            )}
          />
        </BoxContent>
      </Panel>
    );
  }
}

export const Page = createPaginatedStateContainer(EnrollmentsPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store],

  paginate: {
    store: UsersState.Store,
    propName: 'users',
    getQuery() {
      let query = {
        ordering: 'first_name',
        learner__company: this.props.currentUser.get('learner').company.id,
        limit: 20,
        is_active: true,
        fields: $y.getFields(EnrollmentsPage, 'users')
      };
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
      const search = PageState.Store.getUserSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, EnrollmentsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, EnrollmentsPage, errors);
  }
});
