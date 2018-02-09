import React from 'react';
import Im from 'immutable';
import Style from 'style/index.js';
import pluralize from 'pluralize';
import { t } from 'i18n';

const styles = {
  stat: {
    textAlign: 'center'
  },
  statsContainer: {
    backgroundColor: Style.vars.colors.get('white')
  },
  statBoxes: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  statBox: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: '25px'
  },
  statDesc: {
    fontSize: '15px'
  }
};

export class ChannelAnalyticsBox extends React.Component {
  static propTypes = {
    channel: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  render() {
    const reachedUsers = this.props.channel.get('reached_users_count');
    const subscribedCompanies = this.props.channel.get('subscribed_companies_count');
    const trainingPlans = this.props.channel.get('training_plans_count');
    const likeRating = this.props.channel.get('avg_like_rating')
      ? this.props.channel.get('avg_like_rating').toFixed(2)
      : 'N/A';
    const learnRating = this.props.channel.get('avg_learn_rating')
      ? this.props.channel.get('avg_learn_rating').toFixed(2)
      : 'N/A';
    return (
      <div style={styles.statsContainer}>
        <div style={styles.statBoxes}>
          <div style={styles.statBox}>
            <div style={styles.stat}>
              <span>
                <span style={styles.statValue}>{reachedUsers}</span>
                <br />
                <span style={styles.statDesc}>{t('users_reached')}</span>
              </span>
            </div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.stat}>
              <span>
                <span style={styles.statValue}>{subscribedCompanies}</span>
                <br />
                <span style={styles.statDesc}>{t('connected_companies')}</span>
              </span>
            </div>
          </div>
          <div cstyle={styles.statBox}>
            <div style={styles.stat}>
              <span>
                <span style={styles.statValue}>{trainingPlans}</span>
                <br />
                <span style={styles.statDesc}>{pluralize('Plan', trainingPlans)}</span>
              </span>
            </div>
          </div>
          <div cstyle={styles.statBox}>
            <div style={styles.stat}>
              <span>
                <span style={styles.statValue}>{likeRating}</span>
                <br />
                <span style={styles.statDesc}>{t('like_rating')}</span>
              </span>
            </div>
          </div>
          <div cstyle={styles.statBox}>
            <div style={styles.stat}>
              <span>
                <span style={styles.statValue}>{learnRating}</span>
                <br />
                <span style={styles.statDesc}>{t('learn_rating')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
