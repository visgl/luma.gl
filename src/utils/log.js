import {luma} from './is-browser';
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

export function formatValue(v, maxElts = 16) {
  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    let string = '[';
    for (let i = 0; i < v.length && i < maxElts; ++i) {
      if (i > 0) {
        string += ', '
      }
      string += formatValue(v[i]);
    }
    return string + ']';
  } else if (Number.isFinite(v)) {
    return v.toPrecision(2);
  }
  return String(v);
}

// Make available in browser console
luma.log = log;

export default log;
