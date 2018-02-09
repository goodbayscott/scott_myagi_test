import React from 'react';
import _ from 'lodash';
import cx from 'classnames';

import Style from 'style/index.js';

import { FormMixin } from 'common-mixins/form/form';

export const Form = React.createClass({
  /*
    Form component should be used instead of standard
    HTML form tag. Takes care of validating all child
    fields, then calling an `onSubmitAndValid`
    function with data from those fields once the data
    is submitted, validated and cleaned.

    Example usage:

    <Form onSubmitAndValid={this.onFormSubmitAndValid}>
      <TextInput name="name" />
      <EmailInput name="email" required />
      <SubmitButton />
    </Form>

    In this example, the submit button will be disabled until
    the user enters a value in the email field (the only required
    field). The form can then be submitted, at which point the
    `onFormSubmitAndValid` function will be called with the following
    object:

    {
      name: // Whatever the user entered //,
      email: // Whatever the user entered //
    }

    NOTE: Influenced by https://github.com/christianalfoni/formsy-react/blob/master/src/main.js

  */

  mixins: [FormMixin],

  doSubmit() {
    // Basically this function is just an alias for onSubmit
    // which is consistent with a similar function in the Native App code base.
    this.onSubmit();
  },

  render() {
    const children = this.traverseChildrenAndRegisterInputs(this.props.children);
    const classes = cx('ui', { loading: this.props.loading }, 'form');
    return (
      <form onSubmit={this.onSubmit} className={classes} style={this.props.style}>
        {children}
      </form>
    );
  }
});

const fhStyle = {
  exp: {
    marginTop: '-10px'
  },
  container: {
    marginBottom: 10
  },
  labelStyle: {
    fontSize: 14,
    color: '#999999',
    fontWeight: 600
  }
};

export const FieldHeader = React.createClass({
  render() {
    let opt;
    if (!this.props.required) {
      opt = <small>(optional)</small>;
    }
    let explanation;
    if (this.props.explanation) {
      explanation = <p style={fhStyle.exp}>{this.props.explanation}</p>;
    }
    return (
      <div style={Style.funcs.merge(fhStyle.container, this.props.style)}>
        <h3 style={Style.funcs.merge(fhStyle.labelStyle, this.props.headerStyle)}>
          {this.props.children} {opt}
        </h3>
        {explanation}
      </div>
    );
  }
});

export {
  DatetimeInput,
  TextInput,
  TextArea,
  PasswordInput,
  EmailInput,
  URLInput,
  HiddenTextInput,
  FileInput,
  NumberInput,
  RangeInput
} from './input';
export { FormMixin } from 'common-mixins/form/form';
export { ImageCropper } from './image';
export { SubmitButton } from './submit-button';
export { SearchableSelect } from './select';
export { InfiniteInputs } from './infinite-inputs';
export { ButtonToggle, SlideToggle, YesNoToggle } from './toggles';
export { Checkbox } from './checkbox';
