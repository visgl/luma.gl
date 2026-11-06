// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {assert} from '@luma.gl/core';
import {CPUData, CPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import type {
  GeoArrowColumn,
  GeoArrowDimension,
  GeoArrowArray,
  GeoArrowFixedSizeList
} from '@math.gl/geospatial/geoarrow';

/** Borrow CPU coordinate chunks as native GeoArrow points or single-level coordinate lists. */
export function makeGeoArrowColumnFromCPUVector(
  vector: CPUVector,
  options: {
    encoding?:
      | 'geoarrow.point'
      | 'geoarrow.linestring'
      | 'geoarrow.multipoint'
      | 'geoarrow.polygon';
    dimension?: GeoArrowDimension;
  } = {}
): GeoArrowColumn {
  const info = getGPUVectorFormatInfo(vector.format);
  assert(info.signedDataType === 'float32' && info.components >= 2 && !info.fixedSizeList);
  const variable = info.vertexList || info.valueList;
  const encoding = options.encoding ?? (variable ? 'geoarrow.linestring' : 'geoarrow.point');
  assert(variable === (encoding !== 'geoarrow.point'));
  const dimension =
    options.dimension ?? (info.components === 2 ? 'xy' : info.components === 3 ? 'xyz' : 'xyzm');
  assert((dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3) === info.components);
  const chunks = vector.data.map(chunk => {
    // GeoArrow primitive scalar stride cannot express padding between coordinate tuples.
    const packed = chunk.byteStride === info.byteLength && chunk.byteOffset % 4 === 0;
    const count = variable ? chunk.valueLength : chunk.length;
    let values: Float32Array;
    if (packed) values = new Float32Array(chunk.buffer, chunk.byteOffset, count * info.components);
    else {
      values = new Float32Array(count * info.components);
      const bytes = new Uint8Array(values.buffer);
      for (let index = 0; index < count; index++)
        bytes.set(
          new Uint8Array(
            chunk.buffer,
            chunk.byteOffset + index * chunk.byteStride,
            info.byteLength
          ),
          index * info.byteLength
        );
    }
    const coordinates: GeoArrowFixedSizeList = {
      kind: 'fixed-size-list',
      length: count,
      size: info.components,
      child: {
        kind: 'primitive',
        length: count * info.components,
        values
      }
    };
    const validity = chunk.nullBitmap ? {values: chunk.nullBitmap} : undefined;
    if (!variable) return {...coordinates, validity};
    assert(chunk.valueOffsets);
    const rings: GeoArrowArray = {
      kind: 'list',
      length: chunk.length,
      offsets: chunk.valueOffsets,
      child: coordinates,
      validity
    };
    return encoding === 'geoarrow.polygon'
      ? {
          kind: 'list' as const,
          length: chunk.length,
          offsets: Int32Array.from({length: chunk.length + 1}, (_, index) => index),
          child: rings,
          validity
        }
      : rings;
  });
  return {encoding, dimension, coordinateLayout: 'interleaved', chunks};
}

/** Borrow packed Float32 GeoArrow points/lines/multipoints as CPU chunks. Nested polygons stay GeoArrow. */
export function makeCPUVectorFromGeoArrowColumn(column: GeoArrowColumn): CPUVector {
  assert(
    column.coordinateLayout === 'interleaved' &&
      ['geoarrow.point', 'geoarrow.linestring', 'geoarrow.multipoint'].includes(column.encoding)
  );
  const components = column.dimension === 'xy' ? 2 : column.dimension === 'xyzm' ? 4 : 3;
  const variable = column.encoding !== 'geoarrow.point';
  const element = `float32x${components}` as 'float32x2' | 'float32x3' | 'float32x4';
  const format = variable ? (`vertex-list<${element}>` as const) : element;
  const data = column.chunks.map(chunk => {
    assert(!chunk.validity?.bitOffset);
    const coordinates = variable && chunk.kind === 'list' ? chunk.child : chunk;
    assert(
      coordinates.kind === 'fixed-size-list' &&
        coordinates.size === components &&
        !coordinates.offset &&
        (!variable || !coordinates.validity)
    );
    const primitive = coordinates.child;
    assert(
      primitive.kind === 'primitive' &&
        primitive.values instanceof Float32Array &&
        !primitive.validity &&
        (!primitive.stride || primitive.stride === 1)
    );
    const offset = primitive.offset ?? 0;
    const values = primitive.values.subarray(offset, offset + coordinates.length * components);
    let valueOffsets: Int32Array | undefined;
    if (variable) {
      assert(
        chunk.kind === 'list' &&
          chunk.offsets instanceof Int32Array &&
          !chunk.offset &&
          !chunk.offsetBase
      );
      valueOffsets = chunk.offsets;
    }
    return new CPUData({
      buffer: values,
      format,
      length: chunk.length,
      valueLength: variable ? coordinates.length : undefined,
      valueOffsets,
      nullBitmap: chunk.validity?.values
    });
  });
  return new CPUVector({format, data});
}
