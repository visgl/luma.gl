// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DeviceProps,
  DeviceInfo,
  CanvasContextProps,
  TextureFormat,
  VertexArray,
  VertexArrayProps,
  Framebuffer,
  Buffer,
  Texture,
  TypedArray
} from '@luma.gl/core';
import {Device, CanvasContext, log, uid, assert} from '@luma.gl/core';
import type {GLExtensions} from '@luma.gl/constants';
import {
  popContextState,
  pushContextState,
  trackContextState
} from '../context/state-tracker/track-context-state';
import {createBrowserContext} from '../context/helpers/create-browser-context';
import {getDeviceInfo} from './device-helpers/webgl-device-info';
import {WebGLDeviceFeatures} from './device-helpers/webgl-device-features';
import {WebGLDeviceLimits} from './device-helpers/webgl-device-limits';
import {WebGLCanvasContext} from './webgl-canvas-context';
import {loadSpectorJS, initializeSpectorJS} from '../context/debug/spector';
import {loadWebGLDeveloperTools, makeDebugContext} from '../context/debug/webgl-developer-tools';
import {
  isTextureFormatSupported,
  isTextureFormatRenderable,
  isTextureFormatFilterable
} from './converters/texture-formats';

// WebGL classes
import type {
  BufferProps,
  ShaderProps,
  // Sampler,
  SamplerProps,
  TextureProps,
  ExternalTexture,
  ExternalTextureProps,
  FramebufferProps,
  // RenderPipeline,
  RenderPipelineProps,
  ComputePipeline,
  ComputePipelineProps,
  // RenderPass,
  RenderPassProps,
  ComputePass,
  ComputePassProps,
  // CommandEncoder,
  CommandEncoderProps,
  TransformFeedbackProps,
  QuerySetProps
} from '@luma.gl/core';

import {WEBGLBuffer} from './resources/webgl-buffer';
import {WEBGLShader} from './resources/webgl-shader';
import {WEBGLSampler} from './resources/webgl-sampler';
import {WEBGLTexture} from './resources/webgl-texture';
import {WEBGLFramebuffer} from './resources/webgl-framebuffer';
import {WEBGLRenderPass} from './resources/webgl-render-pass';
import {WEBGLRenderPipeline} from './resources/webgl-render-pipeline';
import {WEBGLCommandEncoder} from './resources/webgl-command-encoder';
import {WEBGLVertexArray} from './resources/webgl-vertex-array';
import {WEBGLTransformFeedback} from './resources/webgl-transform-feedback';
import {WEBGLQuerySet} from './resources/webgl-query-set';

import {readPixelsToArray, readPixelsToBuffer} from '../classic/copy-and-blit';
import {
  setGLParameters,
  getGLParameters,
  resetGLParameters
} from '../context/parameters/unified-parameter-api';
import {withGLParameters} from '../context/state-tracker/with-parameters';
import {clear} from '../classic/clear';
import {getWebGLExtension} from '../context/helpers/webgl-extensions';

const LOG_LEVEL = 1;

/** WebGPU style Device API for a WebGL context */
export class WebGLDevice extends Device {
  //
  // Public `Device` API
  //

  /** type of this device */
  static readonly type: string = 'webgl';

  /** type of this device */
  readonly type = 'webgl';

  /** The underlying WebGL context */
  readonly handle: WebGL2RenderingContext;
  features: WebGLDeviceFeatures;
  limits: WebGLDeviceLimits;

  readonly info: DeviceInfo;
  readonly canvasContext: WebGLCanvasContext;

  readonly lost: Promise<{reason: 'destroyed'; message: string}>;

  private _resolveContextLost?: (value: {reason: 'destroyed'; message: string}) => void;

  //
  // Static methods, expected to be present by `luma.createDevice()`
  //

  /** Check if WebGL 2 is available */
  static isSupported(): boolean {
    return typeof WebGL2RenderingContext !== 'undefined';
  }

  /**
   * Get a device instance from a GL context
   * Creates and instruments the device if not already created
   * @param gl
   * @returns
   */
  static attach(gl: Device | WebGL2RenderingContext): WebGLDevice {
    if (gl instanceof WebGLDevice) {
      return gl;
    }
    // @ts-expect-error
    if (gl?.device instanceof Device) {
      // @ts-expect-error
      return gl.device as WebGLDevice;
    }
    if (!isWebGL(gl)) {
      throw new Error('Invalid WebGL2RenderingContext');
    }
    return new WebGLDevice({gl: gl as WebGL2RenderingContext});
  }

  static async create(props: DeviceProps = {}): Promise<WebGLDevice> {
    log.groupCollapsed(LOG_LEVEL, 'WebGLDevice created')();

    const promises: Promise<unknown>[] = [];

    // Load webgl and spector debug scripts from CDN if requested
    if (props.debug) {
      promises.push(loadWebGLDeveloperTools());
    }

    if (props.spector) {
      promises.push(loadSpectorJS());
    }

    // Wait for page to load: if canvas is a string we need to query the DOM for the canvas element.
    // We only wait when props.canvas is string to avoids setting the global page onload callback unless necessary.
    if (typeof props.canvas === 'string') {
      promises.push(CanvasContext.pageLoaded);
    }

    // Wait for all the loads to settle before creating the context.
    // The Device.create() functions are async, so in contrast to the constructor, we can `await` here.
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'rejected') {
        log.error(`Failed to initialize debug libraries ${result.reason}`)();
      }
    }

    log.probe(LOG_LEVEL + 1, 'DOM is loaded')();

    // @ts-expect-error
    if (props.gl?.device) {
      log.warn('reattaching existing device')();
      return WebGLDevice.attach(props.gl);
    }

    const device = new WebGLDevice(props);

    // Log some debug info about the newly created context
    const message = `\
Created ${device.type}${device.debug ? ' debug' : ''} context: \
${device.info.vendor}, ${device.info.renderer} for canvas: ${device.canvasContext.id}`;
    log.probe(LOG_LEVEL, message)();
    log.table(LOG_LEVEL, device.info)();

    log.groupEnd(LOG_LEVEL)();

    return device;
  }

  //
  // Public API
  //

  constructor(props: DeviceProps) {
    super({...props, id: props.id || uid('webgl-device')});

    // If attaching to an already attached context, return the attached device
    // @ts-expect-error device is attached to context
    const device: WebGLDevice | undefined = props.gl?.device;
    if (device) {
      throw new Error(`WebGL context already attached to device ${device.id}`);
    }

    // Create and instrument context
    const canvas = props.gl?.canvas || props.canvas;
    this.canvasContext = new WebGLCanvasContext(this, {...props, canvas});

    this.lost = new Promise<{reason: 'destroyed'; message: string}>(resolve => {
      this._resolveContextLost = resolve;
    });

    let gl: WebGL2RenderingContext | null = props.gl || null;
    gl ||= createBrowserContext(this.canvasContext.canvas, {
      ...props,
      onContextLost: (event: Event) =>
        this._resolveContextLost?.({
          reason: 'destroyed',
          message: 'Entered sleep mode, or too many apps or browser tabs are using the GPU.'
        })
    });

    if (!gl) {
      throw new Error('WebGL context creation failed');
    }

    this.handle = gl;
    this.gl = gl;

    (this.gl as any).device = this; // Update GL context: Link webgl context back to device
    (this.gl as any)._version = 2; // Update GL context: Store WebGL version field on gl context (HACK to identify debug contexts)

    // luma Device fields
    this.info = getDeviceInfo(this.gl, this._extensions);
    this.limits = new WebGLDeviceLimits(this.gl);
    this.features = new WebGLDeviceFeatures(this.gl, this._extensions, this.props.disabledFeatures);
    if (this.props.initalizeFeatures) {
      this.features.initializeFeatures();
    }

    this.canvasContext.resize();

    // Install context state tracking
    // @ts-expect-error - hidden parameters
    const {enable = true, copyState = false} = props;
    trackContextState(this.gl, {
      enable,
      copyState,
      log: (...args: any[]) => log.log(1, ...args)()
    });

    // DEBUG contexts: Add debug instrumentation to the context, force log level to at least 1
    if (props.debug) {
      this.gl = makeDebugContext(this.gl, {...props, throwOnError: true});
      this.debug = true;
      log.level = Math.max(log.level, 1);
      log.warn('WebGL debug mode activated. Performance reduced.')();
    }

    if (props.spector) {
      this.spectorJS = initializeSpectorJS({...this.props, canvas: this.handle.canvas});
    }
  }

  /**
   * Destroys the context
   * @note Has no effect for WebGL browser contexts, there is no browser API for destroying contexts
   */
  destroy(): void {}

  get isLost(): boolean {
    return this.gl.isContextLost();
  }

  getSize(): [number, number] {
    return [this.gl.drawingBufferWidth, this.gl.drawingBufferHeight];
  }

  isTextureFormatSupported(format: TextureFormat): boolean {
    return isTextureFormatSupported(this.gl, format, this._extensions);
  }

  isTextureFormatFilterable(format: TextureFormat): boolean {
    return isTextureFormatFilterable(this.gl, format, this._extensions);
  }

  isTextureFormatRenderable(format: TextureFormat): boolean {
    return isTextureFormatRenderable(this.gl, format, this._extensions);
  }

  // IMPLEMENTATION OF ABSTRACT DEVICE

  createCanvasContext(props?: CanvasContextProps): CanvasContext {
    throw new Error('WebGL only supports a single canvas');
  }

  createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): WEBGLBuffer {
    const newProps = this._getBufferProps(props);
    return new WEBGLBuffer(this, newProps);
  }

  _createTexture(props: TextureProps): WEBGLTexture {
    return new WEBGLTexture(this, props);
  }

  createExternalTexture(props: ExternalTextureProps): ExternalTexture {
    throw new Error('createExternalTexture() not implemented'); // return new Program(props);
  }

  createSampler(props: SamplerProps): WEBGLSampler {
    return new WEBGLSampler(this, props);
  }

  createShader(props: ShaderProps): WEBGLShader {
    return new WEBGLShader(this, props);
  }

  createFramebuffer(props: FramebufferProps): WEBGLFramebuffer {
    return new WEBGLFramebuffer(this, props);
  }

  createVertexArray(props: VertexArrayProps): VertexArray {
    return new WEBGLVertexArray(this, props);
  }

  createTransformFeedback(props: TransformFeedbackProps): WEBGLTransformFeedback {
    return new WEBGLTransformFeedback(this, props);
  }

  createQuerySet(props: QuerySetProps): WEBGLQuerySet {
    return new WEBGLQuerySet(this, props);
  }

  createRenderPipeline(props: RenderPipelineProps): WEBGLRenderPipeline {
    return new WEBGLRenderPipeline(this, props);
  }

  beginRenderPass(props: RenderPassProps): WEBGLRenderPass {
    return new WEBGLRenderPass(this, props);
  }

  createComputePipeline(props?: ComputePipelineProps): ComputePipeline {
    throw new Error('ComputePipeline not supported in WebGL');
  }

  beginComputePass(props: ComputePassProps): ComputePass {
    throw new Error('ComputePass not supported in WebGL');
  }

  private renderPass: WEBGLRenderPass | null = null;

  override createCommandEncoder(props?: CommandEncoderProps): WEBGLCommandEncoder {
    return new WEBGLCommandEncoder(this, props);
  }

  /**
   * Offscreen Canvas Support: Commit the frame
   * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/commit
   * Chrome's offscreen canvas does not require gl.commit
   */
  submit(): void {
    this.renderPass?.end();
    this.renderPass = null;
    // this.canvasContext.commit();
  }

  //
  // TEMPORARY HACKS - will be removed in v9.1
  //

  /** @deprecated - should use command encoder */
  override readPixelsToArrayWebGL(
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
    return readPixelsToArray(source, options);
  }

  /** @deprecated - should use command encoder */
  override readPixelsToBufferWebGL(
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
    return readPixelsToBuffer(source, options);
  }

  override setParametersWebGL(parameters: any): void {
    setGLParameters(this.gl, parameters);
  }

  override getParametersWebGL(parameters: any): any {
    return getGLParameters(this.gl, parameters);
  }

  override withParametersWebGL(parameters: any, func: any): any {
    return withGLParameters(this.gl, parameters, func);
  }

  override clearWebGL(options?: {
    framebuffer?: Framebuffer;
    color?: any;
    depth?: any;
    stencil?: any;
  }): void {
    clear(this, options);
  }

  override resetWebGL(): void {
    log.warn('WebGLDevice.resetWebGL is deprecated, use only for debugging')();
    resetGLParameters(this.gl);
  }

  //
  // WebGL-only API (not part of `Device` API)
  //

  /** WebGL2 context. */
  readonly gl: WebGL2RenderingContext;
  readonly debug: boolean = false;

  /** State used by luma.gl classes: TODO - move to canvasContext*/
  readonly _canvasSizeInfo = {clientWidth: 0, clientHeight: 0, devicePixelRatio: 1};

  /** State used by luma.gl classes - TODO - not used? */
  readonly _extensions: GLExtensions = {};
  _polyfilled: boolean = false;

  /** Instance of Spector.js (if initialized) */
  spectorJS: unknown;

  /**
   * Triggers device (or WebGL context) loss.
   * @note primarily intended for testing how application reacts to device loss
   */
  override loseDevice(): boolean {
    let deviceLossTriggered = false;
    const extensions = this.getExtension('WEBGL_lose_context');
    const ext = extensions.WEBGL_lose_context;
    if (ext) {
      deviceLossTriggered = true;
      ext.loseContext();
      // ext.loseContext should trigger context loss callback but the platform may not do this, so do it explicitly
    }
    this._resolveContextLost?.({
      reason: 'destroyed',
      message: 'Application triggered context loss'
    });
    return deviceLossTriggered;
  }

  /** Save current WebGL context state onto an internal stack */
  pushState(): void {
    pushContextState(this.gl);
  }

  /** Restores previously saved context state */
  popState(): void {
    popContextState(this.gl);
  }

  /**
   * Storing data on a special field on WebGLObjects makes that data visible in SPECTOR chrome debug extension
   * luma.gl ids and props can be inspected
   */
  setSpectorMetadata(handle: unknown, props: Record<string, unknown>) {
    // @ts-expect-error
    // eslint-disable-next-line camelcase
    handle.__SPECTOR_Metadata = props;
  }

  /**
   * Returns the GL.<KEY> constant that corresponds to a numeric value of a GL constant
   * Be aware that there are some duplicates especially for constants that are 0,
   * so this isn't guaranteed to return the right key in all cases.
   */
  getGLKey(value: unknown, gl?: WebGL2RenderingContext): string {
    // @ts-ignore expect-error depends on settings
    gl = gl || this.gl2 || this.gl;
    const number = Number(value);
    for (const key in gl) {
      // @ts-ignore expect-error depends on settings
      if (gl[key] === number) {
        return `GL.${key}`;
      }
    }
    // No constant found. Stringify the value and return it.
    return String(value);
  }

  /** Store constants */
  _constants: (TypedArray | null)[];

  /**
   * Set a constant value for a location. Disabled attributes at that location will read from this value
   * @note WebGL constants are stored globally on the WebGL context, not the VertexArray
   * so they need to be updated before every render
   * @todo - remember/cache values to avoid setting them unnecessarily?
   */
  setConstantAttributeWebGL(location: number, constant: TypedArray): void {
    const maxVertexAttributes = this.limits.maxVertexAttributes;
    this._constants = this._constants || new Array(maxVertexAttributes).fill(null);
    const currentConstant = this._constants[location];
    if (currentConstant && compareConstantArrayValues(currentConstant, constant)) {
      log.info(
        1,
        `setConstantAttributeWebGL(${location}) could have been skipped, value unchanged`
      )();
    }
    this._constants[location] = constant;

    switch (constant.constructor) {
      case Float32Array:
        setConstantFloatArray(this, location, constant as Float32Array);
        break;
      case Int32Array:
        setConstantIntArray(this, location, constant as Int32Array);
        break;
      case Uint32Array:
        setConstantUintArray(this, location, constant as Uint32Array);
        break;
      default:
        assert(false);
    }
  }

  /** Ensure extensions are only requested once */
  getExtension(name: keyof GLExtensions): GLExtensions {
    getWebGLExtension(this.gl, name, this._extensions);
    return this._extensions;
  }
}

/** Check if supplied parameter is a WebGL2RenderingContext */
function isWebGL(gl: any): boolean {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && Number.isFinite(gl._version));
}

/** Set constant float array attribute */
function setConstantFloatArray(device: WebGLDevice, location: number, array: Float32Array): void {
  switch (array.length) {
    case 1:
      device.gl.vertexAttrib1fv(location, array);
      break;
    case 2:
      device.gl.vertexAttrib2fv(location, array);
      break;
    case 3:
      device.gl.vertexAttrib3fv(location, array);
      break;
    case 4:
      device.gl.vertexAttrib4fv(location, array);
      break;
    default:
      assert(false);
  }
}

/** Set constant signed int array attribute */
function setConstantIntArray(device: WebGLDevice, location: number, array: Int32Array): void {
  device.gl.vertexAttribI4iv(location, array);
  // TODO - not clear if we need to use the special forms, more testing needed
  // switch (array.length) {
  //   case 1:
  //     gl.vertexAttribI1iv(location, array);
  //     break;
  //   case 2:
  //     gl.vertexAttribI2iv(location, array);
  //     break;
  //   case 3:
  //     gl.vertexAttribI3iv(location, array);
  //     break;
  //   case 4:
  //     break;
  //   default:
  //     assert(false);
  // }
}

/** Set constant unsigned int array attribute */
function setConstantUintArray(device: WebGLDevice, location: number, array: Uint32Array) {
  device.gl.vertexAttribI4uiv(location, array);
  // TODO - not clear if we need to use the special forms, more testing needed
  // switch (array.length) {
  //   case 1:
  //     gl.vertexAttribI1uiv(location, array);
  //     break;
  //   case 2:
  //     gl.vertexAttribI2uiv(location, array);
  //     break;
  //   case 3:
  //     gl.vertexAttribI3uiv(location, array);
  //     break;
  //   case 4:
  //     gl.vertexAttribI4uiv(location, array);
  //     break;
  //   default:
  //     assert(false);
  // }
}

/**
 * Compares contents of two typed arrays
 * @todo max length?
 */
function compareConstantArrayValues(v1: TypedArray, v2: TypedArray): boolean {
  if (!v1 || !v2 || v1.length !== v2.length || v1.constructor !== v2.constructor) {
    return false;
  }
  for (let i = 0; i < v1.length; ++i) {
    if (v1[i] !== v2[i]) {
      return false;
    }
  }
  return true;
}
