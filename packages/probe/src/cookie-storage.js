/* global document */

export default class CookieStorage {
  /**
   * @classdesc
   * Cookie Storage class allows storing and retriving values for keys(cookies)
   * (a key effectively identifies a cookie).
   *
   * @class
   */
  constructor() {
    /* eslint-disable */
    this.document = typeof document !== 'undefined' ?
      document.cookie :
      {cookie: ''};
  }

  /**
   * Gets string value for a key
   * @param {String} key - key to retrieve
   * @return {String} value stored under key, or undefined
   */
  get(key) {
    const keyValues = this.document.cookie.split(/;\s*/);
    for (const keyValue of keyValues) {
      const [key1, value1] = keyValue.split('=');
      if (key === decodeURIComponent(key1)) {
        return decodeURIComponent(value1);
      }
    }
    return undefined;
  }

  /**
   * Sets string value for a key
   * @param {String} key - key to update
   * @param {String} value - string to be stored under key
   */
  set(key, value, {expires, path, domain, secure} = {}) {
    let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    if (expires) {
      cookie += `; expires=${expires}`;
    }
    if (path) {
      cookie += `; path=${encodeURIComponent(path)}`;
    }
    if (domain) {
      cookie += `; domain=${encodeURIComponent(domain)}`;
    }
    if (secure) {
      cookie += '; secure';
    }
    this.document.cookie = cookie;
  }
}
