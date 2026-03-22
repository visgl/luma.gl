/**
 * Provide a minimal browser-side `process` shim for test utilities that still
 * probe `process.browser` or `process.env` during module initialization.
 */
const browserProcess = globalThis.process || {};

browserProcess.browser = true;
browserProcess.env ||= {};
browserProcess.argv ||= [];
browserProcess.cwd ||= () => '/';

if (typeof globalThis.process === 'undefined') {
  Object.defineProperty(globalThis, 'process', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: browserProcess
  });
}
