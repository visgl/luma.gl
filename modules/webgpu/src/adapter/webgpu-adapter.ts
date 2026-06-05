// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// biome-ignore format: preserve layout
// / <reference types="@webgpu/types" />

import {
  Adapter,
  type DeviceProps,
  log
} from '@luma.gl/core';
import type {WebGPUDevice} from './webgpu-device';

type WebGPUSupportedLimitName = Exclude<keyof GPUSupportedLimits, '__brand'>;
type RequestedWebGPUFeatureLevel = NonNullable<DeviceProps['featureLevel']>;

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
  const options: GPURequestAdapterOptions = {featureLevel: 'core'};

  if (props.powerPreference && props.powerPreference !== 'default') {
    options.powerPreference = props.powerPreference;
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
  featureLevel: RequestedWebGPUFeatureLevel
): GPUFeatureName[] {
  if (featureLevel === 'max') {
    return Array.from(supportedFeatures) as GPUFeatureName[];
  }

  return [];
}

export class WebGPUAdapter extends Adapter {
  /** type of device's created by this adapter */
  readonly type: WebGPUDevice['type'] = 'webgpu';
  protected gpuAdapterPromises = new Map<string, Promise<GPUAdapter | null>>();

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
    if (!navigator.gpu) {
      throw new Error('WebGPU not available. Recent Chrome browsers should work.');
    }

    const requestedFeatureLevel = getWebGPUFeatureLevel(props);
    const requestAdapterOptions = getWebGPURequestAdapterOptions(props);
    const gpuAdapterCacheKey = this.getGPUAdapterCacheKey(
      requestedFeatureLevel,
      requestAdapterOptions
    );
    const adapterPromise = this.getGPUAdapterPromise(gpuAdapterCacheKey, requestAdapterOptions);

    const adapter = await adapterPromise;

    if (!adapter) {
      throw new Error('Failed to request WebGPU adapter');
    }

    //  Note: adapter.requestAdapterInfo() has been replaced with adapter.info. Fall back in case adapter.info is not available
    const adapterInfo =
      adapter.info ||
      // @ts-ignore
      (await adapter.requestAdapterInfo?.());
    // log.probe(2, 'Adapter available', adapterInfo)();

    const deviceDescriptor: GPUDeviceDescriptor = {};

    const requiredFeatures = getRequiredWebGPUFeatures(adapter.features, requestedFeatureLevel);
    if (requiredFeatures.length > 0) {
      deviceDescriptor.requiredFeatures = requiredFeatures;
    }

    if (requestedFeatureLevel === 'max') {
      deviceDescriptor.requiredLimits = getRequiredWebGPULimits(adapter.limits);
    }

    const gpuDevice = await adapter.requestDevice(deviceDescriptor);
    this.gpuAdapterPromises.delete(gpuAdapterCacheKey);

    // log.probe(1, 'GPUDevice available')();

    const {WebGPUDevice} = await import('./webgpu-device');
    const deviceProps = {...props, featureLevel: requestedFeatureLevel};

    log.groupCollapsed(1, 'WebGPUDevice created')();
    try {
      const device = new WebGPUDevice(deviceProps, gpuDevice, adapter, adapterInfo);
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

  protected getGPUAdapterPromise(
    cacheKey: string,
    requestAdapterOptions: GPURequestAdapterOptions
  ): Promise<GPUAdapter | null> {
    let gpuAdapterPromise = this.gpuAdapterPromises.get(cacheKey);
    if (!gpuAdapterPromise) {
      gpuAdapterPromise = navigator.gpu.requestAdapter(requestAdapterOptions);
      this.gpuAdapterPromises.set(cacheKey, gpuAdapterPromise);
    }
    return gpuAdapterPromise;
  }

  protected getGPUAdapterCacheKey(
    featureLevel: RequestedWebGPUFeatureLevel,
    requestAdapterOptions: GPURequestAdapterOptions
  ): string {
    return [
      featureLevel,
      requestAdapterOptions.featureLevel || 'core',
      requestAdapterOptions.powerPreference || 'default'
    ].join(':');
  }
}

export const webgpuAdapter = new WebGPUAdapter();
