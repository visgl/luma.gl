// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {VertexFormat} from '@luma.gl/core';
import {vertexFormatDecoder} from '@luma.gl/core';
import type {TypedArray} from '@math.gl/core';
import {Geometry, getGeometryShaderAttributeName, type GeometryAttribute} from './geometry';

type TypedArrayConstructor = {
  new (length: number): TypedArray;
  new (buffer: ArrayBufferLike): TypedArray;
  readonly BYTES_PER_ELEMENT: number;
};

type GeometryLike = {
  indices?: GeometryAttribute;
  attributes: Record<string, GeometryAttribute | undefined>;
};

/** Options for {@link makeInterleavedGeometry}. */
export type MakeInterleavedGeometryOptions = {
  /** Name of the packed geometry buffer. Defaults to `geometry`. */
  bufferName?: string;

  /** Attribute names to pack. Defaults to all non-index geometry attributes. */
  attributes?: string[];

  /**
   * Minimum byte alignment for each packed attribute and for the final byte stride.
   *
   * Defaults to 4 bytes, matching WebGPU and WebGL vertex-buffer alignment constraints.
   */
  minAttributeAlignment?: number;
};

type InterleavedAttribute = {
  sourceName: string;
  attributeName: string;
  value: TypedArray;
  size: number;
  format: VertexFormat;
  byteOffset: number;
  byteLength: number;
};

/**
 * Expands indexed geometry attributes into non-indexed attributes.
 *
 * The returned object keeps the original attribute keys and replaces each non-constant attribute
 * with data expanded through the index buffer. The `indices` field is intentionally omitted from
 * the returned geometry-like object.
 */
export function unpackIndexedGeometry<T extends GeometryLike>(geometry: T): GeometryLike {
  const {indices, attributes} = geometry;
  if (!indices) {
    return geometry;
  }

  const vertexCount = indices.value.length;
  const unpackedAttributes: Record<string, GeometryAttribute> = {};

  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    if (!attribute) {
      continue; // eslint-disable-line
    }
    const {value, size} = attribute;
    const constant = attribute['constant'];
    if (constant || !size) {
      continue; // eslint-disable-line
    }
    const ArrayType = value.constructor as TypedArrayConstructor;
    const unpackedValue = new ArrayType(vertexCount * size);
    for (let x = 0; x < vertexCount; ++x) {
      const index = indices.value[x];
      for (let i = 0; i < size; i++) {
        unpackedValue[x * size + i] = value[index * size + i];
      }
    }
    unpackedAttributes[attributeName] = {size, value: unpackedValue};
  }

  return {
    attributes: Object.assign({}, attributes, unpackedAttributes)
  };
}

/**
 * Packs a CPU {@link Geometry} into one interleaved vertex buffer.
 *
 * The returned value is a normal `Geometry` whose `attributes` contains one packed typed array,
 * and whose `bufferLayout` maps that packed buffer back to the original shader attributes.
 * Calling this function on an already interleaved geometry with the same `bufferName` is
 * idempotent and returns the original instance.
 */
export function makeInterleavedGeometry(
  geometry: Geometry,
  options: MakeInterleavedGeometryOptions = {}
): Geometry {
  const bufferName = options.bufferName || 'geometry';
  if (isInterleavedGeometry(geometry, bufferName)) {
    return geometry;
  }

  const minAttributeAlignment = options.minAttributeAlignment || 4;
  const sourceAttributes = getInterleavedSourceAttributes(geometry, options.attributes);
  const interleavedAttributes: InterleavedAttribute[] = [];
  let byteOffset = 0;
  let attributeVertexCount = Infinity;

  for (const [sourceName, attribute] of sourceAttributes) {
    if (!attribute) {
      continue; // eslint-disable-line no-continue
    }
    if (attribute['constant']) {
      throw new Error(`Attribute ${sourceName} is constant`);
    }
    const {value, size, normalized} = attribute;
    if (!ArrayBuffer.isView(value)) {
      throw new Error(`Attribute ${sourceName} is missing typed array data`);
    }
    if (size === undefined) {
      throw new Error(`Attribute ${sourceName} is missing a size`);
    }

    const format = vertexFormatDecoder.getVertexFormatFromAttribute(value, size, normalized);
    const vertexFormatInfo = vertexFormatDecoder.getVertexFormatInfo(format);

    byteOffset = alignTo(byteOffset, minAttributeAlignment);
    interleavedAttributes.push({
      sourceName,
      attributeName: getGeometryShaderAttributeName(sourceName),
      value,
      size,
      format,
      byteOffset,
      byteLength: vertexFormatInfo.byteLength
    });
    byteOffset += vertexFormatInfo.byteLength;
    const sourceVertexCount = value.length / size;
    if (!Number.isInteger(sourceVertexCount)) {
      throw new Error(`Attribute ${sourceName} length is not divisible by size`);
    }
    attributeVertexCount = Math.min(attributeVertexCount, sourceVertexCount);
  }

  if (interleavedAttributes.length === 0 || !Number.isFinite(attributeVertexCount)) {
    throw new Error(`Geometry ${geometry.id} has no interleavable attributes`);
  }

  const byteStride = alignTo(byteOffset, minAttributeAlignment);
  const arrayBuffer = new ArrayBuffer(attributeVertexCount * byteStride);

  for (const attribute of interleavedAttributes) {
    writeInterleavedAttribute(arrayBuffer, attributeVertexCount, byteStride, attribute);
  }

  return new Geometry({
    id: geometry.id,
    topology: geometry.topology || 'triangle-list',
    vertexCount: geometry.vertexCount,
    indices: geometry.indices,
    attributes: {
      [bufferName]: {
        value: new Uint8Array(arrayBuffer),
        size: byteStride,
        byteStride
      }
    },
    bufferLayout: [
      {
        name: bufferName,
        stepMode: 'vertex',
        byteStride,
        attributes: interleavedAttributes.map(attribute => ({
          attribute: attribute.attributeName,
          format: attribute.format,
          byteOffset: attribute.byteOffset
        }))
      }
    ]
  });
}

function isInterleavedGeometry(geometry: Geometry, bufferName: string): boolean {
  if (geometry.bufferLayout.length !== 1) {
    return false;
  }

  const bufferLayout = geometry.bufferLayout[0];
  return (
    bufferLayout.name === bufferName &&
    Boolean(bufferLayout.attributes?.length) &&
    Boolean(geometry.attributes[bufferName])
  );
}

function getInterleavedSourceAttributes(
  geometry: Geometry,
  attributeNames?: string[]
): Array<[string, GeometryAttribute | undefined]> {
  if (attributeNames) {
    return attributeNames.map(attributeName => {
      const normalizedAttributeName = getGeometryShaderAttributeName(attributeName);
      return [normalizedAttributeName, geometry.attributes[normalizedAttributeName]];
    });
  }
  return Object.entries(geometry.attributes);
}

function writeInterleavedAttribute(
  arrayBuffer: ArrayBuffer,
  vertexCount: number,
  byteStride: number,
  attribute: InterleavedAttribute
): void {
  const ArrayType = attribute.value.constructor as TypedArrayConstructor;
  const bytesPerElement = ArrayType.BYTES_PER_ELEMENT;

  if (attribute.byteOffset % bytesPerElement !== 0 || byteStride % bytesPerElement !== 0) {
    throw new Error(`Attribute ${attribute.sourceName} is not aligned to its component type`);
  }

  const target = new ArrayType(arrayBuffer) as any;
  const source = attribute.value as any;
  const elementOffset = attribute.byteOffset / bytesPerElement;
  const elementStride = byteStride / bytesPerElement;

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const sourceIndex = vertexIndex * attribute.size;
    const targetIndex = vertexIndex * elementStride + elementOffset;
    for (let componentIndex = 0; componentIndex < attribute.size; componentIndex++) {
      target[targetIndex + componentIndex] = source[sourceIndex + componentIndex];
    }
  }
}

function alignTo(byteOffset: number, alignment: number): number {
  return Math.ceil(byteOffset / alignment) * alignment;
}

// export function calculateVertexNormals(positions: Float32Array): Uint8Array {
//   let normals = new Uint8Array(positions.length / 3);

//   for (let i = 0; i < positions.length; i++) {
//     const vec1 = new Vector3(positions.subarray(i * 3, i + 0, i + 3));
//     const vec2 = new Vector3(positions.subarray(i + 3, i + 6));
//     const vec3 = new Vector3(positions.subarray(i + 6, i + 9));

//     const normal = new Vector3(vec1).cross(vec2).normalize();
//     normals.set(normal[0], i + 4);
//     normals.set(normal[1], i + 4 + 1);
//     normals.set(normal[2], i + 2);
//   }
//   const normal = new Vector3(vec1).cross(vec2).normalize();
// }
