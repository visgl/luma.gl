import {create} from 'zustand';

import {luma, Device, type DeviceProps} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {
  installCpuHotspotProfilerApi,
  updateCpuHotspotProfilerTargets
} from '../debug/luma-cpu-hotspot-profiler';
import {getErrorMessage, logError} from '../utils/error-utils';

const DEVICE_TYPE_STORAGE_KEY = 'luma-device-type';
const DEFAULT_DEVICE_TYPE: DeviceType = 'webgpu-core';
const FALLBACK_DEVICE_TYPE_ORDER: DeviceType[] = ['webgpu-core', 'webgpu-compatibility', 'webgl'];

export type DeviceType = 'webgl' | 'webgpu-core' | 'webgpu-max' | 'webgpu-compatibility';

const WEBGPU_FEATURE_LEVELS = {
  'webgpu-core': 'core',
  'webgpu-max': 'max',
  'webgpu-compatibility': 'compatibility'
} as const satisfies Partial<Record<DeviceType, NonNullable<DeviceProps['featureLevel']>>>;

export type Store = {
  device?: Device;
  presentationDevice?: Device;
  deviceType?: DeviceType;
  deviceError?: any;
  presentationDeviceError?: any;
  setDeviceType: (type: any) => Promise<void>;
};

let cachedDevice: Partial<Record<DeviceType, Promise<Device>>> = {};
let cachedPresentationDevice: Partial<Record<DeviceType, Promise<Device>>> = {};
let cachedDeviceAvailability: Partial<Record<DeviceType, Promise<boolean>>> = {};
let deviceRequestGeneration = 0;

let cachedContainer: HTMLDivElement | undefined;
export function getCanvasContainer() {
  if (!cachedContainer) {
    cachedContainer = document.createElement('div');
    cachedContainer.style.display = 'none';
    document.body.appendChild(cachedContainer);
  }
  return cachedContainer;
}

export async function createDevice(type: DeviceType): Promise<Device> {
  cachedDevice[type] ||= (async () => {
    const device = await luma.createDevice({
      adapters: [webgl2Adapter, webgpuAdapter],
      ...getDeviceRequestProps(type),
      debugGPUTime: true,
      createCanvasContext: {
        container: getCanvasContainer(),
        alphaMode: 'opaque'
      }
    });

    validateCreatedDeviceType(type, device);
    return device;
  })().catch(error => {
    delete cachedDevice[type];
    throw error;
  });

  return await cachedDevice[type]!;
}

export async function createPresentationDevice(type: DeviceType): Promise<Device> {
  if (isWebGPUDeviceType(type)) {
    return await createDevice(type);
  }

  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('Presentation devices require OffscreenCanvas support');
  }

  cachedPresentationDevice[type] ||= (async () => {
    const device = await luma.createDevice({
      adapters: [webgl2Adapter, webgpuAdapter],
      ...getDeviceRequestProps(type),
      debugGPUTime: true,
      createCanvasContext: {
        canvas: new OffscreenCanvas(1, 1),
        width: 1,
        height: 1,
        autoResize: false,
        useDevicePixels: false,
        alphaMode: 'opaque'
      }
    });

    validateCreatedDeviceType(type, device);
    return device;
  })().catch(error => {
    delete cachedPresentationDevice[type];
    throw error;
  });

  return await cachedPresentationDevice[type]!;
}

function getStoredDeviceType(): DeviceType | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const storedDeviceType = window.localStorage.getItem(DEVICE_TYPE_STORAGE_KEY);
  return isDeviceType(storedDeviceType)
    ? storedDeviceType
    : undefined;
}

export async function canCreateDeviceType(type: DeviceType): Promise<boolean> {
  cachedDeviceAvailability[type] ||= (async () => {
    try {
      await createDevice(type);
      await createPresentationDevice(type);
      return true;
    } catch {
      return false;
    }
  })();

  return await cachedDeviceAvailability[type]!;
}

export async function getPreferredAvailableDeviceType(
  preferredTypes: DeviceType[]
): Promise<DeviceType | undefined> {
  for (const deviceType of preferredTypes) {
    if (await canCreateDeviceType(deviceType)) {
      return deviceType;
    }
  }

  return undefined;
}

export const useStore = create<Store>(set => ({
  deviceType: undefined,
  deviceError: undefined,
  presentationDeviceError: undefined,
  device: undefined,
  presentationDevice: undefined,
  setDeviceType: async deviceType => {
    if (!(await canCreateDeviceType(deviceType))) {
      const currentDeviceType = useStore.getState().deviceType;
      const fallbackDeviceType = await getPreferredAvailableDeviceType(
        FALLBACK_DEVICE_TYPE_ORDER.filter(type => type !== deviceType)
      );
      if (fallbackDeviceType && fallbackDeviceType !== currentDeviceType) {
        await useStore.getState().setDeviceType(fallbackDeviceType);
      }
      return;
    }

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
      deviceError = getErrorMessage(error);
      logError(`Failed to create ${deviceType} device`, error);
    }
    try {
      presentationDevice = await createPresentationDevice(deviceType);
    } catch (error) {
      presentationDeviceError = getErrorMessage(error);
      logError(`Failed to create ${deviceType} presentation device`, error);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEVICE_TYPE_STORAGE_KEY, deviceType);
    }

    if (requestGeneration !== deviceRequestGeneration) {
      return;
    }

    installCpuHotspotProfilerApi();
    updateCpuHotspotProfilerTargets({device, presentationDevice});

    return set(() => ({
      deviceType,
      deviceError,
      device,
      presentationDeviceError,
      presentationDevice
    }));
  }
}));

async function initializeDeviceType(): Promise<void> {
  const storedDeviceType = getStoredDeviceType();
  const preferredDeviceTypes = [
    ...(storedDeviceType ? [storedDeviceType] : []),
    ...FALLBACK_DEVICE_TYPE_ORDER.filter(deviceType => deviceType !== storedDeviceType)
  ];
  const initialDeviceType =
    (await getPreferredAvailableDeviceType(preferredDeviceTypes)) || DEFAULT_DEVICE_TYPE;
  await useStore.getState().setDeviceType(initialDeviceType);
}

if (typeof window !== 'undefined') {
  void initializeDeviceType();
}

function getDeviceRequestProps(type: DeviceType): {
  type: 'webgl' | 'webgpu';
  featureLevel?: NonNullable<DeviceProps['featureLevel']>;
} {
  if (type === 'webgl') {
    return {type: 'webgl'};
  }

  return {
    type: 'webgpu',
    featureLevel: WEBGPU_FEATURE_LEVELS[type]
  };
}

function isWebGPUDeviceType(type: DeviceType): boolean {
  return type.startsWith('webgpu-');
}

function validateCreatedDeviceType(type: DeviceType, device: Device): void {
  const featureLevel = WEBGPU_FEATURE_LEVELS[type];
  if (featureLevel && device.info.featureLevel !== featureLevel) {
    throw new Error(`Requested ${featureLevel} WebGPU device, received ${device.info.featureLevel}`);
  }
}

function isDeviceType(type: string | null): type is DeviceType {
  return (
    type === 'webgl' ||
    type === 'webgpu-core' ||
    type === 'webgpu-max' ||
    type === 'webgpu-compatibility'
  );
}
