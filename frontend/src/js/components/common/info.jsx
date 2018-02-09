import React from 'react';
import _ from 'lodash';

import Style from 'style/index.js';
import { Tooltip } from 'react-lightweight-tooltip';

const style = {
  color: Style.vars.colors.get('darkGrey'),
  cursor: 'pointer'
};

const tooltipStyles = {
  wrapper: {
    zIndex: 2
  },
  tooltip: {
    width: 150,
    textAlign: 'center',
    opacity: 0.75,
    zIndex: 100
  },
  content: {
    whiteSpace: 'wrap',
    fontWeight: 'normal'
  }
};

export class Info extends React.Component {
  /*
    Info icon which  displays help information when
    user mouses over it.
  */
  render() {
    return (
      <Tooltip
        content={this.props.content}
        styles={Style.funcs.merge(tooltipStyles, this.props.tooltipStyle)}
      >
        {this.props.children || (
          <i className="ui info circle icon" style={Style.funcs.merge(style, this.props.style)} />
        )}
      </Tooltip>
    );
  }
}
