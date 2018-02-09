import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';

import Style from 'style';

import { MOBILE_WIDTH } from 'core/constants';

import { CardCollection, CornerCheckmarkIcon, Card } from 'components/common/cards';
import { Image } from 'components/common/image';
import { LoadingContainer, NoData } from 'components/common/loading';
import { BadgeAwardModal } from 'components/badges';

const MAX_BADGES = 6;

const styles = {
  statsBoxContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Style.vars.colors.get('xLightGrey')
  },
  statsBox: {
    maxWidth: Style.vars.widths.get('mainContentMaxWidth'),
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  statsContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  badgeContainer: {
    margin: '10px',
    fontSize: 10
  },
  statCol: {
    margin: '22px 29px 18px',
    textAlign: 'center',
    [Style.vars.media.get('mobile')]: {
      margin: '20px 18px'
    }
  },
  statValue: {
    fontSize: 25,
    color: Style.vars.colors.get('primary'),
    fontWeight: 'normal'
  },
  statLabel: {
    fontSize: 12,
    marginTop: 7,
    lineHeight: '10px',
    textTransform: 'uppercase',
    color: Style.vars.colors.get('textBlack')
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
    justifyContent: 'left'
  },
  badgeModalContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  badgePreview: {
    margin: '0 6px',
    transition: 'all 0.3s ease',
    [Style.vars.media.get('mobile')]: {
      margin: '0 3px'
    },
    ':hover': {
      transform: 'scale(1.1)'
    }
  },
  badgeImage: {
    maxHeight: 50,
    cursor: 'pointer'
  }
};

@Radium
export class StatsBox extends React.Component {
  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      // This only has an effect when stat columns
      // are stacked
      showStats: false,
      toggleCount: 0
    };
  }

  getStatsDescriptors() {
    const learner = this.props.currentUser.get('learner');
    return [
      {
        label: t('progress'),
        value: `${learner.progress.toFixed(0)}<small>%</small>`,
        description: 'Enrolled Plans'
      },
      {
        label: t('lessons'),
        value: learner.num_modules_completed.toString(),
        description: 'Lessons Passed'
      },
      {
        label: t('average'),
        value: `${learner.average_percentage_score.toFixed(0)}<small>%</small>`,
        description: 'Lesson Score'
      },
      {
        label: t('company_rank_for_month'),
        value: `<small>#</small>${learner.company_rank_for_past_month}`,
        description: 'Leaderboard'
      }
    ];
  }

  makeStatComponent(statDesc) {
    return (
      <div className="column" key={statDesc.label + this.state.toggleCount} style={styles.statCol}>
        <div style={styles.statValue} dangerouslySetInnerHTML={{ __html: statDesc.value }} />
        <div style={styles.statLabel}>{statDesc.label}</div>
      </div>
    );
  }

  onStatToggleClick = () => {
    this.setState({
      showStats: !this.state.showStats,
      // This is necessary to ensure stat containers
      // are hidden and shown properly
      toggleCount: this.state.toggleCount + 1
    });
  };

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
    const curBadgeAward = this.state.curBadgeAward;
    const badges = this.props.currentUser.get('badge_awards');
    if (badges.length) {
      const badgesPreview = _.slice(badges, 0, MAX_BADGES);
      const viewMoreEl =
        badges.length > MAX_BADGES ? (
          <Link to={`/views/profile/${this.props.currentUser.get('id')}/`}>
            <i className="ellipsis horizontal icon" style={styles.viewMoreBadgesIcon} />
          </Link>
        ) : null;
      return (
        <div>
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

          {this.renderCurBadgeModal()}
        </div>
      );
    }
    return <NoData style={styles.noBadgesTxt}>{t('you_have_not_earned_any_badges')}</NoData>;
  };

  render() {
    const learner = this.props.currentUser.get('learner');

    const statCols = this.getStatsDescriptors().map(statDesc => this.makeStatComponent(statDesc));

    return (
      <div style={styles.statsBoxContainer}>
        <div style={styles.statsBox}>
          <div style={styles.badgeContainer}>{this.renderBadges()}</div>
          <div style={styles.statsContainer} onClick={this.goToProfile}>
            {statCols}
          </div>
        </div>
      </div>
    );
  }
}
