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

// WebGLDevice, features & limits
import './adapter/device-helpers/device-info.spec';
import './adapter/device-helpers/device-features.spec';
import './adapter/device-helpers/device-limits.spec';
import './adapter/device-helpers/set-device-parameters.spec';

import './adapter/webgl-device.spec';

// Resources - TODO these tests only depend on Device and could move to API...
import './adapter/resources/webgl-sampler.spec';
// import './adapter/resources/webgl-texture.spec';

// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

// helpers
import './classes/accessor.spec';

// webgl
import './classes/buffer.spec';
import './classes/vertex-array-object.spec';
import './classes/vertex-array.spec';
import './classes/uniforms.spec';

import './classes/texture.spec';
import './classes/texture-2d.spec';
import './classes/texture-3d.spec';

import './classes/renderbuffer.spec';
import './classes/framebuffer.spec';

import './classes/program.spec';
import './classes/program-configuration.spec';
import './classes/draw.spec';

import './classes/copy-and-blit.spec';

// Extensions / webgl2
import './classes/query.spec';

// webgl2
import './classes/uniform-buffer-layout.spec';
import './classes/transform-feedback.spec';

// features
import './_deprecated/features/features.spec';
// import './_deprecated/features/limits.spec';

// Context API
import './_deprecated/context-api.spec';
