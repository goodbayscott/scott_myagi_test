import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { FormFieldMixin } from './form-field';
import { t } from 'i18n';

export const InputMixin = {
  /*
    Base mixin which should be included in
    all inputs (i.e. text inputs and text areas).
    Handles basic `required` validation and running
    of custom validation functions.
  */
  mixins: [FormFieldMixin],
  propTypes: {
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    required: PropTypes.bool,
    // Does the initial value require editing
    // to be valid?
    initialIsAcceptable: PropTypes.bool
  },
  getDefaultProps() {
    return {
      initialIsAcceptable: false
    };
  },
  getInitialState() {
    return {
      prevIsValid: null,
      prevValidatedValue: null
    };
  },
  isRequired() {
    return this.props.required;
  },
  doInitialChangedValidation(value) {
    if ((this.props && this.props.initialIsAcceptable) || !this.isRequired()) return true;
    return this.userHasChangedValue();
  },
  doRequiredValidation(value) {
    if (value) {
      return true;
    }
    if (this.props.required) {
      return t('value_required');
    }
    return true;
  },
  doMinLengthValidation(value) {
    if (!this.props.minLength) return true;
    if (!(value.length >= this.props.minLength)) {
      const values = { minLength: this.props.minLength };
      const translation = t('must_be_at_least_minlength_characters', values);
      return translation;
    }
    return true;
  },
  doMaxLengthValidation(value) {
    if (!this.props.maxLength) return true;
    if (value.length > this.props.maxLength) {
      const values = { maxLength: this.props.maxLength };
      const translation = t('must_be_no_more_than_maxlength', values);
      return translation;
    }
    return true;
  },
  getValidationFuncs() {
    return [
      // Required should come first or else error message
      // will not show when user hits submit and required
      // field has not been filled out
      this.doRequiredValidation,
      this.doInitialChangedValidation,
      this.doMinLengthValidation,
      this.doMaxLengthValidation,
      // Can be added by fields if necessary
      this.baseIsValid,
      this.props.isValid
    ];
  },
  onChange(evt) {
    // When used in react-native, evt will actually just
    // be the text value of the component.
    const value = evt.target ? evt.target.value : evt;
    if (this.props.onChange) {
      this.props.onChange(evt, value);
    }
    this.setState({ value });
  },
  onFocus() {
    if (!this.userHasChangedValue() && !this.props.initialIsAcceptable) {
      this.setState({ value: '' });
    }
    if (this.props.onFocus) this.props.onFocus();
  },
  onBlur(evt) {
    if (this.props.initialValue && !this.state.value && !this.props.initialIsAcceptable) {
      this.setState({ value: this.props.initialValue });
    }
    if (this.props.onBlur) {
      this.props.onBlur(evt);
    }
  },
  onKeyDown(evt) {
    if (this.props.onKeyDown) this.props.onKeyDown(evt);
  },
  isValid() {
    // Use cached validity results to prevent expensive
    // recalculation
    // TODO - There is redundancy between the `error` and the `prevIsValid`
    // attributes. Should remove one.
    if (this.state.prevValidatedValue !== null) {
      if (this.state.prevValidatedValue === this.state.value) {
        return this.state.prevIsValid;
      }
    }
    let isValid = true;
    const validationFuncs = this.getValidationFuncs();
    const cleaned = this.clean(this.state.value);
    let error;
    validationFuncs.forEach((func) => {
      if (!isValid) return;
      if (func) {
        const val = func(cleaned);
        // Validation funcs may return an error message to display.
        error = typeof val === 'string' ? val : null;
        if (!val || error) {
          isValid = false;
        }
      }
    });
    this.state.prevValidatedValue = this.state.value;
    this.state.prevIsValid = isValid;
    this.state.error = error;
    return isValid;
  }
};
