import {lumagl} from './is-browser';
/* eslint-disable no-console */
/* global console */
/* global window */

const log = {
  priority: 0,
  table(priority, table) {
    if (priority <= log.priority && table) {
      console.table(table);
    }
  },
  log(priority, ...args) {
    if (priority <= log.priority) {
      console.debug(...args);
    }
  },
  info(priority, ...args) {
    if (priority <= log.priority) {
      console.log(...args);
    }
  },
  warn(priority, ...args) {
    if (priority <= log.priority) {
      console.warn(...args);
    }
  }
};

// Make available in browser console
lumagl.log = log;

export default log;
