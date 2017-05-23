/* global window */
function storageAvailable(type) {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return storage;
  } catch (e) {
    return null;
  }
}

export default class LocalStorage {
  /**
   * @classdesc
   * Experimental localStorage class, alternative to cookie storage
   *
   * @class
   * @param {Object} opts - options
   * @param {String} type='sessionStorage' -
   *    'sessionStorage' persists between reloads
   *    'localStorage' persists after browser is closed
   */
  constructor({type = 'sessionStorage'} = {}) {
    this.storage = storageAvailable(type);
    if (!this.storage) {
      throw new Error(`${type} not available`);
    }
  }

  /**
   * Sets string value for a key
   * @param {String} key - key to update
   * @param {String} value - string to be stored under key
   */
  set(key, value) {
    this.storage.setItem(key, value);
  }

  /**
   * Gets string value for a key
   * @param {String} key - key to retrieve
   * @return {String} value stored under key, or undefined
   */
  get(key) {
    return this.storage.getItem(key);
  }

  /**
   * Removed a key and its associated value
   * @param {String} key - key to remove
   */
  remove(key) {
    this.storage.removeItem(key);
  }
}
