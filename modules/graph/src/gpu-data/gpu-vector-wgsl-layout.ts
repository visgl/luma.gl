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

/** Packed row metadata and the layout of the corresponding native WGSL storage value. */
export type GPUVectorWGSLLayout = {
  /** The packed GPUVector format. */
  format: GPUVectorWGSLFormat;
  /** Number of scalar components in a row. */
  components: 1 | 2 | 3 | 4;
  /** GPUVector format of an individual component. */
  componentType: GPUVectorWGSLScalarFormat;
  /** WGSL type of an individual component. */
  scalarType: 'f32' | 'i32' | 'u32';
  /** WGSL scalar or vector type for one row. */
  shaderType: 'f32' | 'i32' | 'u32' | `vec${2 | 3 | 4}<${'f32' | 'i32' | 'u32'}>`;
  /** Number of bytes occupied by the components of one row. */
  byteLength: number;
  /** Distance in bytes between rows in a tightly packed GPUVector. */
  packedByteStride: number;
  /** Required byte alignment of the value in a native WGSL storage buffer. */
  storageAlignment: number;
  /** Distance in bytes between elements in a native WGSL storage array of this value type. */
  nativeArrayByteStride: number;
};

/**
 * Describes packed GPUVector rows and the corresponding native WGSL storage array.
 *
 * @param format - Packed 32-bit scalar or vector format.
 * @returns Layout metadata in bytes. The helper does not allocate or modify storage.
 * @throws If the format has no supported 32-bit WGSL representation.
 *
 * @example
 * ```ts
 * const layout = getGPUVectorWGSLLayout('float32x3');
 * layout.packedByteStride; // 12
 * layout.nativeArrayByteStride; // 16
 * ```
 */
export function getGPUVectorWGSLLayout(format: GPUVectorWGSLFormat): GPUVectorWGSLLayout {
  const {components, signedDataType, primitiveType, byteLength, elementFormat, normalized} =
    getGPUVectorFormatInfo(format);
  if (
    normalized ||
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
