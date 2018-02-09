import React from 'react';
import Im from 'immutable';
import Style from 'style/index.js';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import UsersState from 'state/users';
import PageState from '../state';
import { SelectObjects } from 'components/common/select-objects';
import ChannelSharesState from 'state/channel-shares';
import { remoteSearchMixinFactory } from 'components/common/search';
import reactMixin from 'react-mixin';

import { getViewableUsersQuery } from 'components/people/users/page';

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
class UserSelectorInner extends React.Component {
  renderObject = user => (
    <div>
      {user.get('first_name')} {user.get('last_name')}
    </div>
  );

  render() {
    return (
      <SelectObjects
        loadMore={this.props.loadMore}
        moreDataAvailable={this.props.moreDataAvailable}
        dataIsLoading={this.props.dataIsLoading}
        objects={this.props.users}
        renderObject={this.renderObject}
        isSelected={this.props.isSelected}
        onChange={this.props.onChange}
        value={this.props.value}
      />
    );
  }
}

export const UserSelector = createPaginatedStateContainer(UserSelectorInner, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, UsersState.Store, ChannelSharesState.Store],

  paginate: {
    store: UsersState.Store,
    propName: 'users',
    limit: 40,
    getQuery() {
      const query = {
        ordering: 'first_name,last_name',
        fields: ['id', 'first_name', 'last_name', 'access_to_requested_channel'],
        access_to_requested_channel: this.props.channel.get('id')
      };

      const search = PageState.Store.getSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }

      return getViewableUsersQuery(query, this.context.currentUser);
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  show() {
    this.refs.innerComponent.show();
  },

  pending() {
    return containerUtils.defaultPending(this, UserSelectorInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, UserSelectorInner, errors);
  }
});
