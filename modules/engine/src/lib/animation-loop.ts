import {luma, Device} from '@luma.gl/api';
import type {GLContextOptions} from '@luma.gl/gltools'
type DeviceProps = GLContextOptions;

import {
  isWebGL,
  // createGLContext,
  // instrumentGLContext,
  resizeGLContext,
  resetParameters
} from '@luma.gl/gltools';

import {
  requestAnimationFrame,
  cancelAnimationFrame,
  Query,
  lumaStats,
  // TODO - remove dependency on framebuffer (bundle size impact)
  Framebuffer,
  log,
  assert
} from '@luma.gl/webgl';

import { Stats, Stat } from '@probe.gl/stats'
import { Timeline } from '../animation/timeline'

import {isBrowser} from '@probe.gl/env';

const isPage = isBrowser() && typeof document !== 'undefined';

let statIdCounter = 0;

/** AnimationLoop properties */
export type AnimationLoopProps = {
  onCreateDevice?: (props: DeviceProps) => Device;
  onCreateContext?: (opts: GLContextOptions) => WebGLRenderingContext; // TODO: signature from createGLContext
  onAddHTML?: (div: HTMLDivElement) => string; // innerHTML
  onInitialize?: (animationProps: AnimationProps) => {};
  onRender?: (animationProps: AnimationProps) => void;
  onFinalize?: (animationProps: AnimationProps) => void;
  onError?: (reason: any) => void;

  stats?: Stats;

  device?: Device;
  glOptions?: GLContextOptions // createGLContext options
  debug?: boolean;

  // view parameters
  autoResizeViewport?: boolean;
  autoResizeDrawingBuffer?: boolean;
  useDevicePixels?: number | boolean;

  /** @deprecated Use .device */
  gl?: WebGLRenderingContext
  /** @deprecated Will be removed */
  createFramebuffer?: boolean;
};

export type AnimationProps = {
  device: Device;

  stop: () => AnimationLoop
  canvas: HTMLCanvasElement | OffscreenCanvas
  // Initial values
  useDevicePixels: number | boolean
  needsRedraw?: string
  // Animation props
  startTime: number
  engineTime: number
  tick: number
  tock: number

  // Timeline time for back compatibility
  time: number

  width: number
  height: number
  aspect: number

  // Experimental
  _timeline: Timeline
  _loop: AnimationLoop
  _animationLoop: AnimationLoop
  _mousePosition?: [number, number] // [offsetX, offsetY],

  /** @deprecated Will be removed */
  framebuffer: Framebuffer
  /** @deprecated Use .device */
  gl: WebGLRenderingContext

  // Any fields returned from init function
  [key: string]: unknown;
}

const DEFAULT_ANIMATION_LOOP_PROPS: Required<AnimationLoopProps> = {
  onCreateDevice: (props: DeviceProps) => luma.createDevice(props),
  onCreateContext: null,
  onAddHTML: null,
  onInitialize: () => ({}),
  onRender: () => {},
  onFinalize: () => {},
  onError: (error) => console.error(error), // eslint-disable-line no-console

  device: null,
  debug: false,

  // view parameters
  useDevicePixels: true,
  autoResizeViewport: true,
  autoResizeDrawingBuffer: true,
  stats: lumaStats.get(`animation-loop-${statIdCounter++}`),

  // deprecated
  // onCreateContext: (opts) => createGLContext(opts),
  gl: null,
  glOptions: {},
  createFramebuffer: false
};

export default class AnimationLoop {
  device: Device;
  canvas: HTMLCanvasElement | OffscreenCanvas;

  props: Required<AnimationLoopProps>;
  animationProps: AnimationProps;
  framebuffer: Framebuffer = null;
  timeline: Timeline = null;
  stats: Stats;
  cpuTime: Stat;
  gpuTime: Stat;
  frameRate: Stat;

  display: any;

  needsRedraw: string | null = 'initialized';

  _initialized: boolean = false;
  _running: boolean = false;
  _animationFrameId = null;
  _pageLoadPromise: Promise<{}> | null = null;
  _nextFramePromise: Promise<AnimationLoop> | null = null;
  _resolveNextFrame: ((AnimationLoop) => void) | null = null;
  _cpuStartTime: number = 0;

  _gpuTimeQuery: Query | null = null;

  /** @deprecated */
  gl: WebGLRenderingContext;

  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor(props: AnimationLoopProps = {}) {
    this.props = {...DEFAULT_ANIMATION_LOOP_PROPS, ...props};
    props = this.props;

    let {useDevicePixels = true} = this.props;

    if ('useDevicePixelRatio' in props) {
      log.deprecated('useDevicePixelRatio', 'useDevicePixels')();
      // @ts-expect-error
      useDevicePixels = props.useDevicePixelRatio;
    }

    // state
    this.device = props.device;
    // @ts-expect-error
    this.gl = (this.device && this.device.gl) || props.gl;

    this.stats = props.stats;
    this.cpuTime = this.stats.get('CPU Time');
    this.gpuTime = this.stats.get('GPU Time');
    this.frameRate = this.stats.get('Frame Rate');

    this.setProps({
      autoResizeViewport: props.autoResizeViewport,
      autoResizeDrawingBuffer: props.autoResizeDrawingBuffer,
      useDevicePixels
    });

    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);

    this._onMousemove = this._onMousemove.bind(this);
    this._onMouseleave = this._onMouseleave.bind(this);
  }

  destroy(): void {
    this.stop();
    this._setDisplay(null);
  }

  /** @deprecated Use .destroy() */
  delete(): void {
    this.destroy();
  }

  setNeedsRedraw(reason: string): this {
    this.needsRedraw = this.needsRedraw || reason;
    return this;
  }

  setProps(props: AnimationLoopProps): this {
    if ('autoResizeViewport' in props) {
      this.props.autoResizeViewport = props.autoResizeViewport;
    }
    if ('autoResizeDrawingBuffer' in props) {
      this.props.autoResizeDrawingBuffer = props.autoResizeDrawingBuffer;
    }
    if ('useDevicePixels' in props) {
      this.props.useDevicePixels = props.useDevicePixels;
    }
    return this;
  }

  start(opts = {}) {
    this._start(opts);
    return this;
  }

  /** Starts a render loop if not already running
   * @param {Object} context - contains frame specific info (E.g. tick, width, height, etc)
   */
  async _start(opts) {
    if (this._running) {
      return this;
    }
    this._running = true;

    // console.debug(`Starting ${this.constructor.name}`);
    // Wait for start promise before rendering frame
    try {
      await this._getPageLoadPromise();

      // check that we haven't been stopped
      if (!this._running) {
        return null;
      }

      let appContext;
      if (!this._initialized) {
        this._initialized = true;
        this._initialize(opts);

        // Note: onIntialize can return a promise (in case app needs to load resources)
        appContext = await this.onInitialize(this.animationProps);
        this._addCallbackData(appContext || {});
      }

      // check that we haven't been stopped
      if (!this._running) {
        return null;
      }

      // Start the loop
      if (appContext !== false) {
        // cancel any pending renders to ensure only one loop can ever run
        this._cancelAnimationFrame();
        this._requestAnimationFrame();
      }

      return this;
    } catch (error) {
      this.props.onError(error);
      // this._running = false; // TODO
      return null;
    }
  }

  /** Explicitly draw a frame */
  redraw(): this {
    if (this.isContextLost()) {
      return this;
    }

    this._beginTimers();

    this._setupFrame();
    this._updateCallbackData();

    this._renderFrame(this.animationProps);

    // clear needsRedraw flag
    this._clearNeedsRedraw();

    if (this._resolveNextFrame) {
      this._resolveNextFrame(this);
      this._nextFramePromise = null;
      this._resolveNextFrame = null;
    }

    this._endTimers();

    return this;
  }

  // Stops a render loop if already running, finalizing
  stop() {
    // console.debug(`Stopping ${this.constructor.name}`);
    if (this._running) {
      this._finalizeCallbackData();
      this._cancelAnimationFrame();
      this._nextFramePromise = null;
      this._resolveNextFrame = null;
      this._running = false;
    }
    return this;
  }

  attachTimeline(timeline: Timeline): Timeline {
    this.timeline = timeline;
    return this.timeline;
  }

  detachTimeline(): void {
    this.timeline = null;
  }

  waitForRender(): Promise<AnimationLoop> {
    this.setNeedsRedraw('waitForRender');

    if (!this._nextFramePromise) {
      this._nextFramePromise = new Promise((resolve) => {
        this._resolveNextFrame = resolve;
      });
    }
    return this._nextFramePromise;
  }

  async toDataURL() {
    this.setNeedsRedraw('toDataURL');

    await this.waitForRender();

    return this.gl.canvas.toDataURL();
  }

  isContextLost(): boolean {
    return this.gl.isContextLost();
  }

  onCreateDevice(deviceProps: DeviceProps) {
    return this.props.onCreateDevice(deviceProps);
  }

  onInitialize(animationProps: AnimationProps) {
    return this.props.onInitialize(animationProps);
  }

  onRender(animationProps: AnimationProps) {
    return this.props.onRender(animationProps);
  }

  onFinalize(animationProps: AnimationProps) {
    return this.props.onFinalize(animationProps);
  }

  // DEPRECATED/REMOVED METHODS

  /** @deprecated Use .onCreateDevice() */
  onCreateContext(props: GLContextOptions) {
    return this.props.onCreateContext(props);
  }

  /** @deprecated */
  getHTMLControlValue(id, defaultValue = 1) {
    const element = document.getElementById(id);
    // @ts-expect-error Not all html elements have value
    return element ? Number(element.value) : defaultValue;
  }

  // PRIVATE METHODS

  _initialize(props: AnimationLoopProps) {
    // Create the WebGL context
    this._createDevice(props);
    this._createFramebuffer();
    this._startEventHandling();

    // Initialize the callback data
    this._initializeCallbackData();
    this._updateCallbackData();

    // Default viewport setup, in case onInitialize wants to render
    this._resizeCanvasDrawingBuffer();
    this._resizeViewport();

    this._gpuTimeQuery = Query.isSupported(this.gl, ['timers']) ? new Query(this.gl) : null;
  }

  _getPageLoadPromise() {
    if (!this._pageLoadPromise) {
      this._pageLoadPromise = isPage
        ? new Promise((resolve, reject) => {
            if (isPage && document.readyState === 'complete') {
              resolve(document);
              return;
            }
            window.addEventListener('load', () => {
              resolve(document);
            });
          })
        : Promise.resolve({});
    }
    return this._pageLoadPromise;
  }

  _setDisplay(display) {
    if (this.display) {
      this.display.delete();
      this.display.animationLoop = null;
    }

    // store animation loop on the display
    if (display) {
      display.animationLoop = this;
    }

    this.display = display;
  }

  _requestAnimationFrame() {
    if (!this._running) {
      return;
    }

    // VR display has a separate animation frame to sync with headset
    // TODO WebVR API discontinued, replaced by WebXR: https://immersive-web.github.io/webxr/
    // See https://developer.mozilla.org/en-US/docs/Web/API/VRDisplay/requestAnimationFrame
    // if (this.display && this.display.requestAnimationFrame) {
    //   this._animationFrameId = this.display.requestAnimationFrame(this._animationFrame.bind(this));
    // }
    this._animationFrameId = requestAnimationFrame(this._animationFrame.bind(this));
  }

  _cancelAnimationFrame() {
    if (this._animationFrameId !== null) {
      return;
    }

    // VR display has a separate animation frame to sync with headset
    // TODO WebVR API discontinued, replaced by WebXR: https://immersive-web.github.io/webxr/
    // See https://developer.mozilla.org/en-US/docs/Web/API/VRDisplay/requestAnimationFrame
    // if (this.display && this.display.cancelAnimationFrame) {
    //   this.display.cancelAnimationFrame(this._animationFrameId);
    // }
    cancelAnimationFrame(this._animationFrameId);
    this._animationFrameId = null;
  }

  _animationFrame() {
    if (!this._running) {
      return;
    }
    this.redraw();
    this._requestAnimationFrame();
  }

  // Called on each frame, can be overridden to call onRender multiple times
  // to support e.g. stereoscopic rendering
  _renderFrame(props: AnimationProps) {
    // Allow e.g. VR display to render multiple frames.
    if (this.display) {
      this.display._renderFrame(props);
      return;
    }

    // call callback
    this.onRender(props);
    // end callback
  }

  _clearNeedsRedraw() {
    this.needsRedraw = null;
  }

  _setupFrame() {
    this._resizeCanvasDrawingBuffer();
    this._resizeViewport();
    this._resizeFramebuffer();
  }

  // Initialize the  object that will be passed to app callbacks
  _initializeCallbackData() {
    // @ts-expect-error
    this.animationProps = {
      device: this.device,
      gl: this.gl,

      stop: this.stop,
      canvas: this.gl.canvas,

      // Initial values
      useDevicePixels: this.props.useDevicePixels,
      needsRedraw: null,

      // Animation props
      startTime: Date.now(),
      engineTime: 0,
      tick: 0,
      tock: 0,

      // Timeline time for back compatibility
      time: 0,

      // Experimental
      _timeline: this.timeline,
      _loop: this,
      _animationLoop: this,
      _mousePosition: null, // Event props

      // Deprecated
      framebuffer: this.framebuffer,
    };
  }

  // Update the context object that will be passed to app callbacks
  _updateCallbackData() {
    const {width, height, aspect} = this._getSizeAndAspect();
    if (width !== this.animationProps.width || height !== this.animationProps.height) {
      this.setNeedsRedraw('drawing buffer resized');
    }
    if (aspect !== this.animationProps.aspect) {
      this.setNeedsRedraw('drawing buffer aspect changed');
    }

    this.animationProps.width = width;
    this.animationProps.height = height;
    this.animationProps.aspect = aspect;

    this.animationProps.needsRedraw = this.needsRedraw;

    // Update time properties
    this.animationProps.engineTime = Date.now() - this.animationProps.startTime;

    if (this.timeline) {
      this.timeline.update(this.animationProps.engineTime);
    }

    this.animationProps.tick = Math.floor((this.animationProps.time / 1000) * 60);
    this.animationProps.tock++;

    // For back compatibility
    this.animationProps.time = this.timeline
      ? this.timeline.getTime()
      : this.animationProps.engineTime;
  }

  _finalizeCallbackData() {
    // call callback
    this.onFinalize(this.animationProps);
    // end callback
  }

  /** Add application's data to the app context object */
  _addCallbackData(appContext) {
    if (typeof appContext === 'object' && appContext !== null) {
      this.animationProps = Object.assign({}, this.animationProps, appContext);
    }
  }

  /** Either uses supplied or existing context, or calls provided callback to create one */
  _createDevice(props: DeviceProps) {
    const deviceProps = {...props, ...this.props.glOptions};

    // TODO - support this.onCreateContext
    // Create the WebGL context if necessary
    // this.gl = this.props.gl ? instrumentGLContext(this.props.gl, deviceProps) : this.onCreateContext(deviceProps);

    this.device = this.onCreateDevice(deviceProps);
    // @ts-expect-error
    this.gl = this.device.gl;

    if (!isWebGL(this.gl)) {
      throw new Error('AnimationLoop.onCreateContext - illegal context returned');
    }

    // Reset the WebGL context.
    resetParameters(this.gl);

    this._createInfoDiv();
  }

  _createInfoDiv() {
    if (this.gl.canvas && this.props.onAddHTML) {
      const wrapperDiv = document.createElement('div');
      document.body.appendChild(wrapperDiv);
      wrapperDiv.style.position = 'relative';
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '10px';
      div.style.bottom = '10px';
      div.style.width = '300px';
      div.style.background = 'white';
      wrapperDiv.appendChild(this.gl.canvas);
      wrapperDiv.appendChild(div);
      const html = this.props.onAddHTML(div);
      if (html) {
        div.innerHTML = html;
      }
    }
  }

  _getSizeAndAspect() {
    // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    const width = this.gl.drawingBufferWidth;
    const height = this.gl.drawingBufferHeight;

    // https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html
    let aspect = 1;
    const {canvas} = this.gl;

    if (canvas && canvas.clientHeight) {
      aspect = canvas.clientWidth / canvas.clientHeight;
    } else if (width > 0 && height > 0) {
      aspect = width / height;
    }

    return {width, height, aspect};
  }

  /** Default viewport setup */
  _resizeViewport() {
    if (this.props.autoResizeViewport) {
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
  }

  /** 
   * Resize the render buffer of the canvas to match canvas client size
   * Optionally multiplying with devicePixel ratio
   */
  _resizeCanvasDrawingBuffer() {
    if (this.props.autoResizeDrawingBuffer) {
      resizeGLContext(this.gl, {useDevicePixels: this.props.useDevicePixels});
    }
  }

  _beginTimers() {
    this.frameRate.timeEnd();
    this.frameRate.timeStart();

    // Check if timer for last frame has completed.
    // GPU timer results are never available in the same
    // frame they are captured.
    if (
      this._gpuTimeQuery &&
      this._gpuTimeQuery.isResultAvailable() &&
      !this._gpuTimeQuery.isTimerDisjoint()
    ) {
      this.stats.get('GPU Time').addTime(this._gpuTimeQuery.getTimerMilliseconds());
    }

    if (this._gpuTimeQuery) {
      // GPU time query start
      this._gpuTimeQuery.beginTimeElapsedQuery();
    }

    this.cpuTime.timeStart();
  }

  _endTimers() {
    this.cpuTime.timeEnd();

    if (this._gpuTimeQuery) {
      // GPU time query end. Results will be available on next frame.
      this._gpuTimeQuery.end();
    }
  }

  // Event handling

  _startEventHandling() {
    const {canvas} = this.gl;
    if (canvas) {
      canvas.addEventListener('mousemove', this._onMousemove);
      canvas.addEventListener('mouseleave', this._onMouseleave);
    }
  }

  _onMousemove(e) {
    this.animationProps._mousePosition = [e.offsetX, e.offsetY];
  }
  _onMouseleave(e) {
    this.animationProps._mousePosition = null;
  }

  // Deprecated

  /** @deprecated */
  _createFramebuffer() {
    // Setup default framebuffer
    if (this.props.createFramebuffer) {
      this.framebuffer = new Framebuffer(this.gl);
    }
  }

  /** @deprecated */
  _resizeFramebuffer() {
    if (this.framebuffer) {
      this.framebuffer.resize({
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight
      });
    }
  }  
}
