// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {luma, Device} from '@luma.gl/core';
import {
  requestAnimationFramePolyfill,
  cancelAnimationFramePolyfill
} from './request-animation-frame';
import {Timeline} from '../animation/timeline';
import {AnimationProps} from './animation-props';
import {Stats, Stat} from '@probe.gl/stats';

let statIdCounter = 0;

/** AnimationLoop properties */
export type AnimationLoopProps = {
  device: Device | Promise<Device>;

  onAddHTML?: (div: HTMLDivElement) => string; // innerHTML
  onInitialize?: (animationProps: AnimationProps) => Promise<unknown>;
  onRender?: (animationProps: AnimationProps) => unknown;
  onFinalize?: (animationProps: AnimationProps) => void;
  onError?: (reason: Error) => void;

  stats?: Stats;

  // view parameters - TODO move to CanvasContext?
  autoResizeViewport?: boolean;
  autoResizeDrawingBuffer?: boolean;
  useDevicePixels?: number | boolean;
};

export type MutableAnimationLoopProps = {
  // view parameters
  autoResizeViewport?: boolean;
  autoResizeDrawingBuffer?: boolean;
  useDevicePixels?: number | boolean;
};

const DEFAULT_ANIMATION_LOOP_PROPS: Required<AnimationLoopProps> = {
  device: null!,

  onAddHTML: () => '',
  onInitialize: async () => {
    return null;
  },
  onRender: () => {},
  onFinalize: () => {},
  onError: error => console.error(error), // eslint-disable-line no-console

  stats: luma.stats.get(`animation-loop-${statIdCounter++}`),

  // view parameters
  useDevicePixels: true,
  autoResizeViewport: false,
  autoResizeDrawingBuffer: false
};

/** Convenient animation loop */
export class AnimationLoop {
  device: Device | null = null;
  canvas: HTMLCanvasElement | OffscreenCanvas | null = null;

  props: Required<AnimationLoopProps>;
  animationProps: AnimationProps | null = null;
  timeline: Timeline | null = null;
  stats: Stats;
  cpuTime: Stat;
  gpuTime: Stat;
  frameRate: Stat;

  display: any;

  needsRedraw: string | false = 'initialized';

  _initialized: boolean = false;
  _running: boolean = false;
  _animationFrameId: any = null;
  _nextFramePromise: Promise<AnimationLoop> | null = null;
  _resolveNextFrame: ((animationLoop: AnimationLoop) => void) | null = null;
  _cpuStartTime: number = 0;
  _error: Error | null = null;

  // _gpuTimeQuery: Query | null = null;

  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor(props: AnimationLoopProps) {
    this.props = {...DEFAULT_ANIMATION_LOOP_PROPS, ...props};
    props = this.props;

    if (!props.device) {
      throw new Error('No device provided');
    }

    const {useDevicePixels = true} = this.props;

    // state
    this.stats = props.stats || new Stats({id: 'animation-loop-stats'});
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

  setError(error: Error): void {
    this.props.onError(error);
    this._error = Error();
    const canvas = this.device?.canvasContext?.canvas;
    if (canvas instanceof HTMLCanvasElement) {
      const errorDiv = document.createElement('h1');
      errorDiv.innerHTML = error.message;
      errorDiv.style.position = 'absolute';
      errorDiv.style.top = '20%'; // left: 50%; transform: translate(-50%, -50%);';
      errorDiv.style.left = '10px';
      errorDiv.style.color = 'black';
      errorDiv.style.backgroundColor = 'red';
      document.body.appendChild(errorDiv);
      // canvas.style.position = 'absolute';
    }
  }

  /** Flags this animation loop as needing redraw */
  setNeedsRedraw(reason: string): this {
    this.needsRedraw = this.needsRedraw || reason;
    return this;
  }

  /** TODO - move these props to CanvasContext? */
  setProps(props: MutableAnimationLoopProps): this {
    if ('autoResizeViewport' in props) {
      this.props.autoResizeViewport = props.autoResizeViewport || false;
    }
    if ('autoResizeDrawingBuffer' in props) {
      this.props.autoResizeDrawingBuffer = props.autoResizeDrawingBuffer || false;
    }
    if ('useDevicePixels' in props) {
      this.props.useDevicePixels = props.useDevicePixels || false;
    }
    return this;
  }

  /** Starts a render loop if not already running */
  async start() {
    if (this._running) {
      return this;
    }
    this._running = true;

    try {
      let appContext;
      if (!this._initialized) {
        this._initialized = true;
        // Create the WebGL context
        await this._initDevice();
        this._initialize();

        // Note: onIntialize can return a promise (e.g. in case app needs to load resources)
        await this.props.onInitialize(this._getAnimationProps());
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
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      this.props.onError(error);
      // this._running = false; // TODO
      throw error;
    }
  }

  /** Stops a render loop if already running, finalizing */
  stop() {
    // console.debug(`Stopping ${this.constructor.name}`);
    if (this._running) {
      // call callback
      // If stop is called immediately, we can end up in a state where props haven't been initialized...
      if (this.animationProps && !this._error) {
        this.props.onFinalize(this.animationProps);
      }

      this._cancelAnimationFrame();
      this._nextFramePromise = null;
      this._resolveNextFrame = null;
      this._running = false;
    }
    return this;
  }

  /** Explicitly draw a frame */
  redraw(): this {
    if (this.device?.isLost || this._error) {
      return this;
    }

    this._beginFrameTimers();

    this._setupFrame();
    this._updateAnimationProps();

    this._renderFrame(this._getAnimationProps());

    // clear needsRedraw flag
    this._clearNeedsRedraw();

    if (this._resolveNextFrame) {
      this._resolveNextFrame(this);
      this._nextFramePromise = null;
      this._resolveNextFrame = null;
    }

    this._endFrameTimers();

    return this;
  }

  /** Add a timeline, it will be automatically updated by the animation loop. */
  attachTimeline(timeline: Timeline): Timeline {
    this.timeline = timeline;
    return this.timeline;
  }

  /** Remove a timeline */
  detachTimeline(): void {
    this.timeline = null;
  }

  /** Wait until a render completes */
  waitForRender(): Promise<AnimationLoop> {
    this.setNeedsRedraw('waitForRender');

    if (!this._nextFramePromise) {
      this._nextFramePromise = new Promise(resolve => {
        this._resolveNextFrame = resolve;
      });
    }
    return this._nextFramePromise;
  }

  /** TODO - should use device.deviceContext */
  async toDataURL(): Promise<string> {
    this.setNeedsRedraw('toDataURL');
    await this.waitForRender();
    if (this.canvas instanceof HTMLCanvasElement) {
      return this.canvas.toDataURL();
    }
    throw new Error('OffscreenCanvas');
  }

  // PRIVATE METHODS

  _initialize(): void {
    this._startEventHandling();

    // Initialize the callback data
    this._initializeAnimationProps();
    this._updateAnimationProps();

    // Default viewport setup, in case onInitialize wants to render
    this._resizeCanvasDrawingBuffer();
    this._resizeViewport();

    // this._gpuTimeQuery = Query.isSupported(this.gl, ['timers']) ? new Query(this.gl) : null;
  }

  _setDisplay(display: any): void {
    if (this.display) {
      this.display.destroy();
      this.display.animationLoop = null;
    }

    // store animation loop on the display
    if (display) {
      display.animationLoop = this;
    }

    this.display = display;
  }

  _requestAnimationFrame(): void {
    if (!this._running) {
      return;
    }

    // VR display has a separate animation frame to sync with headset
    // TODO WebVR API discontinued, replaced by WebXR: https://immersive-web.github.io/webxr/
    // See https://developer.mozilla.org/en-US/docs/Web/API/VRDisplay/requestAnimationFrame
    // if (this.display && this.display.requestAnimationFrame) {
    //   this._animationFrameId = this.display.requestAnimationFrame(this._animationFrame.bind(this));
    // }
    this._animationFrameId = requestAnimationFramePolyfill(this._animationFrame.bind(this));
  }

  _cancelAnimationFrame(): void {
    if (this._animationFrameId === null) {
      return;
    }

    // VR display has a separate animation frame to sync with headset
    // TODO WebVR API discontinued, replaced by WebXR: https://immersive-web.github.io/webxr/
    // See https://developer.mozilla.org/en-US/docs/Web/API/VRDisplay/requestAnimationFrame
    // if (this.display && this.display.cancelAnimationFramePolyfill) {
    //   this.display.cancelAnimationFrame(this._animationFrameId);
    // }
    cancelAnimationFramePolyfill(this._animationFrameId);
    this._animationFrameId = null;
  }

  _animationFrame(): void {
    if (!this._running) {
      return;
    }
    this.redraw();
    this._requestAnimationFrame();
  }

  // Called on each frame, can be overridden to call onRender multiple times
  // to support e.g. stereoscopic rendering
  _renderFrame(animationProps: AnimationProps): void {
    // Allow e.g. VR display to render multiple frames.
    if (this.display) {
      this.display._renderFrame(animationProps);
      return;
    }

    // call callback
    this.props.onRender(this._getAnimationProps());
    // end callback

    // Submit commands (necessary on WebGPU)
    this.device?.submit();
  }

  _clearNeedsRedraw(): void {
    this.needsRedraw = false;
  }

  _setupFrame(): void {
    this._resizeCanvasDrawingBuffer();
    this._resizeViewport();
  }

  // Initialize the  object that will be passed to app callbacks
  _initializeAnimationProps(): void {
    const canvas = this.device?.canvasContext?.canvas;

    if (!this.device || !canvas) {
      throw new Error('loop');
    }
    this.animationProps = {
      animationLoop: this,

      device: this.device,
      canvas,
      timeline: this.timeline,

      // Initial values
      useDevicePixels: this.props.useDevicePixels,
      needsRedraw: false,

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

  _getAnimationProps(): AnimationProps {
    if (!this.animationProps) {
      throw new Error('animationProps');
    }
    return this.animationProps;
  }

  // Update the context object that will be passed to app callbacks
  _updateAnimationProps(): void {
    if (!this.animationProps) {
      return;
    }

    // Can this be replaced with canvas context?
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

  /** Wait for supplied device */
  async _initDevice() {
    this.device = await this.props.device;
    if (!this.device) {
      throw new Error('No device provided');
    }
    this.canvas = this.device.canvasContext?.canvas || null;
    // this._createInfoDiv();
  }

  _createInfoDiv(): void {
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
      if (this.canvas instanceof HTMLCanvasElement) {
        wrapperDiv.appendChild(this.canvas);
      }
      wrapperDiv.appendChild(div);
      const html = this.props.onAddHTML(div);
      if (html) {
        div.innerHTML = html;
      }
    }
  }

  _getSizeAndAspect(): {width: number; height: number; aspect: number} {
    if (!this.device) {
      return {width: 1, height: 1, aspect: 1};
    }
    // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    const [width, height] = this.device?.canvasContext?.getPixelSize() || [1, 1];

    // https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html
    let aspect = 1;
    const canvas = this.device?.canvasContext?.canvas;

    // @ts-expect-error
    if (canvas && canvas.clientHeight) {
      // @ts-expect-error
      aspect = canvas.clientWidth / canvas.clientHeight;
    } else if (width > 0 && height > 0) {
      aspect = width / height;
    }

    return {width, height, aspect};
  }

  /** Default viewport setup */
  _resizeViewport(): void {
    // TODO can we use canvas context to code this in a portable way?
    // @ts-expect-error Expose on canvasContext
    if (this.props.autoResizeViewport && this.device.gl) {
      // @ts-expect-error Expose canvasContext
      this.device.gl.viewport(
        0,
        0,
        // @ts-expect-error Expose canvasContext
        this.device.gl.drawingBufferWidth,
        // @ts-expect-error Expose canvasContext
        this.device.gl.drawingBufferHeight
      );
    }
  }

  /**
   * Resize the render buffer of the canvas to match canvas client size
   * Optionally multiplying with devicePixel ratio
   */
  _resizeCanvasDrawingBuffer(): void {
    if (this.props.autoResizeDrawingBuffer) {
      this.device?.canvasContext?.resize({useDevicePixels: this.props.useDevicePixels});
    }
  }

  _beginFrameTimers() {
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

    this.cpuTime.timeStart();
  }

  _endFrameTimers() {
    this.cpuTime.timeEnd();

    // if (this._gpuTimeQuery) {
    //   // GPU time query end. Results will be available on next frame.
    //   this._gpuTimeQuery.end();
    // }
  }

  // Event handling

  _startEventHandling() {
    if (this.canvas) {
      this.canvas.addEventListener('mousemove', this._onMousemove.bind(this));
      this.canvas.addEventListener('mouseleave', this._onMouseleave.bind(this));
    }
  }

  _onMousemove(event: Event) {
    if (event instanceof MouseEvent) {
      this._getAnimationProps()._mousePosition = [event.offsetX, event.offsetY];
    }
  }

  _onMouseleave(event: Event) {
    this._getAnimationProps()._mousePosition = null;
  }
}
