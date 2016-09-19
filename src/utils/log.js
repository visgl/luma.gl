import {luma} from './globals';
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

export function formatValue(v, opts = {}) {
  const {maxElts = 16, size = 1, isInteger = false} = opts;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    let string = '[';
    for (let i = 0; i < v.length && i < maxElts; ++i) {
      if (i > 0) {
        string += ',' + ((i + 1) % size === 0) ? ' ' : '';
      }
      string += formatValue(v[i], opts);
    }
    const terminator = v.length > maxElts ? '...' : ']';
    return `${string}${terminator}`;
  } else if (Number.isFinite(v)) {
    return isInteger ? v.toFixed(0) : v.toPrecision(2);
  }
  return String(v);
}

// Make available in browser console
luma.log = log;

export default log;
