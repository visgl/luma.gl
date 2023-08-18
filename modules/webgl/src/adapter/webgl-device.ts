// luma.gl, MIT license
import type {
  DeviceProps,
  DeviceInfo,
  DeviceLimits,
  DeviceFeature,
  CanvasContextProps,
  TextureFormat
} from '@luma.gl/core';
import {Device, CanvasContext, log, uid} from '@luma.gl/core';
import {isBrowser} from '@probe.gl/env';
import {polyfillContext} from '../context/polyfill/polyfill-context';
import {popContextState, pushContextState, trackContextState} from '../context/state-tracker/track-context-state';
import {createBrowserContext} from '../context/context/create-browser-context';
import {
  createHeadlessContext,
  isHeadlessGLRegistered
} from '../context/context/create-headless-context';
import {getDeviceInfo} from './device-helpers/get-device-info';
import {getDeviceFeatures} from './device-helpers/device-features';
import {getDeviceLimits, getWebGLLimits, WebGLLimits} from './device-helpers/device-limits';
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
  CommandEncoderProps
} from '@luma.gl/core';

import {BufferWithAccessor} from '../classic/buffer-with-accessor';
import {WEBGLBuffer} from './resources/webgl-buffer';
import {WEBGLShader} from './resources/webgl-shader';
import {WEBGLSampler} from './resources/webgl-sampler';
import {WEBGLTexture} from './resources/webgl-texture';
import {WEBGLFramebuffer} from './resources/webgl-framebuffer';
import {WEBGLRenderPass} from './resources/webgl-render-pass';
import {WEBGLRenderPipeline} from './resources/webgl-render-pipeline';
import {WEBGLCommandEncoder} from './resources/webgl-command-encoder';

const LOG_LEVEL = 1;

/** WebGPU style Device API for a WebGL context */
export class WebGLDevice extends Device {
  //
  // Public `Device` API
  //

  static type: string = 'webgl';

  static isSupported(): boolean {
    return typeof WebGLRenderingContext !== 'undefined' || isHeadlessGLRegistered();
  }

  readonly info: DeviceInfo;
  readonly canvasContext: WebGLCanvasContext;

  readonly handle: WebGLRenderingContext;

  get features(): Set<DeviceFeature> {
    this._features = this._features || getDeviceFeatures(this.gl);
    return this._features;
  }

  get limits(): DeviceLimits {
    this._limits = this._limits || getDeviceLimits(this.gl);
    return this._limits;
  }

  readonly lost: Promise<{reason: 'destroyed'; message: string}>;

  private _resolveContextLost?: (value: {reason: 'destroyed'; message: string}) => void;
  private _features?: Set<DeviceFeature>;
  private _limits?: DeviceLimits;

  //
  // Static methods, expected to be present by `luma.createDevice()`
  //

  /**
   * Get a device instance from a GL context
   * Creates and instruments the device if not already created
   * @param gl
   * @returns
   */
  static attach(gl: Device | WebGLRenderingContext | WebGL2RenderingContext): WebGLDevice {
    if (gl instanceof WebGLDevice) {
      return gl;
    }
    // @ts-expect-error
    if (gl?.device instanceof Device) {
      // @ts-expect-error
      return gl.device as WebGLDevice;
    }
    if (!isWebGL(gl)) {
      throw new Error('Invalid WebGLRenderingContext');
    }
    return new WebGLDevice({gl: gl as WebGLRenderingContext});
  }

  static async create(props: DeviceProps = {}): Promise<WebGLDevice> {
    log.groupCollapsed(LOG_LEVEL, 'WebGLDevice created');

    // Wait for page to load. Only wait when props. canvas is string
    // to avoid setting page onload callback unless necessary
    if (typeof props.canvas === 'string') {
      await CanvasContext.pageLoaded;
    }

    // Load webgl and spector debug scripts from CDN if requested
    if (log.get('debug') || props.debug) {
      await loadWebGLDeveloperTools();
    }
    
    // @ts-expect-error spector not on props
    const {spector} = props;
    if (log.get('spector') || spector) {
      await loadSpectorJS();
    }

    log.probe(LOG_LEVEL + 1, 'DOM is loaded')();

    // @ts-expect-error
    if (props.gl && props.gl.device) {
      return WebGLDevice.attach(props.gl);
    }

    return new WebGLDevice(props);
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
    this.canvasContext = new WebGLCanvasContext(this, props);

    this.lost = new Promise<{reason: 'destroyed'; message: string}>((resolve) => {
      this._resolveContextLost = resolve;
    });

    const onContextLost = (event: Event) =>
      this._resolveContextLost?.({
        reason: 'destroyed',
        message: 'Computer entered sleep mode, or too many apps or browser tabs are using the GPU.'
      });

    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = props.gl || null;
    gl =
      gl ||
      (isBrowser() ? createBrowserContext(this.canvasContext.canvas, {...props, onContextLost}) : null);
    gl = gl || (!isBrowser() ? createHeadlessContext({...props, onContextLost}) : null);

    if (!gl) {
      throw new Error('WebGL context creation failed');
    }

    this.handle = gl;
    this.gl = this.handle;
    this.gl2 = this.gl as WebGL2RenderingContext;
    this.isWebGL2 = isWebGL2(this.gl);
    this.isWebGL1 = !this.isWebGL2;

    // luma Device fields
    this.info = getDeviceInfo(this.gl);

    // @ts-expect-error Link webgl context back to device
    this.gl.device = this;
    // @ts-expect-error Annotate webgl context to handle
    this.gl._version = this.isWebGL2 ? 2 : 1;

    // Add subset of WebGL2 methods to WebGL1 context
    polyfillContext(this.gl);

    // Install context state tracking
    // @ts-expect-error - hidden parameters
    const {enable = true, copyState = false} = props;
    trackContextState(this.gl, {
      enable,
      copyState,
      log: (...args: any[]) => log.log(1, ...args)()
    });

    // DEBUG contexts: Add debug instrumentation to the context, force log level to at least 1
    if (isBrowser() && props.debug) {
      this.gl = makeDebugContext(this.gl, {...props, webgl2: this.isWebGL2, throwOnError: true});
      this.gl2 = this.gl as WebGL2RenderingContext;
      this.debug = true;
      log.level = Math.max(log.level, 1);
      log.warn('WebGL debug mode activated. Performance reduced.')();
    }

    // @ts-expect-error spector not on props
    if (isBrowser() && props.spector) {
      const canvas = this.handle.canvas || (props.canvas as HTMLCanvasElement);
      this.spector = initializeSpectorJS({...this.props, canvas});
    }

    // Log some debug info about the newly created context
    const message = `\
Created ${this.info.type}${this.debug ? ' debug' : ''} context: \
${this.info.vendor}, ${this.info.renderer} for canvas: ${this.canvasContext.id}`;
    log.probe(LOG_LEVEL, message)();

    log.groupEnd(LOG_LEVEL)();
  }

  /**
   * Destroys the context
   * @note Has no effect for browser contexts, there is no browser API for destroying contexts
   */
  destroy(): void {
    const ext = this.gl.getExtension('STACKGL_destroy_context');
    if (ext) {
      ext.destroy();
    }
  }

  get isLost(): boolean {
    return this.gl.isContextLost();
  }

  getSize(): [number, number] {
    return [this.gl.drawingBufferWidth, this.gl.drawingBufferHeight];
  }

  isTextureFormatSupported(format: TextureFormat): boolean {
    return isTextureFormatSupported(this.gl, format);
  }

  isTextureFormatFilterable(format: TextureFormat): boolean {
    return isTextureFormatFilterable(this.gl, format);
  }

  isTextureFormatRenderable(format: TextureFormat): boolean {
    return isTextureFormatRenderable(this.gl, format);
  }

  // WEBGL SPECIFIC METHODS

  /** Returns a WebGL2RenderingContext or throws an error */
  assertWebGL2(): WebGL2RenderingContext {
    if (!this.gl2) {
      throw new Error('Requires WebGL2');
    }
    return this.gl2;
  }

  // IMPLEMENTATION OF ABSTRACT DEVICE

  createCanvasContext(props?: CanvasContextProps): CanvasContext {
    throw new Error('WebGL only supports a single canvas');
  }

  createBuffer(props: BufferProps | ArrayBuffer | ArrayBufferView): WEBGLBuffer {
    const newProps = this._getBufferProps(props);
    return new BufferWithAccessor(this, newProps);
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
    throw new Error('compute shaders not supported in WebGL');
  }

  private renderPass: WEBGLRenderPass | null = null;

  getDefaultRenderPass(): WEBGLRenderPass {
    this.renderPass =
      this.renderPass ||
      this.beginRenderPass({
        framebuffer: this.canvasContext.getCurrentFramebuffer()
      });
    return this.renderPass;
  }

  override createCommandEncoder(props: CommandEncoderProps): WEBGLCommandEncoder {
    return new WEBGLCommandEncoder(this, props);
  }

  /**
   * Offscreen Canvas Support: Commit the frame
   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/commit
   * Chrome's offscreen canvas does not require gl.commit
   */
  submit(): void {
    this.renderPass?.end();
    this.renderPass = null;
    // this.canvasContext.commit();
  }

  //
  // WebGL-only API (not part of `Device` API)
  //

  /** WebGL1 typed context. Can always be used. */
  readonly gl: WebGLRenderingContext;
  /** WebGL2 typed context. Need to check isWebGL2 or isWebGL1 before using. */
  readonly gl2: WebGL2RenderingContext | null = null;
  readonly debug: boolean = false;

  /** `true` if this is a WebGL1 context. @note `false` if WebGL2 */
  readonly isWebGL1: boolean;
  /** `true` if this is a WebGL2 context. @note `false` if WebGL1 */
  readonly isWebGL2: boolean;

  /** State used by luma.gl classes: TODO - move to canvasContext*/
  readonly _canvasSizeInfo = {clientWidth: 0, clientHeight: 0, devicePixelRatio: 1};

  /** State used by luma.gl classes - TODO - not used? */
  readonly _extensions: Record<string, any> = {};
  _polyfilled: boolean = false;

  /** Instance of Spector.js (if initialized) */
  spector;

  private _webglLimits?: WebGLLimits;

  /** Return WebGL specific limits */
  get webglLimits() : WebGLLimits {
    this._webglLimits = this._webglLimits || getWebGLLimits(this.gl);
    return this._webglLimits;
  }

  /**
   * Triggers device (or WebGL context) loss.
   * @note primarily intended for testing how application reacts to device loss
   */
  override loseDevice(): boolean {
    let deviceLossTriggered = false;
    const ext = this.gl.getExtension('WEBGL_lose_context');
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
  getGLKey(value: unknown, gl?: WebGLRenderingContext): string {
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
}

/** Check if supplied parameter is a WebGLRenderingContext */
function isWebGL(gl: any): boolean {
  if (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext) {
    return true;
  }
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && Number.isFinite(gl._version));
}

/** Check if supplied parameter is a WebGL2RenderingContext */
function isWebGL2(gl: any): boolean {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && gl._version === 2);
}
