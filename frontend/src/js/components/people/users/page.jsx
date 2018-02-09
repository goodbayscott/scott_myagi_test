import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';
import pluralize from 'pluralize';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import UsersState from 'state/users';
import TeamsState from 'state/teams';
import PageState from './state';

import { ScrollableDataTable } from 'components/common/table';
import { InfiniteScroll } from 'components/common/infinite-scroll';
import { remoteSearchMixinFactory } from 'components/common/search';
import { LoadingContainer } from 'components/common/loading';
import { Modal } from 'components/common/modal';
import { AvatarImage } from 'components/common/avatar-images';
import { SlideToggle } from 'components/common/form';
import { Dropdown } from 'components/common/dropdown';
import { GatedFeatureModal, GROUPS_AND_AREAS, ANALYTICS } from 'components/common/gated-feature';
import {
  Form,
  EmailInput,
  TextInput,
  SearchableSelect,
  FieldHeader,
  SubmitButton
} from 'components/common/form';

const TABLET_WIDTH = 768;
const NO_TEAM_VALUE = 'no-team';
const NO_TEAM_LABEL = '-- No team --';

const styles = {
  headingContainer: {
    paddingBottom: 0,
    // Overflow visible and minHeight required for
    // export dropdown to be visible.
    overflow: 'visible',
    minHeight: '4.2em'
  },
  heading: {
    display: 'none'
  },
  avatarImage: {
    marginRight: 15,
    cursor: 'pointer'
  },
  editIcon: {
    float: 'right'
  },
  noLgName: {
    color: Style.vars.colors.get('darkGrey'),
    fontStyle: 'italic'
  },
  dropdownMenu: {
    width: '125px'
  },
  dropItem: {},
  settingsIcon: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    fontSize: 18
  },
  removeUserIcon: {
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 16,
    float: 'right'
  },
  slideToggleContainer: {
    float: 'right'
  },
  userCountContainer: {
    float: 'right',
    color: 'white',
    marginBottom: 10,
    marginTop: -10,
    marginRight: 10,
    padding: 5,
    borderRadius: 3,
    backgroundColor: Style.vars.colors.get('navBackground')
  }
};

class EditUserModal extends React.Component {
  static data = {
    user: {
      required: false,
      fields: [
        'first_name',
        'last_name',
        'email',
        'learner.learner_group',
        'learner.company.subscription.groups_and_areas_enabled'
      ]
    },
    teams: {
      required: true,
      many: true,
      fields: ['name', 'id', 'url']
    }
  };

  static propTypes = $y.propTypesFromData(EditUserModal);

  constructor() {
    super();
    this.state = {
      loading: false,
      // Used to force searchable select to refresh
      count: 0
    };
  }

  show = () => {
    this.refs.modal.show();
  };

  onSubmitAndValid = data => {
    if (this.state.loading) return;
    this.setState({ loading: true });
    UsersState.ActionCreators.update(this.props.user.get('id'), data, {
      query: { fields: getUserFetchFields() }
    }).then(() => {
      this.setState({ loading: false, count: (this.state.count += 1) });
      this.refs.modal.hide();
    });

    if (data.learner_group === NO_TEAM_VALUE) {
      data.learner_group = null;
    }
    UsersState.ActionCreators.doDetailAction(this.props.user.get('id'), 'set_learner_group', data, {
      query: { fields: getUserFetchFields() }
    }).then(res => {
      this.setState({ loading: false, count: (this.state.count += 1) });
      if (this.props.onFinishUpdate) this.props.onFinishUpdate();
    });
  };

  render() {
    if (!this.props.user) return <span />;
    const opts = this.props.teams
      .map(t => ({
        value: t.get('url'),
        label: t.get('name')
      }))
      .push({ value: NO_TEAM_VALUE, label: NO_TEAM_LABEL })
      .toJS();
    // using 'no-team' in place of null as the frontend is discarding null
    // values when attempting to getNameAndValue TODO figure out why
    const onChange = _.partial(this.props.toggleIsActive, this.props.user);
    const isActive = this.props.user.get('is_active');
    const disabled = this.props.user.get('id') === this.props.currentUser.get('id');
    const slideToggle = this.props.createSlideToggle('Active', isActive, onChange, disabled);

    return (
      <Modal
        ref="modal"
        header={t('edit_details_for_user', { firstName: this.props.user.get('first_name') })}
      >
        <div className="content">
          <Form onSubmitAndValid={this.onSubmitAndValid}>
            <FieldHeader required>{t('first_name')}</FieldHeader>
            <TextInput
              initialValue={this.props.user.get('first_name')}
              name="first_name"
              initialIsAcceptable
              required
            />
            <FieldHeader required>{t('last_name')}</FieldHeader>
            <TextInput
              initialValue={this.props.user.get('last_name')}
              name="last_name"
              initialIsAcceptable
            />
            {this.props.user.get('learner').company.subscription.groups_and_areas_enabled && (
              <div>
                <FieldHeader required>{t('email')}</FieldHeader>
                <EmailInput
                  initialValue={this.props.user.get('email')}
                  name="email"
                  initialIsAcceptable
                  required
                />
              </div>
            )}
            <FieldHeader required>{t('team')}</FieldHeader>
            <SearchableSelect
              key={this.state.count}
              options={opts}
              initialSelection={this.props.user.get('learner').learner_group || NO_TEAM_VALUE}
              fluid
              name="learner_group"
            />
            <FieldHeader style={{ marginTop: 20 }} required>
              {t('active')}
            </FieldHeader>
            {slideToggle}
            <SubmitButton loading={this.state.loading} />
          </Form>
        </div>
      </Modal>
    );
  }
}

export class UsersCollection extends React.Component {
  static data = {
    users: {
      many: true,
      fields: [
        'id',
        'url',
        'first_name',
        'last_name',
        'email',
        'date_joined',
        'is_active',
        'learner.id',
        'learner.learnergroup_name',
        'learner.is_learner_group_admin',
        'learner.is_company_admin',
        'learner.profile_photo',
        $y.getFields(EditUserModal, 'user')
      ]
    },

    teams: $y.getData(EditUserModal, 'teams')
  };

  static propTypes = $y.propTypesFromData(UsersCollection);

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static tableDataMapping = {
    Name: (u, cxt) => (
      <div
        onClick={_.partial(cxt.userDetail, u)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        key={u.get('first_name')}
      >
        <AvatarImage size="2.5em" style={styles.avatarImage} user={u} />
        <div>
          {u.get('first_name')} {u.get('last_name')}
        </div>
      </div>
    ),
    Team: (u, cxt) => {
      let lgName = u.get('learner').learnergroup_name;
      const lgNameStyle = lgName ? styles.lgName : styles.noLgName;
      lgName = lgName || 'No Team';
      return (
        <div className="ui grid" key={lgName}>
          <div className="twelve wide column" style={lgNameStyle}>
            {lgName}
          </div>
        </div>
      );
    },
    'Date joined': u => (
      <div key={moment(u.get('date_joined')).unix()}>
        {`${moment(u.get('date_joined')).fromNow()}`}
      </div>
    ),
    'Team Manager': (u, cxt) => {
      const onChange = () => {
        cxt.toggleTeamManagerStatus(u);
      };
      const isAdmin = u.get('learner').is_learner_group_admin;
      const groupsAndAreasEnabled = cxt.context.currentUser.get('learner').company.subscription
        .groups_and_areas_enabled;
      // Disable toggle when groups and areas are disabled
      const slideToggle = cxt.createSlideToggle(
        'Team manager',
        isAdmin,
        onChange,
        !groupsAndAreasEnabled,
        cxt.onDisabledOptionClick
      );
      return slideToggle;
    },
    'Company Admin': (u, cxt) => {
      const onChange = () => {
        cxt.toggleCompanyAdminStatus(u);
      };
      const isAdmin = u.get('learner').is_company_admin;
      const groupsAndAreasEnabled = cxt.context.currentUser.get('learner').company.subscription
        .groups_and_areas_enabled;
      // Disable toggle when groups and areas are disabled
      const userIsSelf = u.get('id') === cxt.context.currentUser.get('id');
      const disabled = userIsSelf || !groupsAndAreasEnabled;
      const onDisabledClick = userIsSelf ? _.noop : cxt.onDisabledOptionClick;
      const slideToggle = cxt.createSlideToggle(
        'Company admin',
        isAdmin,
        onChange,
        disabled,
        onDisabledClick
      );
      return slideToggle;
    },
    Actions: (u, cxt) => {
      const removeUser = _.partial(cxt.showRemoveUserModal, u);
      const editUser = _.partial(cxt.showEditUserModal, u);
      return (
        <Dropdown className="ui top left pointing dropdown">
          <i className="setting icon" style={styles.settingsIcon} />
          <div className="menu" style={styles.dropdownMenu}>
            <div className="ui item" style={styles.dropItem} onClick={editUser}>
              {t('edit')}
              <i className="write icon" style={styles.removeUserIcon} />
            </div>
            <div className="ui item" style={styles.dropItem} onClick={removeUser}>
              {t('remove')}
              <i className="remove icon" style={styles.removeUserIcon} />
            </div>
          </div>
        </Dropdown>
      );
    }
  };

  constructor() {
    super();
    this.state = {
      removedUsers: Im.Map(),
      editUser: null
    };
  }

  onDisabledOptionClick = () => {
    this.teamGatedModal.show();
  };

  getDataMapping() {
    let mapping = UsersCollection.tableDataMapping;
    if (!this.context.currentUser.get('learner').is_company_admin) {
      mapping = _.extend({}, mapping);
      delete mapping['Company Admin'];
    }
    return mapping;
  }

  getHeaders() {
    return Im.List(_.keys(this.getDataMapping()));
  }

  createSlideToggle = (label, initial, onChange, disabled = false, onDisabledClick = _.noop) => (
    <SlideToggle
      key={initial}
      initialValue={initial}
      onChange={onChange}
      disabled={disabled}
      onDisabledClick={onDisabledClick}
    />
  );

  getRows() {
    const funcs = _.values(this.getDataMapping());
    return this.props.users
      .filter(u => !this.state.removedUsers.get(u.get('id')))
      .map(u => Im.List(funcs.map(f => f(u, this))));
  }

  toggleGroupMembership(u, isMember, groupName) {
    const method = isMember ? 'remove_from_group' : 'add_to_group';
    UsersState.ActionCreators.doDetailAction(
      u.get('id'),
      method,
      { name: groupName },
      { query: { fields: getUserFetchFields() } }
    ).catch(err => {
      const message = err.response.body.message;
      this.context.displayTempNegativeMessage({
        heading: 'Error',
        body: `<b>${message}</b>`
      });
    });
  }

  toggleTeamManagerStatus(u) {
    this.toggleGroupMembership(u, u.get('learner').is_learner_group_admin, 'team_managers');
  }

  toggleCompanyAdminStatus(u) {
    this.toggleGroupMembership(u, u.get('learner').is_company_admin, 'company_admins');
  }

  toggleIsActive = u => {
    if (u.get('id') === this.context.currentUser.get('id')) {
      this.context.displayTempNegativeMessage({
        heading: 'Error',
        body: '<b>This action cannot be performed on your own account</b>'
      });
      return;
    }
    UsersState.ActionCreators.update(
      u.get('id'),
      {
        is_active: !u.get('is_active')
      },
      { query: { fields: getUserFetchFields() } }
    );
  };

  removeUserFromCompany = u => {
    UsersState.ActionCreators.doDetailAction(u.get('id'), 'remove_user_from_current_company', {})
      .then(() => {
        this.setState(
          {
            removedUsers: this.state.removedUsers.set(u.get('id'), u)
          },
          () => {
            this.context.displayTempPositiveMessage({
              heading: 'Success',
              body: `${u.get('first_name')} ${u.get('last_name')} has been removed.`
            });
          }
        );
      })
      .catch(err => {
        const message = err.response.body.message;
        this.context.displayTempNegativeMessage({
          heading: 'Error',
          body: `<b>${message}</b>`
        });
      })
      .then(() => {
        this.refs.removeUserModal.hide();
      });
  };

  showRemoveUserModal = u => {
    this.setState({ editUser: u });
    _.defer(this.refs.removeUserModal.show.bind(this.refs.removeUserModal));
  };

  showEditUserModal = u => {
    this.setState({ editUser: u });
    _.defer(this.refs.editUserModal.show.bind(this.refs.editUserModal));
  };

  editUserTeam = u => {
    this.setState({ editUser: u });
    _.defer(this.refs.editTeamModal.show);
  };

  userDetail = u => {
    this.context.router.push(resolve('profile', {
      userId: u.get('id')
    }));
  };

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();
    const removeFunc = _.partial(this.removeUserFromCompany, this.state.editUser);
    const removeUserName = this.state.editUser ? this.state.editUser.get('full_name') : '';

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
            // Disabled sort when user is searching, because table will be sorted according to
            // search rank
            sortDisabled={Boolean(this.props.search)}
          />
        </InfiniteScroll>
        <Modal
          ref="removeUserModal"
          onConfirm={removeFunc}
          header={t('are_you_sure_remove_user', { removeUserName })}
          basic
        />
        <EditUserModal
          ref="editUserModal"
          user={this.state.editUser}
          teams={this.props.teams}
          currentUser={this.context.currentUser}
          createSlideToggle={this.createSlideToggle}
          toggleIsActive={this.toggleIsActive}
        />
        <GatedFeatureModal
          ref={teamGatedModal => (this.teamGatedModal = teamGatedModal)}
          headerText={t('upgrade_to_pro')}
          descriptionText={t('upgrade_to_pro_info')}
          featureType={GROUPS_AND_AREAS}
        />
      </div>
    );
  }
}

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
export class UsersPage extends React.Component {
  static data = {
    users: $y.getData(UsersCollection, 'users', { required: false }),
    teams: $y.getData(UsersCollection, 'teams', { required: false })
  };

  static propTypes = $y.propTypesFromData(UsersPage);

  render() {
    return (
      <div>
        {(this.props.usersCount || PageState.Store.getSearch()) &&
          this.getSearchInput({
            initialValue: `Search ${this.props.usersCount} ${pluralize(
              'user',
              this.props.usersCount
            )}...`
          })}
        <LoadingContainer
          loadingProps={[this.props.users, this.props.teams]}
          createComponent={() => (
            <UsersCollection
              users={this.props.users}
              teams={this.props.teams}
              loadMore={this.props.loadMore}
              moreDataAvailable={this.props.moreDataAvailable}
              dataIsLoading={this.props.dataIsLoading}
              search={this.props.search}
            />
          )}
          noDataText={t('there_are_no_users_in_this_company')}
        />
      </div>
    );
  }
}

function getUserFetchFields() {
  // Added this function to ensure that fetch fields are the same
  // for getting users and for when detail actions are used to update
  // users
  return $y.getFields(UsersPage, 'users');
}

export const getViewableUsersQuery = (query, currentUser) => {
  const learner = currentUser.get('learner');
  if (learner.is_area_manager && !learner.is_company_admin) {
    return {
      ...query,
      learner__company: learner.company.id,
      learner__learnergroups__areas__managers: currentUser.get('id')
    };
  }
  return {
    ...query,
    learner__company: learner.company.id
  };
};

export const Page = createPaginatedStateContainer(UsersPage, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [PageState.Store, UsersState.Store, TeamsState.Store],

  paginate: {
    store: UsersState.Store,
    propName: 'users',
    limit: 50,
    getQuery() {
      const learner = this.context.currentUser.get('learner');
      let query = {
        ordering: 'first_name',
        fields: getUserFetchFields()
      };
      // If not admin, only show active users
      if (!learner.is_company_admin) {
        query.is_active = true;
      }
      query = getViewableUsersQuery(query, this.context.currentUser);
      const search = PageState.Store.getSearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      return query;
    }
  },

  fetch: {
    usersCount() {
      const query = getViewableUsersQuery({}, this.context.currentUser);
      return UsersState.Store.getKnownCountForQuery(query);
    },
    search() {
      return PageState.Store.getSearch();
    },
    teams() {
      const query = {
        ordering: 'name',
        limit: 0,
        fields: $y.getFields(UsersPage, 'teams')
      };
      return TeamsState.Store.getItems(query);
    }
  },

  componentWillMount() {
    PageState.Store.resetState();
  },

  pending() {
    return containerUtils.defaultPending(this, UsersPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, UsersPage, errors);
  }
});
