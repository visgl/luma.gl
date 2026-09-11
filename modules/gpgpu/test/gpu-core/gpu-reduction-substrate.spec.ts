// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {
  GPUFloat32HierarchicalReduction,
  getGPUHierarchicalReductionLevels
} from '../../src/gpu-core/gpu-reduction-substrate';
import {
  GPUDotProductHierarchical,
  GPUVectorNormSquaredHierarchical
} from '../../src/gpu-core/gpu-dot-norm-hierarchical';

describe('GPU hierarchical reduction substrate', () => {
  it('plans multi-level reductions', () => {
    expect(getGPUHierarchicalReductionLevels(1)).toEqual([1]);
    expect(getGPUHierarchicalReductionLevels(256)).toEqual([1]);
    expect(getGPUHierarchicalReductionLevels(257)).toEqual([2, 1]);
    expect(getGPUHierarchicalReductionLevels(65537)).toEqual([257, 2, 1]);
  });

  it('exports shared reduction consumers', () => {
    expect(GPUFloat32HierarchicalReduction).toBeDefined();
    expect(GPUDotProductHierarchical).toBeDefined();
    expect(GPUVectorNormSquaredHierarchical).toBeDefined();
  });
});
