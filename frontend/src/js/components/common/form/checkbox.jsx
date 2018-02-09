import Marty from 'marty';
import React from 'react';
import reactMixin from 'react-mixin';
import { FormFieldMixin } from 'common-mixins/form/form-field';

import Style from 'style';

const styles = {
  input: {
    marginTop: 4
  }
};

@reactMixin.decorate(FormFieldMixin)
export class Checkbox extends React.Component {
  onChange = () => {
    if (this.props.onChange) {
      this.props.onChange();
    }
    this.setState({ value: !this.state.value });
  };

  render() {
    return (
      <input
        style={Style.funcs.merge(styles.input, this.props.style)}
        type="checkbox"
        onChange={this.onChange}
        checked={this.props.checked}
      />
    );
  }
}
