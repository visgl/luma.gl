/**
 * Common environment setup
 */
/* eslint-disable no-console */
/* global process */
import console from 'global/console';
import window from 'global/window';

// Extract version from package.json
import {version} from '../package.json';
export const VERSION = version;

// Check for process object (and browserify's browser flag)
const isNode =
  typeof process !== undefined &&
  process.toString() === '[object process]' &&
  !process.browser;

export const isBrowser = !isNode;

function noop() {}

// Configure console

// Console.debug is useful in chrome as it gives blue styling, but is not
// available in node
console.debug = console.debug || console.log;

// Groups, timeStamps, table are not available in node
console.group = console.group || console.log;
console.groupCollapsed = console.groupCollapsed || console.log;
console.groupEnd = console.groupEnd || noop;

console.timeStamp = console.timeStamp || noop;

console.table = console.table || noop;

// Some instrumentation may override console methods, so preserve them here
console.native = {
  debug: console.debug.bind(console),
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

export {console as logger};

// Set up high resolution timer
let timestamp;
let timestamp0;
if (!isBrowser) {
  timestamp = () => {
    const [seconds, nanoseconds] = process.hrtime();
    return seconds + nanoseconds / 1e6;
  };
  timestamp0 = timestamp();
} else if (window.performance) {
  timestamp = () => window.performance.now();
  timestamp0 = 0;
} else {
  timestamp = () => Date.now();
  timestamp0 = timestamp();
}

const refUnixEpoch = Date.now();

// A rough conversion of unix epoch millis to timestamps
export function timestampFromUnixEpoch(date) {
  return (date - refUnixEpoch) + timestamp0;
}

export {timestamp, timestamp0};
