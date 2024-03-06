// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';
import type {Buffer, VertexArrayProps} from '@luma.gl/core';
import {VertexArray} from '@luma.gl/core';

import type {NullDevice} from '../null-device';

export class NullVertexArray extends VertexArray {
  device: NullDevice;

  // Create a VertexArray
  constructor(device: NullDevice, props: VertexArrayProps) {
    super(device, props);
    this.device = device;
  }

  setIndexBuffer(indexBuffer: Buffer | null): void {
    this.indexBuffer = indexBuffer;
  }

  /** Set a location in vertex attributes array to a buffer, enables the location, sets divisor */
  setBuffer(location: number, attributeBuffer: Buffer): void {
    const attributeInfo = this.attributeInfos[location];
    if (!attributeInfo) {
      throw new Error(`Unknown attribute location ${location}`);
    }
    this.attributes[location] = attributeBuffer;
  }

  bindBeforeRender(): void {}

  unbindAfterRender(): void {}

  override setConstantWebGL(location: number, value: TypedArray | null): void {}
}
