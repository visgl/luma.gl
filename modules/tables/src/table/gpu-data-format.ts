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

/**
 * Named fixed-width memory formats stored in one interleaved GPU data row.
 * Object insertion order defines field declaration order.
 */
export type GPUDataStructFields = Readonly<Record<string, VertexFormat>>;

/**
 * Supported physical packing rules for one GPU data struct row.
 * `wgsl-storage` follows WGSL storage alignment; `packed` follows WebGPU vertex alignment.
 */
export type GPUDataStructLayout = 'wgsl-storage' | 'packed';

/**
 * Computed physical metadata for one field in a GPU data struct row.
 *
 * @typeParam Format - Fixed-width format stored for the field.
 */
export type GPUDataStructField<Format extends VertexFormat = VertexFormat> = Readonly<{
  /** Fixed-width memory format stored for this field. */
  format: Format;
  /** Byte offset of this field from the start of each row. */
  byteOffset: number;
  /** Number of bytes occupied by this field's physical format. */
  byteLength: number;
}>;

/**
 * Canonical physical metadata for named fixed-width fields interleaved in one GPU data row.
 * The constructor derives this immutable object from an inline field declaration.
 *
 * @typeParam Fields - Field names and fixed-width formats in declaration order.
 * @typeParam Layout - Physical alignment rules applied to the fields.
 */
export type GPUDataStructFormat<
  Fields extends GPUDataStructFields = GPUDataStructFields,
  Layout extends GPUDataStructLayout = GPUDataStructLayout
> = Readonly<{
  /** Discriminator separating struct formats from string GPU vector formats. */
  type: 'struct';
  /** Packing rules used to resolve field offsets. */
  layout: Layout;
  /** Computed fields in declaration order. */
  fields: Readonly<{[Name in keyof Fields]: GPUDataStructField<Fields[Name]>}>;
  /** Total number of scalar components represented by one row. */
  components: number;
  /** Bytes between adjacent struct rows. */
  byteStride: number;
  /** Bytes through the end of the final field payload, excluding trailing row padding. */
  rowByteLength: number;
}>;

/** Canonical physical metadata retained by a `GPUData` instance. */
export type GPUDataFormat = GPUVectorFormat | GPUDataStructFormat;

/**
 * Scalar/list format string or inline struct fields accepted by the `GPUData` constructor.
 *
 * @internal
 */
export type GPUDataFormatDeclaration = GPUVectorFormat | GPUDataStructFields;

/** Options for lowering a GPU data struct format into a vertex buffer layout. */
export type BufferLayoutFromGPUDataStructFormatOptions = {
  /** Whether rows advance per vertex or per instance. */
  stepMode?: 'vertex' | 'instance';
};

/**
 * Tests whether canonical GPU data metadata describes named interleaved fields.
 *
 * @param format - Canonical GPU data metadata to inspect.
 * @returns `true` when `format` is a `GPUDataStructFormat`.
 */
export function isGPUDataStructFormat(
  format: GPUDataFormat | undefined
): format is GPUDataStructFormat {
  return Boolean(format && typeof format === 'object' && format.type === 'struct');
}

/**
 * Normalizes named physical field formats into one immutable interleaved row format.
 *
 * @param fieldFormats - Named fixed-width formats in declaration order.
 * @param layout - Physical alignment rules to apply.
 * @returns Canonical field offsets and row metadata.
 *
 * @internal
 */
export function normalizeGPUDataStructFormat<
  const Fields extends GPUDataStructFields,
  const Layout extends GPUDataStructLayout
>(fieldFormats: Fields, layout: Layout): GPUDataStructFormat<Fields, Layout> {
  const fieldEntries = Object.entries(fieldFormats) as [keyof Fields & string, VertexFormat][];
  if (fieldEntries.length === 0) {
    throw new Error('GPUData struct format must declare at least one field');
  }

  return (
    layout === 'packed'
      ? makePackedGPUDataStructFormat(fieldEntries)
      : makeStorageGPUDataStructFormat(fieldEntries)
  ) as GPUDataStructFormat<Fields, Layout>;
}

/**
 * Converts physical GPU data struct metadata into an interleaved vertex buffer layout.
 *
 * @param name - Logical buffer binding name.
 * @param format - Canonical struct metadata to lower.
 * @param options - Optional vertex step mode.
 * @returns A buffer layout that preserves field order, offsets, formats, and row stride.
 */
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

/** Computes the minimum padding permitted by WebGPU vertex buffer layout rules. */
function makePackedGPUDataStructFormat<Fields extends GPUDataStructFields>(
  fieldEntries: [keyof Fields & string, VertexFormat][]
): GPUDataStructFormat<Fields, 'packed'> {
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
    // WebGPU vertex attributes align to their byte width, capped at four bytes.
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
  }) as GPUDataStructFormat<Fields, 'packed'>;
}

/** Computes WGSL storage offsets using shader types that can carry each physical format. */
function makeStorageGPUDataStructFormat<Fields extends GPUDataStructFields>(
  fieldEntries: [keyof Fields & string, VertexFormat][]
): GPUDataStructFormat<Fields, 'wgsl-storage'> {
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
  }) as GPUDataStructFormat<Fields, 'wgsl-storage'>;
}

/** Returns the WGSL scalar or vector carrier used to lay out one physical field. */
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
      // Compact and normalized formats are stored in one or more raw u32 words.
      const wordCount = Math.ceil(formatInfo.byteLength / 4);
      return getComponentStorageType('u32', wordCount as 1 | 2);
    }
  }
}

/** Builds a scalar or vector shader type for a primitive carrier and component count. */
function getComponentStorageType(
  primitiveType: 'f32' | 'i32' | 'u32',
  components: 1 | 2 | 3 | 4
): VariableShaderType {
  return components === 1 ? primitiveType : `vec${components}<${primitiveType}>`;
}

/** Rounds a byte offset up to the requested positive alignment. */
function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}
