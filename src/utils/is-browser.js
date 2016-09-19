// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process, window, global */
export const isNode =
  typeof process === 'object' &&
  String(process) === '[object process]' &&
  !process.browser;
export const isBrowser = !isNode;
