import Marty from 'marty';
import React from 'react';
import _ from 'lodash';

import Style from 'style/index.js';

const legendStyle = {
  list: {
    listStyleType: 'none',
    padding: 0,
    margin: 0
  },
  listItem: {
    lineHeight: '1em',
    marginRight: '1em',
    display: 'inline-block'
  },
  listItemBox: {
    width: '1em',
    height: '1em',
    float: 'left',
    borderRadius: '0.5em',
    marginRight: '0.3em'
  },
  container: {
    position: 'relative',
    marginTop: '1em',
    marginBottom: '2em'
  }
};

export const ChartLegend = React.createClass({
  /*
    Renders a legend for a chart-js chart
    based on datasets used to create that
    chart.
  */
  propTypes: {
    datasets: React.PropTypes.array.isRequired
  },
  render() {
    const innerHTML = _.map(this.props.datasets, ds => {
      const colStyle = { backgroundColor: ds.strokeColor };
      return (
        <li key={ds.label} style={legendStyle.listItem}>
          <div style={_.extend(colStyle, legendStyle.listItemBox)} />
          {ds.label}
        </li>
      );
    });
    return (
      <div style={legendStyle.container}>
        <ul style={legendStyle.list}>{innerHTML}</ul>
      </div>
    );
  }
});

const chartContainerStyle = {
  position: 'relative'
};

export const ChartContainer = React.createClass({
  /*
    Wrap `ChartLegend` and react-chartjs
    charts using this container to position
    them consistently.
  */
  render() {
    return <div style={chartContainerStyle}>{this.props.children}</div>;
  }
});
