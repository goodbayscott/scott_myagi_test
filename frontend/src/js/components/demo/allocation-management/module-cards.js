import React from 'react';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';

import Style from 'style';

import { ANALYTICS_EVENTS } from 'core/constants';

import $y from 'utilities/yaler';
import TrainingPageUtils from 'utilities/component-helpers/training-page';

import { HeaderWithLineThrough } from 'components/common/box';
import { Image } from 'components/common/image';
import { HoverMixin } from 'components/common/hover';
import { ProgressRadial } from 'components/common/progress-radial';

const styles = {
  cardContainer: {
    padding: 20,
    border: `1px solid ${Style.vars.colors.get('xDarkGrey')}`,
    borderRadius: 5,
    maxWidth: 1200,
    margin: '20px auto',
    cursor: 'pointer'
  },
  cardContainerHover: {
    backgroundColor: Style.vars.colors.get('xLightGrey')
  },
  cardContainerComplete: {
    borderColor: Style.vars.colors.get('fadedOliveGreen'),
    backgroundColor: Style.vars.colors.get('xFadedOliveGreen')
  },
  modName: {
    fontSize: 20
  },
  modTopInfo: {
    color: Style.vars.colors.get('xxDarkGrey'),
    marginBottom: 10
  },
  modDescription: {
    marginTop: 20,
    minHeight: 50,
    color: Style.vars.colors.get('textBlack')
  },
  modImage: {
    // marginTop: 20,
    height: '10em',
    width: '100%'
    // backgroundColor: Style.vars.colors.get('mediumGrey')
  },
  modImageSmall: {
    height: '8em'
  },
  modButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modButton: {
    margin: 0,
    display: 'block'
  },
  nxtBtn: {
    textAlign: 'center',
    marginTop: 10,
    cursor: 'pointer',
    display: 'block',
    color: Style.vars.colors.get('textBlack')
  },
  nxtBtnHover: {
    textDecoration: 'underline'
  },
  statsHeading: {
    color: Style.vars.colors.get('xDarkGrey')
  },
  radialContainer: {
    marginTop: '10%'
  },
  progressRadial: {
    progressRadialContainer: {
      width: '50%'
    }
  },
  attemptsRadial: {
    progressRadialContainer: {
      width: '50%'
    },
    progressRadialBar: {
      fill: Style.vars.colors.get('textBlack')
    }
  },
  statsContainer: {
    margin: 20,
    marginLeft: 40,
    marginRight: 40,
    marginBottom: 0
  }
};

export class ModuleSummaryStatsContainer extends React.Component {
  static data = {
    module: {
      fields: ['avg_like_rating', 'avg_learn_rating', 'num_feedback_submissions']
    }
  };

  static propTypes = $y.propTypesFromData(ModuleSummaryStatsContainer);

  constructor() {
    super();
    this.state = {
      numUsers: this.getRandomInt(200, 500),
      numTeams: this.getRandomInt(10, 50),
      numGroups: this.getRandomInt(1, 10),
      numTriggers: this.getRandomInt(0, 5)
    };
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  render() {
    const {
      numUsers, numTeams, numGroups, numTriggers
    } = this.state;

    return (
      <div>
        <div className="ui four column stackable grid" style={styles.statsContainer}>
          <div className="column">
            <ProgressRadial
              proportion={numUsers / 500}
              centerText={numUsers}
              descText="Users"
              style={styles.progressRadial}
            />
          </div>
          <div className="column">
            <ProgressRadial
              proportion={numTeams / 50}
              centerText={numTeams}
              descText="Teams"
              style={styles.progressRadial}
            />
          </div>
          <div className="column">
            <ProgressRadial
              proportion={numGroups / 10}
              centerText={numGroups}
              descText="Groups"
              style={styles.progressRadial}
            />
          </div>
          <div className="column">
            <ProgressRadial
              proportion={1}
              centerText={numTriggers}
              descText="Triggers"
              style={styles.attemptsRadial}
            />
          </div>
        </div>
      </div>
    );
  }
}

@reactMixin.decorate(HoverMixin)
class ModuleCard extends React.Component {
  static data = {
    module: {
      fields: [
        'id',
        'name',
        'description',
        'thumbnail_url',
        'last_successful_attempt_for_current_user',
        'most_relevant_training_plan_for_current_user',
        $y.getFields(ModuleSummaryStatsContainer, 'module')
      ]
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  attemptModule = () => {
    // Pass all nextIds so that user can complete the sequence of modules for today
    const nextIds =
      this.props.nextModules && this.props.nextModules.count()
        ? this.props.nextModules.map(m => m.get('id')).toArray()
        : null;
    const nextQuery = nextIds ? `?nextForToday=${nextIds.join(',')}` : '';
    analytics.track(ANALYTICS_EVENTS.START_TODAY_MODULE, {
      'Module ID': this.props.module.get('id')
    });
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: this.props.module.get('id'),
      trainingPlanId: this.getTrainingPlan().id
    }) + nextQuery);
  };

  next = () => {
    this.props.goForward();
  };

  getTrainingPlan() {
    return this.props.module.get('most_relevant_training_plan_for_current_user');
  }

  completedToday() {
    return TrainingPageUtils.moduleWasCompletedToday(this.props.module);
  }

  render() {
    const { module } = this.props;
    const tp = this.getTrainingPlan();
    const tpName = tp && tp.name;
    const coName = tp && tp.owner.company_name;
    const cStyle = this.getHoverStyle(styles.cardContainer, styles.cardContainerHover);
    const imgStyle = Style.funcs.merge(styles.modImage, styles.modImageSmall);
    return (
      <div style={cStyle} onClick={this.attemptModule} {...this.getHoverProps()}>
        <div className="ui stackable grid">
          <div className="ui four wide column">
            <Image src={module.get('thumbnail_url')} style={imgStyle} />
          </div>
          <div className="ui twelve wide column">
            <div style={styles.modTopInfo}>
              {tpName} {coName && 'by'} {coName}
            </div>
            <div style={styles.modName}>{module.get('name')}</div>
            <div style={styles.modDescription}>{module.get('description')}</div>
          </div>
        </div>
        <HeaderWithLineThrough style={{ marginTop: 10 }}>Current Allocation</HeaderWithLineThrough>
        <ModuleSummaryStatsContainer module={this.props.module} />
      </div>
    );
  }
}

export default class ModuleCards extends React.Component {
  static data = {
    modules: {
      many: true,
      fields: ['id', $y.getFields(ModuleCard, 'module')]
    }
  };

  render() {
    return (
      <div>{this.props.modules.map((m, i) => <ModuleCard key={m.get('id')} module={m} />)}</div>
    );
  }
}
