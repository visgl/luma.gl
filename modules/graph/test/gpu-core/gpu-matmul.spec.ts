// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUMatMul} from '../../src/gpu-core/gpu-matmul';

describe('GPUMatMul', () => {
  it('exports a graph primitive', () => {
    expect(GPUMatMul).toBeDefined();
  });
});
