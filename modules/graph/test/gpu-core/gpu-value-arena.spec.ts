// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUValueArena, getGPUValueArena} from '../../src/gpu-core/gpu-value-arena';

describe('GPUValueArena', () => {
  it('exports the graph-owned packed value arena API', () => {
    expect(GPUValueArena).toBeDefined();
    expect(getGPUValueArena).toBeDefined();
  });
});
