// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/core';
import type * as arrow from 'apache-arrow';

/** Primitive topology values supported by Mesh Arrow geometry input. */
export type ArrowMeshTopology = 'point-list' | 'triangle-list' | 'triangle-strip';

/** Accessor-style typed array descriptor used by Mesh Arrow table wrappers. */
export type ArrowMeshAttribute = {
  /** Attribute or index values. */
  value: TypedArray;
  /** Number of typed-array elements per logical attribute. */
  size: number;
  /** Optional byte offset into {@link value}. */
  byteOffset?: number;
  /** Optional byte stride between logical values in {@link value}. */
  byteStride?: number;
  /** Whether integer values should be interpreted through normalized vertex formats. */
  normalized?: boolean;
};

/**
 * Structural Mesh Arrow table accepted by luma.gl.
 *
 * This intentionally mirrors loaders.gl `MeshArrowTable` and should be kept
 * structurally consistent with
 * `/Users/ib/opensource/loaders.gl/modules/schema/src/categories/category-mesh.ts`.
 */
export type ArrowMeshTable = {
  /** loaders.gl-compatible table shape discriminator. */
  shape: 'arrow-table';
  /** Mesh primitive topology represented by the Arrow rows and optional indices. */
  topology: ArrowMeshTopology;
  /** Optional top-level primitive index accessor. The Arrow `indices` column takes precedence. */
  indices?: ArrowMeshAttribute;
  /** Raw Apache Arrow table containing vertex attribute columns and optional `indices` column. */
  data: arrow.Table;
};
