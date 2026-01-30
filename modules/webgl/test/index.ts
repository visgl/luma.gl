// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// utils
import './utils/fill-array.spec';

// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

import './adapter/helpers/parse-shader-compiler-log.spec';
import './adapter/helpers/get-shader-layout.spec';
import './adapter/helpers/webgl-topology-utils.spec';
import './context/create-browser-context.spec';

// Device pixels
// import './context/device-pixels.spec';

// state-tracker
import './context/state-tracker/deep-array-equal.spec';
import './context/state-tracker/set-parameters.spec';
import './context/state-tracker/webgl-state-tracker.spec';
import './context/state-tracker/context-state.spec';

// ADAPTER

import './adapter/webgl-device.spec';
import './adapter/webgl-canvas-context.spec';

// Resources, WebGL-specific APIs
import './adapter/resources/webgl-vertex-array.spec';
import './adapter/resources/webgl-transform-feedback.spec';
import './adapter/resources/webgl-render-pass.spec';
import './adapter/resources/webgl-render-pipeline.spec';
