import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { PivotTableProcessor } from 'utilities/dataframe';

import ModulesState from 'state/modules';
import QuestionAttemptsDataframeState from 'state/question-attempts-dataframe';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import { LoadingContainer, NoData } from 'components/common/loading';
import { Box, BoxHeader, BoxContent, HeaderWithLineThrough } from 'components/common/box';
import { GatedFeatureBox, ANALYTICS } from 'components/common/gated-feature';
import { PrimaryButton } from 'components/common/buttons';
import { ScrollableDataTable } from 'components/common/table';
import { ProgressRadial } from 'components/common/progress-radial';
import FeedbackResults from './feedback-results';

import parsing from '../parsing';

import blurImage from 'img/analytics-dash-blur.jpg';

const NUMBER_OF_ATTEMPTS = 'Number of Attempts';
const AVG_SCORE = 'Average Score (%)';
const PERC_SUCCESSFUL = 'Percentage Successful';

const MODULE_STATS_VALUE_DESCRIPTORS = [
  {
    attr: 'percentage_score',
    aggFunc: 'mean',
    name: AVG_SCORE,
    parseFunc: parsing.toOneDecimalPlace
  },
  {
    attr: 'total_count',
    aggFunc: 'sum',
    name: NUMBER_OF_ATTEMPTS,
    parseFunc: parsing.toTruncatedInt
  },
  {
    attr: 'is_successful',
    aggFunc: 'mean',
    name: PERC_SUCCESSFUL,
    parseFunc: parsing.proportionToPercentage
  }
];

const MODULE_STATS_INDEX_DESCRIPTORS = [{ attr: 'module', name: 'Lesson' }];

const ANSWER_KEYS = ['A', 'B', 'C', 'D', 'E'];

const QUESTION_ID_DESC = {
  attr: 'question__id',
  name: 'Question ID',
  hidden: true
};

const QUESTION_DESC = {
  attr: 'question_with_answers',
  name: 'Question',
  parseFunc: val => {
    const parts = val.split('|');
    const q = parts[0];
    const answers = _.map(ANSWER_KEYS, (key, i) => {
      let val = parts[i + 1];
      val = val.trim();
      if (!val.length) return null;
      key += ':';
      return (
        <p key={key}>
          <b>{key}</b> {val}
        </p>
      );
    });
    return (
      <div>
        <p>{q}</p>
        {answers}
      </div>
    );
  }
};

const ANSWER_DESC = {
  attr: 'question__answer',
  name: 'Answer',
  parseFunc: val => val.toUpperCase()
};

const QATTEMPT_VALUE_DESCRIPTORS = [
  {
    attr: 'answer_is_correct',
    aggFunc: 'mean',
    name: 'Correct (%)',
    parseFunc: parsing.proportionToPercentage
  },
  {
    attr: 'is_a',
    aggFunc: 'mean',
    name: 'A (%)',
    parseFunc: parsing.proportionToPercentage
  },
  {
    attr: 'is_b',
    aggFunc: 'mean',
    name: 'B (%)',
    parseFunc: parsing.proportionToPercentage
  },
  {
    attr: 'is_c',
    aggFunc: 'mean',
    name: 'C (%)',
    parseFunc: parsing.proportionToPercentage
  },
  {
    attr: 'is_d',
    aggFunc: 'mean',
    name: 'D (%)',
    parseFunc: parsing.proportionToPercentage
  },
  {
    attr: 'is_e',
    aggFunc: 'mean',
    name: 'E (%)',
    parseFunc: parsing.proportionToPercentage
  }
];

function getQAttemptPtProcessor() {
  const indexDescs = [QUESTION_ID_DESC, QUESTION_DESC, ANSWER_DESC];
  const ptProcessor = new PivotTableProcessor(indexDescs, QATTEMPT_VALUE_DESCRIPTORS);
  return ptProcessor;
}

function getModuleStatsPtProcessor() {
  const ptProcessor = new PivotTableProcessor(
    MODULE_STATS_INDEX_DESCRIPTORS,
    MODULE_STATS_VALUE_DESCRIPTORS
  );
  return ptProcessor;
}

const styles = {
  statsHeading: {
    color: Style.vars.colors.get('xDarkGrey')
  },
  radialContainer: {
    marginTop: '10%'
  },
  attemptsRadial: {
    progressRadialBar: {
      fill: Style.vars.colors.get('textBlack')
    }
  },
  containerOuter: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  container: {
    margin: 20,
    marginTop: 40,
    maxWidth: 600
  }
};

export class ModuleSummaryStatsContainer extends React.Component {
  static data = {
    module: {
      fields: ['avg_like_rating', 'avg_learn_rating', 'num_feedback_submissions']
    }
  };

  static propTypes = $y.propTypesFromData(ModuleSummaryStatsContainer, {
    show: React.PropTypes.bool,
    moduleAttemptStats: React.PropTypes.instanceOf(Im.List).isRequired
  });

  static defaultProps = {
    show: true
  };

  componentDidUpdate() {
    this._headers = undefined;
    this._rows = undefined;
  }

  getPtDataForHeader(header) {
    const ptProcessor = getModuleStatsPtProcessor();
    const headers = ptProcessor.getHeaders(this.props.moduleAttemptStats);
    const rows = ptProcessor.getRows(this.props.moduleAttemptStats);
    const data = rows.get(0);
    if (!data) return null;
    const headerIndex = headers.indexOf(header);
    return data.get(headerIndex);
  }

  getPeriodNumAttempts() {
    return this.getPtDataForHeader(NUMBER_OF_ATTEMPTS) || 0;
  }

  getPeriodAvgScore() {
    return this.getPtDataForHeader(AVG_SCORE) || 0;
  }

  getPercSuccessful() {
    return this.getPtDataForHeader(PERC_SUCCESSFUL) || 0;
  }

  getRatingVals(rating) {
    let txt;
    let proportion;
    if (rating === null) {
      txt = 'N/A';
      proportion = 1;
    } else {
      txt = rating.toFixed(1).toString();
      proportion = rating / 5;
    }
    return {
      txt,
      proportion
    };
  }

  render() {
    // Destroy and recreate every time hide/show button is pressed.
    // This ensures creation animations are triggered
    if (!this.props.show) return null;
    const numAttempts = this.getPeriodNumAttempts();
    const avgScore = this.getPeriodAvgScore();
    const percSuccessful = this.getPercSuccessful();

    const avgLikeRatingVals = this.getRatingVals(this.props.module.get('avg_like_rating'));
    const avgLearnRatingVals = this.getRatingVals(this.props.module.get('avg_learn_rating'));

    // Do not add /5 text if there are not enough ratings.
    const outOfFive = this.props.module.get('avg_like_rating') ? '<small>/5</small>' : '';

    return (
      <div>
        <div style={styles.containerOuter}>
          <div className="ui three column stackable grid" style={styles.container}>
            <div className="column">
              <ProgressRadial
                proportion={1}
                centerText={numAttempts.toString()}
                descText="Attempts"
                style={styles.attemptsRadial}
              />
            </div>
            <div className="column">
              <ProgressRadial
                proportion={avgScore / 100}
                centerText={`${avgScore}<small>%</small>`}
                descText="Average Score"
              />
            </div>
            <div className="column">
              <ProgressRadial
                proportion={percSuccessful / 100}
                centerText={`${percSuccessful}<small>%</small>`}
                descText="Successful"
              />
            </div>
          </div>
          <div className="ui three column stackable grid" style={styles.container}>
            <div className="column">
              <ProgressRadial
                proportion={1}
                centerText={this.props.module.get('num_feedback_submissions')}
                descText="Feedback submissions"
                style={styles.attemptsRadial}
              />
            </div>
            <div className="column">
              <ProgressRadial
                proportion={avgLikeRatingVals.proportion}
                centerText={avgLikeRatingVals.txt + outOfFive}
                descText="Average like rating"
              />
            </div>
            <div className="column">
              <ProgressRadial
                proportion={avgLearnRatingVals.proportion}
                centerText={avgLearnRatingVals.txt + outOfFive}
                descText="Average learn rating"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class QuestionStatsTable extends React.Component {
  static tableDataMapping = {
    Question: t => t.get('name'),
    'Percentage Correct': t => t.get('description')
  };

  render() {
    const ptProcessor = getQAttemptPtProcessor();
    const headers = ptProcessor.getHeaders(this.props.qAttemptDataframe);
    const rows = ptProcessor.getRows(this.props.qAttemptDataframe);
    if (!rows.count()) {
      return <NoData>Please attempt questions in this lesson to see data here</NoData>;
    }
    return <ScrollableDataTable headers={headers} rows={rows} />;
  }
}

class ModuleAnalytics extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static data = {
    module: {
      required: false,
      fields: ['name', 'training_plans.owner', $y.getFields(ModuleSummaryStatsContainer, 'module')]
    }
  };

  render() {
    let heading;
    if (this.props.module) {
      heading = this.props.module.get('name');
    }
    let backOpts = {
      text: 'Training',
      route: 'training'
    };
    const flags = this.props.currentUser.get('feature_flags');
    if (flags && flags['new-content-management']) {
      backOpts = {
        onClick: this.context.router.goBack,
        text: 'Back'
      };
    }

    // We only show feedback results to module owner,
    // as we cannot filter these comments by company
    // currently
    let ownedByCurCo = false;
    if (this.props.module) {
      ownedByCurCo =
        this.props.currentUser.get('learner').company.url ===
        this.props.module.get('training_plans')[0].owner;
    }
    const analyticsEnabled = this.props.currentUser.get('learner').company.subscription
      .analytics_enabled;
    const descriptionText =
      'Dig deeper with Myagi’s analytics and find out how your associates consume training content, improve performance, and compare to other associates and teams.';

    return (
      <Box>
        <BoxHeader heading={heading} backOpts={backOpts} />
        <BoxContent>
          <GatedFeatureBox
            hideContent={!analyticsEnabled}
            descriptionText={descriptionText}
            headerText="Upgrade to Pro — Get Analytics Access"
            backgroundImage={blurImage}
            featureType={ANALYTICS}
          >
            <HeaderWithLineThrough>Summary</HeaderWithLineThrough>
            <LoadingContainer
              loadingProps={[this.props.module, this.props.modAttemptDataframe]}
              createComponent={() => (
                <ModuleSummaryStatsContainer
                  module={this.props.module}
                  moduleAttemptStats={this.props.modAttemptDataframe}
                />
              )}
            />
            <HeaderWithLineThrough style={{ marginTop: 60, marginBottom: 40 }}>
              Question Analytics
            </HeaderWithLineThrough>
            <LoadingContainer
              loadingProps={[this.props.qAttemptDataframe]}
              createComponent={() => (
                <QuestionStatsTable qAttemptDataframe={this.props.qAttemptDataframe} />
              )}
            />
            {ownedByCurCo && (
              <div>
                <HeaderWithLineThrough style={{ marginTop: 60, marginBottom: 40 }}>
                  Feedback Comments
                </HeaderWithLineThrough>
                <LoadingContainer
                  loadingProps={[this.props.module]}
                  createComponent={() => <FeedbackResults module={this.props.module} />}
                />
              </div>
            )}
          </GatedFeatureBox>
        </BoxContent>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(ModuleAnalytics, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [
    ModulesState.Store,
    QuestionAttemptsDataframeState.Store,
    ModuleAttemptsDataframeState.Store
  ],
  getQAttemptFetchParams() {
    const ptProcessor = getQAttemptPtProcessor();
    return {
      indexes: ptProcessor.getIndexes(),
      values: ptProcessor.getValues(),
      agg_funcs: ptProcessor.getAggFuncs(),
      // Without this, when average score for a user is NaN (i.e. they have not answer any questions),
      // then user will see NaN. Thinking is that it is better to just show 0 instead.
      fill_na: 0,
      page_attempt__module_attempt__module: this.context.routeParams.moduleId
    };
  },
  getModAttemptFetchParams() {
    const ptProcessor = getModuleStatsPtProcessor();
    return {
      indexes: ptProcessor.getIndexes(),
      values: ptProcessor.getValues(),
      agg_funcs: ptProcessor.getAggFuncs(),
      // Without this, when average score for a user is NaN (i.e. they have not answer any questions),
      // then user will see NaN. Thinking is that it is better to just show 0 instead.
      fill_na: 0,
      module: this.context.routeParams.moduleId
    };
  },
  fetch: {
    module() {
      return ModulesState.Store.getItem(this.context.routeParams.moduleId, {
        fields: $y.getFields(ModuleAnalytics, 'module')
      });
    },
    qAttemptDataframe() {
      return QuestionAttemptsDataframeState.Store.getPivotTable(this.getQAttemptFetchParams());
    },
    modAttemptDataframe() {
      return ModuleAttemptsDataframeState.Store.getPivotTable(this.getModAttemptFetchParams());
    }
  },
  done(results) {
    return <ModuleAnalytics ref="innerComponent" {...this.props} {...results} />;
  },
  pending() {
    return containerUtils.defaultPending(this, ModuleAnalytics);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, ModuleAnalytics, errors);
  }
});
