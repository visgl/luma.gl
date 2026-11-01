// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Device, Buffer} from '@luma.gl/core';

class BufferPool {
  poolSize: number = 20;

  private bufferPools: Map<Device, Buffer[]>;

  constructor() {
    this.bufferPools = new Map();
  }

  createOrReuse(device: Device, byteLength: number): Buffer {
    if (byteLength > device.limits.maxBufferSize) {
      throw new Error(
        `Buffer pool cannot allocate ${byteLength} bytes: device.limits.maxBufferSize is ${device.limits.maxBufferSize}`
      );
    }

    const pool = this.bufferPools.get(device);
    const i = pool ? pool.findIndex(b => b.byteLength >= byteLength) : -1;
    if (i < 0) {
      return device.createBuffer({
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength
      });
    }
    const [result] = pool!.splice(i, 1);
    return result;
  }

  recycle(buffer: Buffer) {
    const device = buffer.device;
    if (!this.bufferPools.has(device)) {
      this.bufferPools.set(device, []);
    }
    const pool = this.bufferPools.get(device)!;
    // Sort buffers by increasing size
    const i = pool.findIndex(b => b.byteLength > buffer.byteLength);
    if (i < 0) {
      pool.push(buffer);
    } else {
      pool.splice(i, 0, buffer);
    }
    // Bound every pool and discard entries for devices that became unusable since the last recycle.
    this.purge();
  }

  /** Destroys the smallest cached buffers until every device pool satisfies `poolSize`. */
  purge(): void {
    for (const [device, pool] of this.bufferPools) {
      const targetSize = device.isLost ? 0 : this.poolSize;
      while (pool.length > targetSize) {
        pool.shift()!.destroy();
      }
      if (pool.length === 0) {
        this.bufferPools.delete(device);
      }
    }
  }
}

export const bufferPool = new BufferPool();
