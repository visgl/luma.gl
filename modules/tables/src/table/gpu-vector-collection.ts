// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferLayout, type VertexFormat} from '@luma.gl/core';
import type {DynamicBuffer} from '@luma.gl/engine';
import {DataType, Field, Precision} from 'apache-arrow';
import {GPUVector} from './gpu-vector';

type GPUVectorMap = Record<string, GPUVector>;

/** Inputs shared by vector-backed Arrow GPU table-like objects. */
export type GPUVectorCollectionProps = {
  /** Error prefix for the owning public object. */
  ownerName: 'GPUTable' | 'GPURecordBatch';
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: GPUVectorMap | GPUVector[];
  /** Optional precomputed buffer layouts keyed by layout name. */
  bufferLayout?: BufferLayout[];
  /** Optional selected schema fields keyed by field name. */
  fields?: Field[];
  /** Explicit row count for collections that intentionally have no vectors. */
  numRows?: number;
};

/** Shared metadata synthesized from one named GPU vector collection. */
export type GPUVectorCollection = {
  /** Normalized vector map keyed by vector name. */
  gpuVectors: GPUVectorMap;
  /** Model-ready attribute buffers keyed by buffer layout name. */
  attributes: Record<string, Buffer | DynamicBuffer>;
  /** Buffer layouts preserving the normalized vector iteration order. */
  bufferLayout: BufferLayout[];
  /** Selected schema fields preserving the normalized vector iteration order. */
  fields: Field[];
  /** Common row count shared by every vector. */
  numRows: number;
};

/** Builds shared schema/layout/attribute metadata for vector-backed GPU objects. */
export function createGPUVectorCollection(props: GPUVectorCollectionProps): GPUVectorCollection {
  const gpuVectors = normalizeGPUVectorMap(props.vectors);
  const vectorEntries = Object.entries(gpuVectors);
  const firstVector = vectorEntries[0]?.[1];

  if (!firstVector && props.numRows === undefined) {
    throw new Error(`${props.ownerName} requires at least one GPU vector`);
  }

  const numRows = firstVector?.length ?? props.numRows ?? 0;
  const attributes: Record<string, Buffer | DynamicBuffer> = {};
  const bufferLayout: BufferLayout[] = [];
  const fields: Field[] = [];

  for (const [name, gpuVector] of vectorEntries) {
    if (gpuVector.length !== numRows) {
      throw new Error(
        `${props.ownerName} vector "${name}" length ${gpuVector.length} does not match ${numRows}`
      );
    }

    fields.push(
      props.fields?.find(field => field.name === name) ?? new Field(name, gpuVector.type, false)
    );

    const vectorBufferLayout = props.bufferLayout
      ? props.bufferLayout.find(layout => layout.name === name)
      : getGPUVectorBufferLayout(props.ownerName, name, gpuVector);
    if (vectorBufferLayout) {
      bufferLayout.push(vectorBufferLayout);
      addGPUVectorAttributes(attributes, vectorBufferLayout, gpuVector.buffer);
    }
  }

  return {
    gpuVectors,
    attributes,
    bufferLayout,
    fields: vectorEntries.length === 0 ? (props.fields ?? []) : fields,
    numRows
  };
}

function normalizeGPUVectorMap(vectors: GPUVectorMap | GPUVector[]): GPUVectorMap {
  return Array.isArray(vectors)
    ? Object.fromEntries(vectors.map(vector => [vector.name, vector]))
    : vectors;
}

function addGPUVectorAttributes(
  attributes: Record<string, Buffer | DynamicBuffer>,
  bufferLayout: BufferLayout,
  buffer: Buffer | DynamicBuffer
): void {
  attributes[bufferLayout.name] = buffer;
}

function getGPUVectorBufferLayout(
  ownerName: GPUVectorCollectionProps['ownerName'],
  name: string,
  vector: GPUVector
): BufferLayout {
  if (vector.bufferLayout) {
    return vector.bufferLayout;
  }

  const format = getGPUVectorVertexFormat(ownerName, vector);
  return vector.byteOffset > 0
    ? {
        name,
        byteStride: vector.byteStride,
        attributes: [{attribute: name, format, byteOffset: vector.byteOffset}]
      }
    : {
        name,
        byteStride: vector.byteStride,
        format
      };
}

function getGPUVectorVertexFormat(
  ownerName: GPUVectorCollectionProps['ownerName'],
  vector: GPUVector
): VertexFormat {
  const arrowType = vector.type;
  const numericType = DataType.isFixedSizeList(arrowType) ? arrowType.children[0].type : arrowType;
  const components = DataType.isFixedSizeList(arrowType) ? arrowType.listSize : 1;

  if (!DataType.isInt(numericType) && !DataType.isFloat(numericType)) {
    throw new Error(`${ownerName} cannot synthesize a layout for Arrow type ${arrowType}`);
  }

  let componentType: string;
  if (DataType.isInt(numericType)) {
    if (numericType.bitWidth === 64) {
      throw new Error(`${ownerName} does not support 64-bit integer GPU buffers`);
    }
    componentType = `${numericType.isSigned ? 'sint' : 'uint'}${numericType.bitWidth}`;
  } else {
    switch (numericType.precision) {
      case Precision.HALF:
        componentType = 'float16';
        break;
      case Precision.SINGLE:
        componentType = 'float32';
        break;
      default:
        throw new Error(`${ownerName} does not support float64 GPU buffers`);
    }
  }

  if (componentType === 'float16' && components === 3) {
    throw new Error(`${ownerName} cannot synthesize a float16x3 buffer layout`);
  }
  if (
    (componentType === 'uint8' ||
      componentType === 'sint8' ||
      componentType === 'uint16' ||
      componentType === 'sint16') &&
    components === 3
  ) {
    return `${componentType}x3-webgl` as VertexFormat;
  }
  return `${componentType}${components === 1 ? '' : `x${components}`}` as VertexFormat;
}
