// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {CPUData, CPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import type {Projection} from '@math.gl/geospatial/projection/types';
import {BufferType, Data, Field, List, Vector} from 'apache-arrow';
import {makeArrowVectorFromCPUVector} from './arrow-cpu-vector-adapters';
import {tessellateArrowPolygons} from '../geoarrow/arrow-polygon-tessellation';
import type {ArrowPolygonInputType} from '../geoarrow/arrow-polygon-tessellation';

/** Project Float32 coordinates while retaining single-level row topology and null rows. */
export async function projectCPUVector(
  vector: CPUVector,
  projection: Pick<Projection, 'projectFlat'>
): Promise<CPUVector> {
  const info = getGPUVectorFormatInfo(vector.format);
  assert(
    info.signedDataType === 'float32' &&
      (info.components === 2 || info.components === 3) &&
      !info.fixedSizeList
  );
  const data: CPUData[] = [];
  for (const chunk of vector.data) {
    const variable = info.vertexList || info.valueList;
    const count = variable ? chunk.valueLength : chunk.length;
    const values = new Float32Array(count * info.components);
    const bytes = new Uint8Array(values.buffer);
    for (let index = 0; index < count; index++)
      bytes.set(
        new Uint8Array(chunk.buffer, chunk.byteOffset + index * chunk.byteStride, info.byteLength),
        index * info.byteLength
      );
    for (let row = 0; row < chunk.length; row++) {
      if (chunk.nullBitmap && !(chunk.nullBitmap[row >> 3] & (1 << (row & 7)))) continue;
      if (variable) assert(chunk.valueOffsets);
      const start = variable ? chunk.valueOffsets![row] : row;
      const end = variable ? chunk.valueOffsets![row + 1] : row + 1;
      if (end > start)
        values.set(
          await projection.projectFlat(
            values.slice(start * info.components, end * info.components),
            info.components
          ),
          start * info.components
        );
    }
    data.push(
      new CPUData({
        buffer: values,
        format: vector.format,
        length: chunk.length,
        valueLength: chunk.valueLength,
        valueOffsets: chunk.valueOffsets?.slice(),
        nullBitmap: chunk.nullBitmap?.slice()
      })
    );
  }
  return new CPUVector({name: vector.name, format: vector.format, data});
}

/** Tessellate one simple polygon ring per list row, preserving source chunks and row identities. */
export function tessellateCPUVectorPolygons(vector: CPUVector): {
  positions: CPUVector<'vertex-list<float32x4>'>;
  indices: CPUVector<'vertex-list<uint32>'>;
  rowIndices: CPUVector<'vertex-list<uint32>'>;
} {
  assert(vector.format === 'vertex-list<float32x2>' || vector.format === 'vertex-list<float32x3>');
  const positions: CPUData<'vertex-list<float32x4>'>[] = [];
  const indices: CPUData<'vertex-list<uint32>'>[] = [];
  const rowIndices: CPUData<'vertex-list<uint32>'>[] = [];
  let rowOffset = 0;
  for (const rings of makeArrowVectorFromCPUVector(vector).data) {
    const type = new List(new Field('rings', rings.type, false));
    const offsets = Int32Array.from({length: rings.length + 1}, (_, index) => index);
    const polygons = new Vector([
      new Data(
        type,
        0,
        rings.length,
        rings.nullCount,
        {[BufferType.OFFSET]: offsets, [BufferType.VALIDITY]: rings.nullBitmap},
        [rings]
      )
    ]) as Vector<ArrowPolygonInputType>;
    const mesh = tessellateArrowPolygons({polygons}, {rowIndexOffset: rowOffset});
    const vertexOffsets = new Int32Array(rings.length + 1);
    const indexOffsets = new Int32Array(rings.length + 1);
    for (const source of mesh.rowIndices) vertexOffsets[source - rowOffset + 1]++;
    for (const index of mesh.indices) indexOffsets[mesh.rowIndices[index] - rowOffset + 1]++;
    for (let row = 1; row <= rings.length; row++) {
      vertexOffsets[row] += vertexOffsets[row - 1];
      indexOffsets[row] += indexOffsets[row - 1];
    }
    const common = {
      length: rings.length,
      nullBitmap: rings.nullCount ? rings.nullBitmap : undefined
    };
    positions.push(
      new CPUData({
        ...common,
        format: 'vertex-list<float32x4>',
        buffer: mesh.positions,
        valueLength: mesh.vertexCount,
        valueOffsets: vertexOffsets
      })
    );
    indices.push(
      new CPUData({
        ...common,
        format: 'vertex-list<uint32>',
        buffer: Uint32Array.from(mesh.indices),
        valueLength: mesh.indices.length,
        valueOffsets: indexOffsets
      })
    );
    rowIndices.push(
      new CPUData({
        ...common,
        format: 'vertex-list<uint32>',
        buffer: mesh.rowIndices,
        valueLength: mesh.vertexCount,
        valueOffsets: vertexOffsets
      })
    );
    rowOffset += rings.length;
  }
  return {
    positions: new CPUVector({format: 'vertex-list<float32x4>', data: positions}),
    indices: new CPUVector({format: 'vertex-list<uint32>', data: indices}),
    rowIndices: new CPUVector({format: 'vertex-list<uint32>', data: rowIndices})
  };
}
