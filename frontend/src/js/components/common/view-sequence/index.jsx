import React from 'react';
import _ from 'lodash';

import Style from 'style/index.js';

import { clamp } from 'utilities/generic';

const allSceneContainerStyle = {
  position: 'relative'
};

export const ViewSequence = React.createClass({
  /*
    Containing component for `Views`. Manages
    transitioning between component scenes (which just amounts to
    hiding and showing scenes sequentially). This is useful for
    forms which have multiple pages (e.g. you fill out one set
    of inputs, click a Next button, then sill out some more inputs
    before submitting).

    Example usage:

    var SomeParentComponent = React.createClass({
      goForward: function() {
        this.refs.viewSequence.goForward()
      },
      render: function() {
        return (
          <div>
            <ViewSequence ref="viewSequence">
              <View>
                <h1>Scene 1</h1>
              </View>
              <View>
                <h1>Scene 2</h1>
              </View>
              <button onClick={this.goForward}>Next</button>
            </ViewSequence>
          <div>
        )
      }
    })

    In this example, "Scene 1" header will be displayed until
    the "Next" button is clicked, after which the scene will change
    and "Scene 2" will be displayed.
  */
  propTypes: {
    // If true, then views will only be rendered once they
    // become active, rather than being hidden via styling.
    renderWhenActive: React.PropTypes.bool
  },
  getInitialState() {
    return {
      sceneIndex: 0
    };
  },
  childContextTypes: {
    goToPreviousScene: React.PropTypes.func.isRequired,
    goToNextScene: React.PropTypes.func.isRequired
  },
  getChildContext() {
    return {
      goToPreviousScene: this.goBackward,
      goToNextScene: this.goForward
    };
  },
  _addToSceneIndex(val) {
    this.goTo(this.state.sceneIndex + val);
  },
  goForward() {
    this._addToSceneIndex(1);
  },
  goBackward() {
    this._addToSceneIndex(-1);
  },
  canGoForward() {
    return this.state.sceneIndex < React.Children.count(this.props.children) - 1;
  },
  canGoBackward() {
    return this.state.sceneIndex !== 0;
  },
  goTo(index) {
    const newVal = clamp(index, 0, React.Children.count(this.props.children));
    this.setState({
      sceneIndex: newVal
    });
  },
  getScenes() {
    return _.values(this.refs);
  },
  getSceneIndex() {
    return this.state.sceneIndex;
  },
  render() {
    const sceneEls = React.Children.map(this.props.children, (child, index) => {
      const isCurScene = index === this.state.sceneIndex;
      // If this prop is enabled, then components are only rendered
      // when they are the current scene.
      if (this.props.renderWhenActive) {
        if (!isCurScene) {
          return null;
        }
      }
      const display = isCurScene ? 'block' : 'none';
      const style = _.extend(
        {
          display
        },
        this.props.style
      );
      child = React.cloneElement(child, { isCurView: isCurScene });
      return (
        <div ref={`scene-${index}`} key={index} style={style}>
          {child}
        </div>
      );
    });
    return (
      <div style={Object.assign({}, allSceneContainerStyle, this.props.style)}>{sceneEls}</div>
    );
  }
});

export const View = React.createClass({
  /*
    Container for scene in a view sequences. Is really just an
    alias for a span tag for now, however this could change in
    future.
  */
  render() {
    let child = React.Children.only(this.props.children);
    child = React.cloneElement(child, { isCurView: this.props.isCurView });
    return <span>{child}</span>;
  }
});

const smallBackBtnStyle = {
  cursor: 'pointer',
  textAlign: 'center',
  margin: '0.5em'
};

export const SmallBackButton = React.createClass({
  /*
    It is common to need a back button
    in a view sequence. This just describes
    a simple one. Must be passed
    a goToPreviousScene function which
    triggers transition to previous scene.
  */
  propTypes: {
    goBackward: React.PropTypes.func.isRequired
  },
  render() {
    return (
      <p
        style={Style.funcs.merge(smallBackBtnStyle, this.props.style)}
        onClick={this.props.goBackward}
      >
        Go Back
      </p>
    );
  }
});
