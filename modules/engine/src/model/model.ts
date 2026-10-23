// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUVectorModel, type GPUVectorModelProps} from './gpu-vector-model';

/** Properties for the high-level rendering model. */
export type ModelProps = Omit<GPUVectorModelProps, 'gpuVectorCount'>;

/**
 * High-level rendering API, built on the shared GPU vector rendering implementation.
 *
 * This first extraction preserves shader assembly, geometry, uniforms and binding APIs on
 * the base for existing GPUVectorModel callers. Input adaptation can be separated incrementally.
 */
export class Model extends GPUVectorModel {}
