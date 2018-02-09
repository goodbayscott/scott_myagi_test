import React from 'react';
import Im from 'immutable';
import Style from 'style/index.js';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import TeamsState from 'state/teams';
import PageState from '../state';
import { SelectObjects } from 'components/common/select-objects';
import ChannelSharesState from 'state/channel-shares';
import { remoteSearchMixinFactory } from 'components/common/search';
import reactMixin from 'react-mixin';

import { getViewableUsersQuery } from 'components/people/users/page';

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
class TeamSelectorInner extends React.Component {
  renderObject = team => <div>{team.get('name')}</div>;

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

export const TeamSelector = createPaginatedStateContainer(TeamSelectorInner, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, TeamsState.Store, ChannelSharesState.Store],

  paginate: {
    store: TeamsState.Store,
    propName: 'users',
    limit: 40,
    getQuery() {
      const query = {
        ordering: 'name',
        fields: ['id', 'name', 'access_to_requested_channel'],
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
    return containerUtils.defaultPending(this, TeamSelectorInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TeamSelectorInner, errors);
  }
});