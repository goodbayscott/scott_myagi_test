import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';

import Style from 'style';

import { CardCollection, CornerCheckmarkIcon, Card } from 'components/common/cards';
import { Image } from 'components/common/image';
import { LoadingContainer, NoData } from 'components/common/loading';
import { ProgressRadial } from 'components/common/progress-radial';
import { BadgeAwardModal } from 'components/badges';
import { AvatarImage } from 'components/common/avatar-images';

import { styles as commonStyles, constants as commonConstants } from '../common';

import Sticky from 'react-sticky-el';

const MAX_BADGES = 6;
const AVATAR_IMAGE_SIZE = 75;

const styles = {
  container: {
    ...commonStyles.sidePanel,
    [commonConstants.statPanelHideScreenSize]: {
      display: 'none'
    }
  },
  innerContainer: {
    ...commonStyles.sidePanelInner
  },
  heading: {
    ...commonStyles.panelHeading
  },
  statsContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    flexDirection: 'column',
    width: '100%'
  },
  badgeContainer: {
    margin: '10px',
    fontSize: 10
  },
  row: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 20,
    '@media screen and (max-width: 1400px)': {
      flexDirection: 'column',
      paddingTop: 0,
      paddingBottom: 0
    }
  },
  noBadgesTxt: {
    fontSize: 14,
    color: Style.vars.colors.get('xDarkGrey')
  },
  viewMoreBadgesIcon: {
    fontSize: 22,
    margin: '0px 10px',
    color: Style.vars.colors.get('xDarkGrey'),
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'scale(1.1)',
      color: 'black'
    }
  },
  badgePreviewContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  badgePreview: {
    margin: '0 7px',
    transition: 'all 0.3s ease',
    ...Style.common.cardBorder,
    [Style.vars.media.get('mobile')]: {
      margin: '0 3px'
    },
    ':hover': {
      transform: 'scale(1.1)'
    }
  },
  badgeTxt: {
    color: 'white',
    fontSize: 13,
    textAlign: 'center'
  },
  badgeModalContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },

  badgeImage: {
    maxHeight: 50,
    cursor: 'pointer'
  },
  statContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10,
    paddingLeft: 10
  },
  statsRadial: {
    progressRadialContainer: {
      marginLeft: 0,
      width: '100%',
      height: '100%',
      transform: 'none',
      cursor: 'pointer',
      color: Style.vars.colors.get('xxDarkGrey')
    },
    textContainer: {
      fontSize: 21
    },
    descText: {
      fontSize: 11,
      lineHeight: '12px',
      marginTop: 10
    }
  },
  statsRadialBlack: {
    progressRadialBar: {
      fill: Style.vars.colors.get('textBlack')
    }
  }
};

@Radium
export default class StatsOverlay extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  getStatsDescriptors() {
    const learner = this.props.currentUser.get('learner');
    return {
      progress: {
        label: t('your_progress'),
        valueTxt: `${learner.progress.toFixed(0)}<small>%</small>`,
        proportion: learner.progress / 100
      },
      completedPlans: {
        label: t('completed_plans'),
        valueTxt: learner.num_training_plans_completed.toString(),
        proportion: 1,
        useBlackFill: true
      },
      lessonAverage: {
        label: t('lesson_average'),
        valueTxt: `${learner.average_percentage_score.toFixed(0)}<small>%</small>`,
        proportion: learner.average_percentage_score / 100
      },
      rank: {
        label: t('company_rank_for_month'),
        valueTxt: `<small>#</small>${learner.company_rank_for_past_month}`,
        proportion: 1,
        useBlackFill: true
      }
    };
  }

  makeStatComponent(statDesc) {
    return (
      <div style={styles.statContainer}>
        <ProgressRadial
          proportion={statDesc.proportion}
          centerText={statDesc.valueTxt.toString()}
          descText={statDesc.label}
          onClick={this.goToProfile}
          style={Style.funcs.mergeIf(
            statDesc.useBlackFill,
            styles.statsRadial,
            styles.statsRadialBlack
          )}
        />
      </div>
    );
  }

  showAllBadgesModal = () => {
    this.refs.allBadgesModal.show();
  };

  showBadgeAward = badgeAward => {
    this.setState({ curBadgeAward: Im.Map(badgeAward) });
    _.defer(() => this.refs.badgeDetailsModal.show());
  };

  renderCurBadgeModal = () => {
    const badgeAward = this.state.curBadgeAward;
    if (!badgeAward) return null;
    return (
      <BadgeAwardModal
        ref="badgeDetailsModal"
        currentUser={this.props.currentUser}
        badgeAward={badgeAward}
      />
    );
  };

  goToProfile = () => {
    this.context.router.push(resolve('profile', { userId: this.props.currentUser.get('id') }));
  };

  renderBadges = () => {
    const badges = this.props.currentUser.get('badge_awards');
    const badgesPreview = _.slice(badges, 0, MAX_BADGES);
    const viewMoreEl =
      badges.length > MAX_BADGES ? (
        <Link to={`/views/profile/${this.props.currentUser.get('id')}/`}>
          <i className="ellipsis horizontal icon" style={styles.viewMoreBadgesIcon} />
        </Link>
      ) : null;
    return (
      <div>
        {badges.length ? (
          <div style={styles.badgePreviewContainer}>
            {badgesPreview.map(b => (
              <div
                key={`list-${b.id}`}
                style={styles.badgePreview}
                onClick={() => this.showBadgeAward(b)}
              >
                <img src={b.badge.badge_image} style={styles.badgeImage} />
              </div>
            ))}
            {viewMoreEl}
          </div>
        ) : (
          <NoData style={styles.noBadgesTxt}>{t('you_have_not_earned_any_badges')}</NoData>
        )}

        {this.renderCurBadgeModal()}
      </div>
    );
  };

  renderInner() {
    const learner = this.props.currentUser.get('learner');
    const statDescs = this.getStatsDescriptors();

    return (
      <div style={styles.innerContainer}>
        <p style={styles.heading}>{t('your_performance')}</p>
        <div style={styles.statsContainer}>
          <div style={styles.row}>
            {this.makeStatComponent(statDescs.progress)}
            {this.makeStatComponent(statDescs.completedPlans)}
          </div>
          <div style={styles.row}>
            {this.makeStatComponent(statDescs.lessonAverage)}
            {this.makeStatComponent(statDescs.rank)}
          </div>
        </div>
        <p style={styles.heading}>{t('badges')}</p>
        {this.renderBadges()}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.container}>
        {/* Action items are stacked above the feed on mobile, in which case we don't want to use
        a sticky element */}
        {window.innerWidth > commonConstants.stickyWidth ? (
          <Sticky>{this.renderInner()}</Sticky>
        ) : (
          <div>{this.renderInner()}</div>
        )}
      </div>
    );
  }
}
