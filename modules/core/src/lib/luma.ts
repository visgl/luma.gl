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

const deviceMap = new Map<string, typeof Device>();

/** Properties for creating a new device */
export type CreateDeviceProps = DeviceProps & {
  /** Selects the type of device. `best-available` uses webgpu if available, then webgl. */
  type?: 'webgl' | 'webgpu' | 'unknown' | 'best-available';
  devices?: any[];
};

/** Properties for attaching an existing WebGL context or WebGPU device to a new luma Device */
export type AttachDeviceProps = DeviceProps & {
  /** Externally created WebGL context or WebGPU device */
  handle: WebGL2RenderingContext; // | GPUDevice;
  devices?: any[];
};

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL devices (controls application bundle size)
 * Run-time selection of the first available Device
 */
export class luma {
  static defaultProps: Required<CreateDeviceProps> = {
    ...Device.defaultProps,
    type: 'best-available',
    devices: undefined!
  };

  /** Global stats for all devices */
  static stats: StatsManager = lumaStats;

  /** Global log */
  static log: Log = log;

  static registerDevices(deviceClasses: any[] /* : typeof Device */): void {
    for (const deviceClass of deviceClasses) {
      assert(deviceClass.type && deviceClass.isSupported && deviceClass.create);
      deviceMap.set(deviceClass.type, deviceClass);
    }
  }

  static getAvailableDevices(): string[] {
    // @ts-expect-error
    return Array.from(deviceMap).map(Device => Device.type);
  }

  static getSupportedDevices(): string[] {
    return (
      Array.from(deviceMap)
        // @ts-expect-error
        .filter(Device => Device.isSupported())
        // @ts-expect-error
        .map(Device => Device.type)
    );
  }

  static setDefaultDeviceProps(props: CreateDeviceProps): void {
    Object.assign(Device.defaultProps, props);
  }

  /** Attach to an existing GPU API handle (WebGL2RenderingContext or GPUDevice). */
  static async attachDevice(props: AttachDeviceProps): Promise<Device> {
    const devices = getDeviceMap(props.devices) || deviceMap;

    // WebGL
    if (props.handle instanceof WebGL2RenderingContext) {
      const WebGLDevice = devices.get('webgl') as any;
      if (WebGLDevice) {
        return (await WebGLDevice.attach(props.handle)) as Device;
      }
    }

    // TODO - WebGPU does not yet have a stable API
    // if (props.handle instanceof GPUDevice) {
    //   const WebGPUDevice = devices.get('webgpu') as any;
    //   if (WebGPUDevice) {
    //     return (await WebGPUDevice.attach(props.handle)) as Device;
    //   }
    // }

    // null
    if (props.handle === null) {
      const UnknownDevice = devices.get('unknown') as any;
      if (UnknownDevice) {
        return (await UnknownDevice.attach(null)) as Device;
      }
    }

    throw new Error(
      'Failed to attach device. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.'
    );
  }

  /** Creates a device. Asynchronously. */
  static async createDevice(props: CreateDeviceProps = {}): Promise<Device> {
    props = {...Device.defaultProps, ...props};
    if (props.gl) {
      props.type = 'webgl';
    }

    const devices = getDeviceMap(props.devices) || deviceMap;

    switch (props.type) {
      case 'webgpu':
        let WebGPUDevice = devices.get('webgpu') as any;
        if (WebGPUDevice) {
          return await WebGPUDevice.create(props);
        }
        break;

      case 'webgl':
        let WebGLDevice = devices.get('webgl') as any;
        if (WebGLDevice) {
          return await WebGLDevice.create(props);
        }
        break;

      case 'unknown':
        const UnknownDevice = devices.get('unknown') as any;
        if (UnknownDevice) {
          return await UnknownDevice.create(props);
        }
        break;

      case 'best-available':
        WebGPUDevice = devices.get('webgpu') as any;
        if (WebGPUDevice?.isSupported?.()) {
          return await WebGPUDevice.create(props);
        }
        WebGLDevice = devices.get('webgl');
        if (WebGLDevice?.isSupported?.()) {
          return await WebGLDevice.create(props);
        }
        break;
    }
    throw new Error(
      'No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.'
    );
  }
}

/** Convert a list of devices to a map */
function getDeviceMap(
  deviceClasses?: any[] /* : typeof Device */
): Map<string, typeof Device> | null {
  if (!deviceClasses || deviceClasses?.length === 0) {
    return null;
  }
  const map = new Map<string, typeof Device>();
  for (const deviceClass of deviceClasses) {
    // assert(deviceClass.type && deviceClass.isSupported && deviceClass.create);
    map.set(deviceClass.type, deviceClass);
  }
  return map;
}
