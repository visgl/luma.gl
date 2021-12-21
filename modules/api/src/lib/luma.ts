import type Device from '../adapter/device';
import type {DeviceProps} from '../adapter/device';
import StatsManager from '../utils/stats-manager';
import {lumaStats} from '../utils/stats-manager';
import type {Log} from '@probe.gl/log';
import {log} from '../utils/log';

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

  static async createDevice(props: DeviceProps): Promise<Device> {
    for (const DeviceConstructor of deviceList) {
      // @ts-expect-error No typings for the static methods
      const create: (props: DeviceProps) => Promise<Device> = DeviceConstructor.create;
      const isSelected = Boolean(create); // !name || (name ===)
      if (isSelected) { // } && DeviceConstructor?.isSupported?.()) {
        return await create(props);
      }
    }

    throw new Error('No GPU Device found');
  }

  /** Global stats for all devices */
  static stats: StatsManager = lumaStats;

  /** Global log */
  static log: Log = log;
}
