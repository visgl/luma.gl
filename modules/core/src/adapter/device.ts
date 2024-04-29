// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VERSION} from '../init';
import {StatsManager, lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';
import {uid} from '../utils/utils';
import type {TextureFormat} from './types/texture-formats';
import type {CanvasContext, CanvasContextProps} from './canvas-context';
import type {BufferProps} from './resources/buffer';
import {Buffer} from './resources/buffer';
import type {RenderPipeline, RenderPipelineProps} from './resources/render-pipeline';
import type {ComputePipeline, ComputePipelineProps} from './resources/compute-pipeline';
import type {Sampler, SamplerProps} from './resources/sampler';
import type {Shader, ShaderProps} from './resources/shader';
import type {Texture, TextureProps, TextureData} from './resources/texture';
import type {ExternalTexture, ExternalTextureProps} from './resources/external-texture';
import type {Framebuffer, FramebufferProps} from './resources/framebuffer';
import type {RenderPass, RenderPassProps} from './resources/render-pass';
import type {ComputePass, ComputePassProps} from './resources/compute-pass';
import type {CommandEncoder, CommandEncoderProps} from './resources/command-encoder';
import type {VertexArray, VertexArrayProps} from './resources/vertex-array';
import type {TransformFeedback, TransformFeedbackProps} from './resources/transform-feedback';
import type {QuerySet, QuerySetProps} from './resources/query-set';

import {isTextureFormatCompressed} from './type-utils/decode-texture-format';

/**
 * Identifies the GPU vendor and driver.
 * @note Chrome WebGPU does not provide much information, though more can be enabled with
 * @see https://developer.chrome.com/blog/new-in-webgpu-120#adapter_information_updates
 * chrome://flags/#enable-webgpu-developer-features
 */
export type DeviceInfo = {
  /** Type of device */
  type: 'webgl' | 'webgpu' | 'unknown';
  /** Vendor (name of GPU vendor, Apple, nVidia etc */
  vendor: string;
  /** Renderer (usually driver name) */
  renderer: string;
  /** version of driver */
  version: string;
  /** family of GPU */
  gpu: 'nvidia' | 'amd' | 'intel' | 'apple' | 'software' | 'unknown';
  /** Type of GPU () */
  gpuType: 'discrete' | 'integrated' | 'cpu' | 'unknown';
  /** GPU architecture */
  gpuArchitecture?: string; // 'common-3' on Apple
  /** GPU driver backend. Can sometimes be sniffed */
  gpuBackend?: 'opengl' | 'opengles' | 'metal' | 'd3d11' | 'd3d12' | 'vulkan' | 'unknown';
  /** If this is a fallback adapter */
  fallback?: boolean;
  /** Shader language supported by device.createShader() */
  shadingLanguage: 'wgsl' | 'glsl';
  /** Highest supported shader language version: GLSL 3.00 = 300, WGSL 1.00 = 100 */
  shadingLanguageVersion: number;
};

/** Limits for a device (max supported sizes of resources, max number of bindings etc) */
export abstract class DeviceLimits {
  /** max number of TextureDimension1D */
  abstract maxTextureDimension1D: number;
  /** max number of TextureDimension2D */
  abstract maxTextureDimension2D: number;
  /** max number of TextureDimension3D */
  abstract maxTextureDimension3D: number;
  /** max number of TextureArrayLayers */
  abstract maxTextureArrayLayers: number;
  /** max number of BindGroups */
  abstract maxBindGroups: number;
  /** max number of DynamicUniformBuffers per PipelineLayout */
  abstract maxDynamicUniformBuffersPerPipelineLayout: number;
  /** max number of DynamicStorageBuffers per PipelineLayout */
  abstract maxDynamicStorageBuffersPerPipelineLayout: number;
  /** max number of SampledTextures per ShaderStage */
  abstract maxSampledTexturesPerShaderStage: number;
  /** max number of Samplers per ShaderStage */
  abstract maxSamplersPerShaderStage: number;
  /** max number of StorageBuffers per ShaderStage */
  abstract maxStorageBuffersPerShaderStage: number;
  /** max number of StorageTextures per ShaderStage */
  abstract maxStorageTexturesPerShaderStage: number;
  /** max number of UniformBuffers per ShaderStage */
  abstract maxUniformBuffersPerShaderStage: number;
  /** max number of UniformBufferBindingSize */
  abstract maxUniformBufferBindingSize: number;
  /** max number of StorageBufferBindingSize */
  abstract maxStorageBufferBindingSize: number;
  /** min UniformBufferOffsetAlignment */
  abstract minUniformBufferOffsetAlignment: number;
  /** min StorageBufferOffsetAlignment */
  abstract minStorageBufferOffsetAlignment: number;
  /** max number of VertexBuffers */
  abstract maxVertexBuffers: number;
  /** max number of VertexAttributes */
  abstract maxVertexAttributes: number;
  /** max number of VertexBufferArrayStride */
  abstract maxVertexBufferArrayStride: number;
  /** max number of InterStageShaderComponents */
  abstract maxInterStageShaderComponents: number;
  /** max number of ComputeWorkgroupStorageSize */
  abstract maxComputeWorkgroupStorageSize: number;
  /** max number of ComputeInvocations per Workgroup */
  abstract maxComputeInvocationsPerWorkgroup: number;
  /** max ComputeWorkgroupSizeX */
  abstract maxComputeWorkgroupSizeX: number;
  /** max ComputeWorkgroupSizeY */
  abstract maxComputeWorkgroupSizeY: number;
  /** max ComputeWorkgroupSizeZ */
  abstract maxComputeWorkgroupSizeZ: number;
  /** max ComputeWorkgroupsPerDimension */
  abstract maxComputeWorkgroupsPerDimension: number;
}

/** Set-like class for features (lets apps check for WebGL / WebGPU extensions) */
export class DeviceFeatures {
  protected features: Set<DeviceFeature>;
  protected disabledFeatures?: Partial<Record<DeviceFeature, boolean>>;

  constructor(
    features: DeviceFeature[] = [],
    disabledFeatures: Partial<Record<DeviceFeature, boolean>>
  ) {
    this.features = new Set<DeviceFeature>(features);
    this.disabledFeatures = disabledFeatures || {};
  }

  *[Symbol.iterator](): IterableIterator<DeviceFeature> {
    yield* this.features;
  }

  has(feature: DeviceFeature): boolean {
    return !this.disabledFeatures[feature] && this.features.has(feature);
  }
}

/** Device feature names */
export type DeviceFeature =
  | WebGPUDeviceFeature
  | WebGLDeviceFeature
  | WebGLCompressedTextureFeatures;

export type WebGPUDeviceFeature =
  | 'depth-clip-control'
  | 'indirect-first-instance'
  | 'timestamp-query'
  | 'shader-f16'
  | 'depth24unorm-stencil8'
  | 'depth32float-stencil8'
  | 'rg11b10ufloat-renderable' // Is the rg11b10ufloat texture format renderable?
  | 'float32-filterable' // Is the float32 format filterable?
  | 'bgra8unorm-storage' // Can the bgra8unorm texture format be used in storage buffers?
  | 'texture-compression-bc'
  | 'texture-compression-etc2'
  | 'texture-compression-astc';
// | 'depth-clamping' // removed from the WebGPU spec...
// | 'pipeline-statistics-query' // removed from the WebGPU spec...

export type WebGLDeviceFeature =
  // webgl extension features
  | 'timer-query-webgl' // unify with WebGPU timestamp-query?
  | 'compilation-status-async-webgl' // Non-blocking shader compile/link status query available
  | 'provoking-vertex-webgl' // parameters.provokingVertex
  | 'polygon-mode-webgl' // parameters.polygonMode and parameters.polygonOffsetLine

  // GLSL extension features
  | 'shader-noperspective-interpolation-webgl' // Vertex outputs & fragment inputs can have a `noperspective` interpolation qualifier.
  | 'shader-conservative-depth-webgl' // GLSL `gl_FragDepth` qualifiers `depth_unchanged` etc can enable early depth test
  | 'shader-clip-cull-distance-webgl' // Makes gl_ClipDistance and gl_CullDistance available in shaders

  // texture rendering
  | 'float32-renderable-webgl'
  | 'float16-renderable-webgl'
  | 'rgb9e5ufloat_renderable-webgl'
  | 'snorm8-renderable-webgl'
  | 'norm16-renderable-webgl'
  | 'snorm16-renderable-webgl'

  // texture filtering
  | 'float16-filterable-webgl'
  | 'texture-filterable-anisotropic-webgl'

  // texture storage bindings
  | 'bgra8unorm-storage'

  // texture blending
  | 'texture-blend-float-webgl';

type WebGLCompressedTextureFeatures =
  | 'texture-compression-bc5-webgl'
  | 'texture-compression-bc7-webgl'
  | 'texture-compression-etc1-webgl'
  | 'texture-compression-pvrtc-webgl'
  | 'texture-compression-atc-webgl';

/** Device properties */
export type DeviceProps = {
  id?: string;

  // Common parameters
  canvas?: HTMLCanvasElement | OffscreenCanvas | string | null; // A canvas element or a canvas string id
  container?: HTMLElement | string | null;
  width?: number /** width is only used when creating a new canvas */;
  height?: number /** height is only used when creating a new canvas */;

  /** Request a Device with the highest limits supported by platform. WebGPU: devices can be created with minimal limits. */
  requestMaxLimits?: boolean;

  // WebGLContext PARAMETERS - Can only be set on context creation...
  // alpha?: boolean; // Default render target has an alpha buffer.
  // depth?: boolean; // Default render target has a depth buffer of at least 16 bits.
  // stencil?: boolean; // Default render target has a stencil buffer of at least 8 bits.
  // antialias?: boolean; // Boolean that indicates whether or not to perform anti-aliasing.
  // premultipliedAlpha?: boolean; // Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
  // preserveDrawingBuffer?: boolean; // Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten
  // failIfMajorPerformanceCaveat?: boolean; // Do not create if the system performance is low.

  /** Error handling */
  onError?: (error: Error) => unknown;

  // DEBUG SETTINGS

  /** WebGL: Instrument WebGL2RenderingContext (at the expense of performance) */
  debug?: boolean;
  /** Break on WebGL functions matching these strings */
  break?: string[];
  /** WebGL: Initialize the SpectorJS WebGL debugger */
  spector?: boolean;
  /** Initialize all features on startup */
  initalizeFeatures?: boolean;
  /** Disable specific features */
  disabledFeatures?: Partial<Record<DeviceFeature, boolean>>;

  /** TODO- Unclear if still supported: Set to false to disable WebGL state management instrumentation */
  manageState?: boolean;

  // @deprecated Attach to existing context. Rename to handle? Use Device.attach?
  gl?: WebGL2RenderingContext | null;
};

/**
 * WebGPU Device/WebGL context abstraction
 */
export abstract class Device {
  static defaultProps: Required<DeviceProps> = {
    id: null!,
    canvas: null,
    container: null,
    manageState: true,
    width: 800, // width are height are only used by headless gl
    height: 600,

    requestMaxLimits: true,
    debug: Boolean(log.get('debug')), // Instrument context (at the expense of performance)
    spector: Boolean(log.get('spector') || log.get('spectorjs')), // Initialize the SpectorJS WebGL debugger
    break: [],

    // TODO - Change these after confirming things work as expected
    initalizeFeatures: true,
    disabledFeatures: {
      'compilation-status-async-webgl': true
    },

    // alpha: undefined,
    // depth: undefined,
    // stencil: undefined,
    // antialias: undefined,
    // premultipliedAlpha: undefined,
    // preserveDrawingBuffer: undefined,
    // failIfMajorPerformanceCaveat: undefined

    gl: null,

    // Callbacks
    onError: (error: Error) => log.error(error.message)
  };

  get [Symbol.toStringTag](): string {
    return 'Device';
  }

  static VERSION = VERSION;

  constructor(props: DeviceProps) {
    this.props = {...Device.defaultProps, ...props};
    this.id = this.props.id || uid(this[Symbol.toStringTag].toLowerCase());
  }

  /** id of this device, primarily for debugging */
  readonly id: string;
  /** type of this device */
  abstract readonly type: 'webgl' | 'webgpu' | 'unknown';
  /** A copy of the device props  */
  readonly props: Required<DeviceProps>;
  /** Available for the application to store data on the device */
  userData: {[key: string]: unknown} = {};
  /** stats */
  readonly statsManager: StatsManager = lumaStats;

  /** Used by other luma.gl modules to store data on the device */
  _lumaData: {[key: string]: unknown} = {};

  abstract destroy(): void;

  // Capabilities

  /** Information about the device (vendor, versions etc) */
  abstract info: DeviceInfo;
  /** Optional capability discovery */
  abstract features: DeviceFeatures;
  /** WebGPU style device limits */
  abstract get limits(): DeviceLimits;

  /** Check if device supports a specific texture format (creation and `nearest` sampling) */
  abstract isTextureFormatSupported(format: TextureFormat): boolean;

  /** Check if linear filtering (sampler interpolation) is supported for a specific texture format */
  abstract isTextureFormatFilterable(format: TextureFormat): boolean;

  /** Check if device supports rendering to a specific texture format */
  abstract isTextureFormatRenderable(format: TextureFormat): boolean;

  /** Check if a specific texture format is GPU compressed */
  isTextureFormatCompressed(format: TextureFormat): boolean {
    return isTextureFormatCompressed(format);
  }

  // Device loss

  /** `true` if device is already lost */
  abstract get isLost(): boolean;

  /** Promise that resolves when device is lost */
  abstract readonly lost: Promise<{reason: 'destroyed'; message: string}>;

  /**
   * Trigger device loss.
   * @returns `true` if context loss could actually be triggered.
   * @note primarily intended for testing how application reacts to device loss
   */
  loseDevice(): boolean {
    return false;
  }

  // Canvas context

  /** Default / primary canvas context. Can be null as WebGPU devices can be created without a CanvasContext */
  abstract canvasContext: CanvasContext | null;

  /** Returns the default / primary canvas context. Throws an error if no canvas context is available (a WebGPU compute device) */
  getCanvasContext(): CanvasContext {
    if (!this.canvasContext) {
      throw new Error('Device has no CanvasContext');
    }
    return this.canvasContext;
  }

  /** Creates a new CanvasContext (WebGPU only) */
  abstract createCanvasContext(props?: CanvasContextProps): CanvasContext;

  /** Call after rendering a frame (necessary e.g. on WebGL OffscreenCanvas) */
  abstract submit(): void;

  // Resource creation

  /** Create a buffer */
  abstract createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): Buffer;

  /** Create a texture */
  abstract _createTexture(props: TextureProps): Texture;
  createTexture(props: TextureProps): Texture;
  createTexture(data: Promise<TextureData>): Texture;
  createTexture(url: string): Texture;

  createTexture(props: TextureProps | Promise<TextureData> | string): Texture {
    // Signature: new Texture2D(gl, url | Promise)
    if (props instanceof Promise || typeof props === 'string') {
      props = {data: props};
    }
    return this._createTexture(props);
  }

  /** Create a temporary texture view of a video source */
  abstract createExternalTexture(props: ExternalTextureProps): ExternalTexture;

  /** Create a sampler */
  abstract createSampler(props: SamplerProps): Sampler;

  /** Create a Framebuffer. Must have at least one attachment. */
  abstract createFramebuffer(props: FramebufferProps): Framebuffer;

  /** Create a shader */
  abstract createShader(props: ShaderProps): Shader;

  /** Create a render pipeline (aka program) */
  abstract createRenderPipeline(props: RenderPipelineProps): RenderPipeline;

  /** Create a compute pipeline (aka program). WebGPU only. */
  abstract createComputePipeline(props: ComputePipelineProps): ComputePipeline;

  /** Create a vertex array */
  abstract createVertexArray(props: VertexArrayProps): VertexArray;

  /** Create a RenderPass */
  abstract beginRenderPass(props?: RenderPassProps): RenderPass;

  /** Create a ComputePass */
  abstract beginComputePass(props?: ComputePassProps): ComputePass;

  /** Create a transform feedback (immutable set of output buffer bindings). WebGL only. */
  abstract createTransformFeedback(props: TransformFeedbackProps): TransformFeedback;

  abstract createQuerySet(props: QuerySetProps): QuerySet;

  createCommandEncoder(props: CommandEncoderProps = {}): CommandEncoder {
    throw new Error('not implemented');
  }

  // WebGL specific HACKS - enables app to remove webgl import
  // Use until we have a better way to handle these

  /** @deprecated - will be removed - should use command encoder */
  readPixelsToArrayWebGL(
    source: Framebuffer | Texture,
    options?: {
      sourceX?: number;
      sourceY?: number;
      sourceFormat?: number;
      sourceAttachment?: number;
      target?: Uint8Array | Uint16Array | Float32Array;
      // following parameters are auto deduced if not provided
      sourceWidth?: number;
      sourceHeight?: number;
      sourceType?: number;
    }
  ): Uint8Array | Uint16Array | Float32Array {
    throw new Error('not implemented');
  }

  /** @deprecated - will be removed - should use command encoder */
  readPixelsToBufferWebGL(
    source: Framebuffer | Texture,
    options?: {
      sourceX?: number;
      sourceY?: number;
      sourceFormat?: number;
      target?: Buffer; // A new Buffer object is created when not provided.
      targetByteOffset?: number; // byte offset in buffer object
      // following parameters are auto deduced if not provided
      sourceWidth?: number;
      sourceHeight?: number;
      sourceType?: number;
    }
  ): Buffer {
    throw new Error('not implemented');
  }

  /** @deprecated - will be removed - should use WebGPU parameters (pipeline) */
  setParametersWebGL(parameters: any): void {
    throw new Error('not implemented');
  }

  /** @deprecated - will be removed - should use WebGPU parameters (pipeline) */
  getParametersWebGL(parameters: any): void {
    throw new Error('not implemented');
  }

  /** @deprecated - will be removed - should use WebGPU parameters (pipeline) */
  withParametersWebGL(parameters: any, func: any): any {
    throw new Error('not implemented');
  }

  /** @deprecated - will be removed - should use clear arguments in RenderPass */
  clearWebGL(options?: {framebuffer?: Framebuffer; color?: any; depth?: any; stencil?: any}): void {
    throw new Error('not implemented');
  }

  /** @deprecated - will be removed - should use for debugging only */
  resetWebGL(): void {
    throw new Error('not implemented');
  }

  timestamp: number = 0;

  /** A monotonic counter for tracking buffer and texture updates */
  incrementTimestamp(): number {
    return this.timestamp++;
  }

  // Error Handling

  /** Report unhandled device errors */
  onError(error: Error) {
    this.props.onError(error);
  }

  // IMPLEMENTATION

  protected _getBufferProps(props: BufferProps | ArrayBuffer | ArrayBufferView): BufferProps {
    if (props instanceof ArrayBuffer || ArrayBuffer.isView(props)) {
      props = {data: props};
    }

    // TODO - fragile, as this is done before we merge with default options
    // inside the Buffer constructor

    const newProps = {...props};
    // Deduce indexType
    if ((props.usage || 0) & Buffer.INDEX && !props.indexType) {
      if (props.data instanceof Uint32Array) {
        newProps.indexType = 'uint32';
      } else if (props.data instanceof Uint16Array) {
        newProps.indexType = 'uint16';
      } else {
        log.warn('indices buffer content must be of integer type')();
      }
    }
    return newProps;
  }
}
