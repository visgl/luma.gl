// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {GraphBufferHandle, GraphDataView} from '../gpu-primitives/gpu-command-graph';
import {
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import type {GPUVolumeBufferChannel, GPUVolumeMetadata, GPUVolumeScalarFormat} from './types';

export const VOLUME_WORKGROUP_DIMENSION = 4;
export const MAXIMUM_VOLUME_VOXEL_COUNT = 0xffffffff;

export type VolumeDimensions = Pick<GPUVolumeMetadata, 'width' | 'height' | 'depth'>;
export type VolumeResourceOwner = GraphBufferHandle['graph'];

/** Validates an explicit three-dimensional physical grid without allocating GPU resources. */
export function validateVolumeMetadata(metadata: GPUVolumeMetadata, label: string): number {
  const voxelCount = validateVolumeDimensions(metadata, label);
  if (
    metadata.spacing.length !== 3 ||
    !metadata.spacing.every(value => Number.isFinite(value) && value > 0)
  ) {
    throw new Error(`${label} spacing must contain three positive finite values`);
  }
  if (metadata.origin.length !== 3 || !metadata.origin.every(Number.isFinite)) {
    throw new Error(`${label} origin must contain three finite values`);
  }
  if (metadata.direction.length !== 9 || !metadata.direction.every(Number.isFinite)) {
    throw new Error(`${label} direction must contain nine finite values`);
  }
  const directionDeterminant = getDirectionDeterminant(metadata.direction);
  if (!Number.isFinite(directionDeterminant) || directionDeterminant === 0) {
    throw new Error(`${label} direction must be invertible`);
  }
  if (metadata.voxelInterpretation !== 'cell' && metadata.voxelInterpretation !== 'point') {
    throw new Error(`${label} voxelInterpretation must be cell or point`);
  }
  return voxelCount;
}

/** Validates positive dimensions whose x-fastest linear indices fit in uint32. */
export function validateVolumeDimensions(dimensions: VolumeDimensions, label: string): number {
  if (
    !Number.isSafeInteger(dimensions.width) ||
    dimensions.width <= 0 ||
    !Number.isSafeInteger(dimensions.height) ||
    dimensions.height <= 0 ||
    !Number.isSafeInteger(dimensions.depth) ||
    dimensions.depth <= 0
  ) {
    throw new Error(`${label} dimensions must be positive safe integers`);
  }
  const voxelCount = dimensions.width * dimensions.height * dimensions.depth;
  if (!Number.isSafeInteger(voxelCount) || voxelCount > MAXIMUM_VOLUME_VOXEL_COUNT) {
    throw new Error(`${label} voxel count must fit in uint32`);
  }
  return voxelCount;
}

/** Returns and validates the one graph that owns a borrowed volume channel. */
export function validateVolumeChannel(
  channel: GPUVolumeBufferChannel,
  dimensions: VolumeDimensions,
  label: string
): VolumeResourceOwner {
  if (!channel.id) {
    throw new Error(`${label} channel requires an identifier`);
  }
  if (!isVolumeScalarFormat(channel.format)) {
    throw new Error(`${label} channel format must be float32, uint32, or sint32`);
  }
  const voxelCount = validateVolumeDimensions(dimensions, label);
  validateVolumeScalarView(channel.values, channel.format, voxelCount, `${label} values`);
  if (channel.validity) {
    validateVolumeValidityView(channel.validity, voxelCount, `${label} validity`);
    if (channel.validity.buffer.graph !== channel.values.buffer.graph) {
      throw new Error(`${label} validity must belong to the same graph`);
    }
    if (channel.validity.buffer === channel.values.buffer) {
      throw new Error(`${label} values and validity must use separate buffers`);
    }
  }
  validateVolumeNoDataValue(channel.noDataValue, channel.format, label);
  if (channel.scale !== undefined && !Number.isFinite(channel.scale)) {
    throw new Error(`${label} scale must be finite`);
  }
  if (channel.offset !== undefined && !Number.isFinite(channel.offset)) {
    throw new Error(`${label} offset must be finite`);
  }
  return channel.values.buffer.graph;
}

/** Validates one packed scalar view with exactly one row per volume voxel. */
export function validateVolumeScalarView(
  view: GraphDataView,
  format: GPUVolumeScalarFormat,
  voxelCount: number,
  label: string
): void {
  validatePackedView(view, [format], label);
  if (view.length !== voxelCount) {
    throw new Error(`${label} must contain exactly one sample per voxel`);
  }
}

/** Validates one non-owning source-aligned uint32 validity mask. */
export function validateVolumeValidityView(
  view: GraphDataView,
  voxelCount: number,
  label: string
): void {
  validatePackedUint32View(view, label);
  if (view.length !== voxelCount) {
    throw new Error(`${label} must contain exactly one flag per voxel`);
  }
}

/** Validates a portable three-dimensional dispatch before encoding. */
export function getVolumeDispatchSize(
  device: Device,
  width: number,
  height: number,
  depth: number,
  label: string
): readonly [number, number, number] {
  const dimension = VOLUME_WORKGROUP_DIMENSION;
  const invocationCount = dimension * dimension * dimension;
  if (
    device.limits.maxComputeInvocationsPerWorkgroup < invocationCount ||
    device.limits.maxComputeWorkgroupSizeX < dimension ||
    device.limits.maxComputeWorkgroupSizeY < dimension ||
    device.limits.maxComputeWorkgroupSizeZ < dimension
  ) {
    throw new Error(`${label} exceeds device workgroup limits`);
  }
  const dispatch: readonly [number, number, number] = [
    Math.ceil(width / dimension),
    Math.ceil(height / dimension),
    Math.ceil(depth / dimension)
  ];
  if (dispatch.some(value => value > device.limits.maxComputeWorkgroupsPerDimension)) {
    throw new Error(`${label} exceeds device dispatch limits`);
  }
  return dispatch;
}

/** Rejects a packed view whose aligned binding would exceed the current device limit. */
export function assertVolumeStorageBindingFits(
  device: Device,
  view: GraphDataView,
  label: string
): void {
  const byteLength = (view.byteOffset % 256) + view.length * view.rowByteLength;
  if (byteLength > device.limits.maxStorageBufferBindingSize) {
    throw new Error(`${label} exceeds the device storage binding limit`);
  }
}

/** Returns the WGSL scalar representation for one exact GPU sample format. */
export function getVolumeShaderScalarType(format: GPUVolumeScalarFormat): 'f32' | 'u32' | 'i32' {
  switch (format) {
    case 'float32':
      return 'f32';
    case 'uint32':
      return 'u32';
    case 'sint32':
      return 'i32';
  }
}

/** Formats a representable finite float32 value for a generated WGSL expression. */
export function getVolumeFloatLiteral(value: number): string {
  const roundedValue = Math.fround(value);
  if (!Number.isFinite(roundedValue)) {
    throw new Error('Volume calibration must fit in finite float32 values');
  }
  if (Object.is(roundedValue, -0)) return '-0.0';
  const literal = String(roundedValue);
  return literal.includes('.') || literal.includes('e') ? literal : `${literal}.0`;
}

/** Formats a scalar nodata sentinel without converting large uint32 values through float32. */
export function getVolumeScalarLiteral(value: number, format: GPUVolumeScalarFormat): string {
  if (format === 'float32') return getVolumeFloatLiteral(value);
  if (format === 'uint32') return `${value}u`;
  return value === -2147483648 ? '(-2147483647i - 1i)' : `${value}i`;
}

/** Returns the determinant of a row-major 3x3 matrix. */
export function getDirectionDeterminant(direction: GPUVolumeMetadata['direction']): number {
  const [a, b, c, d, e, f, g, h, i] = direction;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

function isVolumeScalarFormat(format: string): format is GPUVolumeScalarFormat {
  return format === 'float32' || format === 'uint32' || format === 'sint32';
}

function validateVolumeNoDataValue(
  value: number | undefined,
  format: GPUVolumeScalarFormat,
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
