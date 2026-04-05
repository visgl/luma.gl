// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Buffer} from '@luma.gl/core';

class BufferPool {
  overAlloc: number = 2;
  poolSize: number = 100;

  private bufferPools: Map<Device, Buffer[]>;

  constructor() {
    this.bufferPools = new Map();
  }

  createOrReuse(device: Device, byteLength: number): Buffer {
    const pool = this.bufferPools.get(device);
    const i = pool ? pool.findIndex(b => b.byteLength >= byteLength) : -1;
    if (i < 0) {
      return device.createBuffer({
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: byteLength * this.overAlloc
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
    while (this.poolSize && pool.length > this.poolSize) {
      // Drop the smallest one
      pool.shift()!.destroy();
    }
  }
}

export const bufferPool = new BufferPool();
