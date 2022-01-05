import create from 'zustand';

import {luma, Device} from '@luma.gl/api';
import '@luma.gl/webgl';
import '@luma.gl/webgpu';

let cachedDevice: Record<string, Promise<Device>> = {};

export async function createDevice(deviceType: string): Promise<Device> {
  const type = deviceType.toLowerCase();
  // @ts-expect-error
  cachedDevice[type] = cachedDevice[type] || luma.createDevice({type, height: 0});
  return await cachedDevice[type];
}

export const useStore = create(set => ({
  deviceType: undefined,
  deviceError: undefined,
  device: undefined,
  setDeviceType: async deviceType => {
    let deviceError;
    let device;
    try {
      device = await createDevice(deviceType);
    } catch (error) {
      deviceError = error.message;
    }
    return set(state => ({deviceType, deviceError, device}));
  }
}));

// Initialize store
useStore.getState().setDeviceType('webgl2');
