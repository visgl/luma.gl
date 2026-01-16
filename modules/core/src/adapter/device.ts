// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {StatsManager, lumaStats} from '../utils/stats-manager';
import {log} from '../utils/log';
import {uid} from '../utils/uid';
import type {VertexFormat, VertexFormatInfo} from '../shadertypes/vertex-arrays/vertex-formats';
import type {TextureFormat, TextureFormatInfo} from '../shadertypes/textures/texture-formats';
import type {CanvasContext, CanvasContextProps} from './canvas-context';
import type {BufferProps} from './resources/buffer';
import {Buffer} from './resources/buffer';
import type {RenderPipeline, RenderPipelineProps} from './resources/render-pipeline';
import type {ComputePipeline, ComputePipelineProps} from './resources/compute-pipeline';
import type {Sampler, SamplerProps} from './resources/sampler';
import type {Shader, ShaderProps} from './resources/shader';
import type {Texture, TextureProps} from './resources/texture';
import type {ExternalTexture, ExternalTextureProps} from './resources/external-texture';
import type {Framebuffer, FramebufferProps} from './resources/framebuffer';
import type {RenderPass, RenderPassProps} from './resources/render-pass';
import type {ComputePass, ComputePassProps} from './resources/compute-pass';
import type {CommandEncoder, CommandEncoderProps} from './resources/command-encoder';
import type {CommandBuffer} from './resources/command-buffer';
import type {VertexArray, VertexArrayProps} from './resources/vertex-array';
import type {TransformFeedback, TransformFeedbackProps} from './resources/transform-feedback';
import type {QuerySet, QuerySetProps} from './resources/query-set';

import {getVertexFormatInfo} from '../shadertypes/vertex-arrays/decode-vertex-format';
import {textureFormatDecoder} from '../shadertypes/textures/texture-format-decoder';
import type {ExternalImage} from '../image-utils/image-types';
import {isExternalImage, getExternalImageSize} from '../image-utils/image-types';

/**
 * Identifies the GPU vendor and driver.
 * @note Chrome WebGPU does not provide much information, though more can be enabled with
 * @see https://developer.chrome.com/blog/new-in-webgpu-120#adapter_information_updates
 * chrome://flags/#enable-webgpu-developer-features
 */
export type DeviceInfo = {
  /** Type of device */
  type: 'webgl' | 'webgpu' | 'null' | 'unknown';
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
  abstract maxInterStageShaderVariables: number;
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
    return !this.disabledFeatures?.[feature] && this.features.has(feature);
  }
}

/** Device feature names */
export type DeviceFeature =
  | WebGPUDeviceFeature
  | WebGLDeviceFeature
  | WebGLCompressedTextureFeatures;
// | ChromeExperimentalFeatures

/** Chrome-specific extensions. Expected to eventually become standard features. */
// export type ChromeExperimentalFeatures = ;

export type WebGPUDeviceFeature =
  | 'depth-clip-control'
  | 'depth32float-stencil8'
  | 'texture-compression-bc'
  | 'texture-compression-bc-sliced-3d'
  | 'texture-compression-etc2'
  | 'texture-compression-astc'
  | 'texture-compression-astc-sliced-3d'
  | 'timestamp-query'
  | 'indirect-first-instance'
  | 'shader-f16'
  | 'rg11b10ufloat-renderable' // Is the rg11b10ufloat texture format renderable?
  | 'bgra8unorm-storage' // Can the bgra8unorm texture format be used in storage buffers?
  | 'float32-filterable' // Is the float32 format filterable?
  | 'float32-blendable' // Is the float32 format blendable?
  | 'clip-distances'
  | 'dual-source-blending'
  | 'subgroups';
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
  | 'rgb9e5ufloat-renderable-webgl'
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

/** Texture format capabilities that have been checked against a specific device */
export type DeviceTextureFormatCapabilities = {
  format: TextureFormat;
  /** Can the format be created and sampled?*/
  create: boolean;
  /** Is the format renderable. */
  render: boolean;
  /** Is the format filterable. */
  filter: boolean;
  /** Is the format blendable. */
  blend: boolean;
  /** Is the format storeable. */
  store: boolean;
};

/** Device properties */
export type DeviceProps = {
  /** string id for debugging. Stored on the object, used in logging and set on underlying GPU objects when feasible. */
  id?: string;
  /** Properties for creating a default canvas context */
  createCanvasContext?: CanvasContextProps | true;
  /** Control which type of GPU is preferred on systems with both integrated and discrete GPU. Defaults to "high-performance" / discrete GPU. */
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  /** Hints that device creation should fail if no hardware GPU is available (if the system performance is "low"). */
  failIfMajorPerformanceCaveat?: boolean;

  /** WebGL specific: Properties passed through to WebGL2RenderingContext creation: `canvas.getContext('webgl2', props.webgl)` */
  webgl?: WebGLContextProps;

  // CALLBACKS

  /** Error handler. If it returns a probe logger style function, it will be called at the site of the error to optimize console error links. */
  onError?: (error: Error, context?: unknown) => unknown;
  /** Called when the size of a CanvasContext's canvas changes */
  onResize?: (ctx: CanvasContext, info: {oldPixelSize: [number, number]}) => unknown;
  /** Called when the absolute position of a CanvasContext's canvas changes. Must set `CanvasContextProps.trackPosition: true` */
  onPositionChange?: (ctx: CanvasContext, info: {oldPosition: [number, number]}) => unknown;
  /** Called when the visibility of a CanvasContext's canvas changes */
  onVisibilityChange?: (ctx: CanvasContext) => unknown;
  /** Called when the device pixel ratio of a CanvasContext's canvas changes */
  onDevicePixelRatioChange?: (ctx: CanvasContext, info: {oldRatio: number}) => unknown;

  // DEBUG SETTINGS

  /** Turn on implementation defined checks that slow down execution but help break where errors occur */
  debug?: boolean;
  /** Show shader source in browser? The default is `'error'`, meaning that logs are shown when shader compilation has errors */
  debugShaders?: 'never' | 'errors' | 'warnings' | 'always';
  /** Renders a small version of updated Framebuffers into the primary canvas context. Can be set in console luma.log.set('debug-framebuffers', true) */
  debugFramebuffers?: boolean;
  /** Traces resource caching, reuse, and destroys in the PipelineFactory */
  debugFactories?: boolean;
  /** WebGL specific - Trace WebGL calls (instruments WebGL2RenderingContext at the expense of performance). Can be set in console luma.log.set('debug-webgl', true)  */
  debugWebGL?: boolean;
  /** WebGL specific - Initialize the SpectorJS WebGL debugger. Can be set in console luma.log.set('debug-spectorjs', true)  */
  debugSpectorJS?: boolean;
  /** WebGL specific - SpectorJS URL. Override if CDN is down or different SpectorJS version is desired. */
  debugSpectorJSUrl?: string;

  // EXPERIMENTAL SETTINGS - subject to change

  /** adapter.create() returns the existing Device if the provided canvas' WebGL context is already associated with a Device.  */
  _reuseDevices?: boolean;
  /** WebGPU specific - Request a Device with the highest limits supported by platform. On WebGPU devices can be created with minimal limits. */
  _requestMaxLimits?: boolean;
  /** Disable specific features */
  _disabledFeatures?: Partial<Record<DeviceFeature, boolean>>;
  /** WebGL specific - Initialize all features on startup */
  _initializeFeatures?: boolean;
  /** Enable shader caching (via ShaderFactory) */
  _cacheShaders?: boolean;
  /** Enable shader caching (via PipelineFactory) */
  _cachePipelines?: boolean;
  /** Never destroy cached shaders and pipelines */
  _cacheDestroyPolicy?: 'unused' | 'never';

  /** @deprecated Internal, Do not use directly! Use `luma.attachDevice()` to attach to pre-created contexts/devices. */
  _handle?: unknown; // WebGL2RenderingContext | GPUDevice | null;
};

/** WebGL independent copy of WebGLContextAttributes */
type WebGLContextProps = {
  /** indicates if the canvas contains an alpha buffer. */
  alpha?: boolean;
  /** hints the user agent to reduce the latency by desynchronizing the canvas paint cycle from the event loop */
  desynchronized?: boolean;
  /** indicates whether or not to perform anti-aliasing. */
  antialias?: boolean;
  /** indicates that the render target has a stencil buffer of at least `8` bits. */
  stencil?: boolean;
  /** indicates that the drawing buffer has a depth buffer of at least 16 bits. */
  depth?: boolean;
  /** indicates if a context will be created if the system performance is low or if no hardware GPU is available. */
  failIfMajorPerformanceCaveat?: boolean;
  /** Selects GPU */
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  /** page compositor will assume the drawing buffer contains colors with pre-multiplied alpha. */
  premultipliedAlpha?: boolean;
  /** buffers will not be cleared and will preserve their values until cleared or overwritten by the author. */
  preserveDrawingBuffer?: boolean;
};

/**
 * Create and attach devices for a specific backend. Currently static methods on each device
 */
export interface DeviceFactory {
  // new (props: DeviceProps): Device; Constructor isn't used
  type: string;
  isSupported(): boolean;
  create(props: DeviceProps): Promise<Device>;
  attach?(handle: unknown): Device;
}

/**
 * WebGPU Device/WebGL context abstraction
 */
export abstract class Device {
  static defaultProps: Required<DeviceProps> = {
    id: null!,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    createCanvasContext: undefined!,
    // WebGL specific
    webgl: {},

    // Callbacks
    // eslint-disable-next-line handle-callback-err
    onError: (error: Error, context: unknown) => {},
    onResize: (context: CanvasContext, info: {oldPixelSize: [number, number]}) => {
      const [width, height] = context.getDevicePixelSize();
      log.log(1, `${context} resized => ${width}x${height}px`)();
    },
    onPositionChange: (context: CanvasContext, info: {oldPosition: [number, number]}) => {
      const [left, top] = context.getPosition();
      log.log(1, `${context} repositioned => ${left},${top}`)();
    },
    onVisibilityChange: (context: CanvasContext) =>
      log.log(1, `${context} Visibility changed ${context.isVisible}`)(),
    onDevicePixelRatioChange: (context: CanvasContext, info: {oldRatio: number}) =>
      log.log(1, `${context} DPR changed ${info.oldRatio} => ${context.devicePixelRatio}`)(),

    // Debug flags
    debug: log.get('debug') || undefined!,
    debugShaders: log.get('debug-shaders') || undefined!,
    debugFramebuffers: Boolean(log.get('debug-framebuffers')),
    debugFactories: Boolean(log.get('debug-factories')),
    debugWebGL: Boolean(log.get('debug-webgl')),
    debugSpectorJS: undefined!, // Note: log setting is queried by the spector.js code
    debugSpectorJSUrl: undefined!,

    // Experimental
    _reuseDevices: false,
    _requestMaxLimits: true,
    _cacheShaders: false,
    _cachePipelines: false,
    _cacheDestroyPolicy: 'unused',
    // TODO - Change these after confirming things work as expected
    _initializeFeatures: true,
    _disabledFeatures: {
      'compilation-status-async-webgl': true
    },

    // INTERNAL
    _handle: undefined!
  };

  get [Symbol.toStringTag](): string {
    return 'Device';
  }

  toString(): string {
    return `Device(${this.id})`;
  }

  /** id of this device, primarily for debugging */
  readonly id: string;
  /** type of this device */
  abstract readonly type: 'webgl' | 'webgpu' | 'null' | 'unknown';
  abstract readonly handle: unknown;
  abstract commandEncoder: CommandEncoder;

  /** A copy of the device props  */
  readonly props: Required<DeviceProps>;
  /** Available for the application to store data on the device */
  userData: {[key: string]: unknown} = {};
  /** stats */
  readonly statsManager: StatsManager = lumaStats;
  /** An abstract timestamp used for change tracking */
  timestamp: number = 0;

  /** True if this device has been reused during device creation (app has multiple references) */
  _reused: boolean = false;
  /** Used by other luma.gl modules to store data on the device */
  _lumaData: {[key: string]: unknown} = {};

  // Capabilities

  /** Information about the device (vendor, versions etc) */
  abstract info: DeviceInfo;
  /** Optional capability discovery */
  abstract features: DeviceFeatures;
  /** WebGPU style device limits */
  abstract get limits(): DeviceLimits;

  // Texture helpers

  /** Optimal TextureFormat for displaying 8-bit depth, standard dynamic range content on this system. */
  abstract preferredColorFormat: 'rgba8unorm' | 'bgra8unorm';
  /** Default depth format used on this system */
  abstract preferredDepthFormat: 'depth16' | 'depth24plus' | 'depth32float';

  protected _textureCaps: Partial<Record<TextureFormat, DeviceTextureFormatCapabilities>> = {};

  constructor(props: DeviceProps) {
    this.props = {...Device.defaultProps, ...props};
    this.id = this.props.id || uid(this[Symbol.toStringTag].toLowerCase());
  }

  abstract destroy(): void;

  getVertexFormatInfo(format: VertexFormat): VertexFormatInfo {
    return getVertexFormatInfo(format);
  }

  isVertexFormatSupported(format: VertexFormat): boolean {
    return true;
  }

  /** Returns information about a texture format, such as data type, channels, bits per channel, compression etc */
  getTextureFormatInfo(format: TextureFormat): TextureFormatInfo {
    return textureFormatDecoder.getInfo(format);
  }

  /** Determines what operations are supported on a texture format on this particular device (checks against supported device features) */
  getTextureFormatCapabilities(format: TextureFormat): DeviceTextureFormatCapabilities {
    let textureCaps = this._textureCaps[format];
    if (!textureCaps) {
      const capabilities = this._getDeviceTextureFormatCapabilities(format);
      textureCaps = this._getDeviceSpecificTextureFormatCapabilities(capabilities);
      this._textureCaps[format] = textureCaps;
    }
    return textureCaps;
  }

  /** Return the implementation specific alignment for a texture format. 1 on WebGL, 256 on WebGPU */
  abstract getTextureByteAlignment(): number;

  /** Calculates the number of mip levels for a texture of width, height and in case of 3d textures only, depth */
  getMipLevelCount(width: number, height: number, depth3d: number = 1): number {
    const maxSize = Math.max(width, height, depth3d);
    return 1 + Math.floor(Math.log2(maxSize));
  }

  /** Check if data is an external image */
  isExternalImage(data: unknown): data is ExternalImage {
    return isExternalImage(data);
  }

  /** Get the size of an external image */
  getExternalImageSize(data: ExternalImage): {width: number; height: number} {
    return getExternalImageSize(data);
  }

  /** Check if device supports a specific texture format (creation and `nearest` sampling) */
  isTextureFormatSupported(format: TextureFormat): boolean {
    return this.getTextureFormatCapabilities(format).create;
  }

  /** Check if linear filtering (sampler interpolation) is supported for a specific texture format */
  isTextureFormatFilterable(format: TextureFormat): boolean {
    return this.getTextureFormatCapabilities(format).filter;
  }

  /** Check if device supports rendering to a framebuffer color attachment of a specific texture format */
  isTextureFormatRenderable(format: TextureFormat): boolean {
    return this.getTextureFormatCapabilities(format).render;
  }

  /** Check if a specific texture format is GPU compressed */
  isTextureFormatCompressed(format: TextureFormat): boolean {
    return textureFormatDecoder.isCompressed(format);
  }

  // DEBUG METHODS

  pushDebugGroup(groupLabel: string): void {
    this.commandEncoder.pushDebugGroup(groupLabel);
  }

  popDebugGroup(): void {
    this.commandEncoder?.popDebugGroup();
  }

  insertDebugMarker(markerLabel: string): void {
    this.commandEncoder?.insertDebugMarker(markerLabel);
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

  /** A monotonic counter for tracking buffer and texture updates */
  incrementTimestamp(): number {
    return this.timestamp++;
  }

  /**
   * Reports Device errors in a way that optimizes for developer experience / debugging.
   * - Logs so that the console error links directly to the source code that generated the error.
   * - Includes the object that reported the error in the log message, even if the error is asynchronous.
   *
   * Conventions when calling reportError():
   * - Always call the returned function - to ensure error is logged, at the error site
   * - Follow with a call to device.debug() - to ensure that the debugger breaks at the error site
   *
   * @param error - the error to report. If needed, just create a new Error object with the appropriate message.
   * @param context - pass `this` as context, otherwise it may not be available in the debugger for async errors.
   * @returns the logger function returned by device.props.onError() so that it can be called from the error site.
   *
   * @example
   *   device.reportError(new Error(...), this)();
   *   device.debug();
   */
  reportError(error: Error, context: unknown, ...args: unknown[]): () => unknown {
    // Call the error handler
    const isHandled = this.props.onError(error, context);
    if (!isHandled) {
      // Note: Returns a function that must be called: `device.reportError(...)()`
      return log.error(error.message, context, ...args);
    }
    return () => {};
  }

  /** Break in the debugger - if device.props.debug is true */
  debug(): void {
    if (this.props.debug) {
      // @ts-ignore
      debugger; // eslint-disable-line
    } else {
      // TODO(ibgreen): Does not appear to be printed in the console
      const message = `\
'Type luma.log.set({debug: true}) in console to enable debug breakpoints',
or create a device with the 'debug: true' prop.`;
      log.once(0, message)();
    }
  }

  // Canvas context

  /** Default / primary canvas context. Can be null as WebGPU devices can be created without a CanvasContext */
  abstract canvasContext: CanvasContext | null;

  /** Returns the default / primary canvas context. Throws an error if no canvas context is available (a WebGPU compute device) */
  getDefaultCanvasContext(): CanvasContext {
    if (!this.canvasContext) {
      throw new Error('Device has no default CanvasContext. See props.createCanvasContext');
    }
    return this.canvasContext;
  }

  /** Creates a new CanvasContext (WebGPU only) */
  abstract createCanvasContext(props?: CanvasContextProps): CanvasContext;

  /** Call after rendering a frame (necessary e.g. on WebGL OffscreenCanvas) */
  abstract submit(commandBuffer?: CommandBuffer): void;

  // Resource creation

  /** Create a buffer */
  abstract createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): Buffer;

  /** Create a texture */
  abstract createTexture(props: TextureProps): Texture;

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

  abstract createCommandEncoder(props?: CommandEncoderProps): CommandEncoder;

  /** Create a transform feedback (immutable set of output buffer bindings). WebGL only. */
  abstract createTransformFeedback(props: TransformFeedbackProps): TransformFeedback;

  abstract createQuerySet(props: QuerySetProps): QuerySet;

  /** Create a RenderPass using the default CommandEncoder */
  beginRenderPass(props?: RenderPassProps): RenderPass {
    return this.commandEncoder.beginRenderPass(props);
  }

  /** Create a ComputePass using the default CommandEncoder*/
  beginComputePass(props?: ComputePassProps): ComputePass {
    return this.commandEncoder.beginComputePass(props);
  }

  /**
   * Determines what operations are supported on a texture format, checking against supported device features
   * Subclasses override to apply additional checks
   */
  protected abstract _getDeviceSpecificTextureFormatCapabilities(
    format: DeviceTextureFormatCapabilities
  ): DeviceTextureFormatCapabilities;

  // DEPRECATED METHODS

  /** @deprecated Use getDefaultCanvasContext() */
  getCanvasContext(): CanvasContext {
    return this.getDefaultCanvasContext();
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

  // IMPLEMENTATION

  /** Helper to get the canvas context props */
  static _getCanvasContextProps(props: DeviceProps): CanvasContextProps | undefined {
    return props.createCanvasContext === true ? {} : props.createCanvasContext;
  }

  protected _getDeviceTextureFormatCapabilities(
    format: TextureFormat
  ): DeviceTextureFormatCapabilities {
    const genericCapabilities = textureFormatDecoder.getCapabilities(format);

    // Check standard features
    const checkFeature = (feature: DeviceFeature | boolean | undefined) =>
      (typeof feature === 'string' ? this.features.has(feature) : feature) ?? true;

    const supported = checkFeature(genericCapabilities.create);
    return {
      format,
      create: supported,
      render: supported && checkFeature(genericCapabilities.render),
      filter: supported && checkFeature(genericCapabilities.filter),
      blend: supported && checkFeature(genericCapabilities.blend),
      store: supported && checkFeature(genericCapabilities.store)
    } as const satisfies DeviceTextureFormatCapabilities;
  }

  /** Subclasses use this to support .createBuffer() overloads */
  protected _normalizeBufferProps(props: BufferProps | ArrayBuffer | ArrayBufferView): BufferProps {
    if (props instanceof ArrayBuffer || ArrayBuffer.isView(props)) {
      props = {data: props};
    }

    // TODO(ibgreen) - fragile, as this is done before we merge with default options
    // inside the Buffer constructor

    const newProps = {...props};
    // Deduce indexType
    const usage = props.usage || 0;
    if (usage & Buffer.INDEX) {
      if (!props.indexType) {
        if (props.data instanceof Uint32Array) {
          newProps.indexType = 'uint32';
        } else if (props.data instanceof Uint16Array) {
          newProps.indexType = 'uint16';
        } else if (props.data instanceof Uint8Array) {
          // Convert uint8 to uint16 for WebGPU compatibility (WebGPU doesn't support uint8 indices)
          newProps.data = new Uint16Array(props.data);
          newProps.indexType = 'uint16';
        }
      }
      if (!newProps.indexType) {
        throw new Error('indices buffer content must be of type uint16 or uint32');
      }
    }

    return newProps;
  }
}
