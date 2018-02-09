const bowser = require('bowser').browser;
const _ = require('lodash');

import queryString from 'querystring';

/*
  Have borrowed browser grading terminology from
  https://github.com/yui/yui3/wiki/Graded-Browser-Support.

  Browser grading determined using http://caniuse.com/#feat=flexbox.
*/

// Browsers we are not committing to supporting
const UNSUPPORTED_BROWSERS = [
  bowser.msie && bowser.version <= 9,
  bowser.opera && parseFloat(bowser.version) <= 12
];

// Browsers we are commiting to providing core support
// for
const C_GRADE_BROWSERS = [
  bowser.firefox && parseFloat(bowser.version) <= 27,
  bowser.chrome && parseFloat(bowser.version) <= 20,
  bowser.safari && parseFloat(bowser.version) <= 6,
  bowser.android && parseFloat(bowser.version) <= 4.3,
  bowser.ios && parseFloat(bowser.version) <= 6.1
];

export const isUnsupportedBrowser = () => _.any(UNSUPPORTED_BROWSERS, Boolean);

export const isCGradeBrowser = () => _.any(C_GRADE_BROWSERS, Boolean);

export const isIPhone = () => /iPhone/.test(navigator.userAgent) && !window.MSStream;

export const isAndroid = () => navigator.userAgent.indexOf('Android') > -1;

export function setURLParam(param, value) {
  // parse the query string into an object
  const q = queryString.parse(window.location.search.replace('?', ''));
  // set the property
  q[param] = value;
  const newUrl = `${window.location.href.split('?')[0]}?${queryString.stringify(q)}`;
  if (!window.history) {
    console.warn('Window history is not supported by this browser.');
    return;
  }
  // This will update the current URL without causing a refresh of the page
  window.history.pushState('', '', newUrl);
}
