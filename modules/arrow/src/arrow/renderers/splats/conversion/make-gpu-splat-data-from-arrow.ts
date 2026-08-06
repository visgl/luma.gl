// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {makeGPUSplatData, type GPUSplatData, type SplatSource} from '@luma.gl/splats';
import {
  DataType,
  type Data,
  type FixedSizeList,
  type Float32,
  type RecordBatch,
  type Table,
  type Vector
} from 'apache-arrow';
import {getArrowDataBufferSource} from '../../../gpu/arrow-gpu-data';

const SPHERICAL_HARMONIC_DC = 0.28209479177387814;
const GAUSSIAN_SPLAT_ENCODING_METADATA_KEY = 'loaders_gl.gaussian_splats.encoding';
const DEFAULT_SPLAT_COLOR = [255, 255, 255, 255] as const;

/** Structural Arrow record-batch contract shared across installed Arrow versions. */
export type GPUSplatArrowRecordBatchLike = {
  /** Number of independent Gaussian splat source rows. */
  readonly numRows: number;
  /** Arrow field names and field-level encoding metadata. */
  readonly schema: {
    readonly fields: readonly {
      readonly name: string;
      readonly metadata: ReadonlyMap<string, string>;
    }[];
  };
  /** Returns one Arrow column from the source batch's own Arrow package. */
  getChild(columnName: string): unknown;
};

/** Structural Arrow table contract that preserves its original record-batch boundaries. */
export type GPUSplatArrowTableLike = GPUSplatArrowRecordBatchLike & {
  /** Record batches retained in source order without concatenation. */
  readonly batches: readonly GPUSplatArrowRecordBatchLike[];
};

type GPUSplatArrowColumnSource =
  | Table
  | RecordBatch
  | GPUSplatArrowTableLike
  | GPUSplatArrowRecordBatchLike;

/** Apache Arrow source accepted directly or through a structural loaders.gl-style wrapper. */
export type GPUSplatArrowSource =
  | GPUSplatArrowColumnSource
  | {
      /** Raw Arrow table or one independent source record batch. */
      readonly data: GPUSplatArrowColumnSource;
      /** Optional loaders.gl shape tag; no loaders.gl package is required. */
      readonly shape?: string;
    };

/** Optional styling and stable source-row offsets for Arrow Gaussian splat preparation. */
export type MakeGPUSplatDataFromArrowOptions = {
  /** RGBA bytes used when spherical-harmonic DC color columns are absent. */
  fallbackColor?: readonly [number, number, number, number?];
  /** Zero-based source index assigned to the first Arrow record batch. */
  sourceBatchIndex?: number;
  /** Global source-row index assigned to the first nonempty Arrow record batch. */
  rowIndexBase?: number;
};

type GPUSplatArrowSourceOffsets = {
  sourceBatchIndex: number;
  rowIndexBase: number;
};

/**
 * Converts an Arrow table or record batch into independently owned Gaussian splat GPU batches.
 *
 * Every nonempty Arrow record batch becomes exactly one {@link GPUSplatData}. Callers own and must
 * destroy each returned batch after all borrowing renderers have been destroyed.
 */
export function makeGPUSplatDataFromArrow(
  device: Device,
  source: GPUSplatArrowSource,
  options: MakeGPUSplatDataFromArrowOptions = {}
): GPUSplatData[] {
  return prepareArrowSplatSource(device, source, options, {
    sourceBatchIndex: options.sourceBatchIndex ?? 0,
    rowIndexBase: options.rowIndexBase ?? 0
  }).data;
}

/**
 * Progressively prepares streamed Arrow tables or record batches without retaining earlier sources.
 *
 * Source batch boundaries, batch indices, and global row offsets remain stable even when an input
 * table contains multiple record batches. Previously yielded data is never concatenated or changed.
 */
export async function* makeGPUSplatDataFromArrowStream(
  device: Device,
  source: AsyncIterable<GPUSplatArrowSource> | Iterable<GPUSplatArrowSource>,
  options: MakeGPUSplatDataFromArrowOptions = {}
): AsyncIterable<GPUSplatData> {
  let offsets: GPUSplatArrowSourceOffsets = {
    sourceBatchIndex: options.sourceBatchIndex ?? 0,
    rowIndexBase: options.rowIndexBase ?? 0
  };

  for await (const arrowSource of source) {
    const prepared = prepareArrowSplatSource(device, arrowSource, options, offsets);
    offsets = prepared.nextOffsets;
    for (const data of prepared.data) {
      yield data;
    }
  }
}

function prepareArrowSplatSource(
  device: Device,
  source: GPUSplatArrowSource,
  options: MakeGPUSplatDataFromArrowOptions,
  offsets: GPUSplatArrowSourceOffsets
): {data: GPUSplatData[]; nextOffsets: GPUSplatArrowSourceOffsets} {
  const arrowSource = isArrowSplatColumnSource(source) ? source : source.data;
  const recordBatches = isArrowSplatTable(arrowSource) ? arrowSource.batches : [arrowSource];
  const data: GPUSplatData[] = [];
  let {sourceBatchIndex, rowIndexBase} = offsets;

  try {
    for (const recordBatch of recordBatches) {
      if (recordBatch.numRows > 0) {
        const splatSource = makeSplatSourceFromArrowRecordBatch(recordBatch, options, {
          sourceBatchIndex,
          rowIndexBase
        });
        const batch = makeGPUSplatData(device, splatSource);
        data.push(batch);
        rowIndexBase += batch.rowCount;
      }
      sourceBatchIndex++;
    }
  } catch (error) {
    for (const batch of data) {
      batch.destroy();
    }
    throw error;
  }

  return {data, nextOffsets: {sourceBatchIndex, rowIndexBase}};
}

/** Arrow may be supplied by a different package version or JavaScript realm. */
function isArrowSplatColumnSource(
  source: GPUSplatArrowSource
): source is GPUSplatArrowColumnSource {
  return 'getChild' in source && typeof source.getChild === 'function' && 'numRows' in source;
}

/** Distinguish tables structurally so record-batch boundaries survive multiple Arrow copies. */
function isArrowSplatTable(source: GPUSplatArrowColumnSource): source is GPUSplatArrowTableLike {
  return 'batches' in source && Array.isArray(source.batches);
}

function makeSplatSourceFromArrowRecordBatch(
  recordBatch: GPUSplatArrowRecordBatchLike,
  options: MakeGPUSplatDataFromArrowOptions,
  offsets: GPUSplatArrowSourceOffsets
): SplatSource {
  const rowCount = recordBatch.numRows;
  const fallbackColor = options.fallbackColor ?? DEFAULT_SPLAT_COLOR;
  const positions = getArrowSplatPositions(recordBatch);
  const scaleColumns = [
    getRequiredArrowSplatColumn(recordBatch, 'scale_0'),
    getRequiredArrowSplatColumn(recordBatch, 'scale_1'),
    getRequiredArrowSplatColumn(recordBatch, 'scale_2')
  ];
  const rotationColumns = [
    getRequiredArrowSplatColumn(recordBatch, 'rot_0'),
    getRequiredArrowSplatColumn(recordBatch, 'rot_1'),
    getRequiredArrowSplatColumn(recordBatch, 'rot_2'),
    getRequiredArrowSplatColumn(recordBatch, 'rot_3')
  ];
  const sphericalHarmonicColumns = [
    getOptionalArrowSplatColumn(recordBatch, 'f_dc_0'),
    getOptionalArrowSplatColumn(recordBatch, 'f_dc_1'),
    getOptionalArrowSplatColumn(recordBatch, 'f_dc_2')
  ];
  const hasSphericalHarmonicColors = sphericalHarmonicColumns.every(Boolean);
  const opacityColumn = getOptionalArrowSplatColumn(recordBatch, 'opacity');
  const scaleEncodings = scaleColumns.map((_, componentIndex) =>
    getArrowSplatFieldEncoding(recordBatch, `scale_${componentIndex}`)
  );
  const opacityEncoding = getArrowSplatFieldEncoding(recordBatch, 'opacity');
  const scales = new Float32Array(rowCount * 3);
  const rotations = new Float32Array(rowCount * 4);
  const colors = new Float32Array(rowCount * 4);
  const opacities = new Float32Array(rowCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      const scale = Number(scaleColumns[componentIndex]!.get(rowIndex) ?? 0);
      scales[rowIndex * 3 + componentIndex] =
        scaleEncodings[componentIndex] === 'linear' ? Math.max(scale, 0) : Math.exp(scale);
      // SH DC radiance can be negative or exceed one; preserve it until final tone mapping.
      colors[rowIndex * 4 + componentIndex] = hasSphericalHarmonicColors
        ? 0.5 +
          Number(sphericalHarmonicColumns[componentIndex]!.get(rowIndex) ?? 0) *
            SPHERICAL_HARMONIC_DC
        : normalizeSplatColorByte(
            fallbackColor[componentIndex] ?? DEFAULT_SPLAT_COLOR[componentIndex]
          );
    }

    for (let componentIndex = 0; componentIndex < 4; componentIndex++) {
      rotations[rowIndex * 4 + componentIndex] = Number(
        rotationColumns[componentIndex]!.get(rowIndex) ?? 0
      );
    }

    const encodedOpacity = opacityColumn ? Number(opacityColumn.get(rowIndex) ?? 0) : 1;
    opacities[rowIndex] = opacityColumn
      ? opacityEncoding === 'linear'
        ? encodedOpacity
        : 1 / (1 + Math.exp(-encodedOpacity))
      : encodedOpacity;
    // Opacity has its own GPU column; copying it into color alpha would apply it twice.
    colors[rowIndex * 4 + 3] = normalizeSplatColorByte(fallbackColor[3] ?? DEFAULT_SPLAT_COLOR[3]);
  }

  return {positions, scales, rotations, colors, opacities, ...offsets};
}

function getArrowSplatPositions(recordBatch: GPUSplatArrowRecordBatchLike): Float32Array {
  const positions = getRequiredArrowSplatColumn(recordBatch, 'POSITION');
  const positionData = positions.data[0];
  if (
    DataType.isFixedSizeList(positions.type) &&
    positions.type.listSize === 3 &&
    positions.data.length === 1 &&
    positionData &&
    positionData.nullCount === 0 &&
    positionData.children[0]?.values instanceof Float32Array
  ) {
    return getArrowDataBufferSource(positionData as Data<FixedSizeList<Float32>>);
  }

  const values = new Float32Array(recordBatch.numRows * 3);
  for (let rowIndex = 0; rowIndex < recordBatch.numRows; rowIndex++) {
    const position = positions.get(rowIndex) as
      | (ArrayLike<number> & {get?: (componentIndex: number) => unknown})
      | null;
    if (!position || position.length < 3) {
      throw new Error('Gaussian splats require three POSITION components per row');
    }
    for (let componentIndex = 0; componentIndex < 3; componentIndex++) {
      values[rowIndex * 3 + componentIndex] = Number(
        typeof position.get === 'function' ? position.get(componentIndex) : position[componentIndex]
      );
    }
  }
  return values;
}

function getRequiredArrowSplatColumn(
  recordBatch: GPUSplatArrowRecordBatchLike,
  columnName: string
): Vector {
  const column = getOptionalArrowSplatColumn(recordBatch, columnName);
  if (!column) {
    throw new Error(`Gaussian splats require a ${columnName} column`);
  }
  return column;
}

function getOptionalArrowSplatColumn(
  recordBatch: GPUSplatArrowRecordBatchLike,
  columnName: string
): Vector | null {
  // Arrow vector operations below are structural across supported Arrow versions.
  return (recordBatch.getChild(columnName) as Vector | null) ?? null;
}

function getArrowSplatFieldEncoding(
  recordBatch: GPUSplatArrowRecordBatchLike,
  fieldName: string
): string | undefined {
  return recordBatch.schema.fields
    .find(field => field.name === fieldName)
    ?.metadata.get(GAUSSIAN_SPLAT_ENCODING_METADATA_KEY);
}

function normalizeSplatColorByte(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 255)) / 255;
}
