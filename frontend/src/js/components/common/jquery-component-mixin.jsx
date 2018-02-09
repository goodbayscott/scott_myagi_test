import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

const ContentContainer = React.createClass({
  propsTypes: {
    location: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired,
    _radiumStyleKeeper: React.PropTypes.object.isRequired
  },

  childContextTypes: {
    location: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired,
    _radiumStyleKeeper: React.PropTypes.object.isRequired
  },

  getChildContext() {
    return {
      location: this.props.location,
      router: this.props.router,
      _radiumStyleKeeper: this.props._radiumStyleKeeper
    };
  },

  render() {
    return <span {...this.props}>{this.props.children}</span>;
  }
});

export const JQueryComponentMixin = {
  /*
    Contains boilerplate for using JQuery and React
    together in same component. Prevents React from
    complaining when JQuery code manipulates the DOM,
    but also makes it easy to make the component
    reactive.
  */

  contextTypes: {
    location: React.PropTypes.object.isRequired,
    router: React.PropTypes.object.isRequired,
    _radiumStyleKeeper: React.PropTypes.object.isRequired
  },

  getContainerEl() {
    return $(ReactDOM.findDOMNode(this.containerEl));
  },

  setup() {
    const containerEl = this.getContainerEl()[0];
    // `renderJQueryControllerContent` func should be implemented
    // by subclass.
    ReactDOM.render(this.renderContent(), containerEl);
    this.manipulateDOMWithJQuery();
  },

  renderContent() {
    return (
      <ContentContainer
        location={this.context.location}
        router={this.context.router}
        intl={this.context.intl}
        _radiumStyleKeeper={this.context._radiumStyleKeeper}
      >
        {this.renderJQueryControlledContent()}
      </ContentContainer>
    );
  },

  destroy() {
    const $component = this.getContainerEl();
    ReactDOM.unmountComponentAtNode($component[0]);
    $component.off();
    $component.empty();
  },

  refresh() {
    // This can be called in componentDidUpdate to
    // make inheriting component reactive.
    this.destroy();
    this.setup();
  },

  componentDidMount() {
    this.setup();
  },

  componentWillUnmount() {
    try {
      this.destroy();
    } catch (err) {
      // Do nothing, assume React has already destroyed this component.
    }
  },

  render() {
    return (
      <span>
        <span ref={el => (this.containerEl = el)} />
        {/* This method can be optionally added */}
        {this.renderPostJQueryControlledContent && this.renderPostJQueryControlledContent()}
      </span>
    );
  }
};
