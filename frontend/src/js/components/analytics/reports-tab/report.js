import React from 'react';
import ReactDOM from 'react-dom';
import Marty from 'marty';
import moment from 'moment-timezone';
import Im from 'immutable';

import ReportsState from 'state/reports';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import { LoadingContainer, NoData } from 'components/common/loading';
import { BasicButton } from 'components/common/buttons';
import Plotly from 'components/common/plotly-container';

const PLOTS_ENDPOINT = '/api/v1/plots';
const PLOT_CONFIG = {
  showLink: false,
  displaylogo: false,
  scrollZoom: false,
  modeBarButtonsToRemove: ['sendDataToCloud']
};

const styles = {
  repContainer: {
    marginTop: 20
  },
  repFrame: {
    marginTop: 10,
    border: 'none'
  },
  plotContainer: {
    marginTop: 20,
    border: `1px solid ${Style.vars.colors.get('fadedOffBlack')}`,
    backgroundColor: 'white'
  },
  btnContainer: {
    width: '100%',
    height: 50
  },
  btn: {
    marginRight: 10
  }
};

export class Plot extends React.Component {
  dlData = plot => {
    ReactDOM.findDOMNode(this.refs[`dataForm-${plot.id}`]).submit();
  };

  render() {
    let { plot } = this.props;
    plot = plot.toJS();
    const url = plot.plot_url;
    const dataURL = `${PLOTS_ENDPOINT}/${plot.id}/data_as_csv/`;
    return (
      <div style={styles.plotContainer} key={plot.id}>
        <Plotly data={plot.data} layout={plot.layout} config={PLOT_CONFIG} />
        <div style={styles.btnContainer}>
          <BasicButton onClick={() => this.dlData(plot)} floatRight style={styles.btn}>
            Export data
          </BasicButton>
        </div>
        <form ref={`dataForm-${plot.id}`} method="get" action={dataURL} />
      </div>
    );
  }
}

export class Report extends React.Component {
  static data = {
    report: {
      required: false,
      fields: ['report_url', 'share_token', 'plot_set.id', 'plot_set.data', 'plot_set.layout']
    }
  };

  renderPlot = plot => <Plot key={plot.id} plot={Im.Map(plot)} />;

  render() {
    const url = this.props.report.get('report_url');
    return (
      <div style={styles.repContainer}>
        {this.props.report.get('plot_set').map(this.renderPlot)}
      </div>
    );
  }
}
