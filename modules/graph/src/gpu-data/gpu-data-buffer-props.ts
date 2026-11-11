// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type BufferProps, type Device} from '@luma.gl/core';

export const PORTABLE_GPU_DATA_USAGE =
  Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST;

/** Usage defaults for general-purpose GPUData backing storage. */
export function getGPUDataBufferProps(
  device: Device,
  indexType: BufferProps['indexType'] = 'uint32'
): Pick<BufferProps, 'usage' | 'indexType'> {
  const usage = PORTABLE_GPU_DATA_USAGE;
  if (device.type !== 'webgpu') {
    // WebGL fixes the buffer target on first bind, so INDEX would prevent vertex use.
    return {usage};
  }
  return {
    usage: usage | Buffer.INDEX | Buffer.UNIFORM | Buffer.INDIRECT | Buffer.QUERY_RESOLVE,
    // Explicit index metadata prevents Device from widening raw Uint8Array uploads.
    indexType
  };
}
