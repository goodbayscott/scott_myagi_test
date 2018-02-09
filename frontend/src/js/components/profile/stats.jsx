import React from 'react';
import Im from 'immutable';
import Radium from 'radium';
import { t } from 'i18n';
import { Panel } from 'components/common/box';
import Style from 'style';
import { Box, BoxHeader, BoxContent } from 'components/common/box';

import UsersState from 'state/users';

const style = {
  container: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-around',
    borderBottom: '1px solid #eee',
    padding: 8,
    [Style.vars.media.get('mobile')]: {
      flexDirection: 'column',
      maxHeight: 230
    }
  },
  stat: {
    background: Style.vars.colors.get('white'),
    display: 'flex',
    margin: '15px 0',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statNum: {
    fontSize: '2.5em',
    marginBottom: 7,
    lineHeight: '30px',
    color: Style.vars.colors.get('primary')
  },
  statTitle: {
    fontSize: '1.2em',
    color: '#777'
  }
};

@Radium
export class Stats extends React.Component {
  static data = {
    learner: {
      fields: [
        'num_modules_completed',
        'num_training_plans_completed',
        'average_percentage_score',
        'learnergroup_rank',
        'company_rank_for_past_month',
        'progress'
      ]
    }
  };

  static getDefaultProps = {
    stats: {}
  };

  getStatsDescriptors() {
    const learner = this.props.learner;
    return [
      {
        label: t('progress_through_lessons'),
        value: `${learner.progress.toFixed(0)}%`
      },
      {
        label: t('passed_lessons'),
        value: learner.num_modules_completed
      },
      {
        label: t('average_lesson_score'),
        value: `${Math.round(learner.average_percentage_score)}%`
      },
      {
        label: t('company_rank_for_month_ext'),
        value: learner.company_rank_for_past_month ? `#${learner.company_rank_for_past_month}` : '-'
      }
    ];
  }

  makeStatsBox(statDesc) {
    return (
      <div style={style.stat} key={statDesc.label}>
        <div style={style.statNum}>{statDesc.value}</div>
        <div style={style.statTitle}>{statDesc.label}</div>
      </div>
    );
  }

  render() {
    const statBoxes = this.getStatsDescriptors().map(statDesc => this.makeStatsBox(statDesc));

    return (
      <Panel>
        <div style={style.container}>{statBoxes}</div>
      </Panel>
    );
  }
}
