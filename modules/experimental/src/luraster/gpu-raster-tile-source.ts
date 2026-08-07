// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GPURasterCoordinateReferenceSystem,
  GPURasterMetadata,
  GPURasterScalarFormat
} from './types';

/** Whether a requested half-open pixel window uses overview or level-zero coordinates. */
export type GPURasterTileCoordinateSpace = 'level' | 'level-zero';

/** Half-open pixel rectangle: minimum x/y followed by exclusive maximum x/y. */
export type GPURasterPixelBounds = readonly [number, number, number, number];

/** Exact native sample representation and application-owned source calibration metadata. */
export type GPURasterTileBandMetadata<
  Format extends GPURasterScalarFormat = GPURasterScalarFormat
> = Format extends GPURasterScalarFormat
  ? {
      id: string;
      format: Format;
      /** Raw native-format sentinel, compared before calibration by later GPU contributors. */
      noDataValue?: number;
      scale?: number;
      offset?: number;
    }
  : never;

/** One independently declared overview grid and its application-owned tile geometry. */
export type GPURasterTileLevel = {
  level: number;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  /** Exact anisotropic level-zero pixels per overview pixel; level zero is always [1, 1]. */
  downsample: readonly [number, number];
};

/** CPU-side raster identity, spatial metadata, native bands, and explicit overview pyramid. */
export type GPURasterTileSourceMetadata = {
  id?: string;
  width: number;
  height: number;
  affine: readonly [number, number, number, number, number, number];
  pixelInterpretation: 'area' | 'point';
  coordinateReferenceSystem?: GPURasterCoordinateReferenceSystem;
  levelZeroOrigin?: readonly [number, number];
  bands: readonly GPURasterTileBandMetadata[];
  levels: readonly GPURasterTileLevel[];
};

/** Optional tile identity and selected half-open window; absent identity selects a full level. */
export type GPURasterTileRequest = {
  level: number;
  /** Column and row must either both be supplied or both be omitted. */
  column?: number;
  row?: number;
  /** Defaults to all source bands, preserving their declared order. */
  bandIds?: readonly string[];
  /** Intersected with the requested tile or full level after coordinate normalization. */
  pixelBounds?: GPURasterPixelBounds;
  /** Defaults to overview-level coordinates. */
  coordinateSpace?: GPURasterTileCoordinateSpace;
};

/** Exact decoded CPU samples, with separate canonical source-validity storage. */
export type GPURasterDecodedBand<Format extends GPURasterScalarFormat = GPURasterScalarFormat> =
  Format extends GPURasterScalarFormat
    ? GPURasterTileBandMetadata<Format> & {
        values: Format extends 'float32'
          ? Float32Array
          : Format extends 'uint32'
            ? Uint32Array
            : Int32Array;
        validity?: Uint32Array;
      }
    : never;

/** One application-decoded CPU tile with exact overview and world-coordinate metadata. */
export type GPURasterDecodedTile = {
  level: number;
  /** Whole-level requests retain the stable default identity (0, 0). */
  column: number;
  row: number;
  pixelBounds: GPURasterPixelBounds;
  /** Ragged level-zero coverage uses floor minima and ceil exclusive maxima. */
  levelZeroBounds: GPURasterPixelBounds;
  metadata: GPURasterMetadata;
  bands: readonly GPURasterDecodedBand[];
};

/**
 * Application-owned asynchronous raster transport and decoding boundary.
 *
 * Implementations own HTTP, workers, credentials, GeoTIFF/COG decoding, codecs, and transport
 * cancellation. LuRaster receives already-decoded CPU typed arrays and never uploads them.
 */
export interface GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata;
  readTile(request: GPURasterTileRequest, signal: AbortSignal): Promise<GPURasterDecodedTile>;
}

type NormalizedTileRequest = {
  request: GPURasterTileRequest;
  level: GPURasterTileLevel;
  column: number;
  row: number;
  bounds: GPURasterPixelBounds;
  levelZeroBounds: GPURasterPixelBounds;
  bandIds: readonly string[];
  metadata: GPURasterMetadata;
};

/**
 * Validates, normalizes, and cancels application-owned decoded raster tile requests.
 *
 * No graph, device, buffer, texture, cache, network request, decoder, worker, or upload is
 * created by this reader. Its only asynchronous work delegates to the supplied source.
 */
export class GPURasterTileReader {
  readonly source: GPURasterTileSource;
  readonly metadata: GPURasterTileSourceMetadata;

  private readonly levelsById = new Map<number, GPURasterTileLevel>();
  private readonly bandsById = new Map<string, GPURasterTileBandMetadata>();

  constructor(source: GPURasterTileSource) {
    if (!source || typeof source.readTile !== 'function') {
      throw new Error('Raster tile source must expose an asynchronous readTile method');
    }
    this.source = source;
    this.metadata = source.metadata;
    this.validateMetadata();
  }

  /** Canonicalizes defaults, selected bands, clipped windows, and overview coordinates. */
  normalizeTileRequest(request: GPURasterTileRequest): GPURasterTileRequest {
    return this.normalizeRequest(request).request;
  }

  /** Reads one normalized CPU tile and rejects promptly on preflight, in-flight, or final abort. */
  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal = new AbortController().signal
  ): Promise<GPURasterDecodedTile> {
    throwIfAborted(signal);
    const normalized = this.normalizeRequest(request);
    throwIfAborted(signal);
    const readPromise = Promise.resolve(this.source.readTile(normalized.request, signal));
    const decoded = await waitForDecodedTile(readPromise, signal);
    throwIfAborted(signal);
    this.validateDecodedTile(decoded, normalized);
    throwIfAborted(signal);
    return decoded;
  }

  private validateMetadata(): void {
    if (!this.metadata || typeof this.metadata !== 'object') {
      throw new Error('Raster tile source requires dataset metadata');
    }
    const label = this.metadata.id ?? 'gpu-raster-tile-source';
    if (
      !isPositiveSafeInteger(this.metadata.width) ||
      !isPositiveSafeInteger(this.metadata.height)
    ) {
      throw new Error(`${label} dataset dimensions must be positive safe integers`);
    }
    validateAffine(this.metadata.affine, label);
    if (
      this.metadata.pixelInterpretation !== 'area' &&
      this.metadata.pixelInterpretation !== 'point'
    ) {
      throw new Error(`${label} pixel interpretation must be area or point`);
    }
    if (
      this.metadata.levelZeroOrigin &&
      (this.metadata.levelZeroOrigin.length !== 2 ||
        !this.metadata.levelZeroOrigin.every(Number.isFinite))
    ) {
      throw new Error(`${label} level-zero origin must contain two finite coordinates`);
    }
    if (!Array.isArray(this.metadata.bands) || this.metadata.bands.length === 0) {
      throw new Error(`${label} requires at least one uniquely identified band`);
    }
    for (const band of this.metadata.bands) {
      validateBandMetadata(band, `${label} band`);
      if (this.bandsById.has(band.id)) {
        throw new Error(`${label} band identifiers must be unique`);
      }
      this.bandsById.set(band.id, band);
    }
    if (!Array.isArray(this.metadata.levels) || this.metadata.levels.length === 0) {
      throw new Error(`${label} requires an explicit level-zero overview`);
    }
    for (const level of this.metadata.levels) {
      if (!Number.isSafeInteger(level.level) || level.level < 0) {
        throw new Error(`${label} overview levels must be non-negative safe integers`);
      }
      if (this.levelsById.has(level.level)) {
        throw new Error(`${label} overview level identifiers must be unique`);
      }
      if (!isPositiveSafeInteger(level.width) || !isPositiveSafeInteger(level.height)) {
        throw new Error(`${label} overview dimensions must be positive safe integers`);
      }
      if (!isPositiveSafeInteger(level.tileWidth) || !isPositiveSafeInteger(level.tileHeight)) {
        throw new Error(`${label} tile dimensions must be positive safe integers`);
      }
      if (
        !Array.isArray(level.downsample) ||
        level.downsample.length !== 2 ||
        !level.downsample.every((value: number) => Number.isFinite(value) && value > 0)
      ) {
        throw new Error(`${label} overview downsample must contain two positive finite factors`);
      }
      if (
        level.width !== Math.ceil(this.metadata.width / level.downsample[0]) ||
        level.height !== Math.ceil(this.metadata.height / level.downsample[1])
      ) {
        throw new Error(`${label} overview dimensions must equal the ceiling of its downsample`);
      }
      if (level.level === 0 && (level.downsample[0] !== 1 || level.downsample[1] !== 1)) {
        throw new Error(`${label} level zero downsample must be exactly [1, 1]`);
      }
      this.levelsById.set(level.level, level);
    }
    if (!this.levelsById.has(0)) {
      throw new Error(`${label} requires an explicit level-zero overview`);
    }
  }

  private normalizeRequest(request: GPURasterTileRequest): NormalizedTileRequest {
    const label = this.metadata.id ?? 'gpu-raster-tile-source';
    if (!request || typeof request !== 'object') {
      throw new Error(`${label} requires an explicit tile request`);
    }
    if (!Number.isSafeInteger(request.level) || request.level < 0) {
      throw new Error(`${label} requested overview level must be a non-negative safe integer`);
    }
    const level = this.levelsById.get(request.level);
    if (!level) {
      throw new Error(`${label} does not expose requested overview level ${request.level}`);
    }
    if ((request.column === undefined) !== (request.row === undefined)) {
      throw new Error(`${label} tile column and row must be supplied together`);
    }
    if (
      request.column !== undefined &&
      (!Number.isSafeInteger(request.column) || request.column < 0)
    ) {
      throw new Error(`${label} tile column must be a non-negative safe integer`);
    }
    if (request.row !== undefined && (!Number.isSafeInteger(request.row) || request.row < 0)) {
      throw new Error(`${label} tile row must be a non-negative safe integer`);
    }
    const coordinateSpace = request.coordinateSpace ?? 'level';
    if (coordinateSpace !== 'level' && coordinateSpace !== 'level-zero') {
      throw new Error(`${label} coordinate space must be level or level-zero`);
    }

    const hasTileIdentity = request.column !== undefined && request.row !== undefined;
    const column = request.column ?? 0;
    const row = request.row ?? 0;
    const tileMinimumX = hasTileIdentity ? column * level.tileWidth : 0;
    const tileMinimumY = hasTileIdentity ? row * level.tileHeight : 0;
    if (
      !Number.isSafeInteger(tileMinimumX) ||
      !Number.isSafeInteger(tileMinimumY) ||
      tileMinimumX >= level.width ||
      tileMinimumY >= level.height
    ) {
      throw new Error(`${label} requested tile column or row lies outside the overview`);
    }
    const tileBounds: GPURasterPixelBounds = [
      tileMinimumX,
      tileMinimumY,
      hasTileIdentity ? Math.min(tileMinimumX + level.tileWidth, level.width) : level.width,
      hasTileIdentity ? Math.min(tileMinimumY + level.tileHeight, level.height) : level.height
    ];

    let requestedBounds = tileBounds;
    if (request.pixelBounds !== undefined) {
      validatePixelBounds(request.pixelBounds, `${label} requested pixel bounds`);
      requestedBounds =
        coordinateSpace === 'level-zero'
          ? [
              Math.floor(request.pixelBounds[0] / level.downsample[0]),
              Math.floor(request.pixelBounds[1] / level.downsample[1]),
              Math.ceil(request.pixelBounds[2] / level.downsample[0]),
              Math.ceil(request.pixelBounds[3] / level.downsample[1])
            ]
          : request.pixelBounds;
    }
    const bounds: GPURasterPixelBounds = [
      Math.max(tileBounds[0], Math.min(requestedBounds[0], level.width)),
      Math.max(tileBounds[1], Math.min(requestedBounds[1], level.height)),
      Math.min(tileBounds[2], Math.max(requestedBounds[2], 0)),
      Math.min(tileBounds[3], Math.max(requestedBounds[3], 0))
    ];
    if (bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) {
      throw new Error(`${label} requested pixel bounds do not intersect the selected tile`);
    }
    const pixelCount = (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]);
    if (!Number.isSafeInteger(pixelCount)) {
      throw new Error(`${label} requested tile pixel count must be a safe integer`);
    }
    const bandIds = this.normalizeBandIds(request.bandIds, label);
    const levelZeroBounds: GPURasterPixelBounds = [
      Math.max(0, Math.floor(bounds[0] * level.downsample[0])),
      Math.max(0, Math.floor(bounds[1] * level.downsample[1])),
      Math.min(this.metadata.width, Math.ceil(bounds[2] * level.downsample[0])),
      Math.min(this.metadata.height, Math.ceil(bounds[3] * level.downsample[1]))
    ];
    const normalizedRequest: GPURasterTileRequest = {
      level: level.level,
      ...(hasTileIdentity ? {column, row} : {}),
      bandIds,
      pixelBounds: bounds,
      coordinateSpace: 'level'
    };
    return {
      request: normalizedRequest,
      level,
      column,
      row,
      bounds,
      levelZeroBounds,
      bandIds,
      metadata: this.getTileMetadata(level, bounds)
    };
  }

  private normalizeBandIds(
    bandIds: readonly string[] | undefined,
    label: string
  ): readonly string[] {
    const requested = bandIds ?? this.metadata.bands.map(band => band.id);
    if (!Array.isArray(requested) || requested.length === 0) {
      throw new Error(`${label} requested bands must contain at least one identifier`);
    }
    const seen = new Set<string>();
    for (const bandId of requested) {
      if (typeof bandId !== 'string' || !this.bandsById.has(bandId)) {
        throw new Error(`${label} does not expose requested band ${String(bandId)}`);
      }
      if (seen.has(bandId)) {
        throw new Error(`${label} requested band identifiers must be unique`);
      }
      seen.add(bandId);
    }
    return Object.freeze([...requested]);
  }

  private getTileMetadata(
    level: GPURasterTileLevel,
    bounds: GPURasterPixelBounds
  ): GPURasterMetadata {
    const [
      horizontalScale,
      horizontalShear,
      horizontalOrigin,
      verticalShear,
      verticalScale,
      verticalOrigin
    ] = this.metadata.affine;
    const levelZeroX = bounds[0] * level.downsample[0];
    const levelZeroY = bounds[1] * level.downsample[1];
    const baseOrigin = this.metadata.levelZeroOrigin ?? [0, 0];
    return {
      width: bounds[2] - bounds[0],
      height: bounds[3] - bounds[1],
      affine: [
        horizontalScale * level.downsample[0],
        horizontalShear * level.downsample[1],
        horizontalOrigin + horizontalScale * levelZeroX + horizontalShear * levelZeroY,
        verticalShear * level.downsample[0],
        verticalScale * level.downsample[1],
        verticalOrigin + verticalShear * levelZeroX + verticalScale * levelZeroY
      ],
      pixelInterpretation: this.metadata.pixelInterpretation,
      ...(this.metadata.coordinateReferenceSystem
        ? {coordinateReferenceSystem: this.metadata.coordinateReferenceSystem}
        : {}),
      level: level.level,
      levelZeroOrigin: [baseOrigin[0] + levelZeroX, baseOrigin[1] + levelZeroY]
    };
  }

  private validateDecodedTile(
    decoded: GPURasterDecodedTile,
    expected: NormalizedTileRequest
  ): void {
    const label = this.metadata.id ?? 'gpu-raster-tile-source';
    if (!decoded || typeof decoded !== 'object') {
      throw new Error(`${label} decoder must return one decoded tile`);
    }
    if (
      decoded.level !== expected.level.level ||
      decoded.column !== expected.column ||
      decoded.row !== expected.row
    ) {
      throw new Error(`${label} decoder returned the wrong overview or tile identity`);
    }
    if (!haveMatchingBounds(decoded.pixelBounds, expected.bounds)) {
      throw new Error(`${label} decoder returned mismatched level pixel bounds`);
    }
    if (!haveMatchingBounds(decoded.levelZeroBounds, expected.levelZeroBounds)) {
      throw new Error(`${label} decoder returned mismatched level-zero pixel bounds`);
    }
    validateDecodedMetadata(decoded.metadata, expected.metadata, label);
    if (!Array.isArray(decoded.bands) || decoded.bands.length !== expected.bandIds.length) {
      throw new Error(`${label} decoder must return exactly the requested bands`);
    }
    const pixelCount = expected.metadata.width * expected.metadata.height;
    if (!Number.isSafeInteger(pixelCount)) {
      throw new Error(`${label} decoded tile pixel count must be a safe integer`);
    }
    for (const [index, band] of decoded.bands.entries()) {
      const requestedId = expected.bandIds[index];
      const declared = this.bandsById.get(requestedId);
      if (!band || !declared || band.id !== requestedId || band.format !== declared.format) {
        throw new Error(`${label} decoder returned a mismatched band identifier or format`);
      }
      if (
        !Object.is(band.noDataValue, declared.noDataValue) ||
        !Object.is(band.scale, declared.scale) ||
        !Object.is(band.offset, declared.offset)
      ) {
        throw new Error(`${label} decoder must preserve exact band nodata and calibration`);
      }
      if (
        (band.format === 'float32' && !(band.values instanceof Float32Array)) ||
        (band.format === 'uint32' && !(band.values instanceof Uint32Array)) ||
        (band.format === 'sint32' && !(band.values instanceof Int32Array))
      ) {
        throw new Error(`${label} decoder values must use the exact native typed-array format`);
      }
      if (band.values.length !== pixelCount) {
        throw new Error(`${label} decoder values must contain exactly one sample per pixel`);
      }
      if (
        band.validity !== undefined &&
        (!(band.validity instanceof Uint32Array) || band.validity.length !== pixelCount)
      ) {
        throw new Error(`${label} decoder validity must contain one uint32 flag per pixel`);
      }
    }
  }
}

function validateAffine(affine: GPURasterTileSourceMetadata['affine'], label: string): void {
  if (!Array.isArray(affine) || affine.length !== 6 || !affine.every(Number.isFinite)) {
    throw new Error(`${label} affine must contain six finite coefficients`);
  }
  const determinant = affine[0] * affine[4] - affine[1] * affine[3];
  if (!Number.isFinite(determinant) || determinant === 0) {
    throw new Error(`${label} affine must remain invertible`);
  }
}

function validateBandMetadata(band: GPURasterTileBandMetadata, label: string): void {
  if (!band || typeof band.id !== 'string' || band.id.length === 0) {
    throw new Error(`${label} requires a nonempty identifier`);
  }
  if (band.format !== 'float32' && band.format !== 'uint32' && band.format !== 'sint32') {
    throw new Error(`${label} format must be float32, uint32, or sint32`);
  }
  if (band.noDataValue !== undefined) {
    if (band.format === 'float32') {
      if (!Number.isNaN(band.noDataValue) && !Number.isFinite(Math.fround(band.noDataValue))) {
        throw new Error(`${label} float nodata must fit in float32 or be NaN`);
      }
    } else {
      const minimum = band.format === 'sint32' ? -2147483648 : 0;
      const maximum = band.format === 'sint32' ? 2147483647 : 4294967295;
      if (
        !Number.isSafeInteger(band.noDataValue) ||
        band.noDataValue < minimum ||
        band.noDataValue > maximum
      ) {
        throw new Error(`${label} nodata must fit in ${band.format}`);
      }
    }
  }
  if (band.scale !== undefined && !Number.isFinite(band.scale)) {
    throw new Error(`${label} calibration scale must be finite`);
  }
  if (band.offset !== undefined && !Number.isFinite(band.offset)) {
    throw new Error(`${label} calibration offset must be finite`);
  }
}

function validatePixelBounds(bounds: GPURasterPixelBounds, label: string): void {
  if (
    !Array.isArray(bounds) ||
    bounds.length !== 4 ||
    !bounds.every(Number.isSafeInteger) ||
    bounds[0] >= bounds[2] ||
    bounds[1] >= bounds[3]
  ) {
    throw new Error(`${label} must be a nonempty half-open safe-integer rectangle`);
  }
}

function haveMatchingBounds(first: GPURasterPixelBounds, second: GPURasterPixelBounds): boolean {
  return (
    Array.isArray(first) &&
    first.length === 4 &&
    first.every((coordinate, index) => coordinate === second[index])
  );
}

function validateDecodedMetadata(
  actual: GPURasterMetadata,
  expected: GPURasterMetadata,
  label: string
): void {
  if (
    !actual ||
    actual.width !== expected.width ||
    actual.height !== expected.height ||
    actual.level !== expected.level ||
    actual.pixelInterpretation !== expected.pixelInterpretation ||
    !Array.isArray(actual.affine) ||
    actual.affine.length !== 6 ||
    !actual.affine.every((coefficient, index) => coefficient === expected.affine[index]) ||
    !Array.isArray(actual.levelZeroOrigin) ||
    actual.levelZeroOrigin.length !== 2 ||
    !actual.levelZeroOrigin.every(
      (coordinate, index) => coordinate === expected.levelZeroOrigin?.[index]
    ) ||
    !hasMatchingCoordinateReferenceSystem(
      actual.coordinateReferenceSystem,
      expected.coordinateReferenceSystem
    )
  ) {
    throw new Error(`${label} decoder must preserve exact affine, CRS, origin, and pixel metadata`);
  }
}

function hasMatchingCoordinateReferenceSystem(
  first?: GPURasterCoordinateReferenceSystem,
  second?: GPURasterCoordinateReferenceSystem
): boolean {
  if (first === second) return true;
  if (!first || !second) return false;
  return (
    first.authority === second.authority &&
    first.wellKnownText === second.wellKnownText &&
    JSON.stringify(first.projectionJson) === JSON.stringify(second.projectionJson)
  );
}

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw signal.reason ?? new DOMException('Raster tile request was aborted', 'AbortError');
  }
}

function waitForDecodedTile(
  promise: Promise<GPURasterDecodedTile>,
  signal: AbortSignal
): Promise<GPURasterDecodedTile> {
  if (signal.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException('Raster tile request was aborted', 'AbortError')
    );
  }
  return new Promise((resolve, reject) => {
    let completed = false;
    const cleanup = (): void => {
      signal.removeEventListener('abort', abort);
    };
    const abort = (): void => {
      if (completed) return;
      completed = true;
      cleanup();
      reject(signal.reason ?? new DOMException('Raster tile request was aborted', 'AbortError'));
    };
    signal.addEventListener('abort', abort, {once: true});
    if (signal.aborted) {
      abort();
      return;
    }
    promise.then(
      decoded => {
        if (completed) return;
        completed = true;
        cleanup();
        if (signal.aborted) {
          reject(
            signal.reason ?? new DOMException('Raster tile request was aborted', 'AbortError')
          );
        } else {
          resolve(decoded);
        }
      },
      error => {
        if (completed) return;
        completed = true;
        cleanup();
        reject(error);
      }
    );
  });
}
