/* global window, setTimeout, clearTimeout */
import {isBrowser, pageLoadPromise} from '../utils';
import {createGLContext, isWebGLContext} from '../webgl';

// Node.js polyfills for requestAnimationFrame and cancelAnimationFrame
export const requestAnimationFrame = callback =>
  isBrowser ? window.requestAnimationFrame(callback) : setTimeout(callback, 1000 / 60);

export const cancelAnimationFrame = timerId =>
  isBrowser ? window.cancelAnimationFrame(timerId) : clearTimeout(timerId);

export default class AnimationLoop {
  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor({
    onCreateContext = opts => createGLContext(Object.assign({preserveDrawingBuffer: true}, opts)),
    onInitialize = () => {},
    onRender = () => {},
    onFinalize = () => {},

    gl = null,
    width = null,
    height = null,
    autoResizeViewport = true,
    autoResizeCanvas = true,
    autoResizeDrawingBuffer = true,
    useDevicePixelRatio = true
  } = {}) {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this._renderFrame = this._renderFrame.bind(this);

    this.update({
      autoResizeViewport,
      autoResizeCanvas,
      autoResizeDrawingBuffer,
      useDevicePixelRatio
    });

    this._onCreateContext = onCreateContext;

    this._onInitialize = onInitialize;
    this._onRender = onRender;
    this._onFinalize = onFinalize;

    this.width = width;
    this.height = height;

    this.gl = gl;

    return this;
  }

  // Update parameters (TODO - should these be specified in `start`?)
  update({
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
  start(contextParams = {}) {
    if (!this._animationFrameId) {

      // Wait for start promise before rendering frame
      this._startPromise = pageLoadPromise
      .then(() => {
        // Create the context
        this.gl = this.gl || contextParams.gl || this._onCreateContext(contextParams);
        if (!isWebGLContext(this.gl)) {
          throw new Error('AnimationLoop.onCreateContext - illegal context returned');
        }
        this._initializeContext();
        // Note: onIntialize can return a promise (in case it needs to load resources)
        return this._onInitialize(this._context) || {};
      })
      .then((appContext = {}) => {
        this._addAppDataToContext(appContext);
        if (!this._animationFrameId) {
          this._animationFrameId = requestAnimationFrame(this._renderFrame);
        }
      });

    }
    return this;
  }

  // Stops a render loop if already running, finalizing
  stop() {
    if (this._animationFrameId) {
      this._finalizeContext();
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    return this;
  }

  // Resize canvas in "CSS coordinates" (may be different from device coords)
  // NOTE: No effect on headless contexts
  // @param {Number} width, height - new width and height of canvas in CSS coordinates
  resizeCanvas(width, height) {
    this._resizeCanvas(width, height);
    return this;
  }

  // PRIVATE METHODS

  // Initialize the context object that will be passed to app callbacks
  _initializeContext() {
    if (!this._context) {
      this._context = {
        gl: this.gl,
        canvas: this.gl.canvas,
        stop: this.stop,
        tick: 0,
        tock: 0
      };
    }
    this._updateContext();
  }

  // Update the context object that will be passed to app callbacks
  _updateContext() {
    // Context width and height represent drawing buffer width and height
    const {canvas} = this._context;
    this._context.width = canvas.width;
    this._context.height = canvas.height;
    this._context.aspect = canvas.width / canvas.height;
  }

  _finalizeContext() {
  }

  // Add application's data to the app context object
  _addAppDataToContext(appContext) {
    if (typeof appContext === 'object' && appContext !== null) {
      this._context = Object.assign({}, appContext, this._context);
    }
  }

  /**
   * @private
   * Handles a render loop frame- updates context and calls the application
   * callback
   */
  _renderFrame() {
    const {canvas} = this._context;

    if (this._onSetupFrame) {
      this._onSetupFrame(this._context);
    } else {
      this._resizeCanvasDrawingBuffer(canvas);
      // Default viewport setup
      if (this.autoResizeViewport) {
        this.gl.viewport(0, 0, canvas.width, canvas.height);
      }
    }

    this._updateContext();
    this._onRender(this._context);

    // Increment tick
    this._context.tick++;

    // Request another render frame (now )
    this._animationFrameId = requestAnimationFrame(this._renderFrame);
  }

  // Resize canvas in "CSS coordinates" (may be different from device coords)
  // NOTE: No effect on headless contexts
  // @param {Number} width, height - new width and height of canvas in CSS coordinates
  _resizeCanvas(width, height) {
    const {canvas} = this._context;
    // if (canvas) {
    //   // Lookup the size the browser is displaying the canvas.
    //   var displayWidth = canvas.clientWidth;
    //   var displayHeight = canvas.clientHeight;

    //   // Check if the canvas is not the same size.
    //   if (canvas.width  !== displayWidth || canvas.height !== displayHeight) {
    //     // Make the canvas the same size
    //     canvas.width  = displayWidth;
    //     canvas.height = displayHeight;
    //   }
    // }
    if (canvas) {
      if (this.autoResizeDrawingBuffer) {
        const cssToDevicePixels = this.useDevicePixelRatio ? window.devicePixelRatio || 1 : 1;

        // Lookup the size the browser is displaying the canvas in CSS pixels
        // and compute a size needed to make our drawingbuffer match it in
        // device pixels.
        const displayWidth = Math.floor(width * cssToDevicePixels);
        const displayHeight = Math.floor(height * cssToDevicePixels);

        // Check if the canvas is not the same size.
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          // Make the canvas the same size
          canvas.width = displayWidth;
          canvas.height = displayHeight;
        }
      }

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    return this;
  }

  // Resize the render buffer of the canvas to match canvas client size
  // multiplying with dpr (Optionally can be turned off)
  // http://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      const {canvas} = this._context;
      const cssToDevicePixels = this.useDevicePixelRatio ?
        window.devicePixelRatio || 1 : 1;

      // Lookup the size the browser is displaying the canvas in CSS pixels
      // and compute a size needed to make our drawingbuffer match it in
      // device pixels.
      const oldWidth = window.innerWidth;
      const oldHeight = window.innerHeight;
      const displayWidth = Math.floor(oldWidth * cssToDevicePixels);
      const displayHeight = Math.floor(oldHeight * cssToDevicePixels);

      // Check if the canvas is not the same size.
      if (oldWidth !== displayWidth || oldHeight !== displayHeight) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        canvas.style.width = oldWidth;
        canvas.style.height = oldHeight;
      }
    }
  }

  /**
   * Resize canvas drawing buffer
   * NOTE: The drawing buffer will be scaled to the viewport
   * for best visual results, usually set to either:
   *  canvas CSS width x canvas CSS height
   *  canvas CSS width * devicePixelRatio x canvas CSS height * devicePixelRatio
   * TODO - add separate call for headless contexts
   * @param {Number} width - new width of canvas in CSS coordinates
   * @param {Number} height - new height of canvas in CSS coordinates
   * @return {Renderer} - returns self for chaining
   */
  _resizeDrawingBuffer(width, height) {
    const {canvas} = this._context;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      this.autoResizeDrawingBuffer = false;
    }
    return this;
  }
}
