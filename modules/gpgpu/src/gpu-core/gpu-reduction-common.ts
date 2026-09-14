// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Common reduction infrastructure lives in `gpu-reduction-substrate`.
 *
 * This compatibility module gives existing reduction implementations a narrow import surface while
 * the substrate is integrated incrementally. It deliberately re-exports planning and strategy only;
 * operation-specific min/max/extent/validity semantics remain in `GPUReduction`.
 */
export {
  GPU_REDUCTION_WORKGROUP_SIZE,
  getGPUHierarchicalReductionStrategy,
  getGPUHierarchicalReductionLevels,
  getGPUReductionNextLength,
  type GPUHierarchicalReductionStrategy
} from './gpu-reduction-substrate';
