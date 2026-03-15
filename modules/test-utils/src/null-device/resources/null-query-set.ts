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

  isResultAvailable(_queryIndex?: number): boolean {
    return false;
  }

  async readResults(options?: {firstQuery?: number; queryCount?: number}): Promise<bigint[]> {
    const firstQuery = options?.firstQuery || 0;
    const queryCount = options?.queryCount || this.props.count - firstQuery;
    return new Array(queryCount).fill(0n);
  }

  async readTimestampDuration(_beginIndex: number, _endIndex: number): Promise<number> {
    return 0;
  }
}
