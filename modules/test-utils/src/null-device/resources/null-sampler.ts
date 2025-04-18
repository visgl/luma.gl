// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Sampler, SamplerProps} from '@luma.gl/core';
import type {NullDevice} from '../null-device';

export class NullSampler extends Sampler {
  readonly device: NullDevice;
  readonly handle = null;

  constructor(device: NullDevice, props: SamplerProps) {
    super(device, props);
    this.device = device;
  }
}
