/**
 * Utilities for dev-mode error handling
 */
/* eslint-disable no-console, no-debugger */
/* global window */
import {logger as console} from './env';

/**
 * Ensure that your debugger stops when code issues warnings so that
 * you can see what is going on in othercomponents when they decide
 * to issue warnings.
 *
 * @param {Array} consoleBlacklist - array of strings to match against
 */
export function breakOnConsoleWarnings(consoleBlacklist = [/.*/]) {
  function breakOnConsole(log, msg, param1, ...params) {
    if (typeof msg === 'string' &&
      msg.indexOf('Unhandled promise rejection') === 0) {
      log(msg, param1, ...params);
      throw new Error(param1);
    } else if (consoleBlacklist.some(pattern => pattern.test(msg))) {
      log(msg, param1, ...params);
    } else {
      log(msg, param1, ...params);
    }
  }
  console.warn = breakOnConsole.bind(null, console.native.warn);
  console.error = breakOnConsole.bind(null, console.native.error);

  window.onerror = (message, url, line, column, error) => {
    if (error) {
      console.native.error(`${error} ${url}:${line}:${column || 0}`);
    } else {
      console.native.error(`${message} ${url}:${line}:${column || 0}`);
    }
    debugger;
  };
}

/**
 * Throw exceptions when code issues warnings so that
 * you can access them in your normal exception handling setup, perhaps
 * displaying them in the UI or logging them in a different way.
 *
 * @param {Array} consoleBlacklist - array of strings to match against
 */
export function throwOnConsoleWarnings(consoleBlacklist = [/.*/]) {
  console.warn = function throwOnWarning(msg) {
    if (consoleBlacklist.some(patt => patt.test(msg))) {
      throw new Error(`Unacceptable warning: ${msg}`);
    }
    console.native.warn(...arguments);
  };
}

// Chrome has yet to implement onRejectedPromise, so trigger onerror instead
export function interceptRejectedPromises() {
  console.error = (msg, error, ...params) => {
    if (typeof msg === 'string' &&
      msg.indexOf('Unhandled promise rejection') === 0) {
      error.unhandledPromise = true;
      // Use different message to avoid triggering again
      console.native.error('Rejected promise', error, ...params);
      throw error;
    }
    console.native.error(...arguments);
  };
}
