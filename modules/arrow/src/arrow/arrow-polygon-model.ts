// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';
import {
  tesselateAsync,
  tessellateArrowPolygons,
  type ArrowPolygonSourceVectors,
  type ArrowPolygonTessellationOptions,
  type ArrowPolygonTessellationResult
} from '@math.gl/geoarrow';
import {Field, FixedSizeList, Float32, Uint8, Uint32} from 'apache-arrow';

export {
  tesselateAsync,
  tessellateArrowPolygons,
  type ArrowGeoArrowGeometryType,
  type ArrowMultiPolygonType,
  type ArrowMultiPolygonVertexColorType,
  type ArrowPolygonColorType,
  type ArrowPolygonCoordinateType,
  type ArrowPolygonInputType,
  type ArrowPolygonRowColorType,
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
};

export type PreparedArrowPolygonGPUVectors = {
  /** GPU table with positions, colors, and rowIndices attributes. */
  table: GPUTable;
  /** Output positions vector, padded to vec4 Float32 rows. */
  positions: GPUVector<FixedSizeList<Float32>>;
  /** Output per-vertex RGBA8 colors. */
  colors: GPUVector<FixedSizeList<Uint8>>;
  /** Output source row indices. */
  rowIndices: GPUVector<Uint32>;
  /** Triangle index buffer. */
  indices: Buffer;
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
  return makePreparedArrowPolygonGPUVectors(device, tessellation, id);
}

/** Async variant that awaits GeoArrow polygon tessellation before creating GPU resources. */
export async function prepareArrowPolygonGPUVectorsAsync(
  device: Device,
  sourceVectors: ArrowPolygonSourceVectors,
  options: PrepareArrowPolygonGPUVectorsOptions = {}
): Promise<PreparedArrowPolygonGPUVectors> {
  const id = options.id ?? 'arrow-polygon-model';
  const tessellation = await tesselateAsync(sourceVectors, options);
  return makePreparedArrowPolygonGPUVectors(device, tessellation, id);
}

function makePreparedArrowPolygonGPUVectors(
  device: Device,
  tessellation: ArrowPolygonTessellationResult,
  id: string
): PreparedArrowPolygonGPUVectors {
  const positions = new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({
      id: `${id}-positions`,
      data: tessellation.positions
    }),
    dataType: makeFixedSizeListType(new Float32(), OUTPUT_POSITION_COMPONENTS),
    length: tessellation.vertexCount,
    stride: OUTPUT_POSITION_COMPONENTS,
    byteStride: Float32Array.BYTES_PER_ELEMENT * OUTPUT_POSITION_COMPONENTS,
    ownsBuffer: true
  });
  const colors = new GPUVector({
    type: 'buffer',
    name: 'colors',
    buffer: device.createBuffer({
      id: `${id}-colors`,
      data: tessellation.colors
    }),
    dataType: makeFixedSizeListType(new Uint8(), 4),
    length: tessellation.vertexCount,
    stride: 4,
    byteStride: Uint8Array.BYTES_PER_ELEMENT * 4,
    ownsBuffer: true
  });
  const rowIndices = new GPUVector({
    type: 'buffer',
    name: 'rowIndices',
    buffer: device.createBuffer({
      id: `${id}-row-indices`,
      data: tessellation.rowIndices
    }),
    dataType: new Uint32(),
    length: tessellation.vertexCount,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
  const indexBuffer = device.createBuffer({
    id: `${id}-indices`,
    usage: Buffer.INDEX,
    data: tessellation.indices
  });
  const batch = new GPURecordBatch({vectors: {positions, colors, rowIndices}});
  const table = new GPUTable({
    batches: [batch],
    schema: batch.schema,
    bufferLayout: batch.bufferLayout
  });

  return {
    table,
    positions,
    colors,
    rowIndices,
    indices: indexBuffer,
    tessellation,
    destroy: () => {
      table.destroy();
      indexBuffer.destroy();
    }
  };
}

function makeFixedSizeListType<T extends Float32 | Uint8>(
  childType: T,
  listSize: number
): FixedSizeList<T> {
  return new FixedSizeList(listSize, new Field('value', childType, false));
}
