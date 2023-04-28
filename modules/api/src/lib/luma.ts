// luma.gl, MIT license

import type {default as Device, DeviceProps} from '../adapter/device';
import {DEFAULT_DEVICE_PROPS} from '../adapter/device';
import StatsManager from './utils/stats-manager';
import {lumaStats} from './utils/stats-manager';
import type {Log} from '@probe.gl/log';
import {log} from './utils/log';
import {assert} from '..';

const deviceList = new Map<string, typeof Device>();

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL devices (controls application bundle size)
 * Run-time selection of the first available Device
 */
export default class luma {
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
    // @ts-expect-error
    return Array.from(deviceList).filter(Device => Device.isSupported()).map(Device => Device.type);
  }

  static setDefaultDeviceProps(props: DeviceProps): void {
    Object.assign(DEFAULT_DEVICE_PROPS, props);
  }

  /** Creates a device. Asynchronously. */
  static async createDevice(props: DeviceProps = {}): Promise<Device> {
    props = {...DEFAULT_DEVICE_PROPS, ...props}
    if (props.gl) {
      props.type = 'webgl';
    }

    let Device: any;
    switch (props.type) {
      case 'webgpu':
        Device = deviceList.get('webgpu');
        if (Device) {
          return await Device.create(props);
        }
        break;
      case 'webgl':
      case 'webgl1':
      case 'webgl2':
        Device = deviceList.get('webgl');
        if (Device) {
          return await Device.create(props);
        }
        break;
      case 'best-available':
        Device = deviceList.get('webgpu');
        if (Device && Device.isSupported()) {
          return await Device.create(props);
        }
        Device = deviceList.get('webgl');
        if (Device && Device.isSupported()) {
          return await Device.create(props);
        }
        break;
    }
    throw new Error('No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.');
  }
}
