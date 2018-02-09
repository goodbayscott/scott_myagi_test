import Marty from 'marty';
import React from 'react';
import _ from 'lodash';

import containerUtils from 'utilities/containers';

import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';
import ChannelShareState from 'state/channel-shares';

import CompaniesState from 'state/companies';
import UsersState from 'state/users';

import { CompanySearchableSelect } from 'components/common/company-searchable-select';

class ChannelManagementTool extends React.Component {
  render() {
    return (
      <Box>
        <BoxContent>
          {this.props.companyId && (
            <LoadingContainer
              loadingProps={[this.props.channels]}
              createComponent={() => {
                const filteredChannels = _.filter(
                  this.props.channels.toArray(),
                  c => c && c.get('company')
                );
                const uniqueChannels = _.uniq(filteredChannels, c => c.get('company').company_name);
                const sortedChannels = _.sortBy(uniqueChannels, c => c.get('company').company_name);

                return (
                  <div>
                    {sortedChannels.map(c => (
                      <div key={c.get('id')}>{c.get('company').company_name}</div>
                    ))}
                  </div>
                );
              }}
            />
          )}
        </BoxContent>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(ChannelManagementTool, {
  listenTo: [ChannelShareState.Store],

  fetch: {
    channels() {
      if (this.props.companyId) {
        return ChannelShareState.Store.getItems({
          fields: ['id', 'training_unit.id', 'company.id', 'company.company_name'],
          limit: 0,
          training_unit__company: this.props.companyId,
          ordering: 'name'
        });
      }
      return null;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelManagementTool);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelManagementTool, errors);
  }
});
