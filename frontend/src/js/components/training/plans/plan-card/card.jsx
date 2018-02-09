import React from 'react';
import Radium from 'radium';
import moment from 'moment-timezone';
import _ from 'lodash';

import { t } from 'i18n';
import { resolve } from 'react-router-named-routes';

import Style from 'style';

import ReactStyleTransitionGroup from 'react-style-transition-group';
import { Info } from 'components/common/info';
import { ProgressBar } from 'components/common/progress-bar';
import { Link } from 'react-router';
import { Modal } from 'components/common/modal';

import PLACEHOLDER_IMAGE from 'img/placeholder.svg';

const WIDTH = 330;
const IMG_HEIGHT = 9 / 16 * WIDTH; // ratio should be 16:9 with width
const ICON_TOP = IMG_HEIGHT / 2;

const style = {
  container: {
    width: WIDTH,
    margin: '12px 12px 25px 12px',
    display: 'flex',
    flexDirection: 'column',
    color: Style.vars.colors.get('black'),
    position: 'relative'
  },
  connectOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: WIDTH,
    height: IMG_HEIGHT,
    backgroundColor: 'black',
    // marginTop: -IMG_HEIGHT,
    position: 'absolute',
    // zIndex: 9999,
    color: 'white',
    transition: 'all .2s ease-in-out',
    opacity: 0,
    ':hover': {
      opacity: 1
    }
  },
  connectText: {
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  connectedText: {
    fontSize: 18,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  },
  img: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#eee',
    display: 'flex',
    alignItems: 'flex-end',
    height: IMG_HEIGHT,
    width: '100%',
    cursor: 'pointer',
    position: 'relative',
    ':hover': {}
  },
  hoverIconContainer: {
    width: WIDTH,
    height: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0
  },
  hoverIcon: {
    top: ICON_TOP,
    height: '50px',
    width: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    color: Style.vars.colors.get('primaryFontColor'),
    zIndex: '3',
    backgroundColor: Style.vars.colors.get('primary')
  },
  companyNameRow: {
    marginTop: 8,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  companyNameContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  companyLogo: {
    maxWidth: 26,
    maxHeight: 20,
    marginRight: 5
  },
  companyName: {
    fontSize: 12,
    maxWidth: 200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#888'
  },
  iconsList: {
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    marginLeft: 5
  },
  greenIcon: {
    color: Style.vars.colors.get('oliveGreen')
  },
  redIcon: {
    color: Style.vars.colors.get('red')
  },
  blackIcon: {
    color: '#666'
  },
  greyIcon: {
    color: '#bbb'
  },
  trainingNameLink: {
    color: 'black'
  },
  trainingPlanName: {
    margin: '5px 15px 5px 0',
    fontSize: 18,
    cursor: 'pointer',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  trainingPlanNameHover: {
    textDecoration: 'underline'
  },
  badgeImage: {
    margin: 7,
    height: 50,
    width: 50,
    borderRadius: 3,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#f7f7f7',
    border: '3px solid #f7f7f7',
    boxShadow: 'rgba(0, 0, 0, 0.4) 0 0 12px'
  },
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap-reverse',
    alignItems: 'flex-end',
    width: '100%',
    minHeight: 34
  },
  unpublishedContainer: {
    height: 0
  },
  unpublished: {
    position: 'relative',
    top: 0,
    display: 'inline-block',
    padding: '6px 20px 7px 10px',
    backgroundColor: 'rgba(236, 21, 21, 0.72)',
    color: '#fff',
    borderBottomRightRadius: 27
  },
  lockOverlay: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundImage: 'linear-gradient(#000a, #000a, #0009, #0000)',
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lockIcon: {
    color: 'white',
    fontSize: 48
  }
};

const transitionStyles = {
  enter: {
    transition: 'all .2s ease-in-out',
    transform: 'scale(0.7)',
    opacity: 0
  },
  enterActive: {
    transform: 'scale(1)',
    opacity: 1
  },
  leave: {
    transition: 'all .2s ease-in-out',
    transform: 'scale(1)',
    opacity: 1
  },
  leaveActive: {
    transform: 'scale(0.7)',
    opacity: 0
  }
};

@Radium
export class TrainingPlanCardDetails extends React.Component {
  static data = {
    trainingPlan: {
      fields: [
        'modules',
        'name',
        'id',
        'auto_enroll',
        'owner.company_name',
        'badges.name',
        'badges.id',
        'badges.badge_image',
        'owner.company_name',
        'owner.company_logo',
        'thumbnail_url',
        'custom_thumbnail',
        'custom_thumbnail_small',
        'next_due_date_for_user',
        'num_enrolled_users',
        'num_enrolled_users_in_own_company',
        'next_incompleted_module_for_user'
      ]
    }
  };

  static contextTypes = {
    location: React.PropTypes.object.isRequired
  };

  getIcons() {
    const DAYS_BEFORE_COLOR_CHANGE = -7; // 7 days before due, icon goes red
    const flags = this.props.currentUser.get('feature_flags');
    const icons = [];

    if (this.props.trainingPlan.get('user_is_enrolled')) {
      const nextDueDate = this.props.trainingPlan.get('next_due_date_for_user');
      if (nextDueDate) {
        let iconStyle = {};

        if (this.props.progress !== 100) {
          const daysBefore = moment().diff(moment(nextDueDate), 'days');
          if (daysBefore > DAYS_BEFORE_COLOR_CHANGE) {
            iconStyle = style.redIcon;
          } else {
            iconStyle = style.blackIcon;
          }
        } else {
          iconStyle = style.greenIcon;
        }

        icons.push({
          info: `Due ${moment(nextDueDate).fromNow()}`,
          el: (
            <div>
              <i className="ui icon wait" style={iconStyle} />
            </div>
          )
        });
      }
    }
    return icons;
  }

  getModuleProgress() {
    const totalModules = this.props.trainingPlan.get('modules').length;
    let completedModulesCount = 0;
    this.props.trainingPlan.get('modules').forEach(module => {
      if (module.successfully_completed_by_current_user) {
        completedModulesCount += 1;
      }
    });
    return { totalModules, completedModulesCount };
  }

  calcProgressProportion() {
    const { totalModules, completedModulesCount } = this.getModuleProgress();
    if (totalModules === 0 || completedModulesCount === 0) return 0.0;
    return completedModulesCount / totalModules;
  }

  generateLink = () => {
    const {
      trainingPlan, linkTo, isPublicPage, goToChannelOnCompletion
    } = this.props;
    const nextModule = trainingPlan.get('next_incompleted_module_for_user');
    // To allow for redirections to the training plan edit page (for the search page)
    let link =
      linkTo ||
      `/views/training_plans/${trainingPlan.get('id')}/modules/${nextModule}/attempts/new/`;
    if (goToChannelOnCompletion) {
      link = `${link}?goToChannelOnCompletion=true`;
    }
    if (isPublicPage) link = null;
    return link;
  };

  showLockModal = () => {
    this.lockModal.show();
  };

  renderLockOverlay() {
    return (
      <div style={style.lockOverlay} onClick={this.showLockModal}>
        <i className="ui lock icon" style={style.lockIcon} />
        <Modal
          basic
          message
          header={t('plan_locked')}
          content={t('complete_previous_plans')}
          ref={e => (this.lockModal = e)}
        />
      </div>
    );
  }

  render() {
    const { trainingPlan, sizeMultiplier } = this.props;
    const containerHover = Radium.getState(this.state, 'container', ':hover');
    const baseContainerStyle = {
      ...style.container,
      ...(this.props.containerStyle || {})
    };
    const customThumbnail = trainingPlan.get('custom_thumbnail_small')
      ? trainingPlan.get('custom_thumbnail_small')
      : trainingPlan.get('thumbnail_url');

    const completedModulesCount = !this.props.hideProgress
      ? this.getModuleProgress().completedModulesCount
      : 0;
    let connectedStatus = t('connect_to_access');
    if (this.props.channelRequested) {
      connectedStatus = t('you_have_requested_access', {
        companyName: this.props.trainingPlan.get('owner').company_name
      });
    }
    if (this.props.channelConnected) {
      connectedStatus = t('you_are_already_connected');
    }

    return (
      <div
        style={Style.funcs.mergeIf(sizeMultiplier, baseContainerStyle, {
          width: style.container.width * sizeMultiplier
        })}
      >
        {this.props.lock && this.renderLockOverlay()}
        {!this.props.trainingPlan.get('is_published') && (
          <div style={style.unpublishedContainer}>
            <div style={style.unpublished}>{t('unpublished')}</div>
          </div>
        )}
        <Link to={this.generateLink()}>
          <div
            key="container"
            style={Style.funcs.mergeIf(
              sizeMultiplier,
              {
                ...style.img,
                backgroundImage: `url(${customThumbnail || PLACEHOLDER_IMAGE})`
              },
              { height: style.img.height * sizeMultiplier }
            )}
          >
            {this.props.hoverIcon ? (
              <div style={style.hoverIconContainer}>
                <ReactStyleTransitionGroup>
                  {containerHover && (
                    <i
                      transitionStyles={transitionStyles}
                      style={style.hoverIcon}
                      className={`ui icon ${this.props.hoverIcon}`}
                    />
                  )}
                </ReactStyleTransitionGroup>
              </div>
            ) : null}
            {!this.props.hideBadges && (
              <div style={style.badgeContainer}>
                {trainingPlan.get('badges').map(badge => (
                  <Info
                    key={badge.id}
                    content={t('this_plan_contributes_to_earning_the', {
                      badgeName: badge.name
                    })}
                  >
                    <div
                      style={{
                        ...style.badgeImage,
                        backgroundImage: `url(${badge.badge_image})`
                      }}
                    />
                  </Info>
                ))}
              </div>
            )}
          </div>
        </Link>

        {this.props.isPublicPage ? (
          <div key="connectOverlay" style={style.connectOverlay}>
            <div
              onClick={this.props.showTrainingPlanDetails}
              key={`connect-text${this.props.trainingPlan.get('id')}`}
              style={
                !(this.props.channelConnected || this.props.channelRequested)
                  ? style.connectText
                  : style.connectedText
              }
            >
              {connectedStatus}
            </div>
          </div>
        ) : null}

        {!this.props.isPublicPage && !this.props.hideProgress ? (
          <ProgressBar
            total={trainingPlan.get('modules').length}
            completed={completedModulesCount}
          />
        ) : null}

        <div style={style.companyNameRow}>
          <div style={style.companyNameContainer}>
            <img style={style.companyLogo} src={trainingPlan.get('owner').company_logo} />
            <div style={style.companyName}>{trainingPlan.get('owner').company_name}</div>
          </div>
          <div style={style.iconsList}>
            {this.getIcons().map((icon, i) => (
              <Info content={icon.info} key={i}>
                <div style={style.icon} className="due-clock">
                  {icon.el}
                </div>
              </Info>
            ))}
          </div>
        </div>
        <Link to={this.generateLink()} style={style.trainingNameLink}>
          <div
            style={{
              ...style.trainingPlanName,
              ...(this.props.nameStyle || {}),
              ...(containerHover ? style.trainingPlanNameHover : {})
            }}
          >
            {trainingPlan.get('name')}
          </div>
        </Link>
      </div>
    );
  }
}
