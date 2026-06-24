// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferLayout, VertexFormat} from '@luma.gl/core';
import type {GPUField, GPUTypeMap} from './gpu-schema';
import {GPUVector} from './gpu-vector';
import {
  getGPUVectorElementFormat,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from './gpu-vector-format';
import {isGPUTableIndexColumnName} from './gpu-schema';

type GPUVectorMap<T extends GPUTypeMap = GPUTypeMap> = {
  [Name in keyof T & string]: GPUVector<T[Name]>;
};

/** Options for normalizing named GPU vectors into table columns. */
export type GPUVectorCollectionProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** Name of the owning structure, used in errors. */
  ownerName: 'GPUTable';
  /** GPU vectors keyed by name, or a list of already-named GPU vectors. */
  vectors: GPUVectorMap<T> | Record<string, GPUVector> | GPUVector[];
  /** Optional precomputed buffer layouts. */
  bufferLayout?: BufferLayout[];
  /** Optional selected schema fields. Defaults to fields synthesized from vector names and formats. */
  fields?: GPUField[];
  /** Explicit row count for intentionally vector-less collections. */
  numRows?: number;
};

/** Normalized GPU vector collection metadata used by GPUTable vector construction. */
export type GPUVectorCollection<T extends GPUTypeMap = GPUTypeMap> = {
  /** GPU vectors keyed by shader/table column name. */
  gpuVectors: GPUVectorMap<T> | Record<string, GPUVector>;
  /** Buffer layouts for fixed vectors. */
  bufferLayout: BufferLayout[];
  /** Schema fields for selected vectors. */
  fields: GPUField[];
  /** Logical row count. */
  numRows: number;
};

/** Normalizes GPU vectors and derives fixed-vector schema/layout metadata. */
export function createGPUVectorCollection<T extends GPUTypeMap = GPUTypeMap>(
  props: GPUVectorCollectionProps<T>
): GPUVectorCollection<T> {
  const gpuVectors = normalizeGPUVectors(props.vectors);
  const numRows = getGPUVectorCollectionRowCount(gpuVectors, props.numRows);
  const bufferLayout = getGPUVectorCollectionBufferLayout(props, gpuVectors);
  const fields = getGPUVectorCollectionFields(props, gpuVectors);

  return {
    gpuVectors: gpuVectors as GPUVectorMap<T>,
    bufferLayout,
    fields,
    numRows
  };
}

function normalizeGPUVectors(
  vectors: Record<string, GPUVector> | GPUVector[]
): Record<string, GPUVector> {
  if (!Array.isArray(vectors)) {
    return vectors;
  }

  return Object.fromEntries(vectors.map(vector => [vector.name, vector]));
}

function getGPUVectorCollectionRowCount(
  gpuVectors: Record<string, GPUVector>,
  explicitNumRows?: number
): number {
  const firstVector = Object.values(gpuVectors)[0];
  if (!firstVector) {
    return explicitNumRows ?? 0;
  }

  const numRows = explicitNumRows ?? firstVector.length;
  const mismatchedVector = Object.values(gpuVectors).find(vector => vector.length !== numRows);
  if (mismatchedVector) {
    throw new Error('GPUVectorCollection requires matching vector row counts');
  }
  return numRows;
}

function getGPUVectorCollectionBufferLayout<T extends GPUTypeMap>(
  props: GPUVectorCollectionProps<T>,
  gpuVectors: Record<string, GPUVector>
): BufferLayout[] {
  if (props.bufferLayout) {
    for (const layout of props.bufferLayout) {
      if (isGPUTableIndexColumnName(layout.name)) {
        throw new Error(
          `${props.ownerName} buffer layout cannot include reserved index column "${layout.name}"`
        );
      }
      if (!gpuVectors[layout.name]) {
        throw new Error(
          `${props.ownerName} buffer layout references missing vector "${layout.name}"`
        );
      }
    }
    return props.bufferLayout;
  }

  return Object.values(gpuVectors).flatMap(vector =>
    isGPUTableIndexColumnName(vector.name) ? [] : synthesizeGPUVectorBufferLayout(props, vector)
  );
}

function synthesizeGPUVectorBufferLayout<T extends GPUTypeMap>(
  props: GPUVectorCollectionProps<T>,
  vector: GPUVector
): BufferLayout[] {
  if (vector.bufferLayout) {
    return [vector.bufferLayout];
  }
  if (!vector.format) {
    throw new Error(
      `${props.ownerName} cannot synthesize a buffer layout for vector "${vector.name}" without a format`
    );
  }
  if (isVertexListGPUVectorFormat(vector.format)) {
    throw new Error(
      `${props.ownerName} cannot synthesize a generic buffer layout for vertex-list vector "${vector.name}"`
    );
  }
  if (isValueListGPUVectorFormat(vector.format)) {
    throw new Error(
      `${props.ownerName} cannot synthesize a generic buffer layout for value-list vector "${vector.name}"`
    );
  }
  return [
    {
      name: vector.name,
      byteStride: vector.byteStride,
      format: getGPUVectorElementFormat(vector.format) as VertexFormat
    }
  ];
}

function getGPUVectorCollectionFields<T extends GPUTypeMap>(
  props: GPUVectorCollectionProps<T>,
  gpuVectors: Record<string, GPUVector>
): GPUField[] {
  if (props.fields) {
    for (const field of props.fields) {
      if (!gpuVectors[field.name]) {
        throw new Error(`${props.ownerName} schema references missing vector "${field.name}"`);
      }
    }
    return props.fields;
  }

  return Object.values(gpuVectors).map(vector => {
    if (!vector.format) {
      if (vector.bufferLayout) {
        return {
          name: vector.name,
          nullable: false,
          metadata: new Map()
        };
      }
      throw new Error(
        `${props.ownerName} cannot synthesize a schema field for vector "${vector.name}" without a format`
      );
    }
    return {
      name: vector.name,
      format: vector.format,
      nullable: false,
      metadata: new Map()
    };
  });
}
