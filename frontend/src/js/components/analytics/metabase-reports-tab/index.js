import React from 'react';
import Marty from 'marty';
import Radium from 'radium';
import Im from 'immutable';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import MetabaseDashboardReportsState from 'state/metabase-dashboard-reports';

import { LoadingContainer, NoData } from 'components/common/loading';

import { CardCollection, Card } from 'components/common/cards';
import { FilterSet } from 'components/common/filter-set';
import { GatedFeatureBox, ANALYTICS } from 'components/common/gated-feature';

import Report from './report';
import DemoReport from 'components/demo/analytics';
import blurImage from 'img/analytics-dash-blur.jpg';

const DEMO_REPORT_NAME = 'Learning Impact';

const styles = {
  filterSet: {
    padding: '10px 0px 10px 0px',
    marginBottom: 25,
    color: Style.vars.colors.get('xxDarkGrey'),
    [Style.vars.media.get('mobile')]: {
      borderTop: 'none',
      padding: 0
    }
  }
};

@Radium
class MetabaseDashboardReports extends React.Component {
  static data = {
    reports: {
      required: false,
      many: true,
      fields: $y.getFields(Report, 'report')
    }
  };

  constructor() {
    super();
    this.state = {
      currentReport: null
    };
  }

  componentDidMount() {
    this.setInitialReportConfig();
  }

  componentDidUpdate() {
    this.setInitialReportConfig();
  }

  setInitialReportConfig() {
    if (!this.state.currentReport && this.props.reports) {
      this.setState({
        currentReport: this.props.reports.first()
      });
    }
  }

  setFilter = name => {
    const conf = this.props.reports.find(c => c.get('name') === name);
    this.setState({ currentReport: conf });
  };

  render() {
    const analyticsEnabled = this.props.currentUser.get('learner').company.subscription
      .analytics_enabled;
    const descriptionText =
      'Dig deeper with Myagi’s analytics and find out how your associates consume training content, improve performance, and compare to other associates and teams.';

    return (
      <GatedFeatureBox
        hideContent={!analyticsEnabled}
        descriptionText={descriptionText}
        headerText="Upgrade to Pro — Get Analytics Access"
        backgroundImage={blurImage}
        featureType={ANALYTICS}
      >
        <LoadingContainer
          loadingProps={[this.props.reports]}
          createComponent={() => {
            const names = this.props.reports.map(rc => rc.get('name')).toArray();
            return (
              <div>
                <FilterSet
                  ref="filterSet"
                  filterNames={names}
                  setFilter={this.setFilter}
                  containerStyle={styles.filterSet}
                />
                {this.state.currentReport &&
                  this.state.currentReport.get('name') !== DEMO_REPORT_NAME && (
                    <Report
                      key={this.state.currentReport.get('id')}
                      report={this.state.currentReport}
                    />
                  )}
                {this.state.currentReport &&
                  this.state.currentReport.get('name') === DEMO_REPORT_NAME && <DemoReport />}
              </div>
            );
          }}
        />
      </GatedFeatureBox>
    );
  }
}

export const TabContent = Marty.createContainer(MetabaseDashboardReports, {
  listenTo: [MetabaseDashboardReportsState.Store],

  fetch: {
    reports() {
      return MetabaseDashboardReportsState.Store.getItems({
        fields: $y.getFields(MetabaseDashboardReports, 'reports'),
        order_for_company: this.props.currentUser.get('learner').company.id
      });
    }
  },

  done(results) {
    let reports = results.reports;
    if (this.props.currentUser.get('learner').is_demo_account) {
      reports = reports.unshift(Im.Map({ name: DEMO_REPORT_NAME }));
    }
    return <MetabaseDashboardReports {...this.props} {...results} reports={reports} />;
  },

  pending() {
    return containerUtils.defaultPending(this, MetabaseDashboardReports);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, MetabaseDashboardReports, errors);
  }
});
