import {create} from 'zustand';

import {luma, Device} from '@luma.gl/core';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

luma.registerDevices([WebGLDevice, WebGPUDevice]);

export type Store = {
  device?: Device;
  deviceType?: 'webgl1' | 'webgl2' | 'webgpu';
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

export async function createDevice(deviceType: string): Promise<Device> {
  const type = deviceType.toLowerCase();
  // @ts-expect-error
  cachedDevice[type] =
    cachedDevice[type] || luma.createDevice({type, height: 0, container: getCanvasContainer()});
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
useStore.getState().setDeviceType('webgl2');
