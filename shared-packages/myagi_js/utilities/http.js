const trim = require('lodash/string/trim');

function getCookie(name) {
  let cookieValue = null;
  // For react native
  if (typeof document === 'undefined') {
    // TODO - Implement
    return '';
  }
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    // Reverse cookies so that newest cookie value gets used.
    // IE does not overwrite cookies if a new value is received, and it will
    // be at the end of the cookie string.
    cookies.reverse();
    for (let i = 0; i < cookies.length; i++) {
      const cookie = trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == `${name}=`) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export const getOrigin = () => {
  const port = window.location.port ? `:${window.location.port}` : '';
  const hostname = window.location.hostname.replace('www.', '');
  return `${window.location.protocol}//${hostname}${port}`;
};

function getMetaCsrfToken() {
  // For react native
  if (typeof document === 'undefined') {
    // TODO - Implement
    return '';
  }
  const metas = document.head.getElementsByTagName('meta');
  const csrfTokenMeta = metas['csrf-token'];
  if (csrfTokenMeta) {
    return csrfTokenMeta.content;
  }
}

export const getCSRFToken = () => {
  // Defaulting to cookie CSRF token.
  // Belief is that this will be more likely
  // to be up to date, as the cookie is sent
  // with every request
  let csrfToken = getCookie('csrftoken');
  if (!csrfToken) {
    csrfToken = getMetaCsrfToken();
  }
  return csrfToken;
};

export const qs = key => {
  // Get URL query param
  key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, '\\$&'); // escape RegEx meta chars
  const match = location.search.match(new RegExp(`[?&]${key}=([^&]+)(&|$)`));
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};

export const setDefaultHttpSourceHeaders = marty => {
  marty.HttpStateSource.addHook({
    id: 'DefaultHeaders',
    priority: 1,
    before(req) {
      req.headers['X-CSRFToken'] = getCSRFToken();
      req.headers.Accept = 'application/json'; // Ensures Firefox doesn't get the HTML rendered version of DRF endpoints
    }
  });
};
