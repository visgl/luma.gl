/* global window, Worker */
import {getPageLoadPromise, getCanvas} from '../webgl-context';
import {requestAnimationFrame, cancelAnimationFrame} from '../webgl-utils';
import {log} from '../utils';
import assert from '../utils/assert';

export default class AnimationLoopProxy {
  // Create the script for the rendering worker.
  // @param opts {object} - options to construct an AnimationLoop instance
  static createWorker(animationLoop) {
    return self => {
      animationLoop.setProps({
        // Prevent the animation loop from trying to access DOM properties
        useDevicePixels: false,
        autoResizeDrawingBuffer: false
      });

      self.canvas = null;

      function initializeCanvas(canvas) {
        const eventHandlers = new Map();

        canvas.addEventListener = (type, handler) => {
          self.postMessage({command: 'addEventListener', type});
          if (!eventHandlers.has(type)) {
            eventHandlers.set(type, []);
          }
          eventHandlers.get(type).push(handler);
        };
        canvas.removeEventListener = (type, handler) => {
          self.postMessage({command: 'removeEventListener', type});
          const handlers = eventHandlers.get(type);
          if (handlers) {
            handlers.splice(handlers.indexOf(handler), 1);
          }
        };
        canvas.dispatchEvent = (type, event) => {
          const handlers = eventHandlers.get(type);
          if (handlers) {
            handlers.forEach(handler => handler(event));
          }
        };

        self.canvas = canvas;
      }

      self.addEventListener('message', evt => {
        switch (evt.data.command) {
          case 'start':
            initializeCanvas(evt.data.opts.canvas);
            animationLoop.start(evt.data.opts);
            break;

          case 'stop':
            animationLoop.stop();
            break;

          case 'resize':
            self.canvas.width = evt.data.width;
            self.canvas.height = evt.data.height;
            break;

          case 'event':
            self.canvas.dispatchEvent(evt.data.type, evt.data.event);
            break;

          default:
        }
      });
    };
  }

  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor(worker, opts = {}) {
    const {
      onInitialize = () => {},
      onFinalize = () => {},
      useDevicePixels = true,
      autoResizeDrawingBuffer = true
    } = opts;

    this.props = {
      onInitialize,
      onFinalize
    };

    this.setProps({
      autoResizeDrawingBuffer,
      useDevicePixels
    });

    // state
    assert(worker instanceof Worker);
    this.worker = worker;
    this.canvas = null;
    this.width = null;
    this.height = null;

    this._stopped = true;
    this._animationFrameId = null;
    this._startPromise = null;

    // bind methods
    this._onMessage = this._onMessage.bind(this);
    this._onEvent = this._onEvent.bind(this);
    this._updateFrame = this._updateFrame.bind(this);
  }

  setProps(props) {
    if ('autoResizeDrawingBuffer' in props) {
      this.autoResizeDrawingBuffer = props.autoResizeDrawingBuffer;
    }
    if ('useDevicePixels' in props) {
      this.useDevicePixels = props.useDevicePixels;
    }
    return this;
  }

  /* Public methods */

  // Starts a render loop if not already running
  start(opts = {}) {
    this._stopped = false;
    // console.debug(`Starting ${this.constructor.name}`);
    if (!this._animationFrameId) {
      this.worker.onmessage = this._onMessage;

      // Wait for start promise before rendering frame
      this._startPromise = getPageLoadPromise()
        .then(() => {
          this._createAndTransferCanvas(opts);
          return this.props.onInitialize(this);
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
      this.props.onFinalize(this);
    }
    this.worker.postMessage({command: 'stop'});
    return this;
  }

  // PRIVATE METHODS

  _onMessage(evt) {
    switch (evt.data.command) {
      case 'addEventListener':
        this.canvas.addEventListener(evt.data.type, this._onEvent);
        break;

      case 'removeEventListener':
        this.canvas.removeEventListener(evt.data.type, this._onEvent);
        break;

      default:
    }
  }

  _onEvent(evt) {
    const devicePixelRatio = this.useDevicePixels ? window.devicePixelRatio || 1 : 1;
    const type = evt.type;

    const safeEvent = {};
    for (const key in evt) {
      let value = evt[key];
      const valueType = typeof value;
      if (key === 'offsetX' || key === 'offsetY') {
        value *= devicePixelRatio;
      }
      if (valueType === 'number' || valueType === 'boolean' || valueType === 'string') {
        safeEvent[key] = value;
      }
    }

    this.worker.postMessage({
      command: 'event',
      type,
      event: safeEvent
    });
  }

  _updateFrame() {
    this._resizeCanvasDrawingBuffer();
    this._animationFrameId = requestAnimationFrame(this._updateFrame);
  }

  _createAndTransferCanvas(opts) {
    // Create a canvas on the main thread
    const screenCanvas = getCanvas(opts);

    // Create an offscreen canvas controlling the main canvas
    if (!screenCanvas.transferControlToOffscreen) {
      log.error('OffscreenCanvas is not available in your browser.')(); // eslint-disable-line
    }
    const offscreenCanvas = screenCanvas.transferControlToOffscreen();

    // Transfer the offscreen canvas to the worker
    this.worker.postMessage(
      {
        command: 'start',
        opts: Object.assign({}, opts, {canvas: offscreenCanvas})
      },
      [offscreenCanvas]
    );

    // store the main canvas on the local thread
    this.canvas = screenCanvas;
  }

  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      const devicePixelRatio = this.useDevicePixels ? window.devicePixelRatio || 1 : 1;
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
