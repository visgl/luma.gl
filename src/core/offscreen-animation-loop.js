/* global window */
import AnimationLoop, {requestAnimationFrame, cancelAnimationFrame} from './animation-loop';
import {getPageLoadPromise, createCanvas, getCanvas} from '../webgl-utils';

export default class OffscreenAnimationLoop {

  /*
   * Create the script for the rendering worker.
   * @param opts {object} - options to construct an AnimationLoop instance
   */
  static createWorker(opts) {
    return self => {

      self.animationLoop = new AnimationLoop(Object.assign({}, opts, {
        offScreen: true,
        // Prevent the animation loop from trying to access DOM properties
        useDevicePixels: false,
        autoResizeDrawingBuffer: false
      }));
      self.canvas = null;

      self.addEventListener('message', evt => {
        const {animationLoop} = self;

        switch (evt.data.command) {

        case 'start':
          self.canvas = evt.data.opts.canvas;
          animationLoop.start(evt.data.opts);
          break;

        case 'stop':
          animationLoop.stop();
          break;

        case 'resize':
          self.canvas.width = evt.data.width;
          self.canvas.height = evt.data.height;
          break;

        default:
        }

      });

    };
  }

  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor({
    worker,
    onInitialize = () => {},
    onFinalize = () => {},

    useDevicePixels = true,
    autoResizeDrawingBuffer = true
  }) {
    this.worker = worker;

    this.canvas = null;
    this.width = null;
    this.height = null;

    this.autoResizeDrawingBuffer = autoResizeDrawingBuffer;
    this.useDevicePixels = useDevicePixels;

    this._updateFrame = this._updateFrame.bind(this);
    this._onInitialize = onInitialize;
    this._onFinalize = onFinalize;
  }

  /* Public methods */

  // Starts a render loop if not already running
  start(opts = {}) {
    this._stopped = false;
    // console.debug(`Starting ${this.constructor.name}`);
    if (!this._animationFrameId) {
      // Wait for start promise before rendering frame
      this._startPromise = getPageLoadPromise()
      .then(() => {
        const {targetCanvas, offscreenCanvas} = this._createCanvas(opts);

        this.worker.postMessage({
          command: 'start',
          opts: Object.assign({}, opts, {canvas: offscreenCanvas})
        }, [offscreenCanvas]);

        this.canvas = targetCanvas;

        this._onInitialize(this);
      })
      .then(() => {
        if (!this._stopped) {
          this._animationFrameId = requestAnimationFrame(this._updateFrame);
        }
      });
    }
    return this;
  }

  // Stops a render loop if already running, finalizing
  stop() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
      this._stopped = true;
      this._onFinalize(this);
    }
    this.worker.postMessage({command: 'stop'});
    return this;
  }

  _updateFrame() {
    this._resizeCanvasDrawingBuffer();
    this._animationFrameId = requestAnimationFrame(this._updateFrame);
  }

  _createCanvas(opts) {
    const {canvas, width, height, throwOnError} = opts;

    // Error reporting function, enables exceptions to be disabled
    function onError(message) {
      if (throwOnError) {
        throw new Error(message);
      }
      // log.log(0, message);
      return null;
    }

    let targetCanvas;
    if (!canvas) {
      targetCanvas = createCanvas({id: 'lumagl-canvas', width, height, onError});
    } else if (typeof canvas === 'string') {
      targetCanvas = getCanvas({id: canvas});
    } else {
      targetCanvas = canvas;
    }

    if (!targetCanvas.transferControlToOffscreen) {
      onError('OffscreenCanvas is not available. Enable Experimental canvas features in chrome://flags'); // eslint-disable-line
    }
    const offscreenCanvas = targetCanvas.transferControlToOffscreen();

    return {targetCanvas, offscreenCanvas};
  }

  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      const devicePixelRatio = this.useDevicePixels ? (window.devicePixelRatio || 1) : 1;
      const width = this.canvas.clientWidth * devicePixelRatio;
      const height = this.canvas.clientHeight * devicePixelRatio;

      if (this.width !== width || this.height !== height) {
        this.width = width;
        this.height = height;
        this.worker.postMessage({
          command: 'resize',
          width,
          height
        });
      }
    }
  }
}
