// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {
  GPUScalar,
  getGPUScalarWGSLLoad,
  getGPUScalarWGSLStore,
  getGPUValueArenaWGSLBinding
} from '../../src/gpu-core/gpu-scalar';

describe('GPUScalar', () => {
  it('exports the scalar abstraction and WGSL access helpers', () => {
    expect(GPUScalar).toBeDefined();
    expect(getGPUScalarWGSLLoad).toBeDefined();
    expect(getGPUScalarWGSLStore).toBeDefined();
    expect(getGPUValueArenaWGSLBinding(0, 3)).toContain('@binding(3)');
  });
});
