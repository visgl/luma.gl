// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  makeRasterOverviewMetadata,
  type GPURasterDecodedBand,
  type GPURasterDecodedTile,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata
} from '@luma.gl/experimental/gpu-raster';
import {makeRasterLabDataset, RASTER_LAB_NO_DATA_VALUE, type RasterLabDataset} from './raster-data';
import type {RasterLabSourceTile} from './raster-interface';

const RASTER_LAB_COORDINATE_REFERENCE_SYSTEM = 'EPSG:32610';
const EMPTY_RASTER_FLOAT_VALUES = new Float32Array(0);
const EMPTY_RASTER_VALIDITY_VALUES = new Uint32Array(0);

/** Deterministic decoded source adapter; loading never allocates GPU buffers or assembles halos. */
export class RasterLabTileSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata;

  readCount = 0;

  private readonly dataset: RasterLabDataset;

  constructor(width: number, height: number) {
    this.dataset = makeRasterLabDataset(width, height);
    const overviewWidth = Math.ceil(width / 2);
    const overviewHeight = Math.ceil(height / 2);
    this.metadata = {
      id: 'synthetic-earth-observation',
      width,
      height,
      affine: [10, 0, 552400, 0, -10, 4187600],
      pixelInterpretation: 'area',
      coordinateReferenceSystem: {authority: RASTER_LAB_COORDINATE_REFERENCE_SYSTEM},
      levelZeroOrigin: [0, 0],
      bands: [
        {id: 'red', format: 'float32', noDataValue: RASTER_LAB_NO_DATA_VALUE},
        {id: 'near-infrared', format: 'float32', noDataValue: RASTER_LAB_NO_DATA_VALUE}
      ],
      levels: [
        {
          level: 0,
          width,
          height,
          tileWidth: Math.ceil(width / 2),
          tileHeight: height,
          downsample: [1, 1]
        },
        {
          level: 1,
          width: overviewWidth,
          height: overviewHeight,
          tileWidth: Math.ceil(overviewWidth / 2),
          tileHeight: overviewHeight,
          downsample: [2, 2]
        }
      ]
    };
  }

  /** Returns exactly one requested decoded window; a later request may cancel this work. */
  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    signal.throwIfAborted();
    this.readCount++;
    await waitForSourceAdapter(signal);
    signal.throwIfAborted();

    const level = this.metadata.levels.find(candidate => candidate.level === request.level);
    if (!level) throw new Error(`Unavailable synthetic overview: ${request.level}`);
    const column = request.column ?? 0;
    const row = request.row ?? 0;
    const defaultBounds: readonly [number, number, number, number] =
      request.column === undefined
        ? [0, 0, level.width, level.height]
        : [
            column * level.tileWidth,
            row * level.tileHeight,
            Math.min((column + 1) * level.tileWidth, level.width),
            Math.min((row + 1) * level.tileHeight, level.height)
          ];
    const [minimumColumn, minimumRow, maximumColumn, maximumRow] =
      request.pixelBounds ?? defaultBounds;
    const width = maximumColumn - minimumColumn;
    const height = maximumRow - minimumRow;
    const pixelCount = width * height;
    const red = new Float32Array(pixelCount);
    const nearInfrared = new Float32Array(pixelCount);
    const validity = new Uint32Array(pixelCount);
    const [columnDownsample, rowDownsample] = level.downsample;

    for (let tileRow = 0; tileRow < height; tileRow++) {
      const sourceRow = Math.min((minimumRow + tileRow) * rowDownsample, this.dataset.height - 1);
      for (let tileColumn = 0; tileColumn < width; tileColumn++) {
        const sourceColumn = Math.min(
          (minimumColumn + tileColumn) * columnDownsample,
          this.dataset.width - 1
        );
        const sourceIndex = sourceRow * this.dataset.width + sourceColumn;
        const tileIndex = tileRow * width + tileColumn;
        red[tileIndex] = this.dataset.red[sourceIndex]!;
        nearInfrared[tileIndex] = this.dataset.nearInfrared[sourceIndex]!;
        validity[tileIndex] = this.dataset.validity[sourceIndex]!;
      }
    }

    signal.throwIfAborted();
    const requestedBandIds = request.bandIds ?? this.metadata.bands.map(band => band.id);
    const availableBands: GPURasterDecodedBand<'float32'>[] = [
      {
        id: 'red',
        format: 'float32',
        values: red,
        validity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      },
      {
        id: 'near-infrared',
        format: 'float32',
        values: nearInfrared,
        validity,
        noDataValue: RASTER_LAB_NO_DATA_VALUE
      }
    ];
    const bands = requestedBandIds.map(bandId => {
      const band = availableBands.find(candidate => candidate.id === bandId);
      if (!band) throw new Error(`Unavailable synthetic raster band: ${bandId}`);
      return band;
    });
    const [first, second, third, fourth, fifth, sixth] = this.metadata.affine;
    const levelZeroColumn = minimumColumn * columnDownsample;
    const levelZeroRow = minimumRow * rowDownsample;

    return {
      level: level.level,
      column,
      row,
      pixelBounds: [minimumColumn, minimumRow, maximumColumn, maximumRow],
      levelZeroBounds: [
        levelZeroColumn,
        levelZeroRow,
        Math.min(maximumColumn * columnDownsample, this.metadata.width),
        Math.min(maximumRow * rowDownsample, this.metadata.height)
      ],
      metadata: {
        width,
        height,
        affine: [
          first * columnDownsample,
          second * rowDownsample,
          third + first * levelZeroColumn + second * levelZeroRow,
          fourth * columnDownsample,
          fifth * rowDownsample,
          sixth + fourth * levelZeroColumn + fifth * levelZeroRow
        ],
        pixelInterpretation: this.metadata.pixelInterpretation,
        coordinateReferenceSystem: this.metadata.coordinateReferenceSystem,
        level: level.level,
        levelZeroOrigin: [levelZeroColumn, levelZeroRow]
      },
      bands
    };
  }
}

/** Converts one explicitly decoded source tile into the existing, single-raster GPU workflow. */
export function makeRasterLabTileDataset(
  tile: GPURasterDecodedTile,
  selection: RasterLabSourceTile
): RasterLabDataset {
  const redBand = tile.bands.find(band => band.id === 'red');
  const nearInfraredBand = tile.bands.find(band => band.id === 'near-infrared');
  if (
    !redBand ||
    !nearInfraredBand ||
    redBand.format !== 'float32' ||
    nearInfraredBand.format !== 'float32'
  ) {
    throw new Error('Synthetic raster tiles require red and near-infrared float32 bands');
  }

  const pixelCount = tile.metadata.width * tile.metadata.height;
  const validity = new Uint32Array(pixelCount);
  let cloudPixelCount = 0;
  let noDataPixelCount = 0;
  let waterPixelCount = 0;

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
    const redValidity = redBand.validity?.[pixelIndex] ?? 1;
    const nearInfraredValidity = nearInfraredBand.validity?.[pixelIndex] ?? 1;
    const isValid = redValidity !== 0 && nearInfraredValidity !== 0;
    validity[pixelIndex] = Number(isValid);
    if (!isValid) {
      cloudPixelCount++;
    } else if (redBand.values[pixelIndex] === RASTER_LAB_NO_DATA_VALUE) {
      noDataPixelCount++;
    } else if (nearInfraredBand.values[pixelIndex]! < redBand.values[pixelIndex]!) {
      waterPixelCount++;
    }
  }

  return {
    width: tile.metadata.width,
    height: tile.metadata.height,
    pixelCount,
    red: redBand.values,
    nearInfrared: nearInfraredBand.values,
    validity,
    cloudPixelCount,
    noDataPixelCount,
    waterPixelCount,
    metadata: tile.metadata,
    tile: selection,
    overviewLevel: tile.level === 0 ? 0 : 1,
    levelZeroOrigin: tile.metadata.levelZeroOrigin,
    coordinateReferenceSystem:
      tile.metadata.coordinateReferenceSystem?.authority ?? RASTER_LAB_COORDINATE_REFERENCE_SYSTEM
  };
}

/** Derives bounded target metadata only; actual means and mask categories remain GPU-generated. */
export function makeRasterLabGeneratedOverviewDataset(
  tile: GPURasterDecodedTile,
  selection: RasterLabSourceTile
): RasterLabDataset {
  const redBand = tile.bands.find(band => band.id === 'red');
  const nearInfraredBand = tile.bands.find(band => band.id === 'near-infrared');
  if (
    !redBand ||
    !nearInfraredBand ||
    redBand.format !== 'float32' ||
    nearInfraredBand.format !== 'float32' ||
    !redBand.validity
  ) {
    throw new Error('Generated raster overviews require native float bands and categorical masks');
  }

  const metadata = makeRasterOverviewMetadata(tile.metadata, 2, {level: 1});
  const pixelCount = metadata.width * metadata.height;

  return {
    width: metadata.width,
    height: metadata.height,
    pixelCount,
    red: EMPTY_RASTER_FLOAT_VALUES,
    nearInfrared: EMPTY_RASTER_FLOAT_VALUES,
    validity: EMPTY_RASTER_VALIDITY_VALUES,
    cloudPixelCount: 0,
    noDataPixelCount: 0,
    waterPixelCount: 0,
    metadata,
    tile: selection,
    overviewLevel: 1,
    levelZeroOrigin: metadata.levelZeroOrigin,
    coordinateReferenceSystem:
      metadata.coordinateReferenceSystem?.authority ?? RASTER_LAB_COORDINATE_REFERENCE_SYSTEM
  };
}

function waitForSourceAdapter(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 12);
    const abort = (): void => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      reject(signal.reason ?? new DOMException('Raster tile request aborted', 'AbortError'));
    };
    signal.addEventListener('abort', abort, {once: true});
  });
}
