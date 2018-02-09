import React from 'react';
import Radium from 'radium';
import ReactDOM from 'react-dom';

import $ from 'vendor/jquery/semantic';

import Style from 'style/index.js';

import { JQueryComponentMixin } from './jquery-component-mixin';

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 14;

export var Progress = React.createClass({
  /*
    Wrapper for the http://semantic-ui.com/modules/Progress.html
    module.
  */
  mixins: [JQueryComponentMixin],
  propTypes: {
    progressOpts: React.PropTypes.object,
    percent: React.PropTypes.number.isRequired
  },
  getProgressEl() {
    return $(ReactDOM.findDOMNode(this)).find('.progress');
  },
  manipulateDOMWithJQuery() {
    this.$el = this.getProgressEl().progress({ percent: this.props.percent });
  },
  componentDidUpdate(prevProps) {
    if (prevProps.percent !== this.props.percent) {
      this.refresh();
    }
  },
  renderJQueryControlledContent() {
    return (
      <div
        className={this.props.className}
        style={this.props.style}
        data-percent={this.props.percent}
      >
        {this.props.children}
      </div>
    );
  }
});

export function makeProgressBarStyle(height, width) {
  return {
    progress: {
      width,
      height,
      marginLeft: 25,
      marginBottom: 20,
      backgroundColor: Style.vars.colors.get('mediumGrey'),
      borderRadius: height
    },
    bar: {
      position: 'relative',
      overflow: 'hidden',
      height,
      borderRadius: height
    },
    label: {
      position: 'absolute',
      width,
      textAlign: 'center',
      fontSize: 12,
      height,
      lineHeight: height,
      fontWeight: 'bold',
      color: Style.vars.colors.get('xxxDarkGrey')
    },
    innerLabel: {
      color: Style.vars.colors.get('white')
    }
  };
}

const pbStyle = makeProgressBarStyle(DEFAULT_HEIGHT, DEFAULT_WIDTH);

@Radium
export class ProgressBarWithLabel extends React.Component {
  /*
    Progress bar with inner label that changes color
    as bar covers it. See http://blog.mzsanford.com/blog/sub-glyph-colored-css-progress-bar/index.html
    for explanation of how this works.
  */

  static propTypes = {
    progressOpts: React.PropTypes.object,
    // Allows you to override the style of the progress bar (should be deprecated)
    style: React.PropTypes.object,
    labelColor: React.PropTypes.string,
    barColor: React.PropTypes.string,
    // Allows you to completely override the base style object
    baseStyle: React.PropTypes.object
  };

  getLabel() {
    return `${this.props.percent}% Complete`;
  }

  render() {
    const baseStyle = this.props.baseStyle || pbStyle;
    let barStyle = baseStyle.bar;
    if (this.props.barColor) {
      barStyle = Style.funcs.merge(barStyle, {
        backgroundColor: this.props.barColor
      });
    }
    let labelStyle = baseStyle.label;
    if (this.props.labelColor) {
      labelStyle = Style.funcs.merge(labelStyle, {
        color: this.props.labelColor
      });
    }
    return (
      <Progress
        className="ui bottom attached progress"
        percent={this.props.percent}
        progressOpts={this.props.progressOpts}
        style={Style.funcs.merge(baseStyle.progress, this.props.style)}
      >
        <span style={labelStyle}>{this.getLabel()}</span>
        <div className="bar" style={barStyle}>
          <span style={Style.funcs.merge(labelStyle, baseStyle.innerLabel)}>{this.getLabel()}</span>
        </div>
      </Progress>
    );
  }
}
