import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import Style from 'style';
import containerUtils from 'utilities/containers';
import _ from 'lodash';

import { getIdFromApiUrl } from 'utilities/generic';
import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';
import { TagSearchableMultiSelect } from 'components/common/tag-searchable-multiselect';

import CompaniesState from 'state/companies';
import UsersState from 'state/users';
import ChannelsState from 'state/channels';
import ChannelSharesState from 'state/channel-shares';

class ChannelTagsList extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  onTagsChange = vals => {
    const newTags = Object.keys(vals).map(key => vals[key].value);
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), {
      tags: newTags
    }).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'Tags saved'
      });
    });
  };

  render() {
    return (
      <div>
        <TagSearchableMultiSelect
          name="tags"
          onChange={this.onTagsChange}
          initialSelections={this.props.channel.get('tags')}
          currentUser={this.context.currentUser}
        />
      </div>
    );
  }
}

class ChannelsList extends React.Component {
  render() {
    return (
      <div>
        {this.props.channels.map(channel => (
          <div>
            {channel.get('name')}
            {channel.get('public') ? (
              <i className="ui unlock icon" />
            ) : (
              <i className="ui lock icon" />
            )}
            <ChannelTagsList channel={channel} />
          </div>
        ))}
      </div>
    );
  }
}

class ChannelListPage extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      companyChannelId: null,
      companyId: null
    };
  }

  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={[this.props.channels]}
          createComponent={() => <ChannelsList {...this.props} />}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(ChannelListPage, {
  listenTo: [UsersState.Store, ChannelsState.Store, CompaniesState.Store, ChannelSharesState.Store],

  fetch: {
    channels() {
      if (this.props.companyId) {
        return ChannelsState.Store.getItems({
          fields: ['id', 'name', 'tags', 'public', 'deactivated'],
          limit: 0,
          company: this.props.companyId,
          ordering: 'name',
          deactivated__isnull: true
        });
      }
      return null;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelListPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelListPage, errors);
  }
});
