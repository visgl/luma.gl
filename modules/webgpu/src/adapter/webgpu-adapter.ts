// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// biome-ignore format: preserve layout
// / <reference types="@webgpu/types" />

import {
  Adapter,
  DeviceCreationError,
  type DeviceInfo,
  type DeviceProps,
  type WebGPUDeviceFeature,
  log
} from '@luma.gl/core';
import type {WebGPUDevice} from './webgpu-device';

type WebGPUSupportedLimitName = Exclude<keyof GPUSupportedLimits, '__brand'>;
type RequestedWebGPUFeatureLevel = NonNullable<DeviceProps['featureLevel']>;
type EffectiveWebGPUFeatureLevel = NonNullable<DeviceInfo['featureLevel']>;

const CORE_FEATURES_AND_LIMITS = 'core-features-and-limits' as GPUFeatureName;

const WEBGPU_SUPPORTED_LIMIT_NAMES: readonly WebGPUSupportedLimitName[] = [
  'maxTextureDimension1D',
  'maxTextureDimension2D',
  'maxTextureDimension3D',
  'maxTextureArrayLayers',
  'maxBindGroups',
  'maxBindGroupsPlusVertexBuffers',
  'maxBindingsPerBindGroup',
  'maxDynamicUniformBuffersPerPipelineLayout',
  'maxDynamicStorageBuffersPerPipelineLayout',
  'maxSampledTexturesPerShaderStage',
  'maxSamplersPerShaderStage',
  'maxStorageBuffersPerShaderStage',
  'maxStorageBuffersInVertexStage',
  'maxStorageBuffersInFragmentStage',
  'maxStorageTexturesPerShaderStage',
  'maxStorageTexturesInVertexStage',
  'maxStorageTexturesInFragmentStage',
  'maxUniformBuffersPerShaderStage',
  'maxUniformBufferBindingSize',
  'maxStorageBufferBindingSize',
  'minUniformBufferOffsetAlignment',
  'minStorageBufferOffsetAlignment',
  'maxVertexBuffers',
  'maxBufferSize',
  'maxVertexAttributes',
  'maxVertexBufferArrayStride',
  'maxInterStageShaderVariables',
  'maxColorAttachments',
  'maxColorAttachmentBytesPerSample',
  'maxComputeWorkgroupStorageSize',
  'maxComputeInvocationsPerWorkgroup',
  'maxComputeWorkgroupSizeX',
  'maxComputeWorkgroupSizeY',
  'maxComputeWorkgroupSizeZ',
  'maxComputeWorkgroupsPerDimension',
  'maxImmediateSize'
];

/**
 * Returns every WebGPU limit that luma.gl can request from an adapter.
 * @param supportedLimits Limits exposed by the selected WebGPU adapter.
 * @returns Limits to forward through `GPUDeviceDescriptor.requiredLimits`.
 */
export function getRequiredWebGPULimits(
  supportedLimits: GPUSupportedLimits
): Record<string, number> {
  const requiredLimits: Record<string, number> = {};

  for (const limitName of WEBGPU_SUPPORTED_LIMIT_NAMES) {
    const limitValue = supportedLimits[limitName];
    if (typeof limitValue === 'number') {
      requiredLimits[limitName] = limitValue;
    }
  }

  return requiredLimits;
}

/**
 * Returns the requested WebGPU feature level, defaulting to the portable core profile.
 * @param props Device creation props.
 * @returns Effective WebGPU feature level to request.
 */
export function getWebGPUFeatureLevel(props: DeviceProps): RequestedWebGPUFeatureLevel {
  return props.featureLevel ?? 'core';
}

/**
 * Returns WebGPU adapter options used while selecting an adapter.
 * @param props Device creation props.
 * @returns Options to pass to `navigator.gpu.requestAdapter()`.
 */
export function getWebGPURequestAdapterOptions(props: DeviceProps): GPURequestAdapterOptions {
  const featureLevel = getWebGPUFeatureLevel(props);
  const options: GPURequestAdapterOptions = {
    featureLevel:
      featureLevel === 'compatibility' || featureLevel === 'best-available'
        ? 'compatibility'
        : 'core'
  };

  if (props.powerPreference && props.powerPreference !== 'default') {
    options.powerPreference = props.powerPreference;
  }

  if (props.xrCompatible) {
    options.xrCompatible = true;
  }

  if (props._forceFallbackAdapter) {
    options.forceFallbackAdapter = true;
  }

  return options;
}

/**
 * Returns adapter features required for the requested WebGPU feature level.
 * @param supportedFeatures Features exposed by the selected WebGPU adapter.
 * @param featureLevel Effective WebGPU feature level to request.
 * @returns Features to forward through `GPUDeviceDescriptor.requiredFeatures`.
 */
export function getRequiredWebGPUFeatures(
  supportedFeatures: GPUSupportedFeatures,
  featureLevel: RequestedWebGPUFeatureLevel,
  optionalFeatures: readonly WebGPUDeviceFeature[] = []
): GPUFeatureName[] {
  if (featureLevel === 'max') {
    return Array.from(supportedFeatures) as GPUFeatureName[];
  }

  const requiredFeatures: GPUFeatureName[] = [];
  if (featureLevel === 'best-available' && supportedFeatures.has(CORE_FEATURES_AND_LIMITS)) {
    // Compatibility adapters expose this opt-in when they can be upgraded to
    // core. See WebGPU Fundamentals:
    // https://webgpufundamentals.org/webgpu/lessons/webgpu-compatibility-mode.html
    requiredFeatures.push(CORE_FEATURES_AND_LIMITS);
  }

  for (const optionalFeature of optionalFeatures) {
    const feature = optionalFeature as GPUFeatureName;
    if (supportedFeatures.has(feature) && !requiredFeatures.includes(feature)) {
      requiredFeatures.push(feature);
    }
  }

  return requiredFeatures;
}

/**
 * Returns the feature level exposed by the created WebGPU device.
 * @param requestedFeatureLevel Feature level requested by luma.gl.
 * @param deviceFeatures Features exposed by the created WebGPU device.
 * @returns Effective feature level reported through `device.info`.
 */
export function getEffectiveWebGPUFeatureLevel(
  requestedFeatureLevel: RequestedWebGPUFeatureLevel,
  deviceFeatures: GPUSupportedFeatures
): EffectiveWebGPUFeatureLevel {
  if (
    (requestedFeatureLevel === 'compatibility' || requestedFeatureLevel === 'best-available') &&
    deviceFeatures.has(CORE_FEATURES_AND_LIMITS)
  ) {
    return 'core';
  }

  return requestedFeatureLevel === 'best-available' ? 'compatibility' : requestedFeatureLevel;
}

export class WebGPUAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: WebGPUDevice['type'] = 'webgpu';

  isSupported(): boolean {
    // Check if WebGPU is available
    return Boolean(typeof navigator !== 'undefined' && navigator.gpu);
  }

  isDeviceHandle(handle: unknown): boolean {
    if (typeof GPUDevice !== 'undefined' && handle instanceof GPUDevice) {
      return true;
    }

    // TODO - WebGPU does not yet seem to have a stable in-browser API, so we "sniff" for members instead
    if ((handle as any)?.queue) {
      return true;
    }

    return false;
  }

  async create(props: DeviceProps): Promise<WebGPUDevice> {
    return await this._create(props, true);
  }

  private async _create(
    props: DeviceProps,
    allowImmediateLossRetry: boolean
  ): Promise<WebGPUDevice> {
    const requestedFeatureLevel = getWebGPUFeatureLevel(props);
    const software = Boolean(props._forceFallbackAdapter);
    if (!navigator.gpu) {
      throw makeWebGPUCreationError(
        new Error('WebGPU is not available'),
        requestedFeatureLevel,
        software,
        'adapter-selection'
      );
    }

    const requestAdapterOptions = getWebGPURequestAdapterOptions(props);
    let adapter: GPUAdapter | null;
    try {
      adapter = await this.requestGPUAdapter(requestAdapterOptions);
    } catch (error) {
      throw makeWebGPUCreationError(error, requestedFeatureLevel, software, 'adapter-request');
    }

    if (!adapter) {
      throw makeWebGPUCreationError(
        new Error('Failed to request WebGPU adapter'),
        requestedFeatureLevel,
        software,
        'adapter-request'
      );
    }

    const adapterInfo = await getWebGPUAdapterInfo(adapter);
    if (props.failIfMajorPerformanceCaveat && isSoftwareWebGPUAdapter(adapter, adapterInfo)) {
      throw makeWebGPUCreationError(
        new Error('Software WebGPU adapter rejected'),
        requestedFeatureLevel,
        true,
        'adapter-selection'
      );
    }
    // log.probe(2, 'Adapter available', adapterInfo)();

    const deviceDescriptor: GPUDeviceDescriptor = {};

    const requiredFeatures = getRequiredWebGPUFeatures(
      adapter.features,
      requestedFeatureLevel,
      props.optionalFeatures
    );
    if (requiredFeatures.length > 0) {
      deviceDescriptor.requiredFeatures = requiredFeatures;
    }

    if (requestedFeatureLevel === 'max') {
      deviceDescriptor.requiredLimits = getRequiredWebGPULimits(adapter.limits);
    }

    let gpuDevice: GPUDevice;
    try {
      gpuDevice = await adapter.requestDevice(deviceDescriptor);
    } catch (error) {
      throw makeWebGPUCreationError(error, requestedFeatureLevel, software, 'device-request');
    }

    const immediateLoss = await getImmediateDeviceLoss(gpuDevice);
    if (immediateLoss) {
      gpuDevice.destroy();
      if (allowImmediateLossRetry && immediateLoss.reason !== 'destroyed') {
        log.warn('WebGPU device was returned already lost; retrying with a fresh adapter')();
        return await this._create(props, false);
      }
      throw makeWebGPUCreationError(
        new Error(immediateLoss.message || 'WebGPU device was returned already lost'),
        requestedFeatureLevel,
        software,
        'device-request'
      );
    }

    // log.probe(1, 'GPUDevice available')();

    const {WebGPUDevice} = await import('./webgpu-device');
    const featureLevel = getEffectiveWebGPUFeatureLevel(requestedFeatureLevel, gpuDevice.features);
    const deviceProps = {...props, featureLevel};

    log.groupCollapsed(1, 'WebGPUDevice created')();
    try {
      let device: WebGPUDevice;
      try {
        device = new WebGPUDevice(deviceProps, gpuDevice, adapter, adapterInfo);
      } catch (error) {
        gpuDevice.destroy();
        throw makeWebGPUCreationError(
          error,
          requestedFeatureLevel,
          software,
          'wrapper-initialization'
        );
      }

      const canvasContextProps = WebGPUDevice.getCanvasContextProps(deviceProps);
      if (canvasContextProps) {
        try {
          device.initializeCanvasContext(canvasContextProps);
        } catch (error) {
          device.destroy();
          throw makeWebGPUCreationError(
            error,
            requestedFeatureLevel,
            software,
            'canvas-initialization'
          );
        }
      }
      log.probe(
        1,
        'Device created. For more info, set chrome://flags/#enable-webgpu-developer-features'
      )();
      log.table(1, device.info)();
      return device;
    } finally {
      log.groupEnd(1)();
    }
  }

  async attach(handle: GPUDevice): Promise<WebGPUDevice> {
    throw new Error('WebGPUAdapter.attach() not implemented');
  }

  /** Requests a fresh native adapter for every device creation. */
  protected requestGPUAdapter(
    requestAdapterOptions: GPURequestAdapterOptions
  ): Promise<GPUAdapter | null> {
    return navigator.gpu.requestAdapter(requestAdapterOptions);
  }
}

/** Reads adapter metadata across current and legacy browsers without making it creation-critical. */
export async function getWebGPUAdapterInfo(adapter: GPUAdapter): Promise<GPUAdapterInfo> {
  try {
    return (
      adapter.info ||
      // @ts-ignore Legacy Chromium API.
      (await adapter.requestAdapterInfo?.()) ||
      ({} as GPUAdapterInfo)
    );
  } catch (error) {
    log.warn('WebGPU adapter metadata is unavailable', error)();
    return {} as GPUAdapterInfo;
  }
}

/** Identifies software adapters before native device or canvas creation. */
export function isSoftwareWebGPUAdapter(adapter: GPUAdapter, adapterInfo: GPUAdapterInfo): boolean {
  const fallback = Boolean(
    (adapterInfo as GPUAdapterInfo & {isFallbackAdapter?: boolean}).isFallbackAdapter ??
      (adapter as GPUAdapter & {isFallbackAdapter?: boolean}).isFallbackAdapter
  );
  const extendedAdapterInfo = adapterInfo as GPUAdapterInfo & {
    driver?: string;
    gpuType?: string;
    type?: string;
  };
  const adapterType = String(extendedAdapterInfo.type || extendedAdapterInfo.gpuType || '')
    .split(' ')[0]
    .toLowerCase();
  const description = `${adapterInfo.vendor || ''} ${adapterInfo.description || ''} ${
    extendedAdapterInfo.driver || ''
  } ${adapterInfo.architecture || ''}`;
  return fallback || adapterType === 'cpu' || /SwiftShader|llvmpipe|lavapipe/i.test(description);
}

function makeWebGPUCreationError(
  error: unknown,
  featureLevel: RequestedWebGPUFeatureLevel,
  software: boolean,
  phase: import('@luma.gl/core').DeviceCreationPhase
): DeviceCreationError {
  if (error instanceof DeviceCreationError) {
    return error;
  }
  const cause = error instanceof Error ? error : new Error(String(error));
  return new DeviceCreationError(
    `WebGPU ${phase} failed: ${cause.message}`,
    [{backend: 'webgpu', featureLevel, software, phase, error: cause}],
    cause
  );
}

async function getImmediateDeviceLoss(device: GPUDevice): Promise<GPUDeviceLostInfo | null> {
  return await Promise.race([
    device.lost,
    new Promise<null>(resolve => globalThis.setTimeout(() => resolve(null), 0))
  ]);
}

export const webgpuAdapter = new WebGPUAdapter();
