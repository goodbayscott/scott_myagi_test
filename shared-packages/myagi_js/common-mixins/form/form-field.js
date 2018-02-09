import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

export const FormFieldMixin = {
  /*
    All form fields should include this mixin.
    Includes basic state attributes and common
    functions (e.g. getNameAndValue which is used
    by Form component on submission).
  */
  propTypes: {
    name: PropTypes.string,
    isValid: PropTypes.func,
    label: PropTypes.string,
    initialValue: PropTypes.string,

    // Optional clean function which can be used to
    // cleanup submitted data before submission.
    clean: PropTypes.func
  },
  getDefaultProps() {
    return {
      initialValue: '',
      isValid() {
        return true;
      },
      label: null,
      style: {}
    };
  },
  getInitialState() {
    // `initialSelection` used by select inputs. Every other input uses
    // `initialValue`. TODO Change this?
    return {
      value: this.props.initialValue || this.props.initialSelection || ''
    };
  },
  userHasChangedValue() {
    return this.state.value !== this.props.initialValue;
  },
  getNameAndValue() {
    if (!this.props.name) {
      console.warn('getNameAndValue called on field which does not have a name');
    }
    const obj = {};
    // Avoid submitting default placeholder values
    if (!this.userHasChangedValue() && !this.props.initialIsAcceptable) return null;
    const val = this.clean(this.state.value);
    obj[this.props.name] = val;
    return obj;
  },
  clean(value) {
    // No cleaning applied to undefined values
    if (value === undefined) return value;
    if (this.baseClean) {
      value = this.baseClean(value);
    }
    if (this.props.clean) {
      value = this.props.clean(value);
    }
    return value;
  },
  getLabelEl(style) {
    return this.props.label ? <label style={style}>{this.props.label}</label> : null;
  },
  getValue() {
    return this.state.value;
  },
  setValue(newVal) {
    this.setState({ value: newVal });
  }
};
