// luma.gl, MIT license
import GL from '@luma.gl/constants';
import {Device} from '@luma.gl/api';
import {log} from './utils/log';
import {getDeviceFeatures} from './device/get-webgpu-features';
import {getDeviceLimits} from './device/get-webgpu-limits';
import {getWebGLFeatures} from './device/get-webgl-features';
import {getWebGLLimits} from './device/get-webgl-limits';
import {polyfillContext} from './polyfill/polyfill-context';
import {trackContextState} from './state-tracker/track-context-state';
import { ContextState } from './context/context-state';
import {getDevicePixelRatio, setDevicePixelRatio} from './context/device-pixels';
import {createBrowserContext} from './context/create-context';
import {getCanvas} from './context/get-canvas';
import {isWebGL2} from './context/webgl-checks';

import {WebGLDeviceInfo, WebGPUDeviceLimits, WebGLContextLimits} from './device/device-types';

/** WebGLDevice options */
export type WebGLDeviceProps = {
  canvas?: HTMLCanvasElement | OffscreenCanvas | string; // A canvas element or a canvas string id
  width?: number /** width is only used when creating a new canvas */;
  height?: number /** height is only used when creating a new canvas */;
  // Attach to existing context
  gl?: WebGLRenderingContext | WebGL2RenderingContext;
  // COMMON CONTEXT PARAMETERS
  webgl2?: boolean; // Set to false to not create a WebGL2 context (force webgl1)
  webgl1?: boolean; // set to false to not create a WebGL1 context (fails if webgl2 not available)
  manageState?: boolean; // Set to false to disable WebGL state management instrumentation
  debug?: boolean; // Instrument context (at the expense of performance)
  break?: Array<any>; // TODO: types
  onContextLost?: (event: Event) => void;
  onContextRestored?: (event: Event) => void;
  // BROWSER CONTEXT PARAMETERS
  alpha?: boolean; // Default render target has an alpha buffer.
  depth?: boolean; // Default render target has a depth buffer of at least 16 bits.
  stencil?: boolean; // Default render target has a stencil buffer of at least 8 bits.
  antialias?: boolean; // Boolean that indicates whether or not to perform anti-aliasing.
  premultipliedAlpha?: boolean; // Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha.
  preserveDrawingBuffer?: boolean; // Default render target buffers will not be automatically cleared and will preserve their values until cleared or overwritten
  failIfMajorPerformanceCaveat?: boolean; // Do not create if the system performance is low.
};

const DEFAULT_DEVICE_PROPS: Required<WebGLDeviceProps> = {
  canvas: undefined, // A canvas element or a canvas string id
  gl: undefined,
  webgl2: true, // Attempt to create a WebGL2 context
  webgl1: true, // Attempt to create a WebGL1 context (false to fail if webgl2 not available)
  manageState: true,
  width: 800, // width are height are only used by headless gl
  height: 600,
  debug: false, // Instrument context (at the expense of performance)
  break: undefined,
  onContextLost: () => console.error('WebGL context lost'),
  onContextRestored: () => console.info('WebGL context restored'),

  alpha: undefined,
  depth: undefined,
  stencil: undefined,
  antialias: undefined,
  premultipliedAlpha: undefined,
  preserveDrawingBuffer: undefined,
  failIfMajorPerformanceCaveat: undefined
};

// TODO use weakmap instead of modifying context
const glToContextMap = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, WebGLDevice>();

export function getWebGLDevice(gl: WebGLRenderingContext | WebGL2RenderingContext): WebGLDevice | undefined {
  return glToContextMap.get(gl);
}

let counter = 0;

/** WebGPU style Device API for a WebGL context */
export default class WebGLDevice extends Device implements ContextState {
  // WebGPU style API

  /** A set like interface to test features */
  readonly features: Set<string>;
  readonly limits: WebGPUDeviceLimits;

  /** Promise that rejects when context is lost */
  readonly lost: Promise<string>;

  // Common API
  props: Required<WebGLDeviceProps>;
  info: WebGLDeviceInfo;
  userData: {[key: string]: any};

  // WebGL specific API
  readonly isWebGL2: boolean;
  readonly gl: WebGLRenderingContext;
  readonly gl2: WebGL2RenderingContext;

  readonly webglFeatures: Set<string>;
  readonly webglLimits: WebGLContextLimits;
  readonly webgl1MinLimits: WebGLContextLimits;
  readonly webgl2MinLimits: WebGLContextLimits;

  // State used by luma.gl classes
  _state: 'uninitialized' | 'initializing' | 'initialized' = 'uninitialized';
  readonly _canvasSizeInfo = {clientWidth: 0, clientHeight: 0, devicePixelRatio: 1};
  readonly _extensions: Record<string, any> = {};
  _polyfilled: boolean = false;

  /**
   * Get a device instance from a GL context
   * Creates and instruments the device if not already created
   * @param gl
   * @returns
   */
  static attach(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    props?: WebGLDeviceProps
  ): WebGLDevice {
    if (!gl) {
      throw new Error('gl');
    }
    return new WebGLDevice({...props, gl});
  }

  constructor(props: WebGLDeviceProps) {
    super();
    
    this.props = {...DEFAULT_DEVICE_PROPS, ...props};

    // If attaching to an already attached context, return the attached device
    // @ts-expect-error device is attached to context
    const device: WebGLDevice | undefined = this.props.gl?.device;
    if (device) {
      if (device._state !== 'initialized') {
        log.error('recursive context');
        throw new Error('recursive context');
      }
      return device;
    }


    // Create an instrument context
    this.gl = (this.props.gl || this._createContext(props)) as WebGLRenderingContext;
    this.gl2 = this.gl as WebGL2RenderingContext;
    this.isWebGL2 = isWebGL2(this.gl);
    this._state = 'initializing';
    // Avoid multiple instrumentations
    // @ts-expect-error
    if (this.gl.device) {
      log.error('device already created');
      throw new Error('device already created'); // ASSERT this device;
    }
    // @ts-expect-error
    this.gl.device = this;
    // @ts-ignore
    this.gl._version = typeof WebGL2RenderingContext !== 'undefined' && this.gl instanceof WebGL2RenderingContext ? 2 : 1;
    // TODO - move to weak map indexing
    glToContextMap.set(this.gl, this);

    // Luma Device fields
    this.info = this._getDeviceInfo();
    // Log some debug info about the newly created context
    // @ts-expect-error device is attached to context
    const debug = this.gl.debug ? ' debug' : '';
    const webGL = isWebGL2(this.gl) ? 'WebGL2' : 'WebGL1';
    log.group(0, `${webGL}${debug} context: ${this.info.vendor}, ${this.info.renderer}`)();

    polyfillContext(this.gl);
    log.probe(0, 'polyfilled context')();

    // Install context state tracking
    trackContextState(this.gl, {
      copyState: false,
      log: (...args) => log.log(1, ...args)()
    });
    log.probe(0, 'instrumented context')();

    // WebGPU Device fields
    this.features = getDeviceFeatures(this.gl);
    log.probe(0, `queried device features ${counter}`)();
    this.limits = getDeviceLimits(this.gl);
    log.probe(0, 'queried device limits')();

    // Add seer integration - TODO - currently removed

    // WEBGL specific fields
    this.webglFeatures = getWebGLFeatures(this.gl);
    log.probe(0, 'queried webgl features')();
    this.webglLimits = getWebGLLimits(this.gl).limits;
    log.probe(0, 'queried webgl limits')();

    // Add debug instrumentation to the context
    // if (isBrowser() && props.debug) {
    //   // @ts-ignore
    //   const {makeDebugContext} = global;
    //   if (!makeDebugContext) {
    //     log.warn('WebGL debug mode not activated. import "@luma.gl/debug" to enable.')();
    //   } else {
    //     // @ts-ignore
    //     this.gl = global.makeDebugContext(this.gl, props);
    //     this.gl2 = this.gl as WebGL2RenderingContext;
    //     // Debug forces log level to at least 1
    //     log.level = Math.max(log.level, 1);
    //   }
    // }

    log.groupEnd(0)();
    this._state = 'initialized';
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

  // WEBGL SPECIFIC METHODS

  /**
   * Resize the canvas' drawing buffer.
   *
   * Can match the canvas CSS size, and optionally also consider devicePixelRatio
   * Can be called every frame
   *
   * Regardless of size, the drawing buffer will always be scaled to the viewport, but
   * for best visual results, usually set to either:
   *  canvas CSS width x canvas CSS height
   *  canvas CSS width * devicePixelRatio x canvas CSS height * devicePixelRatio
   * See http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
   */
  resize(options?: {width?: number; height?: number; useDevicePixels?: boolean | number}): void {
    // Resize browser context .
    if (this.gl.canvas) {
      const devicePixelRatio = getDevicePixelRatio(options?.useDevicePixels);
      setDevicePixelRatio(this.gl, devicePixelRatio, options);
      return;
    }

    // Resize headless gl context
    const ext = this.gl.getExtension('STACKGL_resize_drawingbuffer');
    if (ext && options && `width` in options && `height` in options) {
      ext.resize(options.width, options.height);
    }
  }

  // PRIVATE METHODS

  /** @returns strings identifying the GPU vendor and driver. */
  _getDeviceInfo(): WebGLDeviceInfo {
    const vendorMasked = this.gl.getParameter(GL.VENDOR);
    const rendererMasked = this.gl.getParameter(GL.RENDERER);
    // Get unmasked strings if available
    // https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
    const ext = this.gl.getExtension('WEBGL_debug_renderer_info');
    const vendorUnmasked = ext && this.gl.getParameter(ext.UNMASKED_VENDOR_WEBGL || GL.VENDOR);
    const rendererUnmasked =
      ext && this.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL || GL.RENDERER);
    return {
      type: isWebGL2(this.gl) ? 'webgl2' : 'webgl',
      vendor: vendorUnmasked || vendorMasked,
      renderer: rendererUnmasked || rendererMasked,
      version: this.gl.getParameter(GL.VERSION),
      shadingLanguages: ['glsl'],
      shadingLanguageVersion: this.gl.getParameter(GL.SHADING_LANGUAGE_VERSION)
    };
  }

  /**
   * Creates a context giving access to the WebGL API
   */
  _createContext(options?: WebGLDeviceProps): WebGLRenderingContext {
    const {width, height, canvas} = this.props;
    // Get or create a canvas
    const targetCanvas = getCanvas({canvas, width, height});
    // Create a WebGL context in the canvas
    return createBrowserContext(targetCanvas, options);
  }
}
