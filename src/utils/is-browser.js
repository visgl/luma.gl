// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process */

import isElectron from './is-electron';

const isNode =
  typeof process === 'object' &&
  String(process) === '[object process]' &&
  !process.browser;

const isBrowser = !isNode || isElectron;

export default isBrowser;
