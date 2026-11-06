// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {assert} from '@luma.gl/core';
import {CPUData, CPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import type {Projection} from '@math.gl/geospatial/projection/types';
import {
  tessellateGeoArrowPolygons,
  type GeoArrowColumn,
  type TessellateGeoArrowPolygonsOptions
} from '@math.gl/geospatial/geoarrow';
import {makeGeoArrowColumnFromCPUVector, makeCPUVectorFromGeoArrowColumn} from './cpu-geoarrow';

/** Project Float32 coordinates while retaining single-level row topology and null rows. */
export async function projectCPUVector(
  vector: CPUVector,
  projection: Pick<Projection, 'projectFlat'>
): Promise<CPUVector> {
  vector = makeCPUVectorFromGeoArrowColumn(makeGeoArrowColumnFromCPUVector(vector));
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
    if (variable) assert(chunk.valueOffsets);
    let row = 0;
    while (row < chunk.length) {
      if (chunk.nullBitmap && !(chunk.nullBitmap[row >> 3] & (1 << (row & 7)))) {
        row++;
        continue;
      }
      const firstRow = row++;
      while (
        row < chunk.length &&
        (!chunk.nullBitmap || chunk.nullBitmap[row >> 3] & (1 << (row & 7)))
      )
        row++;
      const start = variable ? chunk.valueOffsets![firstRow] : firstRow;
      const end = variable ? chunk.valueOffsets![row] : row;
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
  return tessellateGeoArrowColumnToCPUVectors(
    makeGeoArrowColumnFromCPUVector(vector, {encoding: 'geoarrow.polygon'})
  );
}

/** Full native GeoArrow polygon tessellation, including holes, multipolygons and mixed columns. */
export function tessellateGeoArrowColumnToCPUVectors(
  column: GeoArrowColumn,
  options: TessellateGeoArrowPolygonsOptions = {}
): {
  positions: CPUVector<'vertex-list<float32x4>'>;
  indices: CPUVector<'vertex-list<uint32>'>;
  rowIndices: CPUVector<'vertex-list<uint32>'>;
} {
  const positions: CPUData<'vertex-list<float32x4>'>[] = [];
  const indices: CPUData<'vertex-list<uint32>'>[] = [];
  const rowIndices: CPUData<'vertex-list<uint32>'>[] = [];
  let rowOffset = options.sourceRowOffset ?? 0;
  for (const rings of column.chunks) {
    const mesh = tessellateGeoArrowPolygons(
      {...column, chunks: [rings]},
      {...options, positionSize: 4, sourceRowOffset: rowOffset}
    );
    const vertexOffsets = new Int32Array(rings.length + 1);
    const indexOffsets = new Int32Array(rings.length + 1);
    for (const source of mesh.sourceRowIndices) vertexOffsets[source - rowOffset + 1]++;
    for (const index of mesh.indices) indexOffsets[mesh.sourceRowIndices[index] - rowOffset + 1]++;
    for (let row = 1; row <= rings.length; row++) {
      vertexOffsets[row] += vertexOffsets[row - 1];
      indexOffsets[row] += indexOffsets[row - 1];
    }
    let nullBitmap: Uint8Array | undefined;
    if (rings.validity) {
      nullBitmap = new Uint8Array(Math.ceil(rings.length / 8));
      for (let row = 0; row < rings.length; row++) {
        const bit = row + (rings.validity.bitOffset ?? 0);
        if (rings.validity.values[bit >> 3] & (1 << (bit & 7)))
          nullBitmap[row >> 3] |= 1 << (row & 7);
      }
    }
    const common = {length: rings.length, nullBitmap};
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
        buffer: mesh.sourceRowIndices,
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
