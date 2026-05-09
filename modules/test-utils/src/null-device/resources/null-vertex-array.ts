// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';
import type {Buffer, VertexArrayProps} from '@luma.gl/core';
import {VertexArray} from '@luma.gl/core';

import type {NullDevice} from '../null-device';

export class NullVertexArray extends VertexArray {
  device: NullDevice;
  readonly handle = null;

  /**
   * Creates a null-device vertex array used by tests and non-rendering code paths.
   * @param device The device that owns the vertex array.
   * @param props Vertex-array initialization properties.
   */
  constructor(device: NullDevice, props: VertexArrayProps) {
    super(device, props);
    this.device = device;
  }

  setIndexBuffer(indexBuffer: Buffer | null): void {
    this.indexBuffer = indexBuffer;
  }

  /**
   * Stores a buffer in one logical slot for testing purposes.
   * @param location Buffer slot or attribute location.
   * @param attributeBuffer Buffer supplying the test data.
   */
  setBuffer(location: number, attributeBuffer: Buffer): void {
    if (location < 0 || location >= this.maxVertexAttributes) {
      throw new Error(`Unknown attribute location ${location}`);
    }
    this.attributes[location] = attributeBuffer;
  }

  /** No-op for the null device. */
  bindBeforeRender(): void {}

  /** No-op for the null device. */
  unbindAfterRender(): void {}

  /** No-op for the null device. */
  override setConstantWebGL(location: number, value: TypedArray | null): void {}
}
