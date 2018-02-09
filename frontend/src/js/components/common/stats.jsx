import React from 'react';
import Im from 'immutable';
import moment from 'moment-timezone';
import Style from 'style/index';

import { TimeseriesProcessor, PivotTableProcessor } from 'utilities/dataframe';

import { Bar as BarChart } from 'react-chartjs';
import { ProgressRadial } from 'components/common/progress-radial';
import parsing from 'components/analytics/parsing';

const STATS_DATE_FORMAT = 'MMM Do';

const STATS_PERIOD = 14;
const NUMBER_OF_ATTEMPTS = 'Number of Attempts';
const AVG_SCORE = 'Average Score (%)';
const ACTIVE_USERS = 'Active Users (%)';
const START_TIME = 'Start Time';
const TIMESERIES_INDEX_DESC = {
  attr: 'start_time',
  name: START_TIME
};
const TIMESERIES_FREQ = 'D';
const TIMESERIES_VALUE_DESCRIPTORS = [
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
    attr: 'user__id',
    // This is a sum initially, however it is converted to a
    // percentage of team members in the stat component
    aggFunc: 'nunique',
    name: ACTIVE_USERS,
    parseFunc: parsing.toTruncatedInt
  }
];

function getTsProcessor() {
  const tsProcessor = new TimeseriesProcessor(TIMESERIES_INDEX_DESC, TIMESERIES_VALUE_DESCRIPTORS);
  return tsProcessor;
}

const statsStyle = {
  container: {
    margin: 20,
    marginTop: 40
  },
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
  }
};

export class AttemptStatsContainer extends React.Component {
  static propTypes = {
    show: React.PropTypes.bool,
    attemptStats: React.PropTypes.instanceOf(Im.List).isRequired,
    attemptTimeseries: React.PropTypes.instanceOf(Im.List).isRequired,
    users: React.PropTypes.instanceOf(Im.List).isRequired
  };

  static defaultProps = {
    show: true
  };

  static chartOpts = {
    responsive: true,
    scaleShowHorizontalLines: false,
    scaleShowVerticalLines: false
  };

  getIndexDescriptors() {
    const entityName = this.props.entityName;
    const attr = this.props.query;
    return [{ attr, name: `${entityName}` }];
  }

  componentDidUpdate() {
    this._headers = undefined;
    this._rows = undefined;
    this._timeLabels = undefined;
  }

  getTsRows() {
    if (!this._rows) {
      const tsProcessor = getTsProcessor();
      const now = moment();
      this._rows = tsProcessor.getRows(this.props.attemptTimeseries, {
        expectedStart: moment().subtract(STATS_PERIOD, 'days'),
        expectedEnd: now
      });
    }
    return this._rows;
  }

  getTsHeaders() {
    if (!this._headers) {
      const tsProcessor = getTsProcessor();
      this._headers = tsProcessor.getHeaders(this.props.attemptTimeseries);
    }
    return this._headers;
  }

  getTsTimeLabels() {
    if (!this._timeLabels) {
      this._timeLabels = this.getTsDataForHeader(START_TIME)
        .map(dt => moment(dt).format(STATS_DATE_FORMAT))
        .toJS();
    }
    return this._timeLabels;
  }

  getTsDataForHeader(header) {
    const headers = this.getTsHeaders();
    const index = headers.indexOf(header);
    return this.getTsRows().map(row => row.get(index));
  }

  getPtProcessor() {
    const indexDescriptors = this.getIndexDescriptors();
    const ptProcessor = new PivotTableProcessor(indexDescriptors, TIMESERIES_VALUE_DESCRIPTORS);
    return ptProcessor;
  }

  getPtDataForHeader(header) {
    const ptProcessor = this.getPtProcessor();
    const headers = ptProcessor.getHeaders(this.props.attemptStats);
    const rows = ptProcessor.getRows(this.props.attemptStats);
    const data = rows.get(0);
    if (!data) return null;
    const headerIndex = headers.indexOf(header);
    return data.get(headerIndex);
  }

  getQuizAccuracyData() {
    const labels = this.getTsTimeLabels();
    const data = this.getTsDataForHeader(AVG_SCORE).toJS();

    return {
      labels,
      datasets: [
        {
          label: `${this.props.entityName} Accuracy`,
          data,
          fillColor: Style.vars.colors.get('primary'),
          strokeColor: Style.vars.colors.get('primary'),
          highlightFill: Style.vars.colors.get('darkPrimary'),
          highlightStroke: Style.vars.colors.get('darkPrimary')
        }
      ]
    };
  }

  getActiveUsersData() {
    const numUsers = this.getMemberCount();
    const labels = this.getTsTimeLabels();
    const data = this.getTsDataForHeader(ACTIVE_USERS)
      .map(val => (numUsers > 0 ? val / numUsers * 100 : 0))
      .map(parsing.toOneDecimalPlace)
      .toJS();
    return {
      labels,
      datasets: [
        {
          label: 'Active Users',
          data,
          fillColor: Style.vars.colors.get('green'),
          strokeColor: Style.vars.colors.get('green'),
          highlightFill: Style.vars.colors.get('darkGreen'),
          highlightStroke: Style.vars.colors.get('darkGreen')
        }
      ]
    };
  }

  getNumberOfAttemptsData() {
    const labels = this.getTsTimeLabels();
    const data = this.getTsDataForHeader(NUMBER_OF_ATTEMPTS).toJS();

    return {
      labels,
      datasets: [
        {
          label: 'Number of Attempts',
          data,
          fillColor: Style.vars.colors.get('yellow'),
          strokeColor: Style.vars.colors.get('yellow'),
          highlightFill: Style.vars.colors.get('darkYellow'),
          highlightStroke: Style.vars.colors.get('darkYellow')
        }
      ]
    };
  }

  getPeriodNumAttempts() {
    return this.getPtDataForHeader(NUMBER_OF_ATTEMPTS) || 0;
  }

  getPeriodAvgScore() {
    return this.getPtDataForHeader(AVG_SCORE) || 0;
  }

  getPeriodActiveUsers() {
    const membersCount = this.getMemberCount();
    if (!membersCount) return 0;
    return parsing.toOneDecimalPlace(this.getPtDataForHeader(ACTIVE_USERS) / membersCount) * 100;
  }

  getMemberCount() {
    return this.props.users.count();
  }

  render() {
    // Destroy and recreate every time hide/show button is pressed.
    // This ensures creation animations are triggered
    if (!this.props.show) return null;
    const numAttempts = this.getPeriodNumAttempts();
    const avgScore = this.getPeriodAvgScore();
    const activeUsers = this.getPeriodActiveUsers();
    return (
      <div className="ui two column stackable grid" style={statsStyle.container}>
        <div className="row">
          <div className="column" style={statsStyle.column}>
            <div style={statsStyle.radialContainer} className="ui three column grid">
              <div className="column">
                <ProgressRadial
                  proportion={1}
                  centerText={numAttempts.toString()}
                  descText="Recent Attempts"
                  style={statsStyle.attemptsRadial}
                />
              </div>
              <div className="column">
                <ProgressRadial
                  proportion={avgScore / 100}
                  centerText={`${avgScore}<small>%</small>`}
                  descText="Recent Average"
                />
              </div>
              <div className="column">
                <ProgressRadial
                  proportion={activeUsers / 100}
                  centerText={`${activeUsers}<small>%</small>`}
                  descText="Recent Active Users"
                />
              </div>
            </div>
          </div>
          <div className="column" style={statsStyle.column}>
            <h5 className="ui center aligned header" style={statsStyle.statsHeading}>
              {NUMBER_OF_ATTEMPTS}
            </h5>
            <BarChart
              data={this.getNumberOfAttemptsData()}
              options={AttemptStatsContainer.chartOpts}
            />
          </div>
        </div>
        <div className="row">
          <div className="column" style={statsStyle.column}>
            <h5 className="ui center aligned header" style={statsStyle.statsHeading}>
              {AVG_SCORE}
            </h5>
            <BarChart data={this.getQuizAccuracyData()} options={AttemptStatsContainer.chartOpts} />
          </div>
          <div className="column" style={statsStyle.column}>
            <h5 className="ui center aligned header" style={statsStyle.statsHeading}>
              {ACTIVE_USERS}
            </h5>
            <BarChart data={this.getActiveUsersData()} options={AttemptStatsContainer.chartOpts} />
          </div>
        </div>
      </div>
    );
  }
}
