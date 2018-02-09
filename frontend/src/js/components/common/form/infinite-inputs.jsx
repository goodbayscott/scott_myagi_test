import React from 'react';
import _ from 'lodash';
import cx from 'classnames';

import Style from 'style';

export class InfiniteInputs extends React.Component {
  /*
    Takes a single child input and allows user
    to duplicate that input by clicking a plus button.
    Useful for when user needs to enter a variable amount
    of data, e.g. emails of multiple other people to invite
    to the app.

    Example usage:

    <InfiniteInputs name="email">
      <EmailInput />
    </InfiniteInputs>

    Three EmailInputs will be rendered initially
    (because `initialNumInputs` defaults to 3).
    When user clicks plus button at bottom of the component,
    new EmailInputs will be created. On submission of the form,
    `name` will be used to determine how data will be
    combined with the other form data. Basically, each
    input's name in the form data is simply name plus
    the index of the input (e.g. 1, 2 or 3 in our example).
  */
  static propTypes = {
    name: React.PropTypes.string.isRequired,
    // Use this to determine how many copies of
    // the single child component should be rendered
    // initially
    initialNumInputs: React.PropTypes.number,
    // Used by Form component
    onChange: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    // At least one value is required
    required: React.PropTypes.bool,
    // Allows input funcs to be modified before
    // creation
    getProps: React.PropTypes.func
  };

  static defaultProps = {
    initialNumInputs: 3
  };

  constructor(props) {
    super();
    this.state = {
      numInputs: props.initialNumInputs
    };
  }

  isValid() {
    if (!this.props.required) return true;
    let oneValue = false;
    _.each(_.values(this.refs), input => {
      const nameAndValue = input.getNameAndValue();
      if (!nameAndValue) return;
      let values = _.values(nameAndValue) || [];
      values = _.without(values, null);
      values = _.without(values, undefined);
      if (values.length) {
        oneValue = true;
      }
    });
    return oneValue;
  }

  _getChildInputs() {
    return _.values(this.refs);
  }

  getNameAndValue() {
    const namesAndValues = {};
    this._getChildInputs().forEach(child => {
      _.extend(namesAndValues, child.getNameAndValue());
    });
    return namesAndValues;
  }

  addInput = evt => {
    // Required because sometimes this button triggers
    // form submission
    evt.preventDefault();
    const num = this.state.numInputs;
    this.setState({ numInputs: num + 1 });
  };

  render() {
    let child;
    // React.Children.only does not work with recursive input traversal,
    // so just using this instead.
    React.Children.forEach(this.props.children, curChild => (child = curChild));
    // Determine name either from
    // the `name` prop or from the `name`
    // prop of the single child component.
    const name = this.props.name;
    if (!name) console.warn('No base name could be found for children');
    const children = [];
    let i = 0;
    while (i < this.state.numInputs) {
      const id = `input-${i}`;
      let props = {
        key: id,
        ref: id,
        onChange: this.props.onChange,
        onBlur: this.props.onBlur,
        onFocus: this.props.onFocus,
        name: name + i
      };
      if (this.props.getProps) props = this.props.getProps(props, i);
      children.push(React.cloneElement(child, props));
      i += 1;
    }
    return (
      <div>
        {children}
        <button className="ui fluid basic button" onClick={this.addInput}>
          <i className="plus icon" />
        </button>
      </div>
    );
  }
}
