// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, TextureFormat} from '@luma.gl/core';
import type {
  GraphBufferHandle,
  GraphDataView,
  GraphTextureView
} from '../gpu-core/gpu-command-graph';
import {validatePackedUint32View, validatePackedView} from '../gpu-core/graph-data-view-utils';
import type {
  GPURasterBand,
  GPURasterCoordinateReferenceSystem,
  GPURasterMetadata,
  GPURasterScalarFormat,
  GPURasterTextureFormat
} from './types';

export const RASTER_WORKGROUP_DIMENSION = 8;
export const MAXIMUM_RASTER_PIXEL_COUNT = 0xffffffff;

export type RasterResourceOwner = GraphBufferHandle['graph'];

/** Validates an explicit two-dimensional grid without allocating GPU resources. */
export function validateRasterMetadata(metadata: GPURasterMetadata, label: string): number {
  if (
    !Number.isSafeInteger(metadata.width) ||
    metadata.width <= 0 ||
    !Number.isSafeInteger(metadata.height) ||
    metadata.height <= 0
  ) {
    throw new Error(`${label} dimensions must be positive integers`);
  }
  const pixelCount = metadata.width * metadata.height;
  if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
    throw new Error(`${label} pixel count must fit in uint32`);
  }
  if (metadata.affine.length !== 6 || !metadata.affine.every(Number.isFinite)) {
    throw new Error(`${label} affine must contain six finite coefficients`);
  }
  const determinant =
    metadata.affine[0] * metadata.affine[4] - metadata.affine[1] * metadata.affine[3];
  if (!Number.isFinite(determinant) || determinant === 0) {
    throw new Error(`${label} affine must be invertible`);
  }
  if (metadata.pixelInterpretation !== 'area' && metadata.pixelInterpretation !== 'point') {
    throw new Error(`${label} pixelInterpretation must be area or point`);
  }
  if (
    metadata.level !== undefined &&
    (!Number.isSafeInteger(metadata.level) || metadata.level < 0)
  ) {
    throw new Error(`${label} overview level must be a non-negative integer`);
  }
  if (
    metadata.levelZeroOrigin &&
    (metadata.levelZeroOrigin.length !== 2 || !metadata.levelZeroOrigin.every(Number.isFinite))
  ) {
    throw new Error(`${label} levelZeroOrigin must contain two finite coordinates`);
  }
  return pixelCount;
}

/** Returns and validates the one graph that owns a borrowed raster representation. */
export function validateRasterBand(
  band: GPURasterBand,
  metadata: Pick<GPURasterMetadata, 'width' | 'height'>,
  label: string
): RasterResourceOwner {
  if (!band.id) {
    throw new Error(`${label} band requires an identifier`);
  }
  if (!isRasterScalarFormat(band.format)) {
    throw new Error(`${label} band format must be float32, uint32, or sint32`);
  }
  const pixelCount = metadata.width * metadata.height;
  let owner: RasterResourceOwner;
  if (band.storage.kind === 'buffer') {
    validateRasterScalarView(band.storage.values, band.format, pixelCount, `${label} values`);
    owner = band.storage.values.buffer.graph;
  } else if (band.storage.kind === 'texture') {
    const {view, channel = 0} = band.storage;
    validateRasterTextureView(view, band.format, `${label} texture`);
    if (view.width !== metadata.width || view.height !== metadata.height) {
      throw new Error(`${label} texture extent must match the raster grid`);
    }
    validateRasterTextureChannel(view.format, channel, `${label} channel`);
    owner = view.texture.graph;
  } else {
    throw new Error(`${label} storage must be a buffer or texture`);
  }
  if (band.validity) {
    validateRasterValidityView(band.validity, pixelCount, `${label} validity`);
    if (band.validity.buffer.graph !== owner) {
      throw new Error(`${label} validity must belong to the same graph`);
    }
  }
  validateRasterNoDataValue(band.noDataValue, band.format, label);
  if (band.scale !== undefined && !Number.isFinite(band.scale)) {
    throw new Error(`${label} scale must be finite`);
  }
  if (band.offset !== undefined && !Number.isFinite(band.offset)) {
    throw new Error(`${label} offset must be finite`);
  }
  return owner;
}

/** Validates one packed scalar view with exactly one row per raster pixel. */
export function validateRasterScalarView(
  view: GraphDataView,
  format: GPURasterScalarFormat,
  pixelCount: number,
  label: string
): void {
  validatePackedView(view, [format], label);
  if (view.length !== pixelCount) {
    throw new Error(`${label} must contain exactly one sample per pixel`);
  }
}

/** Validates one non-owning source-aligned uint32 validity mask. */
export function validateRasterValidityView(
  view: GraphDataView,
  pixelCount: number,
  label: string
): void {
  validatePackedUint32View(view, label);
  if (view.length !== pixelCount) {
    throw new Error(`${label} must contain exactly one flag per pixel`);
  }
}

/** Requires exactly one selected 2D mip and array layer with a matching scalar format. */
export function validateRasterTextureView(
  view: GraphTextureView,
  format: GPURasterScalarFormat,
  label: string
): void {
  if (view.dimension !== '2d' || view.mipLevelCount !== 1 || view.arrayLayerCount !== 1) {
    throw new Error(`${label} must select one 2D mip and array layer`);
  }
  if (view.texture.samples !== 1) {
    throw new Error(`${label} must be single-sampled`);
  }
  const scalarFormat = `r32${getRasterTextureFormatSuffix(format)}`;
  const packedFormat = `rgba32${getRasterTextureFormatSuffix(format)}`;
  if (view.format !== scalarFormat && view.format !== packedFormat) {
    throw new Error(`${label} format must preserve ${format} samples`);
  }
}

/** Rejects channels that are absent from the selected texture format. */
export function validateRasterTextureChannel(
  format: TextureFormat,
  channel: number,
  label: string
): void {
  const channelCount = format.startsWith('rgba') ? 4 : 1;
  if (!Number.isInteger(channel) || channel < 0 || channel >= channelCount) {
    throw new Error(`${label} exceeds the texture channel count`);
  }
}

/** Validates a portable two-dimensional dispatch before encoding. */
export function getRasterDispatchSize(
  device: Device,
  width: number,
  height: number,
  label: string
): readonly [number, number] {
  const invocationCount = RASTER_WORKGROUP_DIMENSION * RASTER_WORKGROUP_DIMENSION;
  if (
    device.limits.maxComputeInvocationsPerWorkgroup < invocationCount ||
    device.limits.maxComputeWorkgroupSizeX < RASTER_WORKGROUP_DIMENSION ||
    device.limits.maxComputeWorkgroupSizeY < RASTER_WORKGROUP_DIMENSION
  ) {
    throw new Error(`${label} exceeds device workgroup limits`);
  }
  const horizontalCount = Math.ceil(width / RASTER_WORKGROUP_DIMENSION);
  const verticalCount = Math.ceil(height / RASTER_WORKGROUP_DIMENSION);
  if (
    horizontalCount > device.limits.maxComputeWorkgroupsPerDimension ||
    verticalCount > device.limits.maxComputeWorkgroupsPerDimension
  ) {
    throw new Error(`${label} exceeds device dispatch limits`);
  }
  return [horizontalCount, verticalCount];
}

/** Rejects a packed view whose aligned binding would exceed the current device limit. */
export function assertRasterStorageBindingFits(
  device: Device,
  view: GraphDataView,
  label: string
): void {
  // Shared graph bindings are rounded down to the portable 256-byte storage alignment.
  const byteLength = (view.byteOffset % 256) + view.length * view.rowByteLength;
  if (byteLength > device.limits.maxStorageBufferBindingSize) {
    throw new Error(`${label} exceeds the device storage binding limit`);
  }
}

/** Returns a WGSL scalar representation for one exact GPU sample format. */
export function getRasterShaderScalarType(format: GPURasterScalarFormat): 'f32' | 'u32' | 'i32' {
  switch (format) {
    case 'float32':
      return 'f32';
    case 'uint32':
      return 'u32';
    case 'sint32':
      return 'i32';
  }
}

/** Chooses the unfilterable sampled-texture binding required by raw float32 texel loads. */
export function getRasterTextureSampleType(
  format: GPURasterScalarFormat
): 'unfilterable-float' | 'uint' | 'sint' {
  switch (format) {
    case 'float32':
      return 'unfilterable-float';
    case 'uint32':
      return 'uint';
    case 'sint32':
      return 'sint';
  }
}

/** Formats a representable finite float32 value for a generated WGSL expression. */
export function getRasterFloatLiteral(value: number): string {
  const roundedValue = Math.fround(value);
  if (!Number.isFinite(roundedValue)) {
    throw new Error('Raster calibration must fit in finite float32 values');
  }
  if (Object.is(roundedValue, -0)) return '-0.0';
  const literal = String(roundedValue);
  return literal.includes('.') || literal.includes('e') ? literal : `${literal}.0`;
}

/** Formats a scalar nodata sentinel without converting large uint32 values through float32. */
export function getRasterScalarLiteral(value: number, format: GPURasterScalarFormat): string {
  if (format === 'float32') return getRasterFloatLiteral(value);
  if (format === 'uint32') return `${value}u`;
  return value === -2147483648 ? '(-2147483647i - 1i)' : `${value}i`;
}

/** Returns whether two opaque CRS descriptions are conservatively identical. */
export function hasMatchingRasterCoordinateReferenceSystem(
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

/** Converts one scalar format into its corresponding texture suffix. */
export function getRasterTextureFormatSuffix(
  format: GPURasterScalarFormat
): 'float' | 'uint' | 'sint' {
  switch (format) {
    case 'float32':
      return 'float';
    case 'uint32':
      return 'uint';
    case 'sint32':
      return 'sint';
  }
}

/** Returns the scalar representation implied by a supported raster texture. */
export function getRasterScalarFormatFromTexture<Format extends GPURasterScalarFormat>(
  format: GPURasterTextureFormat<Format>
): GPURasterScalarFormat {
  if (format.endsWith('float')) return 'float32';
  if (format.endsWith('uint')) return 'uint32';
  return 'sint32';
}

function isRasterScalarFormat(format: string): format is GPURasterScalarFormat {
  return format === 'float32' || format === 'uint32' || format === 'sint32';
}

function validateRasterNoDataValue(
  value: number | undefined,
  format: GPURasterScalarFormat,
  label: string
): void {
  if (value === undefined || (format === 'float32' && Number.isNaN(value))) return;
  if (format === 'float32') {
    if (!Number.isFinite(Math.fround(value))) {
      throw new Error(`${label} nodata must be a float32 value or NaN`);
    }
    return;
  }
  const minimum = format === 'sint32' ? -2147483648 : 0;
  const maximum = format === 'sint32' ? 2147483647 : 4294967295;
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} nodata must fit in ${format}`);
  }
}
