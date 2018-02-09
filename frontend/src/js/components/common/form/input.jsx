import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import cx from 'classnames';
import reactMixin from 'react-mixin';

import Datetime from 'react-datetime';
import Style from 'style/index.js';
import { t } from 'i18n';
import { humanFileSize } from 'utilities/generic';
import { validateURL } from 'utilities/validators';

import { InputMixin } from 'common-mixins/form/input';
import { EmailInputMixin } from 'common-mixins/form/email-input';

const PROTOCOLS = ['http://', 'https://', 'ftp://'];

const DEFAULT_PROTOCOL = 'http://';

const textInputStyle = {
  textInput: {
    height: '2.6em',
    fontSize: '14px'
  },
  initValue: {
    color: Style.vars.colors.get('darkGrey')
  },
  label: {
    fontWeight: 'normal'
  },
  container: {
    marginBottom: 20
  },
  errorMsg: {
    color: Style.vars.colors.get('errorRed')
  }
};

const TextInputMixin = {
  /*
    Allows functionality to be shared between
    the `TextInput` and `EmailInput` components.
  */
  mixins: [InputMixin],
  propTypes: {
    // Specify an optional Semantic UI icon class
    // to include.
    icon: React.PropTypes.string,
    style: React.PropTypes.object,
    type: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    // Should input go red when there is an error?
    showError: React.PropTypes.bool,
    // Should initial value be greyed out?
    fadeInitial: React.PropTypes.bool
  },
  getDefaultProps() {
    return {
      fadeInitial: true,
      showError: true
    };
  },

  focus() {
    if (!this.refs.input) console.error('No input ref found');
    ReactDOM.findDOMNode(this.refs.input).focus();
  },

  reset() {
    this.setState({
      value: this.props.initialValue
    });
  },

  render() {
    let iconEl = this.props.icon ? (
      <i className={`${this.props.icon} icon`} style={this.props.iconStyle} />
    ) : null;
    const errorMsgStyle = this.props.errorMsgStyle
      ? this.props.errorMsgStyle
      : textInputStyle.errorMsg;
    // Add icon el if loading is true, that way loading icon still shows.
    if (!iconEl && this.props.loading) iconEl = <i className="notanicon icon" />;
    const style = _.extend({}, textInputStyle.textInput, this.props.style);
    const userHasChanged = this.userHasChangedValue();
    if (!userHasChanged && this.props.fadeInitial && !this.props.initialIsAcceptable) {
      _.extend(style, textInputStyle.initValue);
    }
    // Show error if user has changed the current value OR if user has submitted
    const error = !this.isValid() && (userHasChanged || this.props.hasSubmitted);
    let errorMessage;
    if (error) {
      errorMessage = this.state.error && !this.props.hideErrorMessage ? t(this.state.error) : null;
    }
    const actionEl = this.props.actionComponent || null;
    // placeholderColor also needs to be added as a class in style.css (frontend/src/css)
    // because react doesn't have a nice way of dealing with pseudo classes.
    const placeholderColor = this.props.placeholderColor;
    const classes = cx(
      'ui',
      { icon: iconEl },
      { input: iconEl !== undefined },
      'field',
      { error: error && this.props.showError },
      { loading: this.props.loading },
      { action: Boolean(actionEl) },
      { [`placeholder-${placeholderColor}`]: placeholderColor }
    );
    const cStyle = Style.funcs.merge(textInputStyle.container, this.props.style.container);
    const inputClassName = this.props.name ? `${_.kebabCase(this.props.name)}-input` : null;

    const placeholder = this.props.placeholder ? this.props.placeholder : '';

    return (
      <div style={cStyle}>
        <div className={classes} style={{ width: '100%', ...this.props.style.innerContainer }}>
          {this.getLabelEl({ ...textInputStyle.label, ...this.props.labelStyle })}
          <input
            type={this.props.type}
            placeholder={placeholder}
            onBlur={this.onBlur}
            onChange={this.onChange}
            onFocus={this.onFocus}
            onKeyDown={this.onKeyDown}
            value={this.state.value}
            style={style}
            max={this.props.max}
            min={this.props.min}
            maxLength={this.props.maxLength}
            className={inputClassName}
            ref="input"
          />
          {actionEl}
          {iconEl}
        </div>
        {errorMessage ? (
          <div style={errorMsgStyle}>
            <p>{errorMessage}</p>
          </div>
        ) : null}
      </div>
    );
  }
};

export const TextInput = React.createClass({
  /*
    Simple text input. See comments for
    `TextInputMixin` for information about
    props and usage.
  */
  mixins: [TextInputMixin],

  getDefaultProps() {
    return {
      type: 'text'
    };
  }
});

export const EmailInput = React.createClass({
  /*
    Exactly the same as `TextInput` component
    except it only allows a valid email to
    be entered and submitted.
  */
  mixins: [TextInputMixin, EmailInputMixin],

  getDefaultProps() {
    return {
      type: 'email'
    };
  }
});

export const URLInput = React.createClass({
  mixins: [TextInputMixin],

  getDefaultProps() {
    return {
      type: 'text'
    };
  },

  baseIsValid(val) {
    if (!this.userHasChangedValue() || (this.props.required === false && !val)) return true;
    if (!validateURL(val)) {
      return t('please_enter_a_valid_url');
    }
    return true;
  },

  baseClean(val) {
    // Add default protocol if none is supplied by user
    if (!val) return null;
    let hasProtocol = false;
    PROTOCOLS.forEach(protocol => {
      if (_.startsWith(val, protocol)) {
        hasProtocol = true;
      }
    });
    if (!hasProtocol) return DEFAULT_PROTOCOL + val;
    return val;
  }
});

const textAreaStyle = {
  textarea: {}
};

export const TextArea = React.createClass({
  /*
    A simple text area component. See
    documentation for included mixins for more
    information.
  */
  mixins: [InputMixin],
  propTypes: {
    style: React.PropTypes.object,
    height: React.PropTypes.string,
    showError: React.PropTypes.bool
  },
  getDefaultProps() {
    return {
      showError: false
    };
  },
  render() {
    const taStyle = _.extend(
      {},
      textAreaStyle.textarea,
      this.props.style.textarea || this.props.style
    );
    const labelStyle = _.extend({}, textAreaStyle.label, this.props.style.label);
    if (this.props.height) taStyle.height = this.props.height;
    const error = !this.isValid() && this.userHasChangedValue();
    const classNames = cx('field', { error: error && this.props.showError });
    const inputClassName = this.props.name ? `${this.props.name}-input` : null;
    return (
      <div className={classNames}>
        {this.getLabelEl(labelStyle)}
        <textarea
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          onChange={this.onChange}
          style={taStyle}
          value={this.state.value}
          className={inputClassName}
          placeholder={this.props.placeholder}
          ref="input"
        />
      </div>
    );
  }
});

export const HiddenTextInput = React.createClass({
  /*
    Browsers often focus on first input in a form automatically.
    Sometimes, this auto focus is not desirable. This component
    can be placed at the top of a Form to prevent that behaviour.
  */
  render() {
    return (
      <input
        type="text"
        value={this.props.value}
        style={{ opacity: 0, height: 0, position: 'absolute' }}
      />
    );
  }
});

const fiStyle = {
  container: {
    display: 'relative',
    overflow: 'hidden',
    maxWidth: '100%',
    maxHeight: '100%'
  },
  text: {
    display: 'inline-block',
    position: 'relative',
    maxWidth: 300,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    marginLeft: 10,
    top: 3
  },
  invalidText: {
    color: Style.vars.colors.get('errorRed')
  }
};

export const DatetimeInput = React.createClass({
  getInitialState() {
    return {
      file: null
    };
  },

  onChange(val) {
    this.props.onChange(val);
  },

  render() {
    const inputProps = {};
    if (this.props.placeholder) inputProps.placeholder = this.props.placeholder;
    return (
      <div style={this.props.style}>
        <Datetime
          ref="innerComponent"
          defaultValue={this.props.initialValue}
          value={this.props.value}
          onChange={this.props.onChange}
          open={this.props.open}
          input={this.props.input}
          isValidDate={this.props.isValidDate}
          timeFormat={this.props.timeFormat}
          inputProps={inputProps}
        >
          {this.props.children}
        </Datetime>
      </div>
    );
  }
});

export const FileInput = React.createClass({
  /*
    Stylised file selector
  */
  getInitialState() {
    return {
      file: null
    };
  },
  contextTypes: {
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  },
  onChange(e) {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    this.setState({ file });
    // Call onChange next tick because that is when state will be
    // updated
    if (this.props.onChange) _.defer(this.props.onChange);
  },

  getValue() {
    return this.state.file;
  },

  selectFile(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    ReactDOM.findDOMNode(this.refs.hiddenInput).click();
  },

  isValid() {
    if (this.props.required && !this.state.file) return false;
    if (!this.isValidType()) return false;
    if (!this.isValidSize()) return false;
    return true;
  },
  isValidSize() {
    if (this.state.file && this.state.file.size > this.props.maxFileSize) {
      this.context.displayTempNegativeMessage({
        heading: `${t('notice')}:`,
        body: t('maximum_file_size_is', { size: this.humanFileSize() })
      });
      return false;
    }
    return true;
  },

  isValidType() {
    if (
      this.state.file &&
      this.props.allowedTypes &&
      !_.includes(this.props.allowedTypes, this.state.file.type)
    ) {
      return false;
    }
    return true;
  },

  renderName() {
    if (!this.state.file) return null;
    if (!this.isValidType()) {
      return (
        <p style={Style.funcs.merge(fiStyle.text, fiStyle.invalidText)}>
          Please select a file of the correct type
        </p>
      );
    }
    return <p style={fiStyle.text}>{this.state.file.name}</p>;
  },
  humanFileSize() {
    return humanFileSize(this.props.maxFileSize);
  },
  maxFileSize() {
    if (this.props.maxFileSize) {
      return (
        <p>
          <small>(max file size: {this.humanFileSize()})</small>
        </p>
      );
    }
    return null;
  },
  render() {
    return (
      <div>
        <div style={fiStyle.container}>
          <label htmlFor="file" className="ui icon button" onClick={this.selectFile}>
            <i className="file icon" />
            Select File
          </label>
          <input
            type="file"
            id="file"
            onChange={this.onChange}
            style={{ display: 'none' }}
            ref="hiddenInput"
          />
          {this.renderName()}
        </div>
        {this.maxFileSize()}
      </div>
    );
  }
});

export const PasswordInput = React.createClass({
  mixins: [TextInputMixin],

  getDefaultProps() {
    return {
      type: 'password',
      minLength: 6
    };
  }
});

export const NumberInput = React.createClass({
  mixins: [TextInputMixin],
  getDefaultProps() {
    return {
      type: 'number'
    };
  }
});

export const RangeInput = React.createClass({
  mixins: [TextInputMixin],
  getDefaultProps() {
    return {
      type: 'range'
    };
  }
});
