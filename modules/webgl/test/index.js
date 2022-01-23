// luma.gl, MIT license
// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

import './utils/is-old-ie.spec';

import './webgl-utils/parse-shader-compiler-log.spec';

import './helpers/get-program-bindings.spec';

// Device pixels
// import './context/device-pixels.spec';

// polyfills
// import './context/polyfill/get-parameter-polyfill.spec';
// import './context/polyfill/polyfill-context.spec';

// state-tracker
import './context/state-tracker/deep-array-equal.spec';
import './context/state-tracker/set-parameters.spec';
import './context/state-tracker/track-context-state.spec';
import './context/state-tracker/context-state.spec';

// ADAPTER

// WebGLDevice, features & limits
import './adapter/device-helpers/device-info.spec';
import './adapter/device-helpers/device-features.spec';
import './adapter/device-helpers/device-limits.spec';
import './adapter/device-helpers/set-device-parameters.spec';

import './adapter/webgl-device.spec';

// Resources - TODO these tests only depend on Device and could move to API...
import './adapter/resources/webgl-sampler.spec';
import './adapter/resources/webgl-texture.spec';
import './adapter/resources/webgl-framebuffer.spec';
