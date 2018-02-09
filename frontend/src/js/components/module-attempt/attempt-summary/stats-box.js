import React from 'react';
import Radium from 'radium';
import moment from 'moment-timezone';
import { t } from 'i18n';
import Style from 'style';
import $y from 'utilities/yaler';

const styles = {
  box: {
    padding: '48px 20px 20px 20px',
    margin: 30,
    backgroundColor: 'white',
    height: 150,
    [Style.vars.media.get('mobile')]: {
      margin: 0
    }
  },
  statValue: {
    ...Style.common.statValue,
    [Style.vars.media.get('mobile')]: {
      fontSize: '1.8em'
    }
  },
  statLabel: {
    ...Style.common.statLabel,
    [Style.vars.media.get('mobile')]: {
      fontSize: '0.8em'
    }
  }
};

@Radium
export default class StatsBox extends React.Component {
  static data = {
    moduleAttempt: {
      fields: ['end_time', 'start_time', 'percentage_score']
    },
    module: {
      fields: ['pass_percentage']
    }
  };

  static propTypes = $y.propTypesFromData(StatsBox);

  formatTime = () => {
    const attempt = this.props.moduleAttempt;
    const time = Math.round(moment(attempt.get('end_time')).diff(moment(attempt.get('start_time')), 'seconds', true));
    if (time > 60) return `${Math.floor(time / 60)}m ${time % 60}s`;
    return `${time}s`;
  };

  getStats = () => {
    const attempt = this.props.moduleAttempt;
    const module = this.props.module;
    const time = moment(attempt.get('end_time'))
      .diff(moment(attempt.get('start_time')), 'minutes', true)
      .toFixed(2);
    return [
      {
        name: t('your_score'),
        value: `${Math.round(attempt.get('percentage_score'))}%`
      },
      {
        name: t('required_score'),
        value: `${Math.round(module.get('pass_percentage'))}%`
      },
      {
        name: t('time'),
        value: this.formatTime()
      }
    ];
  };

  renderStat = stat => (
    <div className="ui column" key={stat.name}>
      <span style={styles.statValue}>{stat.value}</span>
      <span style={styles.statLabel}>{stat.name}</span>
    </div>
  );

  render() {
    const statComponents = this.getStats().map(this.renderStat);
    return (
      <div style={styles.box}>
        <div className="ui three column grid">{statComponents}</div>
      </div>
    );
  }
}
