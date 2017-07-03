/* global window, setTimeout, clearTimeout */
import {isBrowser} from '../utils';
import {getPageLoadPromise, resizeDrawingBuffer} from '../webgl-utils';
import {createGLContext, deleteGLContext, isWebGL, resetParameters} from '../webgl';
import {Framebuffer} from '../webgl';

// Node.js polyfills for requestAnimationFrame and cancelAnimationFrame
export function requestAnimationFrame(callback) {
  return isBrowser ? window.requestAnimationFrame(callback) : setTimeout(callback, 1000 / 60);
}

export function cancelAnimationFrame(timerId) {
  return isBrowser ? window.cancelAnimationFrame(timerId) : clearTimeout(timerId);
}

export default class AnimationLoop {
  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor({
    onCreateContext = opts => createGLContext(opts),
    onDeleteContext = gl => deleteGLContext(gl),
    onInitialize = () => {},
    onRender = () => {},
    onFinalize = () => {},

    gl = null,
    glOptions = {
      preserveDrawingBuffer: true
    },
    width = null,
    height = null,

    // view parameters - can be changed for each start call
    autoResizeViewport = true,
    autoResizeCanvas = true,
    autoResizeDrawingBuffer = true,
    useDevicePixelRatio = true
  } = {}) {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this._renderFrame = this._renderFrame.bind(this);

    this.setViewParameters({
      autoResizeViewport,
      autoResizeCanvas,
      autoResizeDrawingBuffer,
      useDevicePixelRatio
    });

    this._onCreateContext = onCreateContext;
    this.glOptions = glOptions;

    this._onInitialize = onInitialize;
    this._onRender = onRender;
    this._onFinalize = onFinalize;

    this.width = width;
    this.height = height;

    this.gl = gl;

    return this;
  }

  // Update parameters (TODO - should these be specified in `start`?)
  setViewParameters({
    autoResizeDrawingBuffer = true,
    autoResizeCanvas = true,
    autoResizeViewport = true,
    useDevicePixelRatio = true
  }) {
    this.autoResizeViewport = autoResizeViewport;
    this.autoResizeCanvas = autoResizeCanvas;
    this.autoResizeDrawingBuffer = autoResizeDrawingBuffer;
    this.useDevicePixelRatio = useDevicePixelRatio;
    return this;
  }

  // Starts a render loop if not already running
  // @param {Object} context - contains frame specific info (E.g. tick, width, height, etc)
  start(opts = {}) {
    this._stopped = false;
    // console.debug(`Starting ${this.constructor.name}`);
    if (!this._animationFrameId) {
      // Wait for start promise before rendering frame
      this._startPromise = getPageLoadPromise()
      .then(() => {
        if (this._stopped) {
          return null;
        }

        // Create the WebGL context
        this._createWebGLContext(opts);

        // Initialize the callback data
        this._initializeCallbackData();
        this._updateCallbackData();

        // Default viewport setup, in case onInitialize wants to render
        this._resizeCanvasDrawingBuffer();
        this._resizeViewport();

        // Note: onIntialize can return a promise (in case it needs to load resources)
        return this._onInitialize(this._callbackData);
      })
      .then(appContext => {
        if (!this._stopped) {
          this._addCallbackData(appContext || {});
          if (appContext !== false && !this._animationFrameId) {
            this._animationFrameId = requestAnimationFrame(this._renderFrame);
          }
        }
      });

    }
    return this;
  }

  // Stops a render loop if already running, finalizing
  stop() {
    // console.debug(`Stopping ${this.constructor.name}`);
    if (this._animationFrameId) {
      this._finalizeCallbackData();
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
      this._stopped = true;
    }
    return this;
  }

  // PRIVATE METHODS

  _setupFrame() {
    if (this._onSetupFrame) {
      // call callback
      this._onSetupFrame(this._callbackData);
      // end callback
    } else {
      this._resizeCanvasDrawingBuffer();
      this._resizeViewport();
      this._resizeFramebuffer();
    }
  }

  /**
   * @private
   * Handles a render loop frame- updates context and calls the application
   * callback
   */
  _renderFrame() {
    this._setupFrame();
    this._updateCallbackData();

    // call callback
    this._onRender(this._callbackData);
    // end callback

    // Increment tick
    this._callbackData.tick++;

    // Request another render frame (now )
    this._animationFrameId = requestAnimationFrame(this._renderFrame);
  }

  // Initialize the  object that will be passed to app callbacks
  _initializeCallbackData() {
    this._callbackData = {
      gl: this.gl,
      canvas: this.gl.canvas,
      framebuffer: this.framebuffer,
      stop: this.stop,
      // Initial values
      tick: 0,
      tock: 0
    };
  }

  // Update the context object that will be passed to app callbacks
  _updateCallbackData() {
    // CallbackData width and height represent drawing buffer width and height
    const {canvas} = this.gl;
    this._callbackData.width = canvas.width;
    this._callbackData.height = canvas.height;
    this._callbackData.aspect = canvas.width / canvas.height;
  }

  _finalizeCallbackData() {
    // call callback
    this._onFinalize(this._callbackData);
    // end callback
  }

  // Add application's data to the app context object
  _addCallbackData(appContext) {
    if (typeof appContext === 'object' && appContext !== null) {
      this._callbackData = Object.assign({}, this._callbackData, appContext);
    }
  }

  // Either uses supplied or existing context, or calls provided callback to create one
  _createWebGLContext(opts) {
    // Create the WebGL context if necessary
    opts = Object.assign({}, opts, this.glOptions);
    if (opts.gl) {
      this.gl = opts.gl;
    } else {
      this.gl = this._onCreateContext(opts);
    }
    if (!isWebGL(this.gl)) {
      throw new Error('AnimationLoop.onCreateContext - illegal context returned');
    }

    // Setup default framebuffer
    this.framebuffer = new Framebuffer(this.gl);
    // Reset the WebGL context.
    resetParameters(this.gl);
  }

  // Default viewport setup
  _resizeViewport() {
    if (this.autoResizeViewport) {
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }
  }

  _resizeFramebuffer() {
    this.framebuffer.resize({width: this.gl.canvas.width, height: this.gl.canvas.height});
  }

  // Resize the render buffer of the canvas to match canvas client size
  // Optionally multiplying with devicePixel ratio
  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      resizeDrawingBuffer(this.gl.canvas, {useDevicePixelRatio: this.useDevicePixelRatio});
    }
  }
}
