// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

const noop = () => {};
test.onFinish(window.browserTestDriver_finish || noop);
test.onFailure(window.browserTestDriver_fail || noop);

// hack: prevent example imports from starting their own animation loop
globalThis.website = true;

// Register WebGL and WebGPU
import '@luma.gl/test-utils';
// Run tests
import './modules';
