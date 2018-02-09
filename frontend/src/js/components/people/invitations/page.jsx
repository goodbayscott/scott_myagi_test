import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';
import { t } from 'i18n';
import reactMixin from 'react-mixin';
import Clipboard from 'react-clipboard.js';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { momentToISO } from 'utilities/time';

import InvitationsState from 'state/invitations';
import PageState from './state';

import { getOrigin } from 'utilities/http';
import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';

const TABLET_WIDTH = 768;
// company to user
const INVITE_TYPE = 1;

class ReSendInviteButton extends React.Component {
  static propTypes = {
    invitation: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  constructor() {
    super();
    this.state = {
      sent: false
    };
  }

  onReSendInvite = () => {
    this.props.onReSendClick(this.props.invitation);
    this.setState({ sent: true });
  };

  render() {
    const btnText = this.state.sent ? 'Sent' : 'Re-send';
    return (
      <button
        className="ui basic button"
        onClick={this.onReSendInvite}
        disabled={this.state.sent}
        style={{ width: 120 }}
      >
        <i className="icon mail" />
        {btnText}
      </button>
    );
  }
}

class InvitationsCollection extends React.Component {
  static data = {
    invitations: {
      many: true,
      fields: [
        'id',
        'invite_id',
        'registered_emails',
        'created_at',
        'learner_group_name',
        'emails_signed_up'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(InvitationsCollection);

  static contextTypes = {
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static tableDataMapping = {
    'Email(s)': (i, ctx) => ctx.cleanEmails(i.get('registered_emails')),
    Team: (i, ctx) => ctx.fetchTeam(i.get('learner_group_name')),
    Sent: i => moment(i.get('created_at')).format('DD MMMM YYYY'),
    'Signed Up': i => i.get('emails_signed_up').join(', ') || <em>{t('none')}</em>,
    Link: (i, ctx) => (
      <Clipboard
        component="div"
        data-clipboard-text={`${getOrigin()}/signup/user/?sid=${i.get('invite_id')}`}
        onSuccess={() =>
          ctx.context.displayTempPositiveMessage({
            body: i.get('registered_emails')
              ? `Link for <b>${ctx.cleanEmails(i.get('registered_emails'))}</b> copied to clipboard`
              : 'Link coped to clipboard'
          })
        }
      >
        <button className="ui button basic">
          <i className="ui icon linkify" />
          {t('copy_link')}
        </button>
      </Clipboard>
    ),
    'Re-send': (i, ctx) => ctx.getSendBtn(i)
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (Im.is(this.props.invitations, nextProps.invitations) && !this.props.dataIsLoading) {
      return false;
    }
    return true;
  }

  fetchTeam = team => {
    if (!team) {
      return <i>{t('none')}</i>;
    }
    return team;
  };

  cleanEmails = emails => {
    if (!emails) return <i>{t('none')}</i>;
    // strip all square braces, unicode indications, and single
    // quotes that are not in the middle of email address
    emails = emails.replace(/(u')|(\[|\])/g, '').split(',');
    emails = emails.map(email => email.replace(/('$)/g, ''));
    return emails.join();
  };

  onReSendClick = invite => {
    const method = 're_send';
    InvitationsState.ActionCreators.doDetailAction(invite.get('id'), method).catch(err => {
      const message = 'Only company admins and team managers can send invitations';
      this.context.displayTempNegativeMessage({
        heading: 'Error',
        body: `<b>${message}</b>`
      });
    });
  };

  getSendBtn = invite =>
    (invite.get('registered_emails') ? (
      <ReSendInviteButton invitation={invite} onReSendClick={this.onReSendClick} />
    ) : (
      <div style={{ fontStyle: 'italic', textAlign: 'center' }}>
        No emails are associated with this invite
      </div>
    ));

  getHeaders() {
    return Im.List(_.keys(InvitationsCollection.tableDataMapping));
  }

  getRows() {
    const funcs = _.values(InvitationsCollection.tableDataMapping);
    const rows = this.props.invitations.map(i => Im.List(funcs.map(f => f(i, this))));
    return rows;
  }

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();
    return (
      <div>
        <InfiniteScroll
          loadMore={this.props.loadMore}
          moreDataAvailable={this.props.moreDataAvailable}
          dataIsLoading={this.props.dataIsLoading}
        >
          <ScrollableDataTable
            headers={headers}
            rows={rows}
            bodyHeight={null}
            ref="table"
            sortDisabled={Boolean(this.props.search)}
          />
        </InfiniteScroll>
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
export class InvitationsPage extends React.Component {
  static data = {
    invitations: $y.getData(InvitationsCollection, 'invitations', { required: false })
  };

  static propTypes = $y.propTypesFromData(InvitationsPage);

  columnsAreStacked() {
    return window.innerWidth < TABLET_WIDTH;
  }

  render() {
    return (
      <div>
        {this.getSearchInput()}
        <LoadingContainer
          loadingProps={[this.props.invitations]}
          createComponent={() => (
            <InvitationsCollection
              invitations={this.props.invitations}
              loadMore={this.props.loadMore}
              moreDataAvailable={this.props.moreDataAvailable}
              dataIsLoading={this.props.dataIsLoading}
              columnsAreStacked={this.columnsAreStacked()}
              search={this.props.search}
            />
          )}
          noDataText={t('no_outstanding_invitations')}
        />
      </div>
    );
  }
}

const now = moment();

export const Page = createPaginatedStateContainer(InvitationsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, InvitationsState.Store],

  paginate: {
    store: InvitationsState.Store,
    propName: 'invitations',
    getQuery() {
      const query = {
        company: this.context.currentUser.get('learner').company.id,
        invite_type: INVITE_TYPE,
        limit: 20,
        ordering: '-id',
        expires__gt: momentToISO(now),
        fields: $y.getFields(InvitationsPage, 'invitations')
      };
      const search = PageState.Store.getSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },

  fetch: {
    search() {
      return PageState.Store.getSearch();
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, InvitationsPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, InvitationsPage, errors);
  }
});
