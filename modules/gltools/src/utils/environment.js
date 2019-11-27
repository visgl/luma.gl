// based on https://github.com/cheton/is-electron
// https://github.com/electron/electron/issues/2288
/* global window, process, navigator */

// Renderer process
export const isElectron =
  (typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process.type === 'renderer') ||
  // Main process
  (typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    Boolean(process.versions.electron)) ||
  // Detect the user agent when the `nodeIntegration` option is set to true
  (typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0);

export const isNode =
  typeof process === 'object' && String(process) === '[object process]' && !process.browser;

export const isBrowser = !isNode || isElectron;

// document does not exist on worker thread
export const isBrowserMainThread = isBrowser && typeof document !== 'undefined';
