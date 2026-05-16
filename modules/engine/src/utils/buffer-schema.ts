// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferLayout, VertexFormat} from '@luma.gl/core';

/**
 * One named view into a logical GPU buffer record.
 *
 * `recordOffset` advances whole records. `elementOffset` advances scalar
 * values within one record. The current helper lowers fields into vertex
 * `BufferLayout` attributes, while keeping the declaration itself record-oriented.
 */
export type BufferField = {
  /** Data format exposed through the generated buffer layout field. */
  format: VertexFormat;
  /** Whole-record offset relative to the current record. */
  recordOffset?: number;
  /** Scalar element offset inside the logical buffer record. */
  elementOffset?: number;
};

/** Named fields that describe one shared logical GPU buffer record. */
export type BufferSchema = Record<string, BufferField>;

/** Options for lowering one logical buffer schema into a vertex buffer layout. */
export type AttributeLayoutFromBufferSchemaOptions = {
  /** Name used to bind the shared logical buffer. */
  name: string;
  /** Byte stride between consecutive logical records. */
  byteStride: number;
  /** Byte size of one scalar element used by `elementOffset`. */
  bytesPerElement: number;
  /** Record schema shared by the logical buffer and future storage-friendly lowering paths. */
  schema: BufferSchema;
  /** Step mode shared by all generated vertex attribute views. */
  stepMode?: 'vertex' | 'instance';
};

/**
 * Lowers a record-oriented buffer schema into the canonical vertex `BufferLayout` shape.
 *
 * Each emitted attribute shares the same logical buffer and stride. Offsets follow:
 * `byteOffset = recordOffset * byteStride + elementOffset * bytesPerElement`.
 */
export function getAttributeLayoutFromBufferSchema(
  options: AttributeLayoutFromBufferSchemaOptions
): BufferLayout {
  const {name, byteStride, bytesPerElement, schema, stepMode} = options;
  assertNonNegativeInteger(byteStride, 'byteStride');
  assertPositiveInteger(bytesPerElement, 'bytesPerElement');

  const fieldEntries = Object.entries(schema);
  if (fieldEntries.length === 0) {
    throw new Error('schema must declare at least one buffer field');
  }

  return {
    name,
    byteStride,
    ...(stepMode ? {stepMode} : {}),
    attributes: fieldEntries.map(([attribute, field]) =>
      getResolvedBufferFieldLayout(attribute, field, byteStride, bytesPerElement)
    )
  };
}

function getResolvedBufferFieldLayout(
  attribute: string,
  field: BufferField,
  byteStride: number,
  bytesPerElement: number
): NonNullable<BufferLayout['attributes']>[number] {
  if (!field?.format) {
    throw new Error(`schema.${attribute} must declare a format`);
  }

  const recordOffset = field.recordOffset ?? 0;
  const elementOffset = field.elementOffset ?? 0;
  assertNonNegativeInteger(recordOffset, `schema.${attribute}.recordOffset`);
  assertNonNegativeInteger(elementOffset, `schema.${attribute}.elementOffset`);

  return {
    attribute,
    format: field.format,
    byteOffset: recordOffset * byteStride + elementOffset * bytesPerElement
  };
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}
