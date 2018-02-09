import React from 'react';
import Marty from 'marty';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';

import ReportConfigsState from 'state/report-configs';
import ReportsState from 'state/reports';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { LoadingContainer, NoData } from 'components/common/loading';

import { DropdownSelect } from 'components/common/form/select';
import { BasicButton, SecondaryButton } from 'components/common/buttons';
import { Report } from './report';
import { Explanation } from 'components/leaderboards/common';

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  fsLink: {
    marginBottom: 10
  },
  dropdown: {
    container: { float: 'left' }
  },
  buttonContainer: {
    margin: 5,
    display: 'flex',
    flexWrap: 'wrap'
  }
};

class ReportConfigInner extends React.Component {
  static data = {
    reportConfig: {
      fields: ['id', 'name', 'description']
    },
    reports: {
      required: false,
      fields: ['created', 'share_token', $y.getFields(Report, 'report')]
    }
  };

  constructor() {
    super();
    this.state = {
      curReport: null
    };
  }

  componentWillReceiveProps(newProps) {
    // If reports have loaded or reports have changed,
    // then reset currently selected report
    if (newProps.reports) {
      if (!this.state.curReport || newProps.reports !== this.props.reports) {
        this.setState({ curReport: newProps.reports.first() });
      }
    }
  }

  componentDidMount() {
    // If reports are available immediately, ensure current report gets
    // set
    if (this.props.reports) {
      const rep = this.props.reports.first();
      if (rep) this.setState({ curReport: rep });
    }
  }

  setReport = rId => {
    this.setState({ curReport: this.props.reports.find(r => r.get('id') === rId) });
  };

  goFullscreen = () => {
    const url = resolve('shared-report', {
      token: this.state.curReport.get('share_token')
    });
    const win = window.open(url, '_blank');
    win.focus();
  };

  giveFeedback = () => {
    if (!window.Intercom) return;
    window.Intercom(
      'showNewMessage',
      `I have some feedback on the ${this.props.reportConfig.get('name')} report: `
    );
  };

  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={[this.props.reportConfig, this.props.reports]}
          createComponent={() => {
            const rep = this.state.curReport;
            const reportOpts = this.props.reports
              .map(r => {
                const co = this.props.currentUser.get('learner').company;
                let m = moment.utc(r.get('created'));
                if (co.timezone) {
                  m = m.tz(co.timezone);
                }
                const label = `${m.format('MMMM Do YYYY, h:mma')}`;
                return { label, value: r.get('id') };
              })
              .toArray();
            return (
              <div>
                {rep ? (
                  <div>
                    <div style={styles.container}>
                      <DropdownSelect
                        onChange={this.setReport}
                        options={reportOpts}
                        initialSelection={rep.get('id')}
                        key={this.props.reportConfig.get('id')}
                        style={styles.dropdown}
                      />
                      <div style={styles.buttonContainer}>
                        <SecondaryButton onClick={this.goFullscreen}>
                          View shareable version
                        </SecondaryButton>
                        <BasicButton onClick={this.giveFeedback}>Give feedback</BasicButton>
                      </div>
                    </div>

                    <div style={{ clear: 'both' }} />
                    <Explanation>{this.props.reportConfig.get('description')}</Explanation>

                    <Report report={rep} />
                  </div>
                ) : (
                  <NoData>
                    A version of this report is still being generated, please check back soon.
                  </NoData>
                )}
              </div>
            );
          }}
        />
      </div>
    );
  }
}

export const ReportConfig = Marty.createContainer(ReportConfigInner, {
  listenTo: [ReportConfigsState.Store, ReportsState.Store],

  fetch: {
    reports() {
      return ReportsState.Store.getItems({
        fields: $y.getFields(ReportConfigInner, 'reports'),
        report_config: this.props.reportConfigId,
        is_fully_generated: true,
        ordering: '-id',
        limit: 10
      });
    },
    reportConfig() {
      return ReportConfigsState.Store.getItem(this.props.reportConfigId, {
        fields: $y.getFields(ReportConfigInner, 'reportConfig')
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, ReportConfigInner);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ReportConfigInner, errors);
  }
});
