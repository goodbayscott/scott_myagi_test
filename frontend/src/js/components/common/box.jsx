import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';
import querystring from 'querystring';
import reactMixin from 'react-mixin';

import { convertToProdMediaPath } from 'utilities/generic';

import Style from 'style';

import { HoverMixin } from './hover';
import { BackButton, PrimaryButton } from './buttons';

const boxStyle = {
  container: {
    backgroundColor: Style.vars.colors.get('white')
  }
};

export class Box extends React.Component {
  /*
    Basically just a white box which can be used to wrap new page content.
  */
  render() {
    const conStyle = Style.funcs.merge(boxStyle.container, this.props.style);
    return (
      <div className="ui container" style={conStyle}>
        {this.props.children}
      </div>
    );
  }
}

const bdStyle = {
  box: {
    maxWidth: '500px !important',
    margin: '0 auto'
  }
};

export class ThinBox extends React.Component {
  render() {
    return (
      <Box style={Style.funcs.merge(bdStyle.box, this.props.style)}>{this.props.children}</Box>
    );
  }
}

@reactMixin.decorate(HoverMixin)
export class RouterBackButton extends React.Component {
  /*
    A back button which is able to trigger navigation
    to a give `route` with the given `params`. If `route`
    is not specified, then `window.history.back` is used
    instead.
  */
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static propTypes = {
    text: React.PropTypes.string.isRequired,
    route: React.PropTypes.string,
    params: React.PropTypes.object
  };

  forceGoBack = () => {
    this.context.router.goBack();
  };

  onClick = () => {
    if (this.props.onClick) {
      this.props.onClick();
      return;
    }
    if (!this.props.route) {
      this.forceGoBack();
      return;
    }
    let route = resolve(this.props.route, this.props.params);
    if (this.props.query) {
      route = `${route}?${querystring.stringify(this.props.query)}`;
    }
    this.context.router.push(route);
  };

  render() {
    return (
      <BackButton
        text={this.props.text}
        onClick={this.onClick}
        style={this.props.style}
        hoverStyle={this.props.hoverStyle}
      />
    );
  }
}

const boxHeaderStyle = {
  container: {
    padding: '20px 20px 10px 20px',
    margin: '0',
    position: 'relative',
    minHeight: '3.8em',
    overflow: 'auto'
  },
  heading: {
    marginBottom: '10px'
  },
  img: {
    width: '3.5em',
    height: '3.5em'
  },
  imgFlexible: {
    width: '3.5em',
    marginRight: '10px'
  }
};

export class BoxHeader extends React.Component {
  /*
    Header which is often placed at the top of a page/box.
  */
  static propTypes = {
    heading: React.PropTypes.string,
    subHeading: React.PropTypes.string,
    backOpts: React.PropTypes.object
  };

  render() {
    let imgTag = null;
    if (this.props.imgSrc) {
      const imageStyle = _.extend({}, boxHeaderStyle.img, this.props.imgStyle);
      imgTag = (
        <img
          src={convertToProdMediaPath(this.props.imgSrc)}
          className="ui circular image"
          style={imageStyle}
        />
      );
    }
    const style = _.extend(
      {},
      boxHeaderStyle.container,
      this.props.style || this.props.containerStyle
    );
    if (this.props.noDivider) style.borderBottom = null;
    let backEl;
    if (this.props.backOpts) {
      const backStyle = this.props.subHeading ? { marginTop: '20px' } : undefined;
      backEl = <RouterBackButton {...this.props.backOpts} style={backStyle} />;
    }
    let headingStyle = Style.funcs.merge(boxHeaderStyle.heading, this.props.headingStyle);
    if (this.props.backText) {
      // If back button is added then margin needs to be different
      headingStyle.marginBottom = '7px';
    }
    headingStyle = Style.funcs.merge(headingStyle, this.props.headingStyle);
    let subheadingStyle;
    if (backEl && this.props.subHeading) {
      subheadingStyle = { marginBottom: 10 };
    }
    return (
      <div style={style}>
        {this.props.heading ? (
          <h3 className="ui left floated header" style={headingStyle}>
            {imgTag}
            <div className="content">
              {this.props.heading}
              <div className="sub header" style={subheadingStyle}>
                {this.props.subHeading}
              </div>
              {backEl}
            </div>
          </h3>
        ) : null}
        {this.props.children}
      </div>
    );
  }
}

const tbhStyle = {
  headingContainer: {
    paddingBottom: 0,
    minHeight: '4.6em',
    overflow: 'visible',
    width: 'auto'
  }
};

export class BoxHeaderTabs extends React.Component {
  render() {
    const cStyle = Style.funcs.merge(tbhStyle.headingContainer, this.props.containerStyle);
    return <BoxHeader {...this.props} containerStyle={cStyle} />;
  }
}

const innerBoxHeaderStyle = {
  marginTop: '1em'
};

export class InnerBoxHeader extends React.Component {
  /*
    Should be used for section headers within a box.
  */
  render() {
    const style = _.extend({}, innerBoxHeaderStyle, this.props.style);
    return (
      <BoxHeader {...this.props} style={style}>
        {' '}
        {this.props.children}{' '}
      </BoxHeader>
    );
  }
}

const boxContentStyle = {
  container: {
    padding: 20
  }
};

export class BoxContent extends React.Component {
  /*
    Wraps content within a box.
  */
  render() {
    const style = _.extend({}, boxContentStyle.container, this.props.style);
    return <div style={style}>{this.props.children}</div>;
  }
}

const fullWidthSegmentStyle = {
  container: {
    marginLeft: '-10px',
    marginTop: 0,
    width: 'calc(100% + 20px)',
    padding: 0,
    backgroundColor: Style.vars.colors.get('lightGrey')
  }
};

export class FullWidthSegment extends React.Component {
  /*
    Creates a section within box which stretches full width
    of the container.
  */
  render() {
    const style = _.extend({}, fullWidthSegmentStyle.container, this.props.style);
    return (
      <div className={this.props.className} style={style}>
        {this.props.children}
      </div>
    );
  }
}

const headerStyle = {
  line: {
    borderTop: `1px solid ${Style.vars.colors.get('darkGrey')}`,
    content: '',
    margin: '0 auto',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    width: '95%',
    zIndex: '-1'
  },
  outer: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center'
  },
  inner: {
    background: Style.vars.colors.get('white'),
    padding: '0 15px',
    position: 'relative',
    margin: '0 auto',
    color: Style.vars.colors.get('darkGrey')
  }
};

export class HeaderWithLineThrough extends React.Component {
  /*
    Header with line either side.
    e.g. https://css-tricks.com/line-on-sides-headers/
  */
  render() {
    return (
      <span style={this.props.containerStyle}>
        <h5 style={Style.funcs.merge(headerStyle.outer, this.props.style)}>
          <span style={headerStyle.line} />
          <span
            style={Style.funcs.mergeIf(this.props.backgroundColor, headerStyle.inner, {
              backgroundColor: this.props.backgroundColor
            })}
          >
            {this.props.children}
          </span>
        </h5>
      </span>
    );
  }
}

export class InfoHeader extends React.Component {
  render() {
    return (
      <h4
        style={Style.funcs.merge(
          { textAlign: 'center', color: Style.vars.colors.get('darkGrey') },
          this.props.style
        )}
      >
        {this.props.children}
      </h4>
    );
  }
}

const panelStyle = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  },
  panel: {
    backgroundColor: 'white',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: Style.vars.widths.get('mainContentMaxWidth')
  }
};

@Radium
export class Panel extends React.Component {
  render() {
    return (
      <div style={{ ...panelStyle.container, ...(this.props.outerStyle || {}) }}>
        <div style={{ ...panelStyle.panel, ...(this.props.innerStyle || {}) }}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
