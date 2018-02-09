import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

export const FormMixin = {
  /*
    Mixin is used to share functionality between webapp and
    native apps.
  */
  propTypes: {
    onSubmitAndValid: PropTypes.func.isRequired,
    loading: PropTypes.bool
  },

  getDefaultProps() {
    return {
      loading: false
    };
  },

  getInitialState() {
    return {
      curIsValid: false,
      // Debounce as validating form is expensive
      debouncedUpdateIsValid: _.debounce(this.updateIsValid, 150),
      hasSubmitted: false
    };
  },

  componentWillMount() {
    this.inputRefs = [];
  },

  componentDidMount() {
    // Ensure curIsValid is given current value on load
    this.updateIsValid();
  },

  componentWillUpdate() {
    // Reset this everytime.
    this.inputRefs = [];
  },

  _forEachInput(func) {
    let inputs = _.map(this.inputRefs, ref => this.refs[ref]);
    inputs = _.filter(inputs, Boolean);
    _.each(inputs, func);
  },

  updateIsValid() {
    const isValid = this.isValid();
    if (isValid !== this.state.curIsValid) {
      this.setState({
        curIsValid: isValid
      });
    }
  },

  isValid() {
    let isValid = true;
    this._forEachInput((child) => {
      if (child.isValid && !child.isValid()) {
        isValid = false;
      }
    });
    return isValid;
  },

  onSubmit(evt) {
    // `evt` will not be sent when
    // using react native.
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    this.setState({ hasSubmitted: true });
    if (!this.isValid()) return;
    const namesAndValues = this.getNamesAndValues();
    this.props.onSubmitAndValid(namesAndValues);
  },

  getNamesAndValues() {
    const namesAndValues = {};
    this._forEachInput((child) => {
      if (child.getNameAndValue) {
        const nameAndVal = child.getNameAndValue();
        if (nameAndVal) _.extend(namesAndValues, nameAndVal);
      }
    });
    return namesAndValues;
  },

  onInputBlur() {
    this.state.debouncedUpdateIsValid();
  },

  onInputChange() {
    this.state.debouncedUpdateIsValid();
  },

  onInputFocus() {
    this.state.debouncedUpdateIsValid();
  },

  doAll() {
    // Returns a func which executes all of the supplied
    // functions in order
    const funcs = arguments;
    return function () {
      _.each(funcs, (f) => {
        if (f) f.apply(this, arguments);
      });
    };
  },

  traverseChildrenAndRegisterInputs(children) {
    // Traverse the children and children of children to find
    // all inputs by checking for a `name` prop on the element.
    const isValid = this.state.curIsValid;
    if (typeof children !== 'object' || children === null) {
      return children;
    }
    return React.Children.map(
      children,
      function (child) {
        if (!_.isObject(child) || _.isNull(child)) {
          return child;
        }

        if (child && child.props && child.props.name) {
          const childProps = child.props || {};
          const childRef = child.ref || _.uniqueId('form-input-');
          this.inputRefs.push(childRef);
          const props = {
            formIsValid: isValid,
            onBlur: this.doAll(childProps.onBlur, this.onInputBlur),
            onChange: this.doAll(childProps.onChange, this.onInputChange),
            onFocus: this.doAll(childProps.onFocus, this.onInputFocus),
            hasSubmitted: this.state.hasSubmitted,
            ref: childRef
          };
          return React.cloneElement(child, props, child.props && child.props.children);
        }
        return React.cloneElement(
          child,
          // This is purely passed along for the submit button, as it is not an input
          // but it does need to know whether the inputs in the form are valid or not
          {
            formIsValid: isValid,
            ref: child.ref,
            doValidation: this.updateIsValid
          },
          this.traverseChildrenAndRegisterInputs(child.props && child.props.children)
        );
      },
      this
    );
  }
};
