// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, assert, type Device} from '@luma.gl/core';

/** Engine-owned aligned uniform slots, reused between submitted batch draws. */
export class BatchUniformBuffer {
  private buffer?: Buffer;
  private byteOffset = 0;

  constructor(private readonly device: Device) {}

  /** Reserves the entire call before drawing, so growth cannot invalidate an earlier batch. */
  prepare(byteLength: number): void {
    if (!this.buffer || this.buffer.byteLength < byteLength) {
      const capacity = Math.max(1024, (this.buffer?.byteLength ?? 0) * 2, byteLength);
      const buffer = this.device.createBuffer({
        id: 'batch-uniforms',
        byteLength: capacity,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
      this.buffer?.destroy();
      this.buffer = buffer;
    }
    this.byteOffset = 0;
  }

  /** Returns the aligned slot size required for a uniform block. */
  getAlignedByteLength(byteLength: number): number {
    const alignment = this.device.limits.minUniformBufferOffsetAlignment || 1;
    return Math.ceil(byteLength / alignment) * alignment;
  }

  /** Writes one slot without overwriting earlier batches in this call. */
  write(data: Uint8Array): {buffer: Buffer; offset: number; size: number} {
    // prepare() must reserve enough space for all blocks in all batches before drawing.
    assert(this.buffer && this.byteOffset + data.byteLength <= this.buffer.byteLength);
    const binding = {buffer: this.buffer, offset: this.byteOffset, size: data.byteLength};
    this.buffer.write(data, binding.offset);
    this.byteOffset += this.getAlignedByteLength(data.byteLength);
    return binding;
  }

  /** Releases the model-owned allocation. */
  destroy(): void {
    this.buffer?.destroy();
    this.buffer = undefined;
    this.byteOffset = 0;
  }
}
