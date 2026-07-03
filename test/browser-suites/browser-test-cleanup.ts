// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {destroyWebGLTestDevices} from '@luma.gl/test-utils';
import {afterAll} from 'vitest';

// Aggregate suites intentionally share one WebGPU device because Dawn adapters are single-use.
// WebGL devices and their auto-created canvases can be detached safely between substantial suites,
// allowing their browser-owned contexts to be collected without invalidating the WebGPU instance.
afterAll(async () => {
  await destroyWebGLTestDevices();
  (globalThis as typeof globalThis & {gc?: () => void}).gc?.();
});
