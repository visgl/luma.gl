// luma.gl, MIT license
import StatsManager, {lumaStats} from '../utils/stats-manager';
import type {default as Buffer, BufferProps} from './resources/buffer';
import type {default as Texture, TextureProps} from './resources/texture';
import type {default as Shader, ShaderProps} from './resources/shader';
// import type {RenderPipeline, RenderPipelineProps, ComputePipeline, ComputePipelineProps} from './pipeline';

export type ShadingLanguage = 'glsl' | 'wgsl';
// export type ShadingLanguageInfo = {version: string; features: Set<string>};

/**
 * Identifies the GPU vendor and driver.
 * @see https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
 */
export type DeviceInfo = {
  type: 'webgl' | 'webgl2' | 'webgpu';
  vendor: string,
  renderer: string,
  version: string,
  gpuVendor: 'NVIDIA' | 'AMD' | 'INTEL' | 'APPLE' | 'UNKNOWN';
  shadingLanguages: ShadingLanguage[];
  shadingLanguageVersions: Record<string, string>;
  vendorMasked?: string;
  rendererMasked?: string;
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

export type DeviceProps = {};

/**
 * WebGPU Device/WebGL context abstraction
 */
export default abstract class Device {
  get [Symbol.toStringTag](): string { return 'Device'; }

  readonly statsManager: StatsManager = lumaStats;

  abstract info: DeviceInfo;
  abstract features: Set<string>;

  /** Call after rendering a frame (necessary e.g. on WebGL OffScreenCanvas) */
  commit(): void {}

  // Resource creation
  createBuffer(props: BufferProps): Buffer;
  createBuffer(data: ArrayBuffer | ArrayBufferView): Buffer;
  
  createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): Buffer { 
    if (props instanceof ArrayBuffer || ArrayBuffer.isView(props)) {
      return this._createBuffer({data: props});
    }
    return this._createBuffer(props);
  }
  createTexture(props: TextureProps): Texture  { throw new Error('not implemented'); }
  createShader(props: ShaderProps): Shader  { throw new Error('not implemented'); }

  protected _createBuffer(props: BufferProps): Buffer { throw new Error('not implemented'); }
}
