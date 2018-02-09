import Marty from 'marty';
import React from 'react';

import containerUtils from 'utilities/containers';

import { LoadingContainer } from 'components/common/loading';
import { Box, BoxHeader, BoxContent } from 'components/common/box';

import CompaniesState from 'state/companies';
import UsersState from 'state/users';

import { CompanySearchableSelect } from 'components/common/company-searchable-select';
import { Page as ConnectionListPage } from './connection-list/page';
import { Page as BulkCreatePage } from './bulk-create/page';
import { Page as ChannelTagPage } from './channel-tags/page';

class ChannelManagementTool extends React.Component {
  render() {
    return (
      <Box>
        <BoxHeader>
          <h1>Channel Management</h1>
        </BoxHeader>
        <BoxContent>
          <LoadingContainer
            loadingProps={[this.props.currentUser]}
            createComponent={() => (
              <div>
                <ChannelTagPage />
                <ConnectionListPage />
                <BulkCreatePage />
              </div>
            )}
          />
        </BoxContent>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(ChannelManagementTool, {
  listenTo: [UsersState.Store],

  fetch: {
    currentUser() {
      return UsersState.Store.getCurrent();
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ChannelManagementTool);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ChannelManagementTool, errors);
  }
});
