// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Adapter, DeviceProps} from '@luma.gl/core';
import {NullDevice} from './null-device';

export class NullAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: NullDevice['type'] = 'null';

  constructor() {
    super();
    // @ts-ignore DEPRECATED For backwards compatibility luma.registerDevices
    NullDevice.adapter = this;
  }

  isSupported(): boolean {
    return true;
  }

  isDeviceHandle(handle: any): boolean {
    return handle === null;
  }

  async attach(handle: null): Promise<NullDevice> {
    return new NullDevice({});
  }

  async create(props: DeviceProps = {}): Promise<NullDevice> {
    return new NullDevice(props);
  }
}

export const nullAdapter = new NullAdapter();
