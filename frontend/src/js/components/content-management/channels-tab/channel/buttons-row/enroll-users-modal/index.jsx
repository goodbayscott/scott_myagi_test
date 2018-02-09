import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import Style from 'style/index.js';
import moment from 'moment-timezone';
import reactMixin from 'react-mixin';

import { momentToISO } from 'utilities/time.js';
import { PrimaryButton } from 'components/common/buttons';
import { Modal } from 'components/common/modal/index.jsx';
import { LoadingSpinner } from 'components/common/loading';
import { remoteSearchMixinFactory } from 'components/common/search';
import UsersState from 'state/users';
import ChannelAccessUserState from 'state/channel-access-users';
import ChannelAccessTeamState from 'state/channel-access-teams';
import ChannelSharesState from 'state/channel-shares';
import PageState from './state';
import { UserSelector } from './selectors/user';
import { TeamSelector } from './selectors/team';

const styles = {
  fraction: {
    margin: '0 20px 20px'
  },
  fractionNumbers: {
    fontSize: '1.6rem',
    fontWeight: 600
  },
  fractionText: {
    marginLeft: 10
  },
  error: {
    marginLeft: 10,
    color: Style.vars.colors.get('red')
  },
  topRowContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  objectRow: {
    display: 'flex',
    alignItems: 'center'
  }
};

const USER_TAB = 'user';
const GROUPS_TAB = 'group';
const TEAM_TAB = 'team';

const TAB_DETAILS = {
  [USER_TAB]: {
    GenericChannelAccessState: ChannelAccessUserState,
    fieldName: 'user',
    routeName: 'users'
  },
  [TEAM_TAB]: {
    GenericChannelAccessState: ChannelAccessTeamState,
    fieldName: 'team',
    routeName: 'learner_groups'
  }
};

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setSearch))
export class EnrollModal extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      selectionChanges: {
        newSelected: {},
        newDeselected: {}
      },
      saving: false,
      deselectAttempt: false,
      currentTab: USER_TAB
    };
  }

  show = () => {
    this.refs.modal.show();
  };

  isSelected = obj => {
    const access = obj.get('access_to_requested_channel');

    // if (this.state.currentTab === USER_TAB) {
    //   if (access[TEAM_TAB].length > 0) {
    //     return true
    //   }
    // }

    return access[this.state.currentTab].length > 0;
  };

  save = () => {
    this.setState({ ...this.state, saving: true });

    const { newSelected, newDeselected } = this.state.selectionChanges;
    const { origin } = window.location;
    const { GenericChannelAccessState, fieldName, routeName } = TAB_DETAILS[this.state.currentTab];

    const createPromises = Object.keys(newSelected).map(id => GenericChannelAccessState.ActionCreators.create({
      channel: this.props.channel.get('url'),
      company: this.context.currentUser.get('learner').company.url,
      // TODO: need a cleaner way to get url, or accept id
      [fieldName]: `${origin}/api/v1/${routeName}/${id}/`
    }));

    const removePromises = Object.keys(newDeselected).map(id => {
      const accessObj = newDeselected[id].get('access_to_requested_channel')[
        this.state.currentTab
      ][0];
      return GenericChannelAccessState.ActionCreators.update(accessObj.id, {
        deactivated: momentToISO(moment())
      });
    });

    Promise.all([...createPromises, ...removePromises]).then(p => {
      ChannelSharesState.ActionCreators.resetLocalData();
      UsersState.ActionCreators.resetLocalData();
      this.setState({
        ...this.state,
        saving: false,
        selectionChanges: {
          newSelected: {},
          newDeselected: {}
        }
      });
    });
  };

  selectionChangeDelta = () => {
    const { newSelected } = this.state.selectionChanges;
    // licences are burnt once enrollment is saved so newDeselected doesn't matter
    return Object.keys(newSelected).length;
  };

  onSelectionChange = newSelection => {
    const newSelectionLength = Object.keys(newSelection.newSelected).length;
    const newSelectionLengthOld = Object.keys(this.state.selectionChanges.newSelected).length;

    if (newSelectionLength > newSelectionLengthOld) {
      const { used, total } = this.usedLicenceFraction();
      if (used >= total) {
        return;
      }
    }

    this.setState({
      ...this.state,
      selectionChanges: newSelection,
      deselectAttempt: false
    });
  };

  usedLicenceFraction = () => {
    const used =
      this.props.ownCompanyConnection.get('total_licences_used') + this.selectionChangeDelta();
    const total = this.props.ownCompanyConnection.get('licence_quantity') || 0;
    return { used, total };
  };

  confirmSaveModalContent = () => {
    const newSelectedIds = Object.keys(this.state.selectionChanges.newSelected);
    const newDeselectedIds = Object.keys(this.state.selectionChanges.newDeselected);
    const renderObject =
      this.currentSelector && this.currentSelector.getInnerComponent().renderObject;
    return (
      <div>
        {newSelectedIds.length > 0 && (
          <div>
            {t('you_are_adding_the_following_enrollments')}

            {newSelectedIds.map(id => {
              const obj = this.state.selectionChanges.newSelected[id];
              return (
                <div key={obj.get('id')} style={styles.objectRow}>
                  <div>- </div>
                  {renderObject(obj)}
                </div>
              );
            })}
          </div>
        )}
        <br />
        {newDeselectedIds.length > 0 && (
          <div>
            {t('you_are_removing_the_following_enrollments')}

            {newDeselectedIds.map(id => {
              const obj = this.state.selectionChanges.newDeselected[id];
              return (
                <div key={obj.get('id')} style={styles.objectRow}>
                  <div>- </div>
                  {renderObject(obj)}
                </div>
              );
            })}
            <br />
            {t('remove_enrollment_licence_warning')}
          </div>
        )}
      </div>
    );
  };

  render() {
    const { used, total } = this.usedLicenceFraction();
    const selectorProps = {
      ref: c => (this.currentSelector = c),
      channel: this.props.channel,
      isSelected: this.isSelected,
      onChange: this.onSelectionChange,
      value: this.state.selectionChanges
    };
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('select_users')}>
        <div className="content">
          <div style={styles.topRowContainer}>
            { total > 0 ?
              <div style={styles.fraction}>
                <span style={styles.fractionNumbers}>
                  {used}/{total}
                </span>
                <span style={styles.fractionText}>{t('licences_used')}</span>
                {used === total && <span style={styles.error}>({t('limit_reached')})</span>}
              </div>
            :
              <div style={styles.error}>
                {t('please_purchase_licences')}
              </div>
            }
            <div>
              {this.getSearchInput({
                borderless: true
              })}
            </div>
          </div>
          {this.state.saving && <LoadingSpinner />}

          {this.state.currentTab === USER_TAB && <UserSelector {...selectorProps} />}
          {this.state.currentTab === TEAM_TAB && <TeamSelector {...selectorProps} />}
        </div>
        <br />
        <PrimaryButton onClick={() => this.confirmSaveModal.show()} disabled={this.state.saving}>
          {t('save')}
        </PrimaryButton>
        <Modal
          ref={c => (this.confirmSaveModal = c)}
          header={t('are_you_sure')}
          content={this.confirmSaveModalContent()}
          onConfirm={this.save}
          basic
        />
      </Modal>
    );
  }
}
