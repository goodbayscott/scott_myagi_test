import React from 'react';
import _ from 'lodash';
import reactMixin from 'react-mixin';

import Style from 'style/index.js';

const styles = {
  link: {
    color: Style.vars.colors.get('darkGrey')
  },
  linkHover: {
    color: Style.vars.colors.get('textBlack')
  }
};

export const HoverMixin = {
  /*
    Mixin which reduces boilerplate for
    adding hover styling to components.
    Adds a `mouseOver` state prop which
    can be used by component to update
    styling on mouse over.
  */
  getInitialState() {
    return {
      mouseOver: false
    };
  },
  hoverMixinOnMouseOver() {
    this.setState({ mouseOver: true });
  },
  hoverMixinOnMouseLeave() {
    this.setState({ mouseOver: false });
  },
  hoverStateHasChanged(nextState) {
    return this.state.mouseOver !== nextState.mouseOver;
  },
  getHoverStyle(...args) {
    // Shortcut for conditionally extending a base
    // style object if `this.state.mouseOver` is true.
    if (this.state.mouseOver) {
      return _.extend.apply(this, [{}].concat(args));
    }
    return args[0];
  },
  getHoverProps() {
    return {
      onMouseOver: this.hoverMixinOnMouseOver.bind(this),
      onMouseLeave: this.hoverMixinOnMouseLeave.bind(this)
    };
  }
};

@reactMixin.decorate(HoverMixin)
export class Hoverable extends React.Component {
  /*
    Simple way of creating a div which changes style on
    hover.
  */

  static propTypes = {
    hoverStyle: React.PropTypes.object.isRequired
  };

  render() {
    const style = this.getHoverStyle(this.props.style, this.props.hoverStyle);
    return (
      <div
        {...this.getHoverProps()}
        style={style}
        className={this.props.className}
        onClick={this.props.onClick}
      >
        {this.props.children}
      </div>
    );
  }
}

@reactMixin.decorate(HoverMixin)
export class HoverableLink extends React.Component {
  /*
    Simple way of creating a link which changes style on
    hover.
  */

  static propTypes = {
    hoverStyle: React.PropTypes.object.isRequired
  };

  render() {
    const style = this.getHoverStyle(
      Style.funcs.merge(styles.link, this.props.style),
      Style.funcs.merge(styles.linkHover, this.props.hoverStyle)
    );
    return (
      <a
        {...this.getHoverProps()}
        style={style}
        className={this.props.className}
        href={this.props.href}
        onClick={this.props.onClick}
        target={this.props.target}
      >
        {this.props.children}
      </a>
    );
  }
}
