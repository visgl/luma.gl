// luma.gl, MIT license
// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

import './utils/is-old-ie.spec';

import './webgl-utils/parse-shader-compiler-log.spec';
import './webgl-utils/texture-utils.spec';

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

// helpers
import './classic/accessor.spec';

// webgl
import './classic/buffer.spec';
import './classic/vertex-array-object.spec';
import './classic/vertex-array.spec';
import './classic/uniforms.spec';

import './classic/texture.spec';
import './classic/texture-2d.spec';
import './classic/texture-3d.spec';

import './classic/renderbuffer.spec';
import './classic/framebuffer.spec';

import './classic/program.spec';
import './classic/program-configuration.spec';
import './classic/draw.spec';

import './classic/copy-and-blit.spec';

// Extensions / webgl2
import './classic/query.spec';

// webgl2
import './classic/uniform-buffer-layout.spec';
import './classic/transform-feedback.spec';

// features
import './classic/context/features.spec';
// import './_deprecated/features/limits.spec';

// Context API
import './classic/context/context-api.spec';
