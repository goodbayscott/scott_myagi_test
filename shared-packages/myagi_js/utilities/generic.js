import _ from 'lodash';
import { MOBILE_WIDTH, COMPUTER_WIDTH } from 'core/constants';

const DEFAULT_MAX_LENGTH = 100;
const ELLIPSIS = '...';
const NOT_VALID_SUBDOMAIN = ['www', 'myagi', 'staging', 'localhost'];
const GOOGLE_SLIDES_URL = 'https://docs.google.com/';
const GOOGLE_SLIDES_KEYWORD = ['/presentation/'];
const LIVESTREAM = 'livestream';

export const isGoogleSlides = function (url) {
  /*
    Checks if snippet type is a Google Slide
  */
  return (
    url &&
    Boolean(url.includes(GOOGLE_SLIDES_URL)) &&
    Boolean(GOOGLE_SLIDES_KEYWORD.find(i => url.includes(i)))
  );
};

export const isGoogleSlidesEmbeddable = function (url) {
  /*
    Checks if Google Slide is embeddable
  */
  return isGoogleSlides(url) && Boolean(url.includes('embed'));
};

export const isLivestream = function (url) {
  /*
    Checks if snippet type is a Livestream
  */
  return Boolean(url.includes(LIVESTREAM));
};

export const convertToProdMediaPath = function (src) {
  /*
    DEPRECATED - Do not use this anymore.
    Use MyagiImageField on the backend instead.
  */
  if (!src) return src;
  return src.replace('http://localhost:8000/media/', 'https://myagi-production.s3.amazonaws.com/');
};

export const getScrollBarWidth = function () {
  /*
    Determines width of scrollbars in the
    current browser.
  */
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.width = '100px';
  // Needed for WinJS apps
  outer.style.msOverflowStyle = 'scrollbar';

  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;

  // Force scrollbars
  outer.style.overflow = 'scroll';

  // Add innerdiv
  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;

  // Remove divs
  outer.parentNode.removeChild(outer);

  return widthNoScroll - widthWithScroll;
};

export const clamp = function (num, min, max) {
  return num < min ? min : num > max ? max : num;
};

export const getIdFromApiUrl = function (url) {
  const split = url.split('/');
  return split[split.length - 2];
};

export const humanFileSize = function (size) {
  // convert file size in bytes to human readable
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2) * 1} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
};

export const hasFields = function (objOrList, fields) {
  /*
    Returns true if given object or list of objects contains
    all `fields`. Useful when field expansion is used via API.

    NOTE - If array is passed in, then only the first object is checked.
  */
  const obj = _.isArray(objOrList) ? objOrList[0] : objOrList;
  if (obj !== undefined) {
    let missing = false;
    _.each(fields, field => {
      if (obj[field] === undefined) {
        missing = true;
      }
    });
    return !missing;
  }
  return false;
};

export const truncateText = function (txt, maxLength = DEFAULT_MAX_LENGTH) {
  if (txt && txt.length > maxLength) {
    txt = txt.substr(0, maxLength - 1) + ELLIPSIS;
  }
  return txt;
};

export const getSubdomain = function () {
  const parts = location.hostname.split('.');
  const sub = parts[0];
  if (_.includes(NOT_VALID_SUBDOMAIN, sub)) {
    return null;
  }
  return sub;
};

export const isMobileWidth = function () {
  return window.innerWidth <= MOBILE_WIDTH;
};

export const isComputerWidth = function () {
  return window.innerWidth >= COMPUTER_WIDTH;
};

export const isVisible = function (ele) {
  // Determines whether element is visible on the screen
  return (
    ele.clientWidth !== 0 &&
    ele.clientHeight !== 0 &&
    ele.style.opacity !== 0 &&
    ele.style.visibility !== 'hidden'
  );
};

export const guid = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export const arraysEqual = function (arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};
