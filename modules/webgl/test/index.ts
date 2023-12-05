// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

import './adapter/device-helpers/is-old-ie.spec';

import './adapter/helpers/parse-shader-compiler-log.spec';
import './adapter/helpers/get-shader-layout.spec';

// Device pixels
// import './context/device-pixels.spec';

// polyfills
import './context/polyfill/get-parameter-polyfill.spec';
import './context/polyfill/polyfill-context.spec';

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
import './adapter/webgl-canvas-context.spec';

import './adapter/objects/webgl-renderbuffer.spec';
// import './adapter/objects/webgl-vertex-array-object.spec';

// Resources, WebGL-specific APIs
import './adapter/resources/webgl-buffer.spec';
import './adapter/resources/webgl-vertex-array.spec';
import './adapter/resources/webgl-transform-feedback.spec';
