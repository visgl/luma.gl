// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getLeafLayoutInfo, makeShaderBlockLayout} from '@luma.gl/shaders/types';
import {getGPUVectorFormatInfo} from './gpu-vector-format';

/** Scalar formats with matching 32-bit WGSL component representations. */
export type GPUVectorWGSLScalarFormat = 'float32' | 'sint32' | 'uint32';

/** Packed 32-bit numeric formats with a corresponding WGSL value type. */
export type GPUVectorWGSLFormat =
  | GPUVectorWGSLScalarFormat
  | `${GPUVectorWGSLScalarFormat}x${2 | 3 | 4}`;

/** Describes packed GPUVector rows and the corresponding native WGSL storage array. */
export function getGPUVectorWGSLLayout(format: GPUVectorWGSLFormat) {
  const {components, signedDataType, primitiveType, byteLength, elementFormat} =
    getGPUVectorFormatInfo(format);
  if (
    elementFormat !== format ||
    (signedDataType !== 'float32' && signedDataType !== 'sint32' && signedDataType !== 'uint32') ||
    primitiveType === 'f16'
  ) {
    throw new Error('Expected a packed 32-bit numeric vector format');
  }
  const scalarType = primitiveType;
  const shaderType = components === 1 ? scalarType : (`vec${components}<${scalarType}>` as const);
  const layout = 'wgsl-storage';
  const {alignment} = getLeafLayoutInfo(shaderType, layout);
  const arrayLayout = makeShaderBlockLayout({values: [shaderType, 2]}, {layout});
  return {
    format,
    components,
    componentType: signedDataType,
    scalarType,
    shaderType,
    byteLength,
    packedByteStride: byteLength,
    storageAlignment: alignment * Uint32Array.BYTES_PER_ELEMENT,
    nativeArrayByteStride: arrayLayout.byteLength / 2
  };
}
