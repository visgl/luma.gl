// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {VertexFormat} from '@luma.gl/core';
import type {GPUVectorType, VertexList} from './gpu-vector-format';

/**
 * Named GPU table columns mapped to their canonical memory formats.
 *
 * The value type is a memory-layout string such as `float32x3`,
 * `unorm8x4`, or `vertex-list<float32x3>`. Shader value declarations live in
 * `ShaderLayout`; compatibility is checked at adapter boundaries.
 */
export type GPUTypeMap = Record<string, GPUVectorType>;

/**
 * One GPU table schema field.
 *
 * `GPUField` is intentionally plain data rather than an Arrow `Field` class.
 * Adapter modules can store source-schema metadata in `metadata`, but table core
 * only uses `name` and `format`.
 */
export type GPUField<Name extends string = string, Format extends GPUVectorType = GPUVectorType> = {
  /** Field/column name. */
  name: Name;
  /** Canonical GPU memory-layout descriptor for this field. */
  format?: Extract<Format, VertexFormat | VertexList<VertexFormat>>;
  /** Whether this logical field may contain null values in the source adapter. */
  nullable?: boolean;
  /** Adapter-owned field metadata. */
  metadata?: Map<string, string>;
};

/**
 * Plain schema metadata for GPU tables and record batches.
 *
 * `GPUSchema` describes selected GPU-facing columns, not necessarily every
 * column in a source table. It is a structural type so Arrow, generated
 * geometry, and application-specific adapters can construct schemas without
 * subclassing.
 */
export type GPUSchema<T extends GPUTypeMap = GPUTypeMap> = {
  /** Selected GPU fields in table order. */
  fields: Array<GPUField<keyof T & string>>;
  /** Adapter-owned schema metadata. */
  metadata: Map<string, string>;
};
