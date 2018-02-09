import React from 'react';
import Marty from 'marty';
import Radium from 'radium';
import Im from 'immutable';

import ReportConfigsState from 'state/report-configs';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { LoadingContainer, NoData } from 'components/common/loading';

import { CardCollection, Card } from 'components/common/cards';
import { FilterSet } from 'components/common/filter-set';
import { ReportConfig } from './report-config';

import DemoReport from 'components/demo/analytics';

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
class ReportConfigList extends React.Component {
  static data = {
    reportConfigs: {
      required: false,
      many: true,
      fields: ['id', 'name']
    }
  };

  constructor() {
    super();
    this.state = {
      currentReportConfig: null
    };
  }

  componentDidMount() {
    this.setInitialReportConfig();
  }

  componentDidUpdate() {
    this.setInitialReportConfig();
  }

  setInitialReportConfig() {
    if (!this.state.currentReportConfig && this.props.reportConfigs) {
      this.setState({
        currentReportConfig: this.props.reportConfigs.first()
      });
    }
  }

  setFilter = name => {
    const conf = this.props.reportConfigs.find(c => c.get('name') === name);
    this.setState({ currentReportConfig: conf });
  };

  render() {
    return (
      <div>
        <LoadingContainer
          loadingProps={[this.props.reportConfigs]}
          createComponent={() => {
            const names = this.props.reportConfigs.map(rc => rc.get('name')).toArray();
            return (
              <div>
                <FilterSet
                  ref="filterSet"
                  filterNames={names}
                  setFilter={this.setFilter}
                  containerStyle={styles.filterSet}
                />
                {this.state.currentReportConfig &&
                  this.state.currentReportConfig.get('name') !== DEMO_REPORT_NAME && (
                    <ReportConfig
                      currentUser={this.props.currentUser}
                      reportConfigId={this.state.currentReportConfig.get('id')}
                    />
                  )}
                {this.state.currentReportConfig &&
                  this.state.currentReportConfig.get('name') === DEMO_REPORT_NAME && <DemoReport />}
              </div>
            );
          }}
        />
      </div>
    );
  }
}

export const TabContent = Marty.createContainer(ReportConfigList, {
  listenTo: [ReportConfigsState.Store],

  fetch: {
    reportConfigs() {
      return ReportConfigsState.Store.getItems({
        fields: $y.getFields(ReportConfigList, 'reportConfigs')
      });
    }
  },

  done(results) {
    let configs = results.reportConfigs;
    if (this.props.currentUser.get('learner').is_demo_account) {
      configs = configs.unshift(Im.Map({ name: DEMO_REPORT_NAME }));
    }
    return <ReportConfigList {...this.props} {...results} reportConfigs={configs} />;
  },

  pending() {
    return containerUtils.defaultPending(this, ReportConfigList);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, ReportConfigList, errors);
  }
});
