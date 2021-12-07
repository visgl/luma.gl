
import {Stats} from '@probe.gl/stats';

export type DeviceInfo = {
  vendor: string,
  renderer: string,
  vendorMasked: string,
  rendererMasked: string,
  version: string,
  shadingLanguage: string
};

/** Limits for a device */
export type DeviceLimits = {
  readonly maxTextureDimension1D?: number;
  readonly maxTextureDimension2D?: number;
  readonly maxTextureDimension3D?: number;
  readonly maxTextureArrayLayers?: number;
  readonly maxBindGroups: number;
  readonly maxDynamicUniformBuffersPerPipelineLayout: number;
  readonly maxDynamicStorageBuffersPerPipelineLayout: number;
  readonly maxSampledTexturesPerShaderStage: number;
  readonly maxSamplersPerShaderStage: number;
  readonly maxStorageBuffersPerShaderStage: number;
  readonly maxStorageTexturesPerShaderStage: number;
  readonly maxUniformBuffersPerShaderStage: number;
  readonly maxUniformBufferBindingSize: number;
  readonly maxStorageBufferBindingSize?: number;
  readonly minUniformBufferOffsetAlignment?: number;
  readonly minStorageBufferOffsetAlignment?: number;
  readonly maxVertexBuffers?: number;
  readonly maxVertexAttributes?: number;
  readonly maxVertexBufferArrayStride?: number;
  readonly maxInterStageShaderComponents?: number;
  readonly maxComputeWorkgroupStorageSize?: number;
  readonly maxComputeInvocationsPerWorkgroup?: number;
  readonly maxComputeWorkgroupSizeX?: number;
  readonly maxComputeWorkgroupSizeY?: number;
  readonly maxComputeWorkgroupSizeZ?: number;
  readonly maxComputeWorkgroupsPerDimension?: number;
};

/**
 * WebGPU Device/WebGL context abstraction
 */
export default abstract class Device {
  private stats = new Map();

  // readonly canvas: HTMLCanvasElement;

  /** Check if this device type is supported on this platform */
  // static isSupported(): boolean;

  /** Create device of this type (asynchronous) */
  // static async create(props?: object): Promise<Device>;

  /** Attach to existing WebGPU device */
  // static attach(device: WebGPUDevice, props?: object): Device;

  /** Resize the context */
  // resize(width: number, height: number): void;
  abstract features: Set<string>;
  abstract limits: DeviceLimits;

  getStats(name: string): Stats {
    if (!this.stats.has(name)) {
      this.stats.set(name, new Stats({id: name}));
    }
    return this.stats.get(name);
  }
}
