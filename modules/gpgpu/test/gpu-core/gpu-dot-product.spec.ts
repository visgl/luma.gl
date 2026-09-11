// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUDotProduct, GPUVectorNorm} from '../../src/gpu-core/gpu-dot-product';

describe('GPU vector reductions', () => {
  it('exports dot product and L2 norm primitives', () => {
    expect(GPUDotProduct).toBeDefined();
    expect(GPUVectorNorm).toBeDefined();
  });
});
