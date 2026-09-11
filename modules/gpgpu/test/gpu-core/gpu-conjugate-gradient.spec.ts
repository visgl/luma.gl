// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUConjugateGradient} from '../../src/gpu-core/gpu-conjugate-gradient';

describe('GPUConjugateGradient', () => {
  it('exports a graph solver', () => {
    expect(GPUConjugateGradient).toBeDefined();
  });
});
