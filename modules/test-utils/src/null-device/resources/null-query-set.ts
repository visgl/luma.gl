// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {QuerySet, QuerySetProps} from '@luma.gl/core';
import {NullDevice} from '../null-device';

export class NullQuerySet extends QuerySet {
  device: NullDevice;
  readonly handle = null;

  constructor(device: NullDevice, props: QuerySetProps) {
    super(device, props);
    this.device = device;
  }
}
