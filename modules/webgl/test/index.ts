// luma.gl, MIT license
// Copyright (c) vis.gl contributors

// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

import './adapter/helpers/parse-shader-compiler-log.spec';
import './adapter/helpers/get-shader-layout.spec';
import './adapter/helpers/webgl-topology-utils.spec';

// Device pixels
// import './context/device-pixels.spec';

// state-tracker
import './context/state-tracker/deep-array-equal.spec';
import './context/state-tracker/set-parameters.spec';
import './context/state-tracker/track-context-state.spec';
import './context/state-tracker/context-state.spec';

// ADAPTER

import './adapter/webgl-device.spec';
import './adapter/webgl-canvas-context.spec';

import './adapter/objects/webgl-renderbuffer.spec';
// import './adapter/objects/webgl-vertex-array-object.spec';

// Resources, WebGL-specific APIs
import './adapter/resources/webgl-buffer.spec';
import './adapter/resources/webgl-vertex-array.spec';
import './adapter/resources/webgl-transform-feedback.spec';
