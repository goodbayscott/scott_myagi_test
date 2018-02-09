import React from 'react';
import _ from 'lodash';
import cx from 'classnames';
import reactMixin from 'react-mixin';
import { t } from 'i18n';

import Style from 'style';

import { setURLParam } from 'utilities/browser';

import { TabsMixin as NativeCompatTabsMixin } from 'common-mixins/tabs';
import { HoverMixin } from '../hover';

const containerStyle = {
  container: {
    border: 'none'
  }
};

const tabStyle = {
  cursor: 'pointer',
  border: 'none',
  color: Style.vars.colors.get('xxDarkGrey'),
  borderBottom: '3px solid transparent',
  borderColor: 'transparent',
  fontWeight: 'normal',
  verticalAlign: 'initial'
};

const activeStyle = {
  color: Style.vars.colors.get('textBlack'),
  borderColor: Style.vars.colors.get('primary'),
  backgroundColor: 'transparent'
};

const hoverStyle = Style.funcs.merge(activeStyle, {
  borderColor: Style.vars.colors.get('mediumGrey')
});

@reactMixin.decorate(HoverMixin)
export class Tab extends React.Component {
  render() {
    let style = Style.funcs.merge(tabStyle, this.props.style);
    if (this.props.tabIsActive) {
      style = Style.funcs.merge(style, activeStyle, this.props.activeStyle);
    } else {
      style = this.getHoverStyle(style, hoverStyle);
    }
    return (
      <div
        {...this.getHoverProps()}
        key={this.props.name}
        className={this.props.className}
        onClick={this.props.onClick}
        style={style}
      >
        {t(this.props.name)}
        {// If HeaderTabs are passed an object with an `indicator` key that
        // contains an array of tab names, a little dot will appear next
        // to the tab name. See components/content-management/channels-tab/page.jsx for an example.
          this.props.indicator && _.includes(this.props.indicator, this.props.name) ? (
            <div className="ui orange empty circular mini label" />
          ) : null}
      </div>
    );
  }
}

export class Tabs extends React.Component {
  /*
    Standard tabs based on http://semantic-ui.com/modules/tab.html
    but restyled.
  */
  static propTypes = {
    // Names for each tab
    tabNames: React.PropTypes.array.isRequired,
    // Initially active tab (defaults to first tab)
    initialSelection: React.PropTypes.string,
    // Callback which is called when active tab changes
    onChange: React.PropTypes.func,
    enabled: React.PropTypes.bool
  };

  static defaultProps = {
    enabled: true
  };

  constructor(props) {
    super();
    let initialSelection = props.initialSelection;
    if (!_.includes(props.tabNames, initialSelection)) {
      initialSelection = props.tabNames[0];
    }
    this.state = {
      activeTab: initialSelection
    };
  }

  componentDidUpdate(oldProps, oldState) {
    if (this.state.activeTab !== oldState.activeTab) {
      // Update current URL param, so that current tab becomes part of
      // browser history
      setURLParam('tab', this.state.activeTab);
    }
  }

  setTab = tabName => {
    if (!this.props.enabled) return;
    this.setState({ activeTab: tabName });
    if (this.props.onChange && this.state.activeTab !== tabName) this.props.onChange(tabName);
  };

  getTab() {
    return this.state.activeTab;
  }

  render() {
    const tabItemEls = [];
    _.each(this.props.tabNames, item => {
      const tabIsActive = item === this.state.activeTab;
      const classes = cx('item', {
        active: tabIsActive
      });
      tabItemEls.push(<Tab
        key={item}
        name={item}
        className={classes}
        onClick={_.partial(this.setTab, item)}
        style={this.props.tabStyle}
        tabIsActive={tabIsActive}
        activeStyle={this.props.activeStyle}
        renderWhenActive={this.props.renderWhenActive}
        indicator={this.props.indicator}
      />);
    });
    const containerClasses = cx('ui', 'top', 'attached', 'tabular', 'menu', {
      stackable: this.props.stackable
    });
    const cStyle = Style.funcs.merge(containerStyle.container, this.props.containerStyle);
    return (
      <div className={containerClasses} style={cStyle}>
        {tabItemEls}
      </div>
    );
  }
}

export class HeaderTabs extends React.Component {
  setTab(...args) {
    this.refs.tabs.apply(this, ...args);
  }

  getTab(...args) {
    this.refs.tabs.apply(this, ...args);
  }

  render() {
    return <Tabs ref="tabs" {...this.props} />;
  }
}

const tabMixinStyle = {
  activeTabContent: {
    display: 'block'
  },
  inactiveTabContent: {
    display: 'none'
  }
};

export const TabsMixin = {
  /*
    Use this mixin to reduce boilerplate when adding tabs and tab content to a
    component. Add the mixin, then write a `getTabContentMap` function on the component
    which returns a mapping in which the keys are tab names and the values are the components
    which those tab names correspond to. Then, in the render method for that component,
    use the `getTabs()` where the Tabs view should be and `getTabContent()` where you want
    the tab content to be rendered.

    Example usage:

      @reactMixin.decorate(TabsMixin)
      class SomeComponent extends React.Component {

        ...

        getTabContentMap() {
          return {
            'First Tab': <FirstTabContent />,
            'Second Tab': <SecondTabContent />
          }
        }

        render() {
          return (
            <div>
              {this.getTabs()}
              {this.getTabContent()}
            </div>
          )
        }
      }
  */

  mixins: [NativeCompatTabsMixin],

  contextTypes: {
    location: React.PropTypes.object.isRequired
  },

  getInitialActiveTab() {
    const tabNames = this.getTabNames();
    let activeTab;
    // Get active tab from query param if it is specified
    if (this.context && this.context.location) {
      activeTab = this.context.location.query.tab;
    }
    if (!activeTab || !_.includes(tabNames, activeTab)) {
      activeTab = _.first(tabNames);
    }
    return activeTab;
  },

  getTabs(extraProps) {
    return <Tabs ref="tabs" {...this.getTabsProps(extraProps)} />;
  },

  getCurrentTab() {
    return this.refs.tabs.getTab();
  },

  getTabContent(opts = {}) {
    const tabContentMap = this.getTabContentMap();
    return _.map(tabContentMap, (val, key) => {
      // Val may be false when using conditional tabs
      if (!val) return;
      if (!val.props) {
        console.warn('Value in tab content map had no props, this will cause an error:', val);
      }
      const tabIsActive = this.tabIsActive(key);
      // Do not render anything if renderWhenActive is enabled
      // and tab is not active
      if (opts.renderWhenActive && !tabIsActive) return null;
      const style = tabIsActive ? tabMixinStyle.activeTabContent : tabMixinStyle.inactiveTabContent;
      val = React.cloneElement(val, {
        isActive: tabIsActive,
        ref: `${key}TabContent`
      });
      return (
        <div key={key} style={style}>
          {' '}
          {val}{' '}
        </div>
      );
    });
  }
};
