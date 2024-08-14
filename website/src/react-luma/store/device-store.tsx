import {create} from 'zustand';

import {luma, Device} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

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
      canvasContext: {
        container: getCanvasContainer()
      }
    });
  return await cachedDevice[type];
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
    return set(state => ({deviceType, deviceError, device}));
  }
}));

// Initialize store
useStore.getState().setDeviceType('webgl');
