// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {BufferLayout, VertexFormat} from '@luma.gl/core';
import {vertexFormatDecoder} from '@luma.gl/core';
import type {TypedArray} from '@math.gl/core';
import type {Geometry as MathGeometry} from '@math.gl/geometry';
export {unpackIndexedGeometry} from '@math.gl/geometry';
import {Geometry, getGeometryShaderAttributeName, type GeometryAttribute} from './geometry';

type TypedArrayConstructor = {
  new (length: number): TypedArray;
  new (buffer: ArrayBufferLike): TypedArray;
  readonly BYTES_PER_ELEMENT: number;
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
 * Packs a CPU {@link Geometry} into one interleaved vertex buffer.
 *
 * The returned value is a normal `Geometry` whose `attributes` contains one packed typed array,
 * and whose `bufferLayout` maps that packed buffer back to the original shader attributes.
 * Calling this function on an already interleaved geometry with the same `bufferName` is
 * idempotent and returns the original instance.
 */
export function makeInterleavedGeometry(
  geometry: MathGeometry & {bufferLayout?: BufferLayout[]},
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

function isInterleavedGeometry(
  geometry: MathGeometry & {bufferLayout?: BufferLayout[]},
  bufferName: string
): geometry is Geometry {
  if (geometry.bufferLayout?.length !== 1) {
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
  geometry: MathGeometry,
  attributeNames?: string[]
): Array<[string, GeometryAttribute | undefined]> {
  const attributes = new Map<string, [string, GeometryAttribute | undefined]>();
  const sourceNames = attributeNames || Object.keys(geometry.attributes);
  for (const name of sourceNames) {
    attributes.set(getGeometryShaderAttributeName(name), [name, geometry.attributes[name]]);
  }
  return Array.from(attributes.values());
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
