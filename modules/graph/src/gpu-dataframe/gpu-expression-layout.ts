// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import {getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import {
  isGPUExpressionRowFormat,
  getGPUExpressionRowInfo
} from '../gpu-core/gpu-expression-operation';

/** Exact numeric value/storage formats accepted by dataframe expressions. */
export type GPUExpressionScalarFormat = 'float32' | 'sint32' | 'uint32';
export type GPUExpressionNumericFormat =
  | GPUExpressionScalarFormat
  | `${GPUExpressionScalarFormat}x${2 | 3 | 4}`;

/** Logical WGSL values and physical packed storage have deliberately separate layouts. */
export function getGPUExpressionLayout(format: GPUExpressionNumericFormat) {
  if (!isGPUExpressionRowFormat(format)) throw new Error('Unsupported numeric expression format');
  const {components, componentType} = getGPUExpressionRowInfo(format);
  const scalarType = {float32: 'f32', sint32: 'i32', uint32: 'u32'}[componentType];
  const byteLength = getGPUVectorFormatInfo(format).byteLength;
  const alignment = components === 1 ? 4 : components === 2 ? 8 : 16;
  return {
    format,
    components,
    componentType,
    scalarType,
    shaderType: components === 1 ? scalarType : `vec${components}<${scalarType}>`,
    byteLength,
    packedByteStride: byteLength,
    storageAlignment: alignment,
    nativeArrayByteStride: Math.ceil(byteLength / alignment) * alignment
  };
}
