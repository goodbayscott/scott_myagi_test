import React from 'react';
import Marty from 'marty';
import { resolve } from 'react-router-named-routes';
import Im from 'immutable';

import containerUtils from 'utilities/containers';

import TeamsState from 'state/teams';

import { LoadingContainer } from 'components/common/loading';
import { Plot } from 'components/analytics/reports-tab/report';
import ActivityMap from './activity-map';

import fakeReportData from './report-data.json';

const styles = {
  repContainer: {
    marginTop: 20
  },
  message: {
    marginBottom: 40,
    cursor: 'pointer'
  }
};

class Report extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      reportData: this.getReportDataForProps(props)
    };
  }
  componentWillReceiveProps(newProps) {
    this.setState({ reportData: this.getReportDataForProps(newProps) });
  }

  getReportDataForProps(props) {
    if (!props.teams) return null;
    let reportData = JSON.stringify(fakeReportData);
    props.teams.forEach((t, i) => (reportData = reportData.replace(new RegExp(`Team ${i + 1}`, 'g'), t.get('name'))));
    return JSON.parse(reportData);
  }

  renderPlot = plot => (
    <div>
      <Plot key={plot.id} plot={Im.Map(plot)} />
    </div>
  );

  goToTriggers = () => {
    this.context.router.push(`${resolve('demo-allocation-management')}?tab=Prioritization`);
  };

  getTeamName(idx) {
    return this.props.teams.get(idx - 1).get('name');
  }

  renderContent = () => (
    <div style={styles.repContainer}>
      <ActivityMap />

      {this.renderPlot(this.state.reportData.plot_set[0])}
      <div className="ui positive message" style={styles.message}>
        <div className="header">Lesson completions are positively impacting net sales.</div>
      </div>

      {this.renderPlot(this.state.reportData.plot_set[1])}
      <div className="ui negative message" style={styles.message} onClick={this.goToTriggers}>
        <div className="header">
          The "
          {this.getTeamName(1)}
          ", "
          {this.getTeamName(4)}
          " and "
          {this.getTeamName(9)}
          " teams have low average units per transaction, this has triggered training
          prioritization. Click here for more information.
        </div>
      </div>

      {this.renderPlot(this.state.reportData.plot_set[2])}
      <div className="ui negative message" style={styles.message} onClick={this.goToTriggers}>
        <div className="header">
          Shopper yield is being positively impacted by lesson completions, but the "{this.getTeamName(1)}" and "{this.getTeamName(2)}" teams have low Shopper yield. Click here for more
          information.
        </div>
      </div>

      {this.renderPlot(this.state.reportData.plot_set[3])}
      <div className="ui positive message" style={styles.message}>
        <div className="header">Lesson creations have positively impacted conversion rate.</div>
      </div>
    </div>
  );

  render() {
    return (
      <LoadingContainer loadingProps={[this.props.teams]} createComponent={this.renderContent} />
    );
  }
}

export default Marty.createContainer(Report, {
  listenTo: [TeamsState.Store],
  fetch: {
    teams() {
      return TeamsState.Store.getItems({
        limit: 10,
        ordering: 'id',
        fields: ['name']
      });
    }
  },
  pending() {
    return containerUtils.defaultPending(this, Report);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Report, errors);
  }
});
