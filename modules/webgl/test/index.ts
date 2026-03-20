// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// utils
import './utils/fill-array.spec';

// Note that we do two test runs on luma.gl, with and without headless-gl
// This file imports tests that should run *with* headless-gl included

import './adapter/webgl-adapter.browser.spec';
import './adapter/helpers/parse-shader-compiler-log.spec';
import './adapter/helpers/get-shader-layout.browser.spec';
import './adapter/helpers/webgl-texture-table.spec';
import './adapter/helpers/webgl-topology-utils.spec';
import './context/create-browser-context.browser.spec';

// Device pixels
// import './context/device-pixels.spec';

// state-tracker
import './context/state-tracker/deep-array-equal.spec';
import './context/state-tracker/set-parameters.browser.spec';
import './context/state-tracker/webgl-state-tracker.browser.spec';
import './context/state-tracker/context-state.browser.spec';

// ADAPTER

import './adapter/webgl-device.browser.spec';
import './adapter/webgl-canvas-context.browser.spec';

// Resources, WebGL-specific APIs
import './adapter/resources/webgl-vertex-array.browser.spec';
import './adapter/resources/webgl-transform-feedback.browser.spec';
import './adapter/resources/webgl-render-pass.browser.spec';
import './adapter/resources/webgl-render-pipeline.browser.spec';
