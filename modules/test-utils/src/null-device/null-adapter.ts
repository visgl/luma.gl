// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Adapter, DeviceProps, CanvasContext} from '@luma.gl/core';
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

  attach(handle: null): NullDevice {
    return new NullDevice({});
  }

  async create(props: DeviceProps = {}): Promise<NullDevice> {
    // Wait for page to load: if canvas is a string we need to query the DOM for the canvas element.
    // We only wait when props.canvas is string to avoids setting the global page onload callback unless necessary.
    if (typeof props.canvas === 'string') {
      await CanvasContext.pageLoaded;
    }

    return new NullDevice(props);
  }
}

export const nullAdapter = new NullAdapter();
