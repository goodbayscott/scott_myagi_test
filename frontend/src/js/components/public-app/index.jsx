import React from 'react';
import { IntlProvider } from 'react-intl';
import { qs } from 'utilities/http';
import { configureForLocale, getNavigatorLocale } from 'i18n';

function getLocaleFromURL() {
  return qs('locale');
}

export class App extends React.Component {
  // React-Router passes location
  // as a prop because this is the top
  // level component. We want to pass it along
  // as context.
  static childContextTypes = {
    location: React.PropTypes.object,
    routeParams: React.PropTypes.object
  };

  getChildContext() {
    return { location: this.props.location, routeParams: this.props.params };
  }

  render() {
    const locale = getLocaleFromURL() || getNavigatorLocale();
    configureForLocale(locale);
    return <div style={{ height: '100%' }}>{this.props.children}</div>;
  }
}
