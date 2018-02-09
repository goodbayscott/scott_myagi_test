import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import pluralize from 'pluralize';
import { t } from 'i18n';

import Style from 'style';

import containerUtils from 'utilities/containers';

import TeamsState from 'state/teams';
import createPaginatedStateContainer from 'state/pagination';
import PageState from './state';

import NavbarState from 'components/navbar/component-state';
import { LoadingContainer } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';
import { ListItemCollection } from 'components/common/list-items';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal';
import { TeamDetailsForm } from './team-details-form';
import { TeamItem } from './team-item';
import { InfiniteScroll } from 'components/common/infinite-scroll';

const styles = {
  addTeamBtn: {
    float: 'right',
    [Style.vars.media.get('tablet')]: {
      marginLeft: 0
    },
    [Style.vars.media.get('mobile')]: {
      float: 'left',
      marginLeft: 0
    }
  },
  header: {
    display: 'flex',
    [Style.vars.media.get('mobile')]: {
      display: 'block'
    }
  },
  teamsCollection: {
    width: '100%'
  }
};

class AddTeamModal extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  show = () => {
    this.modal.show();
  };

  hide = () => {
    this.modal.hide();
  };

  render() {
    return (
      <Modal ref={modal => (this.modal = modal)} closeOnDimmerClick header={t('create_team')}>
        <div className="content">
          <TeamDetailsForm currentUser={this.props.currentUser} onSubmit={this.hide} />
        </div>
      </Modal>
    );
  }
}

export class TeamsCollection extends React.Component {
  static propTypes = {
    teams: React.PropTypes.instanceOf(Im.List).isRequired
  };

  createListItem(team) {
    return <TeamItem key={team.get('id')} team={team} />;
  }

  render() {
    return (
      <InfiniteScroll
        loadMore={this.props.loadMore}
        moreDataAvailable={this.props.moreDataAvailable}
        dataIsLoading={this.props.dataIsLoading}
      >
        <ListItemCollection entities={this.props.teams} createListItem={this.createListItem} />
      </InfiniteScroll>
    );
  }
}

@Radium
@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
class TeamsPage extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static propTypes = {
    teams: React.PropTypes.instanceOf(Im.List),
    moreDataAvailable: React.PropTypes.bool.isRequired,
    loadMore: React.PropTypes.func.isRequired,
    // Has any data been loaded at all?
    hasLoadedData: React.PropTypes.func.isRequired,
    // Is more data currently being loaded?
    dataIsLoading: React.PropTypes.bool
  };

  showAddTeamModal = () => {
    this.refs.addTeamModal.show();
  };

  render() {
    const learner = this.context.currentUser.get('learner');

    return (
      <div>
        <div className="ui two column stackable grid" style={styles.header}>
          <div className="ui column">
            {(this.props.teamsCount || PageState.Store.getSearch()) &&
              this.getSearchInput({
                initialValue: `Search ${this.props.teamsCount} ${pluralize(
                  'team',
                  this.props.teamsCount
                )}...`
              })}
          </div>
          <div className="ui column">
            {learner.is_company_admin ? (
              <PrimaryButton style={styles.addTeamBtn} onClick={this.showAddTeamModal}>
                {t('create_team')}
              </PrimaryButton>
            ) : null}
          </div>
        </div>
        <LoadingContainer
          loadingProps={{
            teams: this.props.teams
          }}
          createComponent={props => (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={styles.teamsCollection}>
                <TeamsCollection
                  teams={this.props.teams}
                  loadMore={this.props.loadMore}
                  moreDataAvailable={this.props.moreDataAvailable}
                  dataIsLoading={this.props.dataIsLoading}
                />
              </div>
            </div>
          )}
          noDataText="There are no teams."
        />
        <AddTeamModal ref="addTeamModal" currentUser={this.context.currentUser} />
      </div>
    );
  }
}

export const Page = createPaginatedStateContainer(TeamsPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [TeamsState.Store, PageState.Store],
  paginate: {
    store: TeamsState.Store,
    propName: 'teams',
    limit: 20,
    getQuery() {
      const search = PageState.Store.getSearch();
      const q = {
        fields: [
          'id',
          'url',
          'name',
          'description',
          'members.id',
          'members.profile_photo',
          'members.user.id',
          'members.user.first_name',
          'members.user.last_name'
        ],
        ordering: 'name'
      };
      if (search) {
        q.search = search;
        q.ordering = '-search_rank';
      }
      const learner = this.context.currentUser.get('learner');
      if (!learner.is_company_admin) {
        if (learner.is_area_manager) {
          q.area__managers = this.context.currentUser.get('id');
        } else {
          q.has_user = this.context.currentUser.get('id');
        }
      }
      return q;
    }
  },

  fetch: {
    teamsCount() {
      return TeamsState.Store.getKnownCountForQuery();
    }
  },
  componentWillMount() {
    NavbarState.ActionCreators.setTitle('People');
    NavbarState.ActionCreators.setInfo('This is where you can manage the teams/users in your company');
    PageState.Store.resetState();
  },
  done(results) {
    return <TeamsPage ref="innerComponent" {...this.props} {...results} />;
  },
  pending() {
    return containerUtils.defaultPending(this, TeamsPage);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, TeamsPage, errors);
  }
});
