import ReactDOM from 'react-dom';
import React from 'react';
import { StyleRoot } from 'radium';
import { browserHistory, Router } from 'react-router';
import { FixNamedRoutesSupport } from 'react-router-named-routes';

import { detectCompat } from 'core/detect-compat';
import { setupRaven } from 'core/setup-raven';
import { setupPluralize } from 'core/setup-pluralize';
import { setupFacebook } from 'core/setup-facebook';
import { routes } from './core/routes';

// Include required CSS files
require('css/vendor/date-range-picker.css');
require('css/vendor/react-datetime.css');
require('css/vendor/react-joyride.css');
require('css/vendor/range-slider.css');
require('css/vendor/graph-loader.css');
require('css/vendor/wistia-uploader.css');
require('css/style.css');

// node_modules
require('leaflet/dist/leaflet.css');
require('react-select/dist/react-select.css');
require('semantic-ui/dist/semantic.css');

require('img/flags.png');
require('img/icons.eot');
require('img/icons.svg');
require('img/icons.ttf');
require('img/icons.woff');
require('img/icons.woff2');

// Safari doesn't know how to deal with Intl, so load polyfills
if (!window.Intl) {
  require('intl');
  require('intl/locale-data/jsonp/en.js');
  require('intl/locale-data/jsonp/nl.js');
  require('intl/locale-data/jsonp/fr.js');
  require('intl/locale-data/jsonp/de.js');
}

// Detect browser compat and display alert
// if necessary
detectCompat();

// React-Router v1 removed support for named routes.
// This function re-enables support for them.
FixNamedRoutesSupport(routes);

setupRaven();
setupPluralize();
setupFacebook();

// Check if container exists because this javascript
// file is also loaded on the public site (which does
// not use react). We load it there as well for caching
// purposes.
const el = document.getElementById('react-container');
if (el) {
  ReactDOM.render(
    <StyleRoot>
      <Router history={browserHistory} routes={routes} />
    </StyleRoot>,
    el
  );
}
