// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferProps} from '@luma.gl/core';
import {Buffer, assert} from '@luma.gl/core';
import type {NullDevice} from '../null-device';

export class NullBuffer extends Buffer {
  device: NullDevice;

  byteLength: number;

  constructor(device: NullDevice, props: BufferProps = {}) {
    super(device, props);
    this.device = device;

    const byteOffset = props.byteOffset || 0;
    const byteLength = props.byteLength ?? (props.data ? props.data.byteLength + byteOffset : 0);

    assert(byteLength >= 0);

    this.byteLength = byteLength;
    this.trackAllocatedMemory(byteLength);
  }

  override destroy(): void {
    if (!this.destroyed) {
      super.destroy();
      this.trackDeallocatedMemory();
    }
  }

  async readAsync(byteOffset = 0, byteLength?: number): Promise<Uint8Array> {
    byteLength = byteLength ?? this.byteLength - byteOffset;
    return new Uint8Array(byteLength);
  }

  write(data: ArrayBufferView, byteOffset: number = 0): void {
    assert(data.byteLength + byteOffset <= this.byteLength);
  }
}
