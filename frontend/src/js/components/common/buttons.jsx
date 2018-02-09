import React from 'react';
import Radium from 'radium';
import cx from 'classnames';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import Style from 'style';

import { HoverMixin } from './hover';

export const pbStyle = {
  btn: {
    fontSize: '.8em',
    color: Style.vars.colors.get('primaryFontColor'),
    backgroundColor: Style.vars.colors.get('primary'),
    borderColor: Style.vars.colors.get('primary'),
    cursor: 'pointer'
  },

  btnHover: {
    backgroundColor: Style.vars.colors.get('darkPrimary'),
    borderColor: Style.vars.colors.get('darkPrimary')
  }
};

@reactMixin.decorate(HoverMixin)
export class PlusButton extends React.Component {
  /*
    Circular plus button which can be used as an 'add' or 'create'
    type button.
  */

  static propTypes = {
    onClick: React.PropTypes.func.isRequired
  };

  onClick = () => {
    this.props.onClick();
  };

  render() {
    const plusClasses = cx('plus', 'icon', 'circular');
    let style = this.getHoverStyle(pbStyle.btn, pbStyle.btnHover);
    style = Style.funcs.merge(style, this.props.style);
    return (
      <i
        {...this.getHoverProps()}
        style={style}
        className={plusClasses}
        onClick={this.props.onClick}
        onTouchEnd={this.props.onClick}
      >
        {this.props.children}
      </i>
    );
  }
}

export const playStyle = {
  btn: {
    fontSize: '2em',
    color: Style.vars.colors.get('primaryFontColor'),
    backgroundColor: Style.vars.colors.get('primary'),
    borderColor: Style.vars.colors.get('primary'),
    cursor: 'pointer'
  },

  btnHover: {
    backgroundColor: Style.vars.colors.get('darkPrimary'),
    borderColor: Style.vars.colors.get('darkPrimary')
  }
};

@reactMixin.decorate(HoverMixin)
export class PlayButton extends React.Component {
  /*
    Circular plus button which can be used as an 'add' or 'create'
    type button.
  */

  static propTypes = {
    onClick: React.PropTypes.func.isRequired
  };

  onClick = () => {
    this.props.onClick();
  };

  render() {
    const plusClasses = cx('play', 'icon', 'circular');
    let style = this.getHoverStyle(playStyle.btn, playStyle.btnHover);
    style = Style.funcs.merge(style, this.props.style);
    return (
      <i
        {...this.getHoverProps()}
        style={style}
        className={plusClasses}
        onClick={this.props.onClick}
        onTouchEnd={this.props.onClick}
      >
        {this.props.children}
      </i>
    );
  }
}

export const tickStyle = {
  btn: {
    fontSize: '2em',
    color: Style.vars.colors.get('white'),
    backgroundColor: Style.vars.colors.get('oliveGreen'),
    borderColor: Style.vars.colors.get('oliveGreen'),
    cursor: 'pointer'
  },

  btnHover: {
    backgroundColor: Style.vars.colors.get('oliveGreen'),
    borderColor: Style.vars.colors.get('oliveGreen')
  }
};

@reactMixin.decorate(HoverMixin)
export class TickButton extends React.Component {
  /*
    Circular plus button which can be used as an 'add' or 'create'
    type button.
  */

  static propTypes = {
    onClick: React.PropTypes.func.isRequired
  };

  onClick = () => {
    this.props.onClick();
  };

  render() {
    const plusClasses = cx('check', 'icon', 'circular');
    let style = this.getHoverStyle(tickStyle.btn, tickStyle.btnHover);
    style = Style.funcs.merge(style, this.props.style);
    return (
      <i
        {...this.getHoverProps()}
        style={style}
        className={plusClasses}
        onClick={this.props.onClick}
        onTouchEnd={this.props.onClick}
      >
        {this.props.children}
      </i>
    );
  }
}

const bbStyle = {
  backIcon: {
    margin: 0,
    marginLeft: '-5px'
  },
  back: {
    margin: 0,
    cursor: 'pointer',
    fontSize: '1rem',
    color: Style.vars.colors.get('xxDarkGrey'),
    ...Style.funcs.makeTransitionAll()
  },
  backHover: {
    color: Style.vars.colors.get('textBlack')
  }
};

@reactMixin.decorate(HoverMixin)
export class BackButton extends React.Component {
  /*
    Very simple button which is useful as a 'back'
    or 'go to previous' type bytton.
  */
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  static propTypes = {
    text: React.PropTypes.string.isRequired,
    onClick: React.PropTypes.func,
    routeName: React.PropTypes.string
  };

  onClick = () => {
    if (this.props.routeName) {
      this.context.router.push(resolve(this.props.routeName));
    } else if (this.props.onClick) {
      this.props.onClick();
    }
  };

  render() {
    let style = Style.funcs.merge(bbStyle.back, this.props.style);
    style = this.getHoverStyle(style, Style.funcs.merge(bbStyle.backHover, this.props.hoverStyle));
    return (
      <div
        className="sub header"
        onClick={this.onClick}
        onTouchEnd={this.onClick}
        style={style}
        {...this.getHoverProps()}
      >
        <i style={bbStyle.backIcon} className="angle left icon" />
        {this.props.text || this.props.children}
      </div>
    );
  }
}

export const primaryBtnStyle = {
  backgroundColor: Style.vars.colors.get('primary'),
  color: Style.vars.colors.get('primaryFontColor'),
  border: 'none',
  padding: '10px 15px',
  marginLeft: '5px',
  borderRadius: 3,
  fontWeight: 'normal',
  transition: '0.2s ease-in all',
  cursor: 'pointer',
  textAlign: 'center',
};

const primaryBtnHoverStyle = {
  backgroundColor: Style.vars.colors.get('darkPrimary')
};

@Radium
@reactMixin.decorate(HoverMixin)
export class PrimaryButton extends React.Component {
  render() {
    let style = this.getHoverStyle(
      primaryBtnStyle,
      Style.funcs.merge(primaryBtnHoverStyle, this.props.hoverStyle)
    );
    style = Style.funcs.mergeIf(this.props.floatRight, style, { float: 'right' });
    const disabledStyles = {
      backgroundColor: Style.vars.colors.get('fadedPrimary'),
      cursor: 'not-allowed',
      color: Style.vars.colors.get('darkGrey')
    };
    style = Style.funcs.mergeIf(this.props.disabled, style, disabledStyles);
    const styles = Style.funcs.merge(style, this.props.style);
    return (
      <a
        style={styles}
        onClick={!this.props.disabled && this.props.onClick}
        onTouchEnd={this.props.onClick}
        className={this.props.className}
        {...this.getHoverProps()}
        href={this.props.href}
        download={this.props.download}
      >
        {this.props.children}
      </a>
    );
  }
}

const basicBtnStyle = {
  border: 'none',
  boxShadow: 'none',
  marginLeft: '5px',
  padding: '10px 15px',
  background: 'none',
  color: Style.vars.colors.get('textBlack'),
  cursor: 'pointer'
};

const basicBtnHoverStyle = {
  textDecoration: 'underline'
};

@reactMixin.decorate(HoverMixin)
export class BasicButton extends React.Component {
  render() {
    let style = this.getHoverStyle(basicBtnStyle, basicBtnHoverStyle);
    style = Style.funcs.mergeIf(this.props.floatRight, style, { float: 'right' });
    style = Style.funcs.merge(style, this.props.style);
    return (
      <a
        style={style}
        onClick={this.props.onClick}
        onTouchEnd={this.props.onClick}
        {...this.getHoverProps()}
        href={this.props.href}
        download={this.props.download}
      >
        {this.props.children}
      </a>
    );
  }
}

export const secondaryBtnStyle = {
  ...primaryBtnStyle,
  backgroundColor: Style.vars.colors.get('secondaryBtnBckgGrey'),
  color: Style.vars.colors.get('secondaryBtnTextBlack')
};

const secondaryBtnHoverStyle = {
  ...primaryBtnHoverStyle,
  backgroundColor: Style.vars.colors.get('darkGrey')
};

@Radium
@reactMixin.decorate(HoverMixin)
export class SecondaryButton extends React.Component {
  render() {
    return (
      <PrimaryButton
        {...this.props}
        style={Style.funcs.merge(secondaryBtnStyle, this.props.style)}
        hoverStyle={Style.funcs.merge(secondaryBtnHoverStyle, this.props.hoverStyle)}
      />
    );
  }
}

@Radium
export class BordelessButton extends React.Component {
  render() {
    const borderlessButtonStyle = {
      padding: '10px 15px',
      marginLeft: '5px',
      borderRadius: 3,
      fontWeight: 'normal',
      transition: '0.2s ease-in all',
      cursor: 'pointer',
      textAlign: 'center',
      backgroundColor: Style.vars.colors.get('white'),
      color: Style.vars.colors.get('xxDarkGrey'),
      border: 'none',
      ':hover': {
        color: this.props.hoverColor ? this.props.hoverColor : Style.vars.colors.get('green')
      }
    };

    return (
      <a
        key={this.props.name}
        style={Style.funcs.merge(borderlessButtonStyle, this.props.style)}
        onClick={!this.props.disabled && this.props.onClick}
        onTouchEnd={this.props.onClick}
        className={this.props.className}
        href={this.props.href}
        download={this.props.download}
      >
        {this.props.children}
      </a>
    );
  }
}

export function FinishedSelectingButton(props) {
  const classes = cx(
    'ui',
    'right',
    'labeled',
    'icon',
    'green',
    { loading: props.loading },
    'button'
  );
  return (
    <button
      style={{ marginLeft: 10, float: 'right', marginBottom: 10 }}
      className={classes}
      onClick={props.onClick}
    >
      <i className="right arrow icon" />
      Finished
    </button>
  );
}

const plusMoreStyles = {
  container: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
    color: 'white',
    borderRadius: 2,
    cursor: 'pointer',
    ...Style.funcs.makeTransitionAll(),
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.25)'
    }
  }
};

@Radium
export class PlusCountMoreButton extends React.Component {
  render() {
    return (
      <div style={[plusMoreStyles.container, this.props.style]} onClick={this.props.onClick}>
        {t('plus_count_more', { count: this.props.count })}
      </div>
    );
  }
}
