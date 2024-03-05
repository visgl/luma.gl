// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FramebufferProps} from '@luma.gl/core';
import {Framebuffer} from '@luma.gl/core';
import type {NullDevice} from '../null-device';

export class NullFramebuffer extends Framebuffer {
  device: NullDevice;

  constructor(device: NullDevice, props: FramebufferProps) {
    super(device, props);
    this.device = device;
  }
}
