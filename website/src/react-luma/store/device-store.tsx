import {create} from 'zustand';

import {luma, Device} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';

const DEVICE_TYPE_STORAGE_KEY = 'luma-device-type';

export type Store = {
  device?: Device;
  presentationDevice?: Device;
  deviceType?: 'webgl' | 'webgpu';
  deviceError?: any;
  presentationDeviceError?: any;
  setDeviceType: (type: any) => Promise<void>;
};

let cachedDevice: Record<string, Promise<Device>> = {};
let cachedPresentationDevice: Record<string, Promise<Device>> = {};
let deviceRequestGeneration = 0;

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
      createCanvasContext: {
        container: getCanvasContainer(),
        alphaMode: 'opaque',
      }
    });
  return await cachedDevice[type];
}

export async function createPresentationDevice(type: 'webgl' | 'webgpu'): Promise<Device> {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('Presentation devices require OffscreenCanvas support');
  }

  cachedPresentationDevice[type] =
    cachedPresentationDevice[type] ||
    luma.createDevice({
      adapters: [webgl2Adapter, webgpuAdapter],
      type,
      createCanvasContext: {
        canvas: new OffscreenCanvas(1, 1),
        width: 1,
        height: 1,
        autoResize: false,
        useDevicePixels: false,
        alphaMode: 'opaque'
      }
    });
  return await cachedPresentationDevice[type];
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
  presentationDeviceError: undefined,
  device: undefined,
  presentationDevice: undefined,
  setDeviceType: async deviceType => {
    const requestGeneration = ++deviceRequestGeneration;
    set(() => ({
      deviceType,
      deviceError: undefined,
      device: undefined,
      presentationDeviceError: undefined,
      presentationDevice: undefined
    }));

    let deviceError;
    let device;
    let presentationDeviceError;
    let presentationDevice;
    try {
      device = await createDevice(deviceType);
    } catch (error) {
      deviceError = error.message;
    }
    try {
      presentationDevice = await createPresentationDevice(deviceType);
    } catch (error) {
      presentationDeviceError = error.message;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEVICE_TYPE_STORAGE_KEY, deviceType);
    }

    if (requestGeneration !== deviceRequestGeneration) {
      return;
    }

    return set(() => ({
      deviceType,
      deviceError,
      device,
      presentationDeviceError,
      presentationDevice
    }));
  }
}));

// Initialize store
useStore.getState().setDeviceType(getStoredDeviceType() || 'webgl');
