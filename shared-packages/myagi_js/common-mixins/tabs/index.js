import _ from 'lodash';

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

  getInitialState() {
    return {
      activeTab: this.getInitialActiveTab()
    };
  },

  getTabNames() {
    const processed = [];
    _.forEach(this.getTabContentMap(), (val, key) => {
      if (val) processed.push(key);
    });
    return processed;
  },
  getActiveTabName() {
    return this.state.activeTab;
  },
  setTab(newTab) {
    this.setState({
      activeTab: newTab
    });
  },
  onTabChange(newTab) {
    this.setTab(newTab);
  },
  tabIsActive(tabName) {
    return tabName === this.state.activeTab;
  },
  getTabsProps(extraProps) {
    return Object.assign(
      {
        tabNames: this.getTabNames(),
        initialSelection: this.state.activeTab,
        onChange: newTab => this.onTabChange(newTab)
      },
      extraProps
    );
  },
  getActiveTabComponent() {
    return this.refs[`${this.state.activeTab}TabContent`];
  }
};
