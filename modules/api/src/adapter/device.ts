// luma.gl, MIT license
import StatsManager, {lumaStats} from '../utils/stats-manager';
import type {default as Buffer, BufferProps} from './buffer';
import type {default as Texture, TextureProps} from './texture';
import type {default as Shader, ShaderProps} from './shader';
// import type {RenderPipeline, RenderPipelineProps, ComputePipeline, ComputePipelineProps} from './pipeline';

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

export type DeviceProps = {};

/**
 * WebGPU Device/WebGL context abstraction
 */
export default class Device {
  readonly statsManager: StatsManager = lumaStats;

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

  /** Call after rendering a frame (necessary e.g. on WebGL OffScreenCanvas) */
  commit(): void {}

  protected _createBuffer(props: BufferProps): Buffer { throw new Error('not implemented'); }
}
