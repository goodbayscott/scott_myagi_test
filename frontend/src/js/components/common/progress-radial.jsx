import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import Radium from 'radium';

import Style from 'style/index.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const toStyle = obj => {
  let s = '';
  _.each(obj, (val, key) => {
    s += `${_.kebabCase(key)}: ${val};`;
  });
  return s;
};

const defaultStyle = {
  progressRadialContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'block',
    marginLeft: '50%',
    transform: 'translate(-50%, 0)'
  },
  progressRadialTrack: {
    fill: Style.vars.colors.get('mediumGrey')
  },
  progressRadialBar: {
    fill: Style.vars.colors.get('primary')
  },
  textContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
  },
  centerText: {
    fontSize: '1.5em',
    textAlign: 'center'
  },
  descText: {
    fontSize: '0.7rem',
    lineHeight: '11px',
    textTransform: 'uppercase',
    marginTop: 3,
    textAlign: 'center'
  }
};

const DEFAULT_RADIUS = 50;

@Radium
export class ProgressRadial extends React.Component {
  /*
    Adaption of http://codepen.io/somethingkindawierd/pen/feKmq.
    Displays a circular progress bar.
  */

  static propTypes = {
    // Value between 0 and 1 which determines
    // how full progress bar is.
    proportion: React.PropTypes.number,
    // Size of radial.
    radius: React.PropTypes.number,
    // Thickness of progress bar around circle.
    barThickness: React.PropTypes.number,
    // Text in center of circle.
    centerText: React.PropTypes.string.isRequired,
    // Text below center text.
    descText: React.PropTypes.string
  };

  static defaultProps = {
    proportion: 0,
    radius: DEFAULT_RADIUS,
    barThickness: 3,
    descText: '',
    style: {}
  };

  constructor(props) {
    super(props);

    const style = _.extend({}, defaultStyle);
    style.progressRadialContainer = Style.funcs.merge(
      style.progressRadialContainer,
      this.props.style.progressRadialContainer
    );
    style.progressRadialBar = Style.funcs.merge(
      style.progressRadialBar,
      this.props.style.progressRadialBar
    );
    style.textContainer = Style.funcs.merge(style.textContainer, this.props.style.textContainer);
    style.descText = Style.funcs.merge(style.descText, this.props.style.descText);
    this.state = {
      proportion: this.props.proportion,
      pathData: this.calculatePath(this.props.proportion),
      style
    };
  }

  componentDidMount() {
    this.renderSvg();
  }

  componentWillReceiveProps(nextProps) {
    if (!isNaN(nextProps.proportion) && nextProps.proportion !== this.props.proportion) {
      this.setState({
        proportion: nextProps.proportion,
        pathData: this.calculatePath(nextProps.proportion)
      });
    }
  }

  componentDidUpdate() {
    this.updateSvg();
  }

  calculatePath(proportion) {
    if (isNaN(proportion)) {
      return;
    }

    proportion = clamp(parseFloat(proportion), 0, 1);

    // 360 loops back to 0, so keep it within 0 to < 360
    const angle = clamp(proportion * 360, 0, 359.99999);
    const paddedRadius = this.props.radius + 1;
    const radians = angle * Math.PI / 180;
    const x = Math.sin(radians) * paddedRadius;
    const y = Math.cos(radians) * -paddedRadius;
    const mid = angle > 180 ? 1 : 0;
    const pathData = `${'M 0 0 v -%@ A %@ %@ 1 '.replace(/%@/gi, paddedRadius) +
      mid} 1 ${x} ${y} z`;

    return pathData;
  }

  updateSvg() {
    const elem = ReactDOM.findDOMNode(this.refs.progressRadial);
    const path = elem.getElementsByClassName('progress-radial-bar')[0];
    if (!path) return;
    path.setAttribute('d', this.state.pathData);
  }

  createSvgString(pathData) {
    const radius = this.props.radius;
    const paddedRadius = radius + 1;
    const cx = radius;
    const cy = cx;
    const holeSize = radius - this.props.barThickness;

    return `
      <svg width="100%" height="100%" viewBox="0 0 100 100" shape-rendering="geometricPrecision">
        <defs>
          <mask id="circle_mask_c" x="0" y="0" width="100" height="100" maskUnits="userSpaceOnUse">
            <circle cx=${cx} cy=${cy} r=${paddedRadius} stroke-width="0" fill="black" opacity="1"></circle>
            <circle cx=${cx} cy=${cy} r=${radius} stroke-width="0" fill="white" opacity="1"></circle>
            <circle class="progress-radial-mask-inner" cx=${cx} cy=${cy} r=${holeSize} stroke-width="0" fill="black" opacity="1"></circle>
          </mask>
        </defs>
        <g mask="url(#circle_mask_c)">
          <circle style="${toStyle(this.state.style.progressRadialTrack)}" cx=${cx} cy=${cy} r=${radius} stroke-width="0" opacity="1"></circle>
          <path style="${toStyle(this.state.style.progressRadialBar)}" transform="translate(${cx}, ${cy})" d="${pathData}"></path>
        </g>
      </svg>
    `;
  }

  renderSvg() {
    const svgString = this.createSvgString(this.state.pathData);
    const elem = ReactDOM.findDOMNode(this.refs.progressRadial);
    elem.innerHTML = svgString;
  }

  render() {
    return (
      <div style={this.state.style.progressRadialContainer} onClick={this.props.onClick}>
        <div ref="progressRadial" className="progress-radial" />
        <div style={this.state.style.textContainer}>
          <div
            style={this.state.style.centerText}
            dangerouslySetInnerHTML={{ __html: this.props.centerText }}
          />
          <div
            style={this.state.style.descText}
            dangerouslySetInnerHTML={{ __html: this.props.descText }}
          />
        </div>
      </div>
    );
  }
}
