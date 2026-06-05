// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPURecordBatch, GPUTable, GPUVector, type GPUTypeMap} from '@luma.gl/tables';
import {
  tesselateAsync,
  tessellateArrowPolygons,
  type ArrowPolygonSourceVectors,
  type ArrowPolygonTessellationOptions,
  type ArrowPolygonTessellationResult
} from '@math.gl/geoarrow';
import {Field, FixedSizeList, Float32, List, Uint8, Uint32} from 'apache-arrow';
import {makeArrowRecordBatchSourceInfo} from './arrow-picking';

export {
  tesselateAsync,
  tessellateArrowPolygons,
  type ArrowGeoArrowGeometryType,
  type ArrowMultiPolygonType,
  type ArrowMultiPolygonVertexColorType,
  type ArrowPolygonColorType,
  type ArrowPolygonCoordinateType,
  type ArrowPolygonInputCoordinateType,
  type ArrowPolygonInputType,
  type ArrowPolygonRowColorType,
  type ArrowSeparatedPolygonCoordinateType,
  type ArrowPolygonSourceVectors,
  type ArrowPolygonTessellationOptions,
  type ArrowPolygonTessellationResult,
  type ArrowPolygonType,
  type ArrowPolygonVertexColorType,
  type ArrowTessellatedPolygonType,
  type ArrowTessellatedPolygonVertexColorType
} from '@math.gl/geoarrow';

export type PrepareArrowPolygonGPUVectorsOptions = ArrowPolygonTessellationOptions & {
  /** Stable resource id prefix. Defaults to `arrow-polygon-model`. */
  id?: string;
  /** Zero-based source batch index. Defaults to `0`. */
  sourceBatchIndex?: number;
};

export type PreparedArrowPolygonGPUVectors = {
  /** GPU table with positions, colors, rowIndices, and reserved indices columns. */
  table: GPUTable;
  /** Output positions vector, padded to vec4 Float32 rows. */
  positions: GPUVector;
  /** Output per-vertex RGBA8 colors. */
  colors: GPUVector;
  /** Output source row indices. */
  rowIndices: GPUVector;
  /** CPU tessellation metadata and generated arrays. */
  tessellation: ArrowPolygonTessellationResult;
  /** Releases owned GPU resources. */
  destroy: () => void;
};

const OUTPUT_POSITION_COMPONENTS = 4;

/** Prepares tessellated Arrow polygon output as table-backed GPU attributes plus indices. */
export function prepareArrowPolygonGPUVectors(
  device: Device,
  sourceVectors: ArrowPolygonSourceVectors,
  options: PrepareArrowPolygonGPUVectorsOptions = {}
): PreparedArrowPolygonGPUVectors {
  const id = options.id ?? 'arrow-polygon-model';
  const tessellation = tessellateArrowPolygons(sourceVectors, options);
  return makePreparedArrowPolygonGPUVectors(device, tessellation, id, options);
}

/** Async variant that awaits GeoArrow polygon tessellation before creating GPU resources. */
export async function prepareArrowPolygonGPUVectorsAsync(
  device: Device,
  sourceVectors: ArrowPolygonSourceVectors,
  options: PrepareArrowPolygonGPUVectorsOptions = {}
): Promise<PreparedArrowPolygonGPUVectors> {
  const id = options.id ?? 'arrow-polygon-model';
  const tessellation = await tesselateAsync(sourceVectors, options);
  return makePreparedArrowPolygonGPUVectors(device, tessellation, id, options);
}

function makePreparedArrowPolygonGPUVectors(
  device: Device,
  tessellation: ArrowPolygonTessellationResult,
  id: string,
  options: PrepareArrowPolygonGPUVectorsOptions
): PreparedArrowPolygonGPUVectors {
  const normalizedTessellation = normalizePolygonTessellationIndices(tessellation);
  const positions = new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({
      id: `${id}-positions`,
      data: normalizedTessellation.positions
    }),
    dataType: makeFixedSizeListType(new Float32(), OUTPUT_POSITION_COMPONENTS),
    format: 'float32x3',
    length: normalizedTessellation.vertexCount,
    stride: OUTPUT_POSITION_COMPONENTS,
    byteStride: Float32Array.BYTES_PER_ELEMENT * OUTPUT_POSITION_COMPONENTS,
    ownsBuffer: true
  });
  const colors = new GPUVector({
    type: 'buffer',
    name: 'colors',
    buffer: device.createBuffer({
      id: `${id}-colors`,
      data: normalizedTessellation.colors
    }),
    dataType: makeFixedSizeListType(new Uint8(), 4),
    format: 'unorm8x4',
    length: normalizedTessellation.vertexCount,
    stride: 4,
    byteStride: Uint8Array.BYTES_PER_ELEMENT * 4,
    ownsBuffer: true
  });
  const rowIndices = new GPUVector({
    type: 'buffer',
    name: 'rowIndices',
    buffer: device.createBuffer({
      id: `${id}-row-indices`,
      data: normalizedTessellation.rowIndices
    }),
    dataType: new Uint32(),
    format: 'uint32',
    length: normalizedTessellation.vertexCount,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
  const indices = new GPUVector({
    type: 'buffer',
    name: 'indices',
    buffer: device.createBuffer({
      id: `${id}-indices`,
      usage: Buffer.INDEX,
      data: normalizedTessellation.indices
    }),
    dataType: makeListType(new Uint32()),
    format: 'vertex-list<uint32>',
    length: normalizedTessellation.vertexCount,
    valueLength: normalizedTessellation.indices.length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
  const batch: GPURecordBatch = new GPURecordBatch<GPUTypeMap>({
    vectors: {positions, colors, rowIndices, indices},
    sourceInfo: makeArrowRecordBatchSourceInfo({
      sourceBatchIndex: options.sourceBatchIndex,
      sourceRowIndexOffset: options.rowIndexOffset,
      sourceRowCount: normalizedTessellation.rowCount
    })
  });
  const table: GPUTable = new GPUTable<GPUTypeMap>({
    batches: [batch],
    schema: batch.schema,
    bufferLayout: batch.bufferLayout
  });

  return {
    table,
    positions,
    colors,
    rowIndices,
    tessellation: normalizedTessellation,
    destroy: () => table.destroy()
  };
}

function normalizePolygonTessellationIndices(
  tessellation: ArrowPolygonTessellationResult
): ArrowPolygonTessellationResult {
  if (tessellation.indices instanceof Uint32Array) {
    return tessellation;
  }
  return {...tessellation, indices: Uint32Array.from(tessellation.indices)};
}

function makeFixedSizeListType<T extends Float32 | Uint8>(
  childType: T,
  listSize: number
): FixedSizeList<T> {
  return new FixedSizeList(listSize, new Field('value', childType, false));
}

function makeListType<T extends Uint32>(childType: T): List<T> {
  return new List(new Field('value', childType, false));
}
