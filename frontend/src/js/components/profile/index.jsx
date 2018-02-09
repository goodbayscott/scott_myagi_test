import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import reactMixin from 'react-mixin';

import Style from 'style';
import { t } from 'i18n';
import UsersState from 'state/users';
import containerUtils from 'utilities/containers';
import { Panel, BoxHeader, BoxContent } from 'components/common/box';
import { AvatarImage } from 'components/common/avatar-images';
import { BadgeAwardList } from './badge-list';

import $y from 'utilities/yaler';

import { Stats } from 'components/profile/stats';
import { TabsMixin } from 'components/common/tabs';
import { LoadingContainer } from 'components/common/loading';
import TrainingPlanList from './training-plan-list';
import ModuleList from './module-list';

const AVATAR_IMAGE_SIZE = '180px';

const style = {
  tabContentContainer: {
    background: 'white'
  },
  avatarImage: {
    border: '3px solid white',
    height: AVATAR_IMAGE_SIZE,
    width: AVATAR_IMAGE_SIZE,
    margin: '30px auto 10px auto'
  },
  nameContainer: {
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    margin: '10px auto 35px auto',
    textAlign: 'center',
    color: Style.vars.colors.get('textBlack')
  },
  nameText: {
    fontSize: '2.1em',
    lineHeight: '28px',
    padding: '10px 0'
  },
  teamText: {
    fontSize: '1.5em'
  }
};

@reactMixin.decorate(TabsMixin)
class InfoTabs extends React.Component {
  getTabContentMap() {
    const badges = Im.List(this.props.user.get('badge_awards'));

    const canEnroll = this.props.currentUser.get('learner').can_enroll_others_in_training_content;
    const isCurrent = this.props.currentUser.get('id') === this.props.user.get('id');

    const tabs = {
      Badges: (
        <BadgeAwardList
          user={this.props.user}
          currentUser={this.props.currentUser}
          badgeAwards={badges}
        />
      )
    };

    if (canEnroll || isCurrent) {
      Object.assign(tabs, {
        Plans: <TrainingPlanList user={this.props.user} />,
        Lessons: <ModuleList user={this.props.user} />
      });
    }

    return tabs;
  }

  render() {
    return (
      <Panel>
        <BoxContent>
          {this.getTabs({ stackable: true })}
          {this.getTabContent({ renderWhenActive: true })}
        </BoxContent>
      </Panel>
    );
  }
}

class ProfilePageComponent extends React.Component {
  static data = {
    user: {
      fields: [
        $y.getFields(Stats, 'learner', 'learner'),
        $y.getFields(TrainingPlanList, 'user'),

        'first_name',
        'last_name',
        'learner',
        'learner.profile_photo',
        'learner.company.cover_image',
        'learner.is_company_admin',
        'learner.learnergroup_name',
        'learner.company.company_name',
        'learner.company.company_logo',

        'badge_awards.id',
        'badge_awards.unique_code',
        'badge_awards.badge.id',
        'badge_awards.badge.name',
        'badge_awards.badge.description',
        'badge_awards.badge.badge_image',
        'badge_awards.badge.discount_code',
        'badge_awards.badge.discount_url'
      ]
    }
  };

  render() {
    const user = this.props.user ? this.props.user : null;
    const learner = this.props.user ? this.props.user.get('learner') : null;
    const teamName =
      this.props.user && learner.learnergroup_name ? learner.learnergroup_name : t('no_team');
    return (
      <LoadingContainer
        loadingProps={[this.props.user]}
        createComponent={() => {
          const learner = this.props.user.get('learner');
          return (
            <div>
              <AvatarImage
                user={this.props.user}
                style={style.avatarImage}
                size={AVATAR_IMAGE_SIZE}
                large
                edit={this.props.edit}
              />
              <div style={style.nameContainer}>
                <div style={style.nameText}>
                  {this.props.user.get('first_name')} {this.props.user.get('last_name')}
                </div>
                <div style={style.teamText}>
                  {teamName} - {learner.company && learner.company.company_name}
                </div>
              </div>
              <Stats learner={learner} />
              <InfoTabs currentUser={this.props.currentUser} user={this.props.user} />
            </div>
          );
        }}
      />
    );
  }
}

export const ProfilePage = Marty.createContainer(ProfilePageComponent, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  propType: {
    isActive: React.PropTypes.bool.isRequired
  },

  listenTo: [UsersState.Store],

  fetch: {
    user() {
      const userId = this.context.routeParams.userId;
      return UsersState.Store.getItem(userId, {
        fields: $y.getFields(ProfilePageComponent, 'user')
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ProfilePageComponent);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ProfilePageComponent, errors);
  }
});
