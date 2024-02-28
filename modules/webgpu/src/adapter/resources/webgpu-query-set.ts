// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {QuerySet, QuerySetProps} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';

export type QuerySetProps2 = {
  type: 'occlusion' | 'timestamp';
  count: number;
};

/**
 * Immutable
 */
export class WebGPUQuerySet extends QuerySet {
  readonly device: WebGPUDevice;
  readonly handle: GPUQuerySet;

  constructor(device: WebGPUDevice, props: QuerySetProps) {
    super(device, props);
    this.device = device;
    this.handle =
      this.props.handle ||
      this.device.handle.createQuerySet({
        type: this.props.type,
        count: this.props.count
      });
    this.handle.label = this.props.id;
  }

  override destroy(): void {
    this.handle.destroy();
  }
}
