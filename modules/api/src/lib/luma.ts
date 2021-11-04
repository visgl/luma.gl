import type Device from '../adapter/device';

const deviceList = new Set();

/**
 * Entry point to the luma.gl GPU abstraction
 * Register WebGPU and/or WebGL devices (controls application bundle size)
 * Run-time selection of the first available Device
 */
export default class luma {
  static registerDevices(deviceClasses: any[] /*: typeof Device */): void {
    for (const deviceClass of deviceClasses) {
      deviceList.add(deviceClass);
    }
  }

  static getDeviceNames(): string[] {
    // @ts-expect-error
    return Array.from(deviceList).map(Device => Device.name || 'device');
  }

  static createDevice(props): Device {
    for (const deviceClass of deviceList) {
      const isSelected =  true; // !name || (name ===)
      // @ts-expect-error
      if (isSelected && deviceClass?.isSupported()) {
        // @ts-expect-error
        return deviceClass;
      }
    }

    throw new Error('No GPU Device found');
  }
}
