import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import cx from 'classnames';

import { t } from 'i18n';

import Style from 'style/index.js';

const submitBtnStyle = {
  hiddenBtn: {
    display: 'none'
  },
  submitBtn: {
    display: 'block',
    margin: '20px auto 0 auto',
    borderRadius: '3px 3px 3px 3px',
    backgroundColor: Style.vars.colors.get('fadedPrimary'),
    color: Style.vars.colors.get('primaryFontColor'),
    padding: '10px',
    width: '100%',
    border: 'none',
    height: '2.5em',
    ...Style.funcs.makeTransition('background-color 500ms linear')
  }
};

export const SubmitButton = React.createClass({
  /*
    A standard submit button which should be placed at the
    bottom of a Form component. Will be disabled by default
    if form is not valid.
  */
  propTypes: {
    text: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.node]),
    // This prop is used by parent Form component
    // to communicate validity of other inputs to
    // this button.
    formIsValid: React.PropTypes.bool,
    onClick: React.PropTypes.func,
    doValidation: React.PropTypes.func
  },

  getDefaultProps() {
    return {
      text: 'Submit',
      formIsValid: false
    };
  },

  getInitialState() {
    return {};
  },

  onSubmitClick() {
    if (this.props.loading) return;
    if (!this.props.formIsValid && this.props.doValidation) {
      // For password inputs autofilled by Chrome,
      // validation initially returns false until the
      // user clicks on the page. If they click submit first,
      // then form will not submit until they click again.
      // Therefore, we just automatically revalidate the form here
      // and try submitting again to prevent this issue.
      this.props.doValidation();
      _.defer(() => {
        if (this.props.formIsValid) this.onSubmitClick();
      });
    }
    if (this.props.onClick) {
      this.props.onClick();
    }
    // `hiddenBtn` will be null if onClick handler causes element to be removed from DOM
    if (this.hiddenBtn) this.hiddenBtn.click();
  },

  render() {
    let style = _.extend({}, submitBtnStyle.submitBtn);
    const bgc = this.props.formIsValid
      ? Style.vars.colors.get('primary')
      : Style.vars.colors.get('fadedPrimary');
    style.backgroundColor = bgc;
    style = _.extend(style, this.props.style);
    style = Style.funcs.mergeIf(!this.props.formIsValid, style, this.props.invalidStyle);
    const classes = cx(
      'ui',
      'fluid',
      { loading: this.props.loading },
      'submit',
      'button',
      'submit-btn',
      { disabled: this.props.disabled }
    );
    return (
      <div>
        <div ref="innerBtn" className={classes} style={style} onClick={this.onSubmitClick}>
          {this.props.text}
        </div>
        <input type="submit" ref={el => (this.hiddenBtn = el)} style={submitBtnStyle.hiddenBtn} />
      </div>
    );
  }
});
