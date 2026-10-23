// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUScalarCompute} from '../../src/gpu-core/gpu-scalar-operation';

describe('GPUScalarCompute', () => {
  it('exports scalar arithmetic and comparison operation', () => {
    expect(GPUScalarCompute).toBeDefined();
  });
});
