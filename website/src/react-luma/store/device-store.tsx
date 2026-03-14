import {create} from 'zustand';

import {luma, Device} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

const DEVICE_TYPE_STORAGE_KEY = 'luma-device-type';

export type Store = {
  device?: Device;
  deviceType?: 'webgl' | 'webgpu';
  deviceError?: any;
  setDeviceType: (type: any) => Promise<void>;
};

let cachedDevice: Record<string, Promise<Device>> = {};

let cachedContainer: HTMLDivElement | undefined;
function getCanvasContainer() {
  if (!cachedContainer) {
    cachedContainer = document.createElement('div');
    cachedContainer.style.display = 'none';
    document.body.appendChild(cachedContainer);
  }
  return cachedContainer;
}

export async function createDevice(type: 'webgl' | 'webgpu'): Promise<Device> {
  cachedDevice[type] =
    cachedDevice[type] ||
    luma.createDevice({
      adapters: [webgl2Adapter, webgpuAdapter],
      type,
      height: 0,
      createCanvasContext: {
        container: getCanvasContainer(),
        alphaMode: 'opaque',
      }
    });
  return await cachedDevice[type];
}

function getStoredDeviceType(): 'webgl' | 'webgpu' | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const storedDeviceType = window.localStorage.getItem(DEVICE_TYPE_STORAGE_KEY);
  return storedDeviceType === 'webgl' || storedDeviceType === 'webgpu'
    ? storedDeviceType
    : undefined;
}

export const useStore = create<Store>(set => ({
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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEVICE_TYPE_STORAGE_KEY, deviceType);
    }
    return set(state => ({deviceType, deviceError, device}));
  }
}));

// Initialize store
useStore.getState().setDeviceType(getStoredDeviceType() || 'webgl');
