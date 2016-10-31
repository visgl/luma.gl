/* global window, setTimeout, clearTimeout */
import autobind from 'autobind-decorator';
import {isBrowser, pageLoadPromise} from '../utils';
import {isWebGLRenderingContext} from '../webgl';

const INITIAL_CONTEXT = {
  tick: 0
};

// Node.js polyfills for requestAnimationFrame and cancelAnimationFrame
export const requestAnimationFrame = callback =>
  isBrowser ?
    window.requestAnimationFrame(callback) :
    setTimeout(callback, 1000 / 60);

export const cancelAnimationFrame = timerId =>
  isBrowser ?
    window.cancelAnimationFrame(timerId) :
    clearTimeout(timerId);

export default class AnimationFrame {
  /*
   * @param {HTMLCanvasElement} canvas - if provided, with and height will be
   *   passed to context
   */
  constructor({
    gl = null,
    canvas = null,
    width = null,
    height = null,
    autoResizeViewport = true,
    autoResizeCanvas = true,
    autoResizeDrawingBuffer = true,
    useDevicePixelRatio = true,
    ...glOpts
  } = {}) {
    this.update({
      autoResizeViewport,
      autoResizeCanvas,
      autoResizeDrawingBuffer,
      useDevicePixelRatio
    });

    this.width = width;
    this.height = height;

    // Don't do a
    this._startPromise = pageLoadPromise.then(page => {
      this.gl = gl;
      return page;
    });
  }

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

  @autobind context(onCreateContext) {
    if (this.gl) {
      throw new Error('AnimationFrame.context - context already provided');
    }
    this._startPromise = this._startPromise.then(() => {
      this.gl = onCreateContext();
      if (!isWebGLRenderingContext(this.gl)) {
        throw new Error('AnimationFrame.context - illegal context returned');
      }
    });
    return this;
  }

  @autobind init(onInit) {
    this._startPromise = this._startPromise.then(() => {
      if (!this.gl) {
        throw new Error('AnimationFrame.context - no context provided');
      }
      this._context = {
        ...INITIAL_CONTEXT,
        gl: this.gl,
        canvas: this.gl.canvas,
        renderer: this,
        stop: this.stop
      };
      return onInit(this._context) || {};
    });

    return this;
  }

  @autobind setupFrame(onSetupFrame) {
    this._onSetupFrame = onSetupFrame;
    return this;
  }

  /**
   * Starts a global render loop with the given frame function
   * @param {Function} onRenderFrame - application frame renderer function
   *  expected to take a context parameter
   * @param {Object} context - contains frame specific info
   *  (E.g. tick, width, height, etc)
   * @return {Renderer} - returns self for chaining
   */
  @autobind frame(onRenderFrame) {
    this._onRenderFrame = onRenderFrame;
    this._restartFrame();
    return this;
  }

  /**
   * Starts a render loop if not already running
   */
  @autobind start() {
    this._startPromise.then(() => {
      if (!this._animationFrameId) {
        this._animationFrameId = requestAnimationFrame(this._frame);
      }
    });
    return this;
  }

  /**
   * Stops a render loop if already running
   */
  @autobind stop() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    return this;
  }

  /**
   * Resize canvas in "CSS coordinates" (may be different from device coords)
   * NOTE: No effect on headless contexts
   * @param {Number} width - new width of canvas in CSS coordinates
   * @param {Number} height - new height of canvas in CSS coordinates
   * @return {Renderer} - returns self for chaining
   */
  resizeCanvas(width, height) {
    this._resizeCanvas(width, height);
    return this;
  }

  // PRIVATE METHODS

  _restartFrame() {
    this.stop();
    // Wait for start promise before rendering frame
    this._startPromise.then((appContext = {}) => {
      this._context = {
        ...INITIAL_CONTEXT,
        gl: this.gl,
        canvas: this.gl.canvas,
        renderer: this,
        stop: this.stop
      };

      if (typeof appContext === 'object' && appContext !== null) {
        this._context = {...appContext, ...this._context};
      }
      this.start();
    });
  }

  /**
   * @private
   * Handles a render loop frame- updates context and calls the application
   * callback
   */
  @autobind _frame() {
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

    // Context width and height represent drawing buffer width and height
    this._context.width = canvas.width;
    this._context.height = canvas.height;
    this._context.aspect = canvas.width / canvas.height;

    this._onRenderFrame(this._context);

    // Increment tick
    this._context.tick++;

    // Request another render frame
    this._animationFrameId = requestAnimationFrame(this._frame);
  }

  /**
   * Resize canvas in "CSS coordinates" (may be different from device coords)
   * NOTE: No effect on headless contexts
   * @param {Number} width - new width of canvas in CSS coordinates
   * @param {Number} height - new height of canvas in CSS coordinates
   * @return {Renderer} - returns self for chaining
   */
  _resizeCanvas(width, height) {
    const {canvas} = this._context;
    if (canvas) {
      if (this.autoResizeDrawingBuffer) {
        const cssToDevicePixels = this.useDevicePixelRatio ?
          window.devicePixelRatio || 1 : 1;

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
   *  canvas CSS width x CSS height
   *  canvas CSS width * devicePixelRatio x CSS height * devicePixelRatio
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
