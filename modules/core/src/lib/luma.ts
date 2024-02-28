// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Log} from '@probe.gl/log';
import type {DeviceProps} from '../adapter/device';
import {Device} from '../adapter/device';
import {StatsManager} from '../utils/stats-manager';
import {lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';
import {assert} from '../utils/assert';

const deviceList = new Map<string, typeof Device>();

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL devices (controls application bundle size)
 * Run-time selection of the first available Device
 */
export class luma {
  /** Global stats for all devices */
  static stats: StatsManager = lumaStats;

  /** Global log */
  static log: Log = log;

  static registerDevices(deviceClasses: any[] /* : typeof Device */): void {
    for (const deviceClass of deviceClasses) {
      assert(deviceClass.type && deviceClass.isSupported && deviceClass.create);
      deviceList.set(deviceClass.type, deviceClass);
    }
  }

  static getAvailableDevices(): string[] {
    // @ts-expect-error
    return Array.from(deviceList).map(Device => Device.type);
  }

  static getSupportedDevices(): string[] {
    return (
      Array.from(deviceList)
        // @ts-expect-error
        .filter(Device => Device.isSupported())
        // @ts-expect-error
        .map(Device => Device.type)
    );
  }

  static setDefaultDeviceProps(props: DeviceProps): void {
    Object.assign(Device.defaultProps, props);
  }

  /** Creates a device. Asynchronously. */
  static async createDevice(props: DeviceProps = {}): Promise<Device> {
    props = {...Device.defaultProps, ...props};
    if (props.gl) {
      props.type = 'webgl';
    }

    let DeviceClass: any;
    switch (props.type) {
      case 'webgpu':
        DeviceClass = deviceList.get('webgpu');
        if (DeviceClass) {
          return await DeviceClass.create(props);
        }
        break;
      case 'webgl':
        DeviceClass = deviceList.get('webgl');
        if (DeviceClass) {
          return await DeviceClass.create(props);
        }
        break;
      case 'best-available':
        DeviceClass = deviceList.get('webgpu');
        if (DeviceClass && DeviceClass.isSupported()) {
          return await DeviceClass.create(props);
        }
        DeviceClass = deviceList.get('webgl');
        if (DeviceClass && DeviceClass.isSupported()) {
          return await DeviceClass.create(props);
        }
        break;
    }
    throw new Error(
      'No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.'
    );
  }
}
