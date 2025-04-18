// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveTopology, ShaderLayout, TransformFeedbackProps} from '@luma.gl/core';
import {TransformFeedback, Buffer, BufferRange} from '@luma.gl/core';
import type {NullDevice} from '../null-device';

export class NullTransformFeedback extends TransformFeedback {
  readonly device: NullDevice;
  readonly handle = null;

  readonly layout: ShaderLayout;
  buffers: Record<string, Buffer | BufferRange> = {};

  constructor(device: NullDevice, props: TransformFeedbackProps) {
    super(device, props);
    this.device = device;
    this.layout = this.props.layout;

    if (props.buffers) {
      this.setBuffers(props.buffers);
    }

    Object.seal(this);
  }

  begin(topology: PrimitiveTopology = 'point-list'): void {}

  end(): void {}

  setBuffers(buffers: Record<string, Buffer | BufferRange>): void {
    this.buffers = {};

    for (const bufferName in buffers) {
      this.setBuffer(bufferName, buffers[bufferName]);
    }
  }

  setBuffer(locationOrName: string | number, bufferOrRange: Buffer | BufferRange): void {
    this.buffers[locationOrName] = bufferOrRange;
  }

  getBuffer(locationOrName: string | number): Buffer | BufferRange | null {
    return this.buffers[locationOrName] || null;
  }
}
