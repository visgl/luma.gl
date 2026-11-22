// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';

/**
 * Returns the byte alignment required for storage-binding offsets on `device`.
 * Devices without a requirement (WebGL, NullDevice) report 0, which is returned as 1.
 */
export function getStorageBufferOffsetAlignment(device: Device): number {
  return Math.max(device.limits.minStorageBufferOffsetAlignment || 1, 1);
}

/**
 * Throws when a storage view does not start at a multiple of the device's
 * `minStorageBufferOffsetAlignment`. WebGPU rejects such bindings, and the offset
 * cannot be moved without changing how the shader indexes the view.
 * @param owner Class or helper that builds the binding, used in the error text.
 * @param name Binding or column name.
 * @param batchIndex Index of the batch or chunk that holds the view.
 * @param byteOffset Byte offset of the view in its buffer.
 */
export function assertStorageBufferOffsetAligned(
  device: Device,
  owner: string,
  name: string,
  batchIndex: number,
  byteOffset: number
): void {
  const alignment = getStorageBufferOffsetAlignment(device);
  if (byteOffset % alignment !== 0) {
    throw new Error(
      `${owner} "${name}" batch ${batchIndex} starts at byte ${byteOffset}, which is not a multiple of minStorageBufferOffsetAlignment (${alignment})`
    );
  }
}
