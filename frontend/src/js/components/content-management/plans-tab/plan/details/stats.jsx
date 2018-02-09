import React from 'react';
import Style from 'style';
import { ProgressRadial } from 'components/common/progress-radial';

const styles = {
  planStatsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignContent: 'flex-start'
  },
  attemptsRadialBlack: {
    progressRadialBar: {
      fill: Style.vars.colors.get('textBlack')
    }
  },
  attemptsRadialRed: {
    progressRadialBar: {
      fill: Style.vars.colors.get('errorRed')
    }
  },
  attemptsRadialGreen: {
    progressRadialBar: {
      fill: Style.vars.colors.get('green')
    }
  },
  radialContainer: {
    maxWidth: 80,
    marginLeft: 18
  }
};

export class PlanStats extends React.Component {
  static data = {
    plan: {
      required: true,
      fields: [
        'num_enrolled_users',
        'num_enrolled_users_in_own_company',
        'enrollment_groups',
        'avg_like_rating',
        'avg_learn_rating',
        'owner.url'
      ]
    }
  };

  render() {
    const companyUsersEnrolledInPlanCount = this.props.plan.get('num_enrolled_users_in_own_company');
    const totalUsersEnrolledInPlanCount = this.props.plan.get('num_enrolled_users');
    const enrollCount =
      this.props.plan.get('owner').url === this.props.currentUser.get('learner').company.url
        ? totalUsersEnrolledInPlanCount
        : companyUsersEnrolledInPlanCount;

    const avgLikeRating = this.props.plan.get('avg_like_rating');
    const likeProportion = avgLikeRating ? avgLikeRating / 5 : 1;
    const avgLearnRating = this.props.plan.get('avg_learn_rating');
    const learnProportion = avgLearnRating ? avgLearnRating / 5 : 1;

    return (
      <div style={styles.planStatsContainer}>
        <div style={styles.radialContainer}>
          <ProgressRadial
            proportion={1}
            centerText={enrollCount.toString()}
            descText="Enrolled Users"
            style={styles.attemptsRadialBlack}
          />
        </div>
        <div style={styles.radialContainer}>
          <ProgressRadial
            proportion={likeProportion}
            centerText={avgLikeRating ? avgLikeRating.toFixed(2).toString() : 'N/A'}
            descText="Like Rating"
            style={avgLikeRating < 4 ? styles.attemptsRadialRed : styles.attemptsRadialGreen}
          />
        </div>
        <div style={styles.radialContainer}>
          <ProgressRadial
            proportion={learnProportion}
            centerText={avgLearnRating ? avgLearnRating.toFixed(2).toString() : 'N/A'}
            descText="Learn Rating"
            style={avgLearnRating < 4 ? styles.attemptsRadialRed : styles.attemptsRadialGreen}
          />
        </div>
      </div>
    );
  }
}
