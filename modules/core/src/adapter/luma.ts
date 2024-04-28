// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Log} from '@probe.gl/log';
import type {DeviceProps} from './device';
import {Device, DeviceFactory} from './device';
import {StatsManager} from '../utils/stats-manager';
import {lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';

const ERROR_MESSAGE =
  'No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.';

const deviceMap = new Map<string, DeviceFactory>();

/** Properties for creating a new device */
export type CreateDeviceProps = DeviceProps & {
  /** Selects the type of device. `best-available` uses webgpu if available, then webgl. */
  type?: 'webgl' | 'webgpu' | 'unknown' | 'best-available';
  devices?: DeviceFactory[];
};

/** Properties for attaching an existing WebGL context or WebGPU device to a new luma Device */
export type AttachDeviceProps = DeviceProps & {
  /** Externally created WebGL context or WebGPU device */
  handle: WebGL2RenderingContext; // | GPUDevice;
  devices?: DeviceFactory[];
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

  static registerDevices(deviceClasses: DeviceFactory[]): void {
    for (const deviceClass of deviceClasses) {
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

  /** Get type strings for best available Device */
  static getBestAvailableDeviceType(devices: DeviceFactory[] = []): 'webgpu' | 'webgl' | null {
    const deviceMap = getDeviceMap(devices);
    if (deviceMap.get('webgpu')?.isSupported?.()) {
      return 'webgpu';
    }
    if (deviceMap.get('webgl')?.isSupported?.()) {
      return 'webgl';
    }
    return null;
  }

  static setDefaultDeviceProps(props: CreateDeviceProps): void {
    Object.assign(luma.defaultProps, props);
  }

  /** Attach to an existing GPU API handle (WebGL2RenderingContext or GPUDevice). */
  static async attachDevice(props: AttachDeviceProps): Promise<Device> {
    const devices = getDeviceMap(props.devices) || deviceMap;

    // WebGL
    if (props.handle instanceof WebGL2RenderingContext) {
      const Device = devices.get('webgl');
      const device = Device?.attach?.(null);
      if (device) {
        return device;
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
      const Device = devices.get('unknown');
      const device = Device?.attach?.(null);
      if (device) {
        return device;
      }
    }

    throw new Error(ERROR_MESSAGE);
  }

  /** Creates a device. Asynchronously. */
  static async createDevice(props: CreateDeviceProps = {}): Promise<Device> {
    props = {...luma.defaultProps, ...props};
    if (props.gl) {
      props.type = 'webgl';
    }

    const devices = getDeviceMap(props.devices) || deviceMap;

    let type: string = props.type || '';
    if (type === 'best-available') {
      type = luma.getBestAvailableDeviceType(props.devices) || type;
    }

    const Device = devices.get(type);
    const device = await Device?.create?.(props);
    if (device) {
      return device;
    }

    throw new Error(ERROR_MESSAGE);
  }

  /**
   * Override `HTMLCanvasContext.getCanvas()` to always create WebGL2 contexts.
   * Used when attaching luma to a context from an external library does not support creating WebGL2 contexts.
   * (luma can only attach to WebGL2 contexts).
   */
  static enforceWebGL2(enforce: boolean = true): void {
    const prototype = HTMLCanvasElement.prototype as any;
    if (!enforce && prototype.originalGetContext) {
      // Reset the original getContext function
      prototype.getContext = prototype.originalGetContext;
      prototype.originalGetContext = undefined;
      return;
    }

    // Store the original getContext function
    prototype.originalGetContext = prototype.getContext;

    // Override the getContext function
    prototype.getContext = function (contextId: string, options?: WebGLContextAttributes) {
      // Attempt to force WebGL2 for all WebGL1 contexts
      if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return this.originalGetContext('webgl2', options);
      }
      // For any other type, return the original context
      return this.originalGetContext(contextId, options);
    };
  }
}

/** Convert a list of devices to a map */
function getDeviceMap(deviceClasses: DeviceFactory[] = []): Map<string, DeviceFactory> {
  const map = new Map<string, DeviceFactory>(deviceMap);
  for (const deviceClass of deviceClasses) {
    // assert(deviceClass.type && deviceClass.isSupported && deviceClass.create);
    map.set(deviceClass.type, deviceClass);
  }
  return map;
}
