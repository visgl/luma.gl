// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Adapter, DeviceProps} from '@luma.gl/core';
import {NullDevice} from './null-device';

export class NullAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: NullDevice['type'] = 'unknown';

  constructor() {
    super();
    // @ts-ignore DEPRECATED For backwards compatibility luma.registerDevices
    NullDevice.adapter = this;
  }

  /** Check if WebGPU is available */
  isSupported(): boolean {
    return true;
  }

  async attach(handle: null): Promise<NullDevice> {
    return new NullDevice({});
  }

  async create(props: DeviceProps = {}): Promise<NullDevice> {
    return new NullDevice(props);
  }
}

export const nullAdapter = new NullAdapter();
