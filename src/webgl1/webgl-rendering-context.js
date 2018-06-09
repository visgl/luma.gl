// WEBGL BUILT-IN TYPES
// 1) Exports all WebGL constants as {GL}
// 2) Enables app to "import" WebGL types
//    - Importing these types makes them known to eslint etc.
//    - Provides dummy types for WebGL2 when not available to streamline
//      library code.
//    - Exports types from headless gl when running under Node.js

/* eslint-disable quotes, no-console */
/* global console */
export const ERR_HEADLESSGL_LOAD = `\
luma.gl: WebGL contexts can not be created in Node.js since headless gl is not installed. \
If this is desired, install headless gl using "npm install gl --save-dev" or "yarn add -D gl"`;

// Load headless gl dynamically, if available
export let headlessTypes = null;

if (module.require) {
  try {
    headlessTypes = module.require('gl/wrap');
  } catch (error) {
    console.info(ERR_HEADLESSGL_LOAD);
  }
}

class DummyType {}

/* global window, global */
const global_ = typeof global !== 'undefined' ? global : window;
const {WebGLRenderingContext = DummyType} = headlessTypes || global_;

export const webGLTypesAvailable = WebGLRenderingContext !== DummyType;
export {WebGLRenderingContext};
