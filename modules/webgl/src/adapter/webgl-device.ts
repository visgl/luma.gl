// luma.gl, MIT license
import type {
  DeviceProps,
  DeviceInfo,
  DeviceLimits,
  DeviceFeature,
  CanvasContextProps,
  TextureFormat
} from '@luma.gl/api';
import {Device, CanvasContext, log, assert} from '@luma.gl/api';
import {isBrowser} from '@probe.gl/env';
import {polyfillContext} from '../context/polyfill/polyfill-context';
import {trackContextState} from '../context/state-tracker/track-context-state';
import {ContextState} from '../context/context/context-state';
import {createBrowserContext} from '../context/context/create-context';
import {getDeviceInfo} from './device-helpers/get-device-info';
import {getDeviceFeatures} from './device-helpers/device-features';
import {getDeviceLimits, getWebGLLimits, WebGLLimits} from './device-helpers/device-limits';
import WebGLCanvasContext from './webgl-canvas-context';
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
  Sampler,
  SamplerProps,
  TextureProps,
  ExternalTexture,
  ExternalTextureProps,
  FramebufferProps,
  RenderPipeline,
  RenderPipelineProps,
  ComputePipeline,
  ComputePipelineProps,
  RenderPass,
  RenderPassProps,
  ComputePass,
  ComputePassProps
} from '@luma.gl/api';

import ClassicBuffer from '../classic/buffer';
import WEBGLBuffer from './resources/webgl-buffer';
import WEBGLShader from './resources/webgl-shader';
import WEBGLSampler from './resources/webgl-sampler';
import WEBGLTexture from './resources/webgl-texture';
import WEBGLFramebuffer from './resources/webgl-framebuffer';
import WEBGLRenderPass from './resources/webgl-render-pass';
import WEBGLRenderPipeline from './resources/webgl-render-pipeline';

const LOG_LEVEL = 1;

let counter = 0;

/** WebGPU style Device API for a WebGL context */
export default class WebGLDevice extends Device implements ContextState {
  // Public API

  static type: string = 'webgl';

  static isSupported(): boolean {
    return typeof WebGLRenderingContext !== 'undefined';
  }

  readonly info: DeviceInfo;
  readonly canvasContext: WebGLCanvasContext;
  readonly lost: Promise<{reason: 'destroyed'; message: string}>;
  readonly handle: WebGLRenderingContext;

  get features(): Set<DeviceFeature> {
    this._features = this._features || getDeviceFeatures(this.gl);
    return this._features;
  }

  get limits(): DeviceLimits {
    this._limits = this._limits || getDeviceLimits(this.gl);
    return this._limits;
  }

  // WebGL specific API

  /** WebGL1 typed context. Can always be used. */
  readonly gl: WebGLRenderingContext;
  /** WebGL2 typed context. Need to check isWebGL2 or isWebGL1 before using. */
  readonly gl2: WebGL2RenderingContext;
  readonly debug: boolean = false;

  /** `true` if this is a WebGL1 context. @note `false` if WebGL2 */
  readonly isWebGL1: boolean;
  /** `true` if this is a WebGL2 context. @note `false` if WebGL1 */
  readonly isWebGL2: boolean;

  get webglLimits(): WebGLLimits {
    this._webglLimits = this._webglLimits || getWebGLLimits(this.gl);
    return this._webglLimits;
  }

  private _features: Set<DeviceFeature>;
  private _limits: DeviceLimits;
  private _webglLimits: WebGLLimits;

  /** State used by luma.gl classes: TODO - move to canvasContext*/
  readonly _canvasSizeInfo = {clientWidth: 0, clientHeight: 0, devicePixelRatio: 1};
  /** State used by luma.gl classes */
  readonly _extensions: Record<string, any> = {};
  _polyfilled: boolean = false;

  /** Instance of Spector.js (if initialized) */
  spector;

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

  static async create(props?: DeviceProps): Promise<WebGLDevice> {
    log.groupCollapsed(LOG_LEVEL, 'WebGLDevice created');

    // Wait for page to load. Only wait when props. canvas is string
    // to avoid setting page onload callback unless necessary
    if (typeof props.canvas === 'string') {
      await CanvasContext.pageLoaded;
    }

    // Load webgl and spector debug scripts from CDN if requested
    if (props.debug) {
      await loadWebGLDeveloperTools();
    }
    // @ts-expect-error spector not on props
    if (props.spector) {
      await loadSpectorJS();
    }

    log.probe(LOG_LEVEL, 'DOM is loaded')();
    return new WebGLDevice(props);
  }

  constructor(props: DeviceProps) {
    super(props);

    // If attaching to an already attached context, return the attached device
    // @ts-expect-error device is attached to context
    const device: WebGLDevice | undefined = props.gl?.device;
    if (device) {
      log.warn(`WebGL context already attached to device ${device.id}`);
      return device;
    }

    // Create and instrument context
    this.canvasContext = new WebGLCanvasContext(this, props);

    this.handle = props.gl || createBrowserContext(this.canvasContext.canvas, props);
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
    trackContextState(this.gl, {copyState: false, log: (...args: any[]) => log.log(1, ...args)()});

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
  destroy() {
    let ext = this.gl.getExtension('STACKGL_destroy_context');
    if (ext) {
      ext.destroy();
    }
    // ext = this.gl.getExtension('WEBGL_lose_context');
    // if (ext) {
    //   // TODO - disconnect context lost callbacks?
    //   ext.loseContext();
    // }
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
    assert(this.isWebGL2, 'Requires WebGL2');
    return this.gl2;
  }

  // IMPLEMENTATION OF ABSTRACT DEVICE

  createCanvasContext(props?: CanvasContextProps): CanvasContext {
    throw new Error('WebGL only supports a single canvas');
  }

  _createBuffer(props: BufferProps): WEBGLBuffer {
    return new ClassicBuffer(this, props);
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

  private renderPass: WEBGLRenderPass;

  getDefaultRenderPass(): WEBGLRenderPass {
    this.renderPass =
      this.renderPass ||
      this.beginRenderPass({
        framebuffer: this.canvasContext.getCurrentFramebuffer()
      });
    return this.renderPass;
  }

  /**
   * Offscreen Canvas Support: Commit the frame
   * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/commit
   * Chrome's offscreen canvas does not require gl.commit
   */
  submit(): void {
    this.renderPass.endPass();
    this.renderPass = null;
    // this.canvasContext.commit();
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
