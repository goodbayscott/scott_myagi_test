import React from 'react';
import _ from 'lodash';
import cx from 'classnames';
import Radium from 'radium';
import { t } from 'i18n';

import Style from 'style/index.js';

import { FormFieldMixin } from 'common-mixins/form/form-field';

export const SlideToggle = React.createClass({
  /*
    A simple toggle switch
  */

  mixins: [FormFieldMixin],

  propTypes: {
    initialValue: React.PropTypes.bool.isRequired
  },

  toggle() {
    if (this.props.disabled) {
      if (this.props.onDisabledClick) this.props.onDisabledClick();
      return;
    }
    this.setState({ value: !this.state.value });
    if (this.props.onChange) this.props.onChange(this.props.state_key);
  },

  toggleNoAction() {
    // Toggle the button, but do not perform onChange()
    // Use this when cancelling a toggle after a bad request.
    this.setState({ value: !this.state.value });
  },

  render() {
    const toggleClasses = cx('ui', 'fitted', 'toggle', 'checkbox', {
      disabled: this.props.disabled
    });
    return (
      <div className={toggleClasses} onClick={this.toggle} style={this.props.style}>
        <input type="checkbox" onChange={_.noop} checked={this.state.value} />
        <label />
      </div>
    );
  }
});

const buttonToggleStyle = {
  container: {
    [Style.vars.media.get('mobile')]: {
      flexDirection: 'column'
    }
  },
  or: {
    [Style.vars.media.get('mobile')]: {
      alignSelf: 'center'
    }
  },
  button: {
    height: '100%',
    color: Style.vars.colors.get('primaryFontColor'),
    fontWeight: 400,
    ...Style.funcs.makeTransition('all ease-in 0.2s')
  },
  activeButton: {
    backgroundColor: Style.vars.colors.get('primary')
  }
};

export const ButtonToggle = Radium(React.createClass({
  /*
    A switch of sorts which can be toggled between two positions.
    Takes a `leftLabel` for the left option and a `rightLabel` for
    the right option. The `onChange` prop/function will be called
    every time the switch changes value.
  */
  mixins: [FormFieldMixin],
  propTypes: {
    leftLabel: React.PropTypes.string.isRequired,
    rightLabel: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func,
    style: React.PropTypes.object
  },
  getDefaultProps() {
    return { style: {} };
  },
  componentWillMount() {
    // Give correct default for value (FormFieldMixin will default to initialValue prop)
    const init =
        this.props.initialValue === this.props.leftLabel ||
        this.props.initialValue === this.props.rightLabel
          ? this.props.initialValue
          : this.props.leftLabel;
    this.setState({ value: init });
  },
  toggle() {
    let cur = this.state.value;
    if (cur === this.props.leftLabel) cur = this.props.rightLabel;
    else cur = this.props.leftLabel;
    this.toggleTo(cur);
  },
  toggleTo(val) {
    if (val !== this.state.value && this.props.onChange) {
      const index = val === this.props.leftLabel ? 0 : 1;
      this.props.onChange(val, index);
    }
    this.setState({ value: val });
  },
  createButton(label) {
    const isActive = label === this.state.value;
    const btnClasses = cx('ui', 'button', { active: isActive });
    let style = _.extend({}, buttonToggleStyle.button, this.props.style.button);
    if (isActive) style = _.extend(style, buttonToggleStyle.activeButton);
    return (
      <div className={btnClasses} style={style} onClick={_.partial(this.toggleTo, label)}>
        {label}
      </div>
    );
  },
  render() {
    if (this.props.leftLabel === this.props.rightLabel) {
      console.warn('Do not use identical labels for button toggle');
    }
    return (
      <div
        className="ui large buttons"
        style={[buttonToggleStyle.container, this.props.style.container]}
      >
        {this.createButton(this.props.leftLabel)}
        <div className="or" style={[buttonToggleStyle.or, this.props.style.orText]} />
        {this.createButton(this.props.rightLabel)}
      </div>
    );
  }
}));

export class YesNoToggle extends React.Component {
  onChange = val => {
    this.props.onChange(val.toLowerCase() === t('yes'));
  };
  render() {
    const initial = this.props.initialValue ? t('yes') : t('no');
    return (
      <ButtonToggle
        leftLabel={t('no')}
        rightLabel={t('yes')}
        {...this.props}
        onChange={this.onChange}
        initialValue={initial}
      />
    );
  }
}
