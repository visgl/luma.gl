// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {destroyWebGLTestDevices} from '@luma.gl/test-utils';
import {afterAll} from 'vitest';

// Aggregate suites intentionally share one WebGPU device because Dawn adapters are single-use.
// WebGL contexts can be recreated safely and are released before the next substantial suite.
afterAll(destroyWebGLTestDevices);
