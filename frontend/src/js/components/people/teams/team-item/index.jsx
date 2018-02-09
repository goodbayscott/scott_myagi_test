import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import { t } from 'i18n';
import { resolve } from 'react-router-named-routes';

import TeamsState from 'state/teams';
import UsersState from 'state/users';

import Style from 'style/index';

import containerUtils from 'utilities/containers';

import { Modal } from 'components/common/modal';
import { AvatarImageCollection } from 'components/common/avatar-images';

const styles = {
  teamContainer: {
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  team: {
    display: 'flex',
    maxWidth: 900,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #e0e0e0',
    borderRadius: 5,
    margin: '5px 0',
    minHeight: 65,
    padding: '10px 20px',
    transition: 'all .2s ease-in-out',
    boxShadow: '#ececec 2px 2px 4px',
    ':hover': {
      transform: 'scale(1.008)',
      boxShadow: '#ddd 2px 2px 30px'
    },
    [Style.vars.media.get('mobile')]: {
      flexDirection: 'column',
      alignItems: 'flex-start'
    }
  },
  teamName: {
    marginRight: 20,
    color: 'black'
  },
  avatarCollection: {
    marginTop: 5,
    textAlign: 'left',
    float: 'right'
  },
  trashIcon: {
    color: Style.vars.colors.get('red'),
    fontSize: '1.3rem',
    padding: 10,
    ':hover': {
      transform: 'scale(1.1)'
    }
  }
};

const MAX_IMAGES = 8;

@Radium
export class TeamItemInner extends React.Component {
  static propTypes = {
    team: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  procMembersForAvatarCollection(members) {
    // AvatarCollection expects an immutable list of users with profile_photo, first_name
    // and last_name attributes. Process members for team so that they match this format
    return members.map(member =>
      Im.Map({
        id: member.get('id'),
        profile_photo: member.get('profile_photo'),
        first_name: member.get('user').first_name,
        last_name: member.get('user').last_name
      }));
  }

  navigateToTeam = () => {
    this.context.router.push(resolve('team', { teamId: this.props.team.get('id') }));
  };

  showDeleteTeamModal = evt => {
    evt.stopPropagation();
    this.refs.delModal.show();
  };

  deleteTeam = () => {
    TeamsState.ActionCreators.delete(this.props.team.get('id'));
    this.refs.delModal.hide();
  };

  render() {
    const users = this.procMembersForAvatarCollection(this.props.members);
    return (
      <div style={styles.teamContainer}>
        <div style={styles.team} key={this.props.team.get('id')} onClick={this.navigateToTeam}>
          <div style={styles.teamName}>{this.props.team.get('name')}</div>
          {this.props.members.count() ? (
            <AvatarImageCollection
              users={users}
              containerStyle={styles.avatarCollection}
              maxImages={MAX_IMAGES}
            />
          ) : (
            <div key="bin" style={styles.trashIcon} onClick={this.showDeleteTeamModal}>
              <i className="ui icon trash outline" />
            </div>
          )}
        </div>
        <Modal
          ref="delModal"
          header={t('are_you_sure_delete_team')}
          content={t('this_action_cannot_be_reversed')}
          onConfirm={this.deleteTeam}
          basic
        />
      </div>
    );
  }
}

export const TeamItem = Marty.createContainer(TeamItemInner, {
  listenTo: [TeamsState.Store, UsersState.Store],

  fetch: {},

  getDefaultProps() {
    return {
      members: Im.List()
    };
  },

  done(results) {
    const members = Im.List(this.props.team.get('members').map(Im.Map));
    return <TeamItemInner {...this.props} members={members} />;
  },

  pending() {
    return containerUtils.defaultPending(this, TeamItemInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TeamItemInner, errors);
  }
});
