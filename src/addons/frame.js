/* global window, document, setTimeout, clearTimeout, HTMLCanvasElement */
import autobind from 'autobind-decorator';
import assert from 'assert';
import {isBrowser} from '../utils';
import {createGLContext} from '../webgl';

const INITIAL_CONTEXT = {
  tick: -1
};

export const requestAnimationFrame = isBrowser ?
  window.requestAnimationFrame :
  nodeRequestAnimationFrame;

export const cancelAnimationFrame = isBrowser ?
  window.cancelAnimationFrame :
  nodeCancelAnimationFrame;

let animationFrameId = null;

/**
 * Starts a global render loop with the given frame function
 * @param {HTMLCanvasElement} canvas - if provided, with and height will be
 *   passed to context
 * @param {Function} renderFrame - application frame renderer function
 *  expected to take a context parameter
 * @param {Object} context - contains frame specific info
 *  (E.g. tick, width, height, etc)
 */
export function frame(canvas, renderFrame) {
  nextFrame(canvas, renderFrame, INITIAL_CONTEXT);
}

/**
 * Stops a render loop with the given frame function
 */
export function endFrame() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * @private
 * Draws next frame render loop with the given frame function
 * @param {HTMLCanvasElement} canvas - if provided, with and height will be
 *   passed to context
 * @param {Function} renderFrame - application frame renderer function
 *  expected to take a context parameter
 * @param {Object} context - contains frame specific info
 *  (E.g. tick, width, height, etc)
 */
function nextFrame(canvas, renderFrame, context) {
  context.tick++;
  resizeCanvasRenderBuffer(canvas);
  context.width = canvas.width;
  context.height = canvas.height;

  renderFrame(context);

  animationFrameId = requestAnimationFrame(
    nextFrame.bind(null, canvas, renderFrame, context)
  );
}

// Resize render buffer to match canvas client size
function resizeCanvasRenderBuffer(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
}

// Polyfill for requestAnimationFrame
function nodeRequestAnimationFrame(callback) {
  return setTimeout(callback, 1000 / 60);
}

// Polyfill for cancelAnimationFrame
function nodeCancelAnimationFrame(requestId) {
  return clearTimeout(requestId);
}

const bodyLoadPromise = new Promise((resolve, reject) => {
  window.onload = () => resolve(document.body);
});

export class Renderer {

  /*
   * @param {HTMLCanvasElement} canvas - if provided, with and height will be
   *   passed to context
   */
  constructor({
    gl = null,
    canvas = null,
    width = null,
    height = null,
    autoResizeCanvas = true,
    autoResizeViewport = true,
    autoResizeDrawingBuffer = true,
    useDevicePixelRatio = true,
    ...glOpts
  } = {}) {
    this.update({
      autoResizeDrawingBuffer,
      useDevicePixelRatio
    });

    this.autoResizeCanvas = autoResizeCanvas;
    this.width = width;
    this.height = height;

    this._startPromise = bodyLoadPromise.then(body => {
      // Deduce or create canvas
      canvas = typeof canvas === 'string' ?
        document.getElementById(canvas) : canvas;
      this.canvas = canvas || this._createCanvas(autoResizeCanvas);
      assert(this.canvas instanceof HTMLCanvasElement, 'Illegal parameter canvas');

      // Create gl context if needed
      this.gl = gl || createGLContext({
        canvas: this.canvas,
        ...glOpts
      });

      if (Number.isFinite(width) && Number.isFinite(height)) {
        this.resize(width, height);
      }

      return {};
    });
  }

  update({
    autoResizeDrawingBuffer = true,
    autoResizeViewport = true,
    useDevicePixelRatio = true
  }) {
    this.autoResizeDrawingBuffer = autoResizeDrawingBuffer;
    this.autoResizeViewport = autoResizeViewport;
    this.useDevicePixelRatio = useDevicePixelRatio;
    return this;
  }

  init(onInit) {
    this._startPromise = this._startPromise.then(() => {
      this._context = {
        ...INITIAL_CONTEXT,
        gl: this.gl,
        canvas: this.canvas,
        renderer: this,
        stop: this.stop
      };
      return onInit(this._context) || {};
    });

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
  frame(onRenderFrame) {
    this.stop();

    this._onRender = onRenderFrame;
    this._context = {
      ...INITIAL_CONTEXT,
      gl: this.gl,
      canvas: this.canvas,
      renderer: this,
      stop: this.stop
    };

    // Wait for start promise before rendering frame
    this._startPromise.then((appContext = {}) => {
      if (typeof appContext === 'object' && appContext !== null) {
        this._context = {...appContext, ...this._context};
      }
      this._nextFrame();
    });
    return this;
  }

  /**
   * Stops a render loop with the given frame function
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
    if (this.canvas) {
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.autoResizeCanvas = false;
    }
    return this;
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
  resizeDrawingBuffer(width, height) {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.autoResizeDrawingBuffer = false;
    }
    return this;
  }

  /**
   * @private
   * Draws next frame render loop with the given frame function
   * @param {HTMLCanvasElement} canvas - if provided, with and height will be
   *   passed to context
   * @param {Function} renderFrame - application frame renderer function
   *  expected to take a context parameter
   * @param {Object} context - contains frame specific info
   *  (E.g. tick, width, height, etc)
   */
  @autobind _nextFrame() {
    this._resizeCanvasDrawingBuffer(this.canvas);
    // Context width and height represent drawing buffer width and height
    this._context.width = this.canvas.width;
    this._context.height = this.canvas.height;
    // Increment tick
    this._context.tick++;

    // Default viewport setup
    if (this.autoResizeViewport) {
      this.gl.viewport(0, 0, this._context.width, this._context.height);
    }

    this._onRender(this._context);

    this._animationFrameId = requestAnimationFrame(this._nextFrame);
  }

  // Create a canvas set to 100%
  _createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'lumagl-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // adds the canvas to the body element
    const body = document.body;
    body.insertBefore(canvas, body.firstChild);
    return canvas;
  }

  // Resize the render buffer of the canvas to match canvas client size
  // multiplying with dpr (Optionally can be turned off)
  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      const dpr = this.useDevicePixelRatio ?
        window.devicePixelRatio || 1 : 1;
      this.canvas.width = this.canvas.clientWidth * dpr;
      this.canvas.height = this.canvas.clientHeight * dpr;
    }
  }
}
