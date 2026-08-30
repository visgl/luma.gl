// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

const DEFAULT_RASTER_WORKGROUP_SIZE = 256;
const DEFAULT_RASTER_BYTES_PER_ELEMENT = Uint32Array.BYTES_PER_ELEMENT;
const GRAPH_STORAGE_BUFFER_OFFSET_ALIGNMENT = 256;

/** Workgroup and packed storage assumptions used when evaluating raster capabilities. */
export type RasterDeviceLimitsOptions = {
  /** Number of invocations in one one-dimensional compute workgroup. Defaults to 256. */
  workgroupSize?: number;
  /** Number of packed storage bytes occupied by each raster element. Defaults to four. */
  bytesPerElement?: number;
};

/** Effective device and per-dispatch storage limits for packed raster processing. */
export type RasterDeviceLimits = {
  /** Requested one-dimensional compute workgroup size. */
  workgroupSize: number;
  /** Packed storage bytes occupied by each raster element. */
  bytesPerElement: number;
  /** Largest supported width or height of a single two-dimensional texture. */
  maxTextureDimension2D: number;
  /** Largest supported invocation count in one compute workgroup. */
  maxComputeInvocationsPerWorkgroup: number;
  /** Largest supported X dimension of one compute workgroup. */
  maxComputeWorkgroupSizeX: number;
  /** Largest supported number of workgroups in one dispatch dimension. */
  maxComputeWorkgroupsPerDimension: number;
  /** Largest byte length of one storage-buffer binding. */
  maxStorageBufferBindingByteLength: number;
  /** Largest byte length of one physical buffer allocation. */
  maxBufferByteLength: number;
  /** Effective graph and adapter byte alignment of storage-buffer binding offsets. */
  storageBufferOffsetAlignment: number;
  /** Largest number of elements covered by a single one-dimensional dispatch. */
  maxDispatchElementCount: number;
  /** Largest number of tightly packed elements in one aligned storage binding. */
  maxStorageBufferBindingElementCount: number;
  /** Largest number of tightly packed elements in one physical buffer. */
  maxBufferElementCount: number;
  /** Largest number of tightly packed elements satisfying both dispatch and storage limits. */
  maxStripeElementCount: number;
};

/** Packed raster dimensions and optional capability overrides for scanline stripe planning. */
export type RasterDispatchStripeOptions = RasterDeviceLimitsOptions & {
  /** Number of packed elements in one complete raster scanline. */
  width: number;
  /** Number of raster scanlines to cover in source order. */
  height: number;
};

/** One complete-scanline dispatch with an offset-aligned storage-buffer binding. */
export type RasterDispatchStripe = {
  /** Zero-based index of the first raster scanline covered by this dispatch. */
  rowOffset: number;
  /** Number of complete raster scanlines covered by this dispatch. */
  rowCount: number;
  /** Zero-based packed element offset within the complete raster. */
  elementOffset: number;
  /** Number of packed raster elements processed by this dispatch. */
  elementCount: number;
  /** Logical packed byte offset within the complete raster. */
  byteOffset: number;
  /** Logical byte length of the raster elements processed by this dispatch. */
  byteLength: number;
  /** Offset-aligned byte position used by a storage-buffer binding. */
  bindingByteOffset: number;
  /** Bound byte length, including bytes preceding the logical stripe offset. */
  bindingByteLength: number;
  /** Number of one-dimensional compute workgroups required for this stripe. */
  workgroupCount: number;
};

/**
 * Returns raster-relevant WebGPU limits and gates unsupported fixed-size workgroups.
 *
 * Shared reduction, histogram, and scan primitives currently require the default 256-invocation
 * workgroup. Raster kernels with their own smaller workgroups can explicitly request a different
 * `workgroupSize`, including 128 on adapters that cannot run those shared primitives.
 */
export function getRasterDeviceLimits(
  device: Device,
  options: RasterDeviceLimitsOptions = {}
): RasterDeviceLimits {
  if (device.type !== 'webgpu') {
    throw new Error('Raster compute requires a WebGPU device');
  }

  const workgroupSize = options.workgroupSize ?? DEFAULT_RASTER_WORKGROUP_SIZE;
  const bytesPerElement = options.bytesPerElement ?? DEFAULT_RASTER_BYTES_PER_ELEMENT;
  if (!Number.isSafeInteger(workgroupSize) || workgroupSize <= 0) {
    throw new Error('Raster workgroup size must be a positive safe integer');
  }
  if (!Number.isSafeInteger(bytesPerElement) || bytesPerElement <= 0) {
    throw new Error('Raster bytes per element must be a positive safe integer');
  }

  const {
    maxTextureDimension2D,
    maxComputeInvocationsPerWorkgroup,
    maxComputeWorkgroupSizeX,
    maxComputeWorkgroupsPerDimension,
    maxStorageBufferBindingSize,
    maxBufferSize,
    minStorageBufferOffsetAlignment
  } = device.limits;

  if (
    workgroupSize > maxComputeInvocationsPerWorkgroup ||
    workgroupSize > maxComputeWorkgroupSizeX
  ) {
    throw new Error(`Raster workgroup size ${workgroupSize} exceeds device compute limits`);
  }

  const maxDispatchElementCount = maxComputeWorkgroupsPerDimension * workgroupSize;
  const maxStorageBufferBindingElementCount = Math.floor(
    maxStorageBufferBindingSize / bytesPerElement
  );
  const maxBufferElementCount = Math.floor(maxBufferSize / bytesPerElement);
  const maxStripeElementCount = Math.min(
    maxDispatchElementCount,
    maxStorageBufferBindingElementCount,
    maxBufferElementCount
  );
  if (!Number.isSafeInteger(maxDispatchElementCount) || maxStripeElementCount < 1) {
    throw new Error('Raster device limits cannot accommodate one packed element');
  }

  return {
    workgroupSize,
    bytesPerElement,
    maxTextureDimension2D,
    maxComputeInvocationsPerWorkgroup,
    maxComputeWorkgroupSizeX,
    maxComputeWorkgroupsPerDimension,
    maxStorageBufferBindingByteLength: maxStorageBufferBindingSize,
    maxBufferByteLength: maxBufferSize,
    storageBufferOffsetAlignment: Math.max(
      GRAPH_STORAGE_BUFFER_OFFSET_ALIGNMENT,
      minStorageBufferOffsetAlignment
    ),
    maxDispatchElementCount,
    maxStorageBufferBindingElementCount,
    maxBufferElementCount,
    maxStripeElementCount
  };
}

/**
 * Partitions a packed raster into ordered complete-scanline dispatches.
 *
 * Every stripe respects the one-dimensional dispatch-workgroup limit, storage-binding byte limit,
 * physical buffer byte limit, and binding-offset alignment prefix. Callers processing a raster
 * larger than `maxBufferByteLength` must materialize separate physical stripe or tile buffers.
 */
export function planRasterDispatchStripes(
  device: Device,
  options: RasterDispatchStripeOptions
): RasterDispatchStripe[] {
  const {width, height} = options;
  if (!Number.isSafeInteger(width) || width <= 0) {
    throw new Error('Raster dispatch width must be a positive safe integer');
  }
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error('Raster dispatch height must be a positive safe integer');
  }
  if (!Number.isSafeInteger(width * height)) {
    throw new Error('Raster dispatch element count must be a safe integer');
  }

  const limits = getRasterDeviceLimits(device, options);
  const stripes: RasterDispatchStripe[] = [];
  let rowOffset = 0;

  while (rowOffset < height) {
    const elementOffset = rowOffset * width;
    const byteOffset = elementOffset * limits.bytesPerElement;
    const bindingByteOffset =
      Math.floor(byteOffset / limits.storageBufferOffsetAlignment) *
      limits.storageBufferOffsetAlignment;
    const bindingPrefixByteLength = byteOffset - bindingByteOffset;
    const maxBoundElementCount = Math.floor(
      (Math.min(limits.maxStorageBufferBindingByteLength, limits.maxBufferByteLength) -
        bindingPrefixByteLength) /
        limits.bytesPerElement
    );
    const maxStripeElementCount = Math.min(limits.maxDispatchElementCount, maxBoundElementCount);
    const rowCount = Math.min(height - rowOffset, Math.floor(maxStripeElementCount / width));
    if (rowCount < 1) {
      throw new Error('Raster device limits cannot accommodate one complete scanline');
    }

    const elementCount = rowCount * width;
    const byteLength = elementCount * limits.bytesPerElement;
    stripes.push({
      rowOffset,
      rowCount,
      elementOffset,
      elementCount,
      byteOffset,
      byteLength,
      bindingByteOffset,
      bindingByteLength: bindingPrefixByteLength + byteLength,
      workgroupCount: Math.ceil(elementCount / limits.workgroupSize)
    });
    rowOffset += rowCount;
  }

  return stripes;
}
