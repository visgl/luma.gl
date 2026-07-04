// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  makeShaderBlockLayout,
  vertexFormatDecoder,
  type BufferLayout,
  type VariableShaderType,
  type VertexFormat
} from '@luma.gl/core';
import type {GPUVectorFormat} from './gpu-vector-format';

/** Named fixed-width memory formats stored in one interleaved GPU data row. */
export type GPUDataStructFields = Readonly<Record<string, VertexFormat>>;

/** Supported physical packing rules for one GPU data struct row. */
export type GPUDataStructLayout = 'wgsl-storage' | 'packed';

/** Resolved physical metadata for one field in a GPU data struct row. */
export type GPUDataStructField<Format extends VertexFormat = VertexFormat> = Readonly<{
  /** Fixed-width memory format stored for this field. */
  format: Format;
  /** Byte offset of this field from the start of each row. */
  byteOffset: number;
  /** Number of bytes occupied by this field's physical format. */
  byteLength: number;
}>;

/** Physical format for named fixed-width fields interleaved in one GPU data row. */
export type GPUDataStructFormat<Fields extends GPUDataStructFields = GPUDataStructFields> =
  Readonly<{
    /** Discriminator separating struct formats from string GPU vector formats. */
    type: 'struct';
    /** Packing rules used to resolve field offsets. */
    layout: GPUDataStructLayout;
    /** Resolved fields in declaration order. */
    fields: Readonly<{[Name in keyof Fields]: GPUDataStructField<Fields[Name]>}>;
    /** Total number of scalar components represented by one row. */
    components: number;
    /** Bytes between adjacent struct rows. */
    byteStride: number;
    /** Bytes through the end of the final field payload, excluding trailing row padding. */
    rowByteLength: number;
  }>;

/** Canonical physical metadata accepted by GPUData. */
export type GPUDataFormat = GPUVectorFormat | GPUDataStructFormat;

/** Options for creating a physical GPU data struct format. */
export type MakeGPUDataStructFormatOptions = {
  /** Packing rules. Defaults to `wgsl-storage`. */
  layout?: GPUDataStructLayout;
};

/** Options for deriving a vertex buffer layout from a GPU data struct format. */
export type BufferLayoutFromGPUDataStructFormatOptions = {
  /** Whether rows advance per vertex or per instance. */
  stepMode?: 'vertex' | 'instance';
};

/** Returns true when a GPU data format describes named interleaved fields. */
export function isGPUDataStructFormat(
  format: GPUDataFormat | undefined
): format is GPUDataStructFormat {
  return Boolean(format && typeof format === 'object' && format.type === 'struct');
}

/**
 * Resolves named physical field formats into one immutable interleaved row format.
 *
 * `packed` applies WebGPU vertex-buffer alignment: each field offset is aligned to
 * `min(4, byteLength)` and the final byte stride is aligned to four bytes.
 * `wgsl-storage` uses WGSL storage-struct alignment for raw storage carrier types.
 */
export function makeGPUDataStructFormat<const Fields extends GPUDataStructFields>(
  fieldFormats: Fields,
  options: MakeGPUDataStructFormatOptions = {}
): GPUDataStructFormat<Fields> {
  const fieldEntries = Object.entries(fieldFormats) as [keyof Fields & string, VertexFormat][];
  if (fieldEntries.length === 0) {
    throw new Error('GPUData struct format must declare at least one field');
  }

  const layout = options.layout ?? 'wgsl-storage';
  return layout === 'packed'
    ? makePackedGPUDataStructFormat(fieldEntries)
    : makeStorageGPUDataStructFormat(fieldEntries);
}

/** Converts physical GPU data struct metadata into an interleaved vertex buffer layout. */
export function getBufferLayoutFromGPUDataStructFormat(
  name: string,
  format: GPUDataStructFormat,
  options: BufferLayoutFromGPUDataStructFormatOptions = {}
): BufferLayout {
  return {
    name,
    byteStride: format.byteStride,
    ...(options.stepMode ? {stepMode: options.stepMode} : {}),
    attributes: Object.entries(format.fields).map(([attribute, field]) => ({
      attribute,
      format: field.format,
      byteOffset: field.byteOffset
    }))
  };
}

function makePackedGPUDataStructFormat<Fields extends GPUDataStructFields>(
  fieldEntries: [keyof Fields & string, VertexFormat][]
): GPUDataStructFormat<Fields> {
  const fieldLayouts: [string, GPUDataStructField][] = [];
  let byteOffset = 0;
  let components = 0;

  for (const [fieldName, format] of fieldEntries) {
    const formatInfo = vertexFormatDecoder.getVertexFormatInfo(format);
    if (formatInfo.webglOnly) {
      throw new Error(
        `Packed GPUData struct field "${fieldName}" uses WebGL-only format ${format}`
      );
    }
    byteOffset = alignTo(byteOffset, Math.min(4, formatInfo.byteLength));
    fieldLayouts.push([
      fieldName,
      Object.freeze({
        format,
        byteOffset,
        byteLength: formatInfo.byteLength
      })
    ]);
    byteOffset += formatInfo.byteLength;
    components += formatInfo.components;
  }

  return Object.freeze({
    type: 'struct',
    layout: 'packed',
    fields: Object.freeze(Object.fromEntries(fieldLayouts)),
    components,
    byteStride: alignTo(byteOffset, 4),
    rowByteLength: byteOffset
  }) as GPUDataStructFormat<Fields>;
}

function makeStorageGPUDataStructFormat<Fields extends GPUDataStructFields>(
  fieldEntries: [keyof Fields & string, VertexFormat][]
): GPUDataStructFormat<Fields> {
  const storageTypes = Object.fromEntries(
    fieldEntries.map(([fieldName, format]) => [fieldName, getStorageType(format)])
  ) as Record<string, VariableShaderType>;

  const storageLayout = makeShaderBlockLayout(storageTypes, {layout: 'wgsl-storage'});
  const fieldLayouts: [string, GPUDataStructField][] = [];
  let rowByteLength = 0;
  let components = 0;

  for (const [fieldName, format] of fieldEntries) {
    const formatInfo = vertexFormatDecoder.getVertexFormatInfo(format);
    const byteOffset = storageLayout.fields[fieldName].offset * 4;
    fieldLayouts.push([
      fieldName,
      Object.freeze({
        format,
        byteOffset,
        byteLength: formatInfo.byteLength
      })
    ]);
    rowByteLength = Math.max(rowByteLength, byteOffset + formatInfo.byteLength);
    components += formatInfo.components;
  }

  return Object.freeze({
    type: 'struct',
    layout: 'wgsl-storage',
    fields: Object.freeze(Object.fromEntries(fieldLayouts)),
    components,
    byteStride: storageLayout.byteLength,
    rowByteLength
  }) as GPUDataStructFormat<Fields>;
}

function getStorageType(format: VertexFormat): VariableShaderType {
  const formatInfo = vertexFormatDecoder.getVertexFormatInfo(format);
  switch (formatInfo.type) {
    case 'float32':
      return getComponentStorageType('f32', formatInfo.components);
    case 'sint32':
      return getComponentStorageType('i32', formatInfo.components);
    case 'uint32':
      return getComponentStorageType('u32', formatInfo.components);
    default: {
      const wordCount = Math.ceil(formatInfo.byteLength / 4);
      return getComponentStorageType('u32', wordCount as 1 | 2);
    }
  }
}

function getComponentStorageType(
  primitiveType: 'f32' | 'i32' | 'u32',
  components: 1 | 2 | 3 | 4
): VariableShaderType {
  return components === 1 ? primitiveType : `vec${components}<${primitiveType}>`;
}

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}
