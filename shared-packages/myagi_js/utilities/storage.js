/**
 * Simple localStorage with Cookie Fallback
 * v.1.0.0
 *
 * https://gist.github.com/Fluidbyte/4718380
 *
 * USAGE:
 * ----------------------------------------
 * Set New / Modify:
 *   store('my_key', 'some_value');
 *
 * Retrieve:
 *   store('my_key');
 *
 * Delete / Remove:
 *   store('my_key', null);
 */

const store = function store(key, value) {
  let lsSupport = false;

  // Check for native support
  if (window.localStorage) {
    lsSupport = true;
  }

  // If value is detected, set new or modify store
  if (typeof value !== 'undefined' && value !== null) {
    // Convert object values to JSON
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    // Set the store
    if (lsSupport) {
      // Native support
      localStorage.setItem(key, value);
    } else {
      // Use Cookie
      createCookie(key, value, 30);
    }
  }

  // No value supplied, return value
  if (typeof value === 'undefined') {
    let data;
    // Get value
    if (lsSupport) {
      // Native support
      data = localStorage.getItem(key);
    } else {
      // Use cookie
      data = readCookie(key);
    }

    // Try to parse JSON...
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = data;
    }

    return data;
  }

  // Null specified, remove store
  if (value === null) {
    if (lsSupport) {
      // Native support
      localStorage.removeItem(key);
    } else {
      // Use cookie
      createCookie(key, '', -1);
    }
  }

  /**
   * Creates new cookie or removes cookie with negative expiration
   * @param  key       The key or identifier for the store
   * @param  value     Contents of the store
   * @param  exp       Expiration - creation defaults to 30 days
   */

  function createCookie(key, value, exp) {
    const date = new Date();
    date.setTime(date.getTime() + exp * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toGMTString()}`;
    document.cookie = `${key}=${value}${expires}; path=/`;
  }

  /**
   * Returns contents of cookie
   * @param  key       The key or identifier for the store
   */

  function readCookie(key) {
    const nameEQ = `${key}=`;
    const ca = document.cookie.split(';');
    for (let i = 0, max = ca.length; i < max; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
};

export const local = {
  get(k) {
    return store(k);
  },
  set(k, v) {
    return store(k, v);
  },
  remove(k) {
    return store(k, null);
  }
};

/**
 * Checks if sessionStorage is accessible.
 * sessionStorage is not accessible when private browsing in Safari
 */

export const checkStorageSupport = function sessionStorageSupport() {
  let testKey = 'test',
    storage = window.sessionStorage;
  try {
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};
