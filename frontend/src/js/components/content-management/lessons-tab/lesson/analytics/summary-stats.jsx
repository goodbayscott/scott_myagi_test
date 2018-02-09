import Marty from 'marty';
import { t } from 'i18n';
import React from 'react';
import Im from 'immutable';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { PivotTableProcessor } from 'utilities/dataframe';

import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import { LoadingContainer } from 'components/common/loading';
import { ProgressRadial } from 'components/common/progress-radial';

import parsing from 'components/analytics/parsing';

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

function getModuleStatsPtProcessor() {
  const ptProcessor = new PivotTableProcessor(
    MODULE_STATS_INDEX_DESCRIPTORS,
    MODULE_STATS_VALUE_DESCRIPTORS
  );
  return ptProcessor;
}

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  radial: {
    maxWidth: 100,
    margin: 10
  },
  attemptsRadial: {
    progressRadialBar: {
      fill: Style.vars.colors.get('textBlack')
    }
  }
};

class ModuleSummaryStatsContainer extends React.Component {
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
    const numAttempts = this.getPeriodNumAttempts();

    const avgScore = this.getPeriodAvgScore();
    const percSuccessful = this.getPercSuccessful();

    const avgLikeRatingVals = this.getRatingVals(this.props.module.get('avg_like_rating'));
    const avgLearnRatingVals = this.getRatingVals(this.props.module.get('avg_learn_rating'));

    // Do not add /5 text if there are not enough ratings.
    const outOfFive = this.props.module.get('avg_like_rating') ? '<small>/5</small>' : '';
    return (
      <div style={styles.container}>
        <div style={styles.radial}>
          <ProgressRadial
            proportion={1}
            centerText={numAttempts.toString()}
            descText={t('attempts')}
            style={styles.attemptsRadial}
          />
        </div>
        <div style={styles.radial}>
          <ProgressRadial
            proportion={avgScore / 100}
            centerText={`${avgScore}<small>%</small>`}
            descText={t('average_score')}
          />
        </div>
        <div style={styles.radial}>
          <ProgressRadial
            proportion={percSuccessful / 100}
            centerText={`${percSuccessful}<small>%</small>`}
            descText={t('successful')}
          />
        </div>
        <div style={styles.radial}>
          <ProgressRadial
            proportion={1}
            centerText={`${this.props.module.get('num_feedback_submissions')}`}
            descText={t('feedback_submissions')}
            style={styles.attemptsRadial}
          />
        </div>
        <div style={styles.radial}>
          <ProgressRadial
            proportion={avgLikeRatingVals.proportion}
            centerText={avgLikeRatingVals.txt + outOfFive}
            descText={t('average_like_rating')}
          />
        </div>
        <div style={styles.radial}>
          <ProgressRadial
            proportion={avgLearnRatingVals.proportion}
            centerText={avgLearnRatingVals.txt + outOfFive}
            descText={t('average_learn_rating')}
          />
        </div>
      </div>
    );
  }
}

class ModuleAnalytics extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={[this.props.modAttemptDataframe]}
          createComponent={() => (
            <ModuleSummaryStatsContainer
              module={this.props.lesson}
              moduleAttemptStats={this.props.modAttemptDataframe}
            />
          )}
        />
      </div>
    );
  }
}

export const SummaryStats = Marty.createContainer(ModuleAnalytics, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },
  listenTo: [ModuleAttemptsDataframeState.Store],
  getModAttemptFetchParams() {
    const ptProcessor = getModuleStatsPtProcessor();
    return {
      indexes: ptProcessor.getIndexes(),
      values: ptProcessor.getValues(),
      agg_funcs: ptProcessor.getAggFuncs(),
      // Without this, when average score for a user is NaN (i.e. they have not answer any questions),
      // then user will see NaN. Thinking is that it is better to just show 0 instead.
      fill_na: 0,
      module: this.context.routeParams.lessonId
    };
  },
  fetch: {
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
