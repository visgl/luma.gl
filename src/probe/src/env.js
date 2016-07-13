/**
 * Common environment setup
 */
/* eslint-disable no-console */
/* global process */
import console from 'global/console';
import window from 'global/window';

// Duck-type Node context
export const IS_NODE = typeof process !== undefined &&
  process.toString() === '[object process]';

// Configure console

// Console.debug is useful in chrome as it gives blue styling, but is not
// available in node
console.debug = console.debug || console.log;

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
if (IS_NODE) {
  timestamp = () => {
    const [seconds, nanoseconds] = process.hrtime();
    return seconds + nanoseconds / 1e6;
  };
} else if (window.performance) {
  timestamp = () => window.performance.now();
} else {
  timestamp = () => Date.now();
}

export {timestamp as timestamp};
