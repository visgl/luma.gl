// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {destroyWebGLTestDevices} from '@luma.gl/test-utils';
import {afterAll} from 'vitest';

// Aggregate suites intentionally share one WebGPU device because Dawn adapters are single-use.
// WebGL contexts can be recreated safely and are explicitly lost before the next substantial
// suite so their browser-owned GPU allocations are released immediately instead of waiting for GC.
afterAll(destroyWebGLTestDevices);
