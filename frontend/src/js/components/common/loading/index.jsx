import React from 'react';
import Radium from 'radium';
import cx from 'classnames';
import reactMixin from 'react-mixin';

import Style from 'style/index.js';

import { LoadingContainerMixin } from 'common-mixins/loading';

const loaderKeyframes = Radium.keyframes({
  '0%': {
    transform: 'rotate(0deg)'
  },
  '100%': {
    transform: 'rotate(360deg)'
  }
});

const lsStyle = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100px'
  },
  spinner: {
    borderBottom: '2px solid rgba(0,0,0,0.03)',
    borderLeft: '2px solid rgba(0,0,0,0.03)',
    borderRight: '2px solid rgba(0,0,0,0.03)',
    borderTop: '2px solid rgba(0,0,0,0.3)',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'x 2s cubic-bezier(0.5,0.3,0.5,0.7) infinite',
    animationName: loaderKeyframes
  }
};

@Radium
export class LoadingSpinner extends React.Component {
  /*
    Wrapper for http://semantic-ui.com/elements/loader.html#indeterminate
  */
  static propTypes = {
    containerStyle: React.PropTypes.object
  };

  render() {
    let cStyle = Style.funcs.merge(lsStyle.container, this.props.containerStyle);
    cStyle = Style.funcs.mergeIf(this.props.transparent, cStyle, {
      backgroundColor: 'transparent'
    });
    const spinnerStyle = Style.funcs.merge(lsStyle.spinner, this.props.spinnerStyle);
    return (
      <div style={cStyle}>
        <div style={spinnerStyle} />
      </div>
    );
  }
}

export const loadingSwitch = function (isLoading, data, ifLoaded, ifNoData) {
  /*
    Basically just implements a common if statement.
    returns LoadingSpinner if `isLoading` is true. Otherwise,
    if `data` has count of zero (is assumed to Immutable.js data
    structure), `ifNoData` is returned. If there is data, then
    `ifLoaded` is returned.

    TODO - Deprecate this and use simpleLoadingSwitch or LoadingContainer
    instead.
  */
  let el = null;
  if (isLoading) {
    el = <LoadingSpinner />;
  } else if (!data.count()) {
    el = ifNoData || ifLoaded;
  } else {
    el = ifLoaded;
  }
  return el;
};

export const simpleLoadingSwitch = function (data, ifLoaded, ifNoData) {
  /*
    Simpler switch which just assumes that if data is undefined
    then it is still loading.
  */
  let el;
  if (!data) {
    el = <LoadingSpinner />;
  } else if (!data.count()) {
    el = ifNoData || ifLoaded;
  } else {
    el = ifLoaded;
  }
  return el;
};

const loadingStyle = {
  noDataText: {
    padding: '10px',
    color: Style.vars.colors.get('xDarkGrey'),
    textAlign: 'center'
  },
  cardContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e5e5',
    boxShadow: 'rgba(0,0,0,0.18) 4px 3px 20px',
    borderRadius: 2,
    padding: 30
  },
  noDataLink: {
    color: Style.vars.colors.get('primary'),
    cursor: 'pointer'
  }
};

export class NoData extends React.Component {
  render() {
    const s = Style.funcs.merge(loadingStyle.noDataText, this.props.style);
    if (this.props.renderHTML) {
      return (
        <p
          style={s}
          dangerouslySetInnerHTML={this.props.renderHTML && { __html: this.props.children }}
        />
      );
    }
    return <p style={s}>{this.props.children}</p>;
  }
}

export class NoDataLink extends React.Component {
  render() {
    return (
      <u onClick={this.props.onClick} style={loadingStyle.noDataLink}>
        {this.props.children}
      </u>
    );
  }
}

export class NoDataCard extends React.Component {
  redner() {
    return <div style={loadingStyle.cardContainer}>{this.props.children}</div>;
  }
}

@Radium
@reactMixin.decorate(LoadingContainerMixin)
export class LoadingContainer extends React.Component {
  /*
    Shortcut for instantiating a component or loading spinner
    depending on whether data has loaded. `createComponent`
    is a func to instantiate the desired component. If any
    prop in `loadingProps` is falsey, then it is assumed that
    it is still loading (and loading spinner will be displayed).
    If prop is not null, but has no count (it is assumed that
    each prop is an Immutable.js structure), then `noDataText`
    is displayed. Otherwise, createComponent is used to generate
    the component.
  */
  getSpinnerComponentFactory() {
    return React.createFactory(LoadingSpinner);
  }
  getNoDataComponentFactory() {
    return React.createFactory(NoData);
  }
}

export class LoadMoreFooter extends React.Component {
  /*
    A simple button which can be clicked to
    trigger loading new data. Requires
    a `loadMore` function to start loading
    more data.
  */
  static propTypes = {
    loadMore: React.PropTypes.func.isRequired,
    moreAvailable: React.PropTypes.func,
    isLoading: React.PropTypes.func.isRequired,
    showMoreText: React.PropTypes.string
  };

  render() {
    let text = 'Show More';
    if (this.props.showMoreText) {
      text = this.props.showMoreText;
    }
    const loadingClasses = cx(
      'fluid',
      'ui',
      'basic',
      'center',
      { loading: this.props.isLoading() },
      { hidden: !this.props.moreAvailable() },
      'button'
    );
    return (
      <div onClick={this.props.loadMore} className={loadingClasses} style={this.props.style}>
        {text}
      </div>
    );
  }
}
