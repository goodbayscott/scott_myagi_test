import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import Im from 'immutable';
import reactMixin from 'react-mixin';

import $ from 'vendor/jquery/semantic';

import Style from 'style/index.js';

import { JQueryComponentMixin } from 'components/common/jquery-component-mixin.jsx';

@reactMixin.decorate(JQueryComponentMixin)
export class Dropdown extends React.Component {
  /*
    Wrapper for the http://semantic-ui.com/modules/dropdown.html
    module.

    TODO - SearchableSelect component should be moved to here.
  */

  componentDidUpdate(prevProps) {
    // use Im.fromJS because _.isEqual does not support Immutable objects
    if (
      !_.isEqual(prevProps.options, this.props.options) ||
      !Im.fromJS(prevProps.children).equals(Im.fromJS(this.props.children))
    ) {
      this.refresh();
    }
  }

  onClick(evt) {
    if (!this.props.stopPropagation) return;
    evt.stopPropagation();
  }

  getDropdownEl() {
    return $(ReactDOM.findDOMNode(this)).find('.dropdown');
  }

  manipulateDOMWithJQuery() {
    this.$el = this.getDropdownEl().dropdown(this.props.dropdownOpts);
    this.$el.on('click', e => this.onClick(e));
  }

  toggle(evt) {
    this.$el.dropdown('toggle');
  }

  show(evt) {
    this.$el.dropdown('show');
  }

  renderJQueryControlledContent() {
    return (
      <div className={this.props.className} style={this.props.style}>
        {this.props.children}
      </div>
    );
  }
}
