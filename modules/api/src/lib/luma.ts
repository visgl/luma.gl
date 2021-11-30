import type Device from '../adapter/device';
import type {DeviceProps} from '../adapter/device';

const deviceList = new Set<Device>();

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

  static createDevice(props: DeviceProps): Device {
    for (const DeviceConstructor of deviceList) {
      const isSelected =  true; // !name || (name ===)
      if (isSelected) { // } && DeviceConstructor?.isSupported?.()) {
        // @ts-expect-error
        return new DeviceConstructor(props);
      }
    }

    throw new Error('No GPU Device found');
  }
}
