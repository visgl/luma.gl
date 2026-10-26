// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Compatibility exports: there is one implementation, owned by gpgpu.
export {
  GPUVectorModel,
  getGPUVectorModelBatches,
  type GPUVectorModelCount,
  type GPUVectorModelProps
} from '../execution/model/gpu-vector-model';

import type {
  GPUVectorModelBatch as EngineGPUVectorModelBatch,
  GPUVectorModelDrawBatchesOptions as EngineGPUVectorModelDrawBatchesOptions
} from '../execution/model/gpu-vector-model';
import type {GPUData} from './gpu-data';
import type {GPUVector} from './gpu-vector';

/** Preserves the full GPUData chunk type for the existing gpgpu entry point. */
export type GPUVectorModelBatch = EngineGPUVectorModelBatch<GPUData>;
export type GPUVectorModelDrawBatchesOptions = EngineGPUVectorModelDrawBatchesOptions<
  Record<string, GPUVector | undefined>
>;
