// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUVector, type GPURecordBatchSourceInfo, type VertexList} from '@luma.gl/tables';
import {
  tesselateAsync,
  tessellateArrowPolygons,
  type ArrowPolygonSourceVectors,
  type ArrowPolygonTessellationOptions,
  type ArrowPolygonTessellationResult
} from '@math.gl/geoarrow';
import {Field, FixedSizeList, Float32, List, Uint8, Uint32, type DataType} from 'apache-arrow';
import {makeArrowRecordBatchSourceInfo} from '../../../engine/arrow-picking';

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

export type ConvertArrowPolygonToGPUVectorsOptions = ArrowPolygonTessellationOptions & {
  /** Stable resource id prefix. Defaults to `arrow-polygon-model`. */
  id?: string;
  /** Zero-based source batch index. Defaults to `0`. */
  sourceBatchIndex?: number;
};

export type PreparedArrowPolygonGPUVectors = {
  /** Output positions vector, padded to vec4 Float32 values per tessellated vertex. */
  positions: GPUVector<VertexList<'float32x4'>>;
  /** Output per-vertex RGBA8 colors aligned with positions. */
  colors: GPUVector<VertexList<'unorm8x4'>>;
  /** Output source row indices aligned with positions. */
  rowIndices: GPUVector<VertexList<'uint32'>>;
  /** Output triangle indices grouped by source polygon row. */
  indices: GPUVector<VertexList<'uint32'>>;
  /** Source-row identity retained for renderer picking and row diagnostics. */
  sourceInfo: GPURecordBatchSourceInfo;
  /** Per-source-row offsets into flattened positions, colors, and rowIndices values. */
  vertexValueOffsets: Int32Array;
  /** Per-source-row offsets into flattened triangle index values. */
  indexValueOffsets: Int32Array;
  /** CPU tessellation metadata and generated arrays. */
  tessellation: ArrowPolygonTessellationResult;
  /** Releases owned GPU resources. */
  destroy: () => void;
};

const OUTPUT_POSITION_COMPONENTS = 4;

/** Converts tessellated Arrow polygon output to flat row-preserving GPU vectors. */
export function convertArrowPolygonToGPUVectors(
  device: Device,
  sourceVectors: ArrowPolygonSourceVectors,
  options: ConvertArrowPolygonToGPUVectorsOptions = {}
): PreparedArrowPolygonGPUVectors {
  const id = options.id ?? 'arrow-polygon-model';
  const tessellation = tessellateArrowPolygons(sourceVectors, options);
  return makePreparedArrowPolygonGPUVectors(device, tessellation, id, options);
}

/** Async variant that awaits GeoArrow polygon tessellation before creating GPU resources. */
export async function convertArrowPolygonToGPUVectorsAsync(
  device: Device,
  sourceVectors: ArrowPolygonSourceVectors,
  options: ConvertArrowPolygonToGPUVectorsOptions = {}
): Promise<PreparedArrowPolygonGPUVectors> {
  const id = options.id ?? 'arrow-polygon-model';
  const tessellation = await tesselateAsync(sourceVectors, options);
  return makePreparedArrowPolygonGPUVectors(device, tessellation, id, options);
}

function makePreparedArrowPolygonGPUVectors(
  device: Device,
  tessellation: ArrowPolygonTessellationResult,
  id: string,
  options: ConvertArrowPolygonToGPUVectorsOptions
): PreparedArrowPolygonGPUVectors {
  const normalizedTessellation = normalizePolygonTessellationIndices(tessellation);
  const vertexValueOffsets = makePolygonVertexValueOffsets(normalizedTessellation, options);
  const indexValueOffsets = makePolygonIndexValueOffsets(
    normalizedTessellation,
    vertexValueOffsets
  );
  const positions: GPUVector<VertexList<'float32x4'>> = new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({
      id: `${id}-positions`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: normalizedTessellation.positions
    }),
    dataType: makeListType(makeFixedSizeListType(new Float32(), OUTPUT_POSITION_COMPONENTS)),
    format: 'vertex-list<float32x4>',
    length: normalizedTessellation.rowCount,
    valueLength: normalizedTessellation.vertexCount,
    stride: OUTPUT_POSITION_COMPONENTS,
    byteStride: Float32Array.BYTES_PER_ELEMENT * OUTPUT_POSITION_COMPONENTS,
    ownsBuffer: true
  });
  const colors: GPUVector<VertexList<'unorm8x4'>> = new GPUVector({
    type: 'buffer',
    name: 'colors',
    buffer: device.createBuffer({
      id: `${id}-colors`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: normalizedTessellation.colors
    }),
    dataType: makeListType(makeFixedSizeListType(new Uint8(), 4)),
    format: 'vertex-list<unorm8x4>',
    length: normalizedTessellation.rowCount,
    valueLength: normalizedTessellation.vertexCount,
    stride: 4,
    byteStride: Uint8Array.BYTES_PER_ELEMENT * 4,
    ownsBuffer: true
  });
  const rowIndices: GPUVector<VertexList<'uint32'>> = new GPUVector({
    type: 'buffer',
    name: 'rowIndices',
    buffer: device.createBuffer({
      id: `${id}-row-indices`,
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: normalizedTessellation.rowIndices
    }),
    dataType: makeListType(new Uint32()),
    format: 'vertex-list<uint32>',
    length: normalizedTessellation.rowCount,
    valueLength: normalizedTessellation.vertexCount,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
  const indices: GPUVector<VertexList<'uint32'>> = new GPUVector({
    type: 'buffer',
    name: 'indices',
    buffer: device.createBuffer({
      id: `${id}-indices`,
      usage: Buffer.INDEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      data: normalizedTessellation.indices
    }),
    dataType: makeListType(new Uint32()),
    format: 'vertex-list<uint32>',
    length: normalizedTessellation.rowCount,
    valueLength: normalizedTessellation.indices.length,
    stride: 1,
    byteStride: Uint32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
  const sourceInfo = makeArrowRecordBatchSourceInfo({
    sourceBatchIndex: options.sourceBatchIndex,
    sourceRowIndexOffset: options.rowIndexOffset,
    sourceRowCount: normalizedTessellation.rowCount
  });

  return {
    positions,
    colors,
    rowIndices,
    indices,
    sourceInfo,
    vertexValueOffsets,
    indexValueOffsets,
    tessellation: normalizedTessellation,
    destroy: () => {
      positions.destroy();
      colors.destroy();
      rowIndices.destroy();
      indices.destroy();
    }
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

function makeListType<T extends DataType>(childType: T): List<T> {
  return new List(new Field('value', childType, false));
}

function makePolygonVertexValueOffsets(
  tessellation: ArrowPolygonTessellationResult,
  options: ConvertArrowPolygonToGPUVectorsOptions
): Int32Array {
  const valueOffsets = new Int32Array(tessellation.rowCount + 1);
  const rowIndexOffset = options.rowIndexOffset ?? 0;
  let vertexIndex = 0;
  for (let rowIndex = 0; rowIndex < tessellation.rowCount; rowIndex++) {
    valueOffsets[rowIndex] = vertexIndex;
    const sourceRowIndex = rowIndexOffset + rowIndex;
    while (tessellation.rowIndices[vertexIndex] === sourceRowIndex) {
      vertexIndex++;
    }
  }
  valueOffsets[tessellation.rowCount] = vertexIndex;
  return valueOffsets;
}

function makePolygonIndexValueOffsets(
  tessellation: ArrowPolygonTessellationResult,
  vertexValueOffsets: Int32Array
): Int32Array {
  const valueOffsets = new Int32Array(tessellation.rowCount + 1);
  let indexValueIndex = 0;
  for (let rowIndex = 0; rowIndex < tessellation.rowCount; rowIndex++) {
    valueOffsets[rowIndex] = indexValueIndex;
    const nextVertexValueOffset = vertexValueOffsets[rowIndex + 1] ?? 0;
    while (
      indexValueIndex < tessellation.indices.length &&
      tessellation.indices[indexValueIndex] < nextVertexValueOffset
    ) {
      indexValueIndex++;
    }
  }
  valueOffsets[tessellation.rowCount] = indexValueIndex;
  return valueOffsets;
}
