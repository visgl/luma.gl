// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUScalarDispatchGate} from '../../src/gpu-core/gpu-scalar-dispatch-gate';
import {GPUVectorScalarMADD} from '../../src/gpu-core/gpu-elementwise-scalar';
import {GPUDotProductScalar} from '../../src/gpu-core/gpu-dot-product-scalar';
import {GPUConjugateGradientExecutable} from '../../src/gpu-core/gpu-conjugate-gradient-executable';

describe('GPU solver integration', () => {
  it('exports scalar/vector/control integration primitives', () => {
    expect(GPUScalarDispatchGate).toBeDefined();
    expect(GPUVectorScalarMADD).toBeDefined();
    expect(GPUDotProductScalar).toBeDefined();
    expect(GPUConjugateGradientExecutable).toBeDefined();
  });
});
