import {luma, Device, DeviceProps} from '@luma.gl/api';
import {requestAnimationFrame, cancelAnimationFrame} from '@luma.gl/api';
import {Timeline} from '@luma.gl/engine';
import {Stats, Stat} from '@probe.gl/stats';
import {isBrowser} from '@probe.gl/env';

const isPage = isBrowser() && typeof document !== 'undefined';

let statIdCounter = 0;

type ContextProps = DeviceProps;

/** AnimationLoop properties */
export type AnimationLoopProps = {
  onCreateDevice?: (props: DeviceProps) => Promise<Device>;
  onAddHTML?: (div: HTMLDivElement) => string; // innerHTML
  onInitialize?: (animationProps: AnimationProps) => {} | void;
  onRender?: (animationProps: AnimationProps) => void;
  onFinalize?: (animationProps: AnimationProps) => void;
  onError?: (reason: Error) => void;

  device?: Device;
  deviceProps?: DeviceProps;
  stats?: Stats;

  // view parameters
  debug?: boolean;
  autoResizeViewport?: boolean;
  autoResizeDrawingBuffer?: boolean;
  useDevicePixels?: number | boolean;
};

const DEFAULT_ANIMATION_LOOP_PROPS: Required<AnimationLoopProps> = {
  onCreateDevice: (props: DeviceProps): Promise<Device> => luma.createDevice(props),
  onAddHTML: undefined,
  onInitialize: () => ({}),
  onRender: () => {},
  onFinalize: () => {},
  onError: (error) => console.error(error), // eslint-disable-line no-console

  device: undefined,
  deviceProps: {},
  debug: false,
  stats: luma.stats.get(`animation-loop-${statIdCounter++}`),

  // view parameters
  useDevicePixels: true,
  autoResizeViewport: true,
  autoResizeDrawingBuffer: true,
};

export type AnimationProps = {
  device: Device;
  canvas: HTMLCanvasElement | OffscreenCanvas;

  width: number;
  height: number;
  aspect: number;

  // Animation props
  time: number;
  startTime: number;
  engineTime: number;
  tick: number;
  tock: number;

  // Initial values
  useDevicePixels: number | boolean;
  needsRedraw?: string;

  timeline: Timeline;
  animationLoop: AnimationLoop;

  // Experimental
  _mousePosition?: [number, number]; // [offsetX, offsetY],
};

/** Convenient animation loop */
export default class AnimationLoop {
  device: Device;
  canvas: HTMLCanvasElement; // | OffscreenCanvas;

  props: Required<AnimationLoopProps>;
  animationProps: AnimationProps;
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
  _nextFramePromise: Promise<AnimationLoop> | null = null;
  _resolveNextFrame: ((AnimationLoop) => void) | null = null;
  _cpuStartTime: number = 0;

  // _gpuTimeQuery: Query | null = null;

  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor(props: AnimationLoopProps = {}) {
    this.props = {...DEFAULT_ANIMATION_LOOP_PROPS, ...props};
    props = this.props;

    let {useDevicePixels = true} = this.props;

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

  // TODO - move to CanvasContext
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
    this._start();
    return this;
  }

  /** Starts a render loop if not already running */
  async _start() {
    if (this._running) {
      return this;
    }
    this._running = true;

    // console.debug(`Starting ${this.constructor.name}`);
    // Wait for start promise before rendering frame
    try {
      // TODO rely on CanvasContext...
      // await this._getPageLoadPromise();

      // check that we haven't been stopped
      if (!this._running) {
        return null;
      }

      let appContext;
      if (!this._initialized) {
        this._initialized = true;
        // Create the WebGL context
        await this._createDevice();
        this._initialize();

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
    } catch (error: unknown) {
      this.props.onError(error instanceof Error ? error : new Error('Unknown error'));
      // this._running = false; // TODO
      return null;
    }
  }

  /** Explicitly draw a frame */
  redraw(): this {
    if (this.device.isLost) {
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
    return this.canvas.toDataURL();
  }

  onCreateDevice(deviceProps: DeviceProps): Promise<Device> {
    return this.props.onCreateDevice(deviceProps);
  }

  onInitialize(animationProps: AnimationProps): {} | void {
    return this.props.onInitialize(animationProps);
  }

  onRender(animationProps: AnimationProps) {
    return this.props.onRender(animationProps);
  }

  onFinalize(animationProps: AnimationProps) {
    return this.props.onFinalize(animationProps);
  }

  // PRIVATE METHODS

  _initialize() {
    this._startEventHandling();

    // Initialize the callback data
    this._initializeCallbackData();
    this._updateCallbackData();

    // Default viewport setup, in case onInitialize wants to render
    this._resizeCanvasDrawingBuffer();
    this._resizeViewport();

    // this._gpuTimeQuery = Query.isSupported(this.gl, ['timers']) ? new Query(this.gl) : null;
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
  }

  // Initialize the  object that will be passed to app callbacks
  _initializeCallbackData() {
    this.animationProps = {
      animationLoop: this,
      device: this.device,
      canvas: this.device.canvas,
      timeline: this.timeline,

      // Initial values
      useDevicePixels: this.props.useDevicePixels,
      needsRedraw: null,

      // Placeholders
      width: 1,
      height: 1,
      aspect: 1,

      // Animation props
      time: 0,
      startTime: Date.now(),
      engineTime: 0,
      tick: 0,
      tock: 0,

      // Experimental
      _mousePosition: null // Event props
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
  async _createDevice() {
    const deviceProps = {...this.props, ...this.props.deviceProps};
    this.device = await this.onCreateDevice(deviceProps);
    this.canvas = this.device.canvas;
    this._createInfoDiv();
  }

  _createInfoDiv() {
    if (this.canvas && this.props.onAddHTML) {
      const wrapperDiv = document.createElement('div');
      document.body.appendChild(wrapperDiv);
      wrapperDiv.style.position = 'relative';
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '10px';
      div.style.bottom = '10px';
      div.style.width = '300px';
      div.style.background = 'white';
      wrapperDiv.appendChild(this.canvas);
      wrapperDiv.appendChild(div);
      const html = this.props.onAddHTML(div);
      if (html) {
        div.innerHTML = html;
      }
    }
  }

  _getSizeAndAspect() {
    // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    const [width, height] = this.device.getSize();

    // https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html
    let aspect = 1;
    const canvas = this.device.canvas;

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
      // this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
  }

  /**
   * Resize the render buffer of the canvas to match canvas client size
   * Optionally multiplying with devicePixel ratio
   */
  _resizeCanvasDrawingBuffer() {
    if (this.props.autoResizeDrawingBuffer) {
      this.device.resize({useDevicePixels: this.props.useDevicePixels});
    }
  }

  _beginTimers() {
    this.frameRate.timeEnd();
    this.frameRate.timeStart();

    // Check if timer for last frame has completed.
    // GPU timer results are never available in the same
    // frame they are captured.
    // if (
    //   this._gpuTimeQuery &&
    //   this._gpuTimeQuery.isResultAvailable() &&
    //   !this._gpuTimeQuery.isTimerDisjoint()
    // ) {
    //   this.stats.get('GPU Time').addTime(this._gpuTimeQuery.getTimerMilliseconds());
    // }

    // if (this._gpuTimeQuery) {
    //   // GPU time query start
    //   this._gpuTimeQuery.beginTimeElapsedQuery();
    // }

    // this.cpuTime.timeStart();
  }

  _endTimers() {
    this.cpuTime.timeEnd();

    // if (this._gpuTimeQuery) {
    //   // GPU time query end. Results will be available on next frame.
    //   this._gpuTimeQuery.end();
    // }
  }

  // Event handling

  _startEventHandling() {
    if (this.canvas) {
      this.canvas.addEventListener('mousemove', this._onMousemove);
      this.canvas.addEventListener('mouseleave', this._onMouseleave);
    }
  }

  _onMousemove(e) {
    this.animationProps._mousePosition = [e.offsetX, e.offsetY];
  }
  _onMouseleave(e) {
    this.animationProps._mousePosition = null;
  }
}
