import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import $y from 'utilities/yaler';

import moment from 'moment-timezone';
import { momentToISO } from 'utilities/time';

import containerUtils from 'utilities/containers.js';
import { Image } from 'components/common/image';

import { PrimaryButton } from 'components/common/buttons';

import { LoadingContainer } from 'components/common/loading';
import InvitationsState from 'state/invitations.js';

import { Title, ListItemCollection, ListItem } from 'components/common/list-items';

class InviteListItem extends React.Component {
  static data = {
    inviteListItem: {
      required: true,
      fields: [
        'id',
        'invite_id',
        'expires',
        'invite_type',
        'company.company_logo',
        'company.company_name'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(InviteListItem, {
    acceptInvite: React.PropTypes.func,
    key: React.PropTypes.number
  });

  acceptInvite = () => {
    const invite = this.props.inviteListItem;

    /*
     * TODO: HANDLE CLICK "processing" + success / error state
     * + ensure response fits INVITATION_RESPONSE requirements
     */

    InvitationsState.ActionCreators.doListAction('accept_invite', {
      invite_id: invite.get('invite_id'),
      invite_type: invite.get('invite_type')
    }).then(res => {
      window.location.href = '/views/training/';
    });
  };

  render() {
    return (
      <ListItem>
        <div className="ui stackable grid">
          <div className="ui one wide column" style={{ verticalAlign: 'middle' }}>
            <Image
              src={this.props.inviteListItem.get('company').company_logo}
              style={{
                height: 30,
                float: 'left',
                marginRight: 20,
                backgroundPosition: 'left'
              }}
            />
          </div>
          <div className="ui eight wide column" style={{ verticalAlign: 'middle' }}>
            <Title style={{ float: 'left' }}>
              {this.props.inviteListItem.get('company').company_name}
            </Title>
          </div>
          <div className="ui two wide column right floated">
            <PrimaryButton onClick={this.acceptInvite}>Accept</PrimaryButton>
          </div>
        </div>
      </ListItem>
    );
  }
}

class InviteList extends React.Component {
  static data = {
    invitationsWithShareLink: {
      many: true,
      required: true,
      fields: $y.getFields(InviteListItem, 'inviteListItem')
    }
  };

  static propTypes = $y.propTypesFromData(InviteList, {
    getEntities: React.PropTypes.instanceOf(Im.List)
  });

  createListItem = item => <InviteListItem key={item.get('invite_id')} inviteListItem={item} />;

  render() {
    return (
      <ListItemCollection
        createListItem={this.createListItem}
        entities={this.props.invitationsWithShareLink}
      />
    );
  }
}

class MyInvitesPage extends React.Component {
  static data = {
    invitationsWithShareLink: $y.getData(InviteList, 'invitationsWithShareLink', {
      required: false
    })
  };

  static propTypes = $y.propTypesFromData(MyInvitesPage);

  render() {
    return (
      <LoadingContainer
        loadingProps={{ invitationsWithShareLink: this.props.invitationsWithShareLink }}
        createComponent={props => <InviteList {...props} />}
        noDataText="No invites available"
      />
    );
  }
}

export const Page = Marty.createContainer(MyInvitesPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [InvitationsState.Store],

  getCurrentDatetime() {
    if (!this._currentDatetime) {
      this._currentDatetime = momentToISO(moment());
    }
    return this._currentDatetime;
  },

  fetch: {
    invitationsWithShareLink() {
      return InvitationsState.Store.getItems({
        invite_id__isnull: false,
        invite_type: 1,
        registered_emails__icontains: this.context.currentUser.get('email'),
        ordering: '-created_at',
        expires__gte: this.getCurrentDatetime(),
        fields: [$y.getFields(InviteListItem, 'inviteListItem')]
      });
    }
  },
  pending() {
    return containerUtils.defaultPending(this, MyInvitesPage);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, MyInvitesPage, errors);
  }
});
