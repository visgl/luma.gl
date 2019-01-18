/* global OffscreenCanvas */
import {createGLContext, resizeGLContext, resetParameters} from '../webgl-context';
import {getPageLoadPromise} from '../webgl-context';
import {makeDebugContext} from '../webgl-context/debug-context';
import {isWebGL, requestAnimationFrame, cancelAnimationFrame} from '../webgl-utils';
import {log} from '../utils';
import assert from '../utils/assert';

// TODO - remove dependency on webgl classes
import {Framebuffer} from '../webgl';

const DEFAULT_GL_OPTIONS = {
  preserveDrawingBuffer: true
};

export default class AnimationLoop {
  /*
   * @param {HTMLCanvasElement} canvas - if provided, width and height will be passed to context
   */
  constructor(props = {}) {
    const {
      onCreateContext = opts => createGLContext(opts),
      onAddHTML = null,
      onInitialize = () => {},
      onRender = () => {},
      onFinalize = () => {},

      gl = null,
      glOptions = {},
      debug = false,

      createFramebuffer = false,

      // view parameters
      autoResizeViewport = true,
      autoResizeDrawingBuffer = true
    } = props;

    let {useDevicePixels = true} = props;

    if ('useDevicePixelRatio' in props) {
      log.deprecated('useDevicePixelRatio', 'useDevicePixels')();
      useDevicePixels = props.useDevicePixelRatio;
    }

    this.props = {
      onCreateContext,
      onAddHTML,
      onInitialize,
      onRender,
      onFinalize,

      gl,
      glOptions,
      debug,
      createFramebuffer
    };

    // state
    this.gl = gl;
    this.needsRedraw = null;

    this.setProps({
      autoResizeViewport,
      autoResizeDrawingBuffer,
      useDevicePixels
    });

    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this._renderFrame = this._renderFrame.bind(this);

    this._onMousemove = this._onMousemove.bind(this);
    this._onMouseleave = this._onMouseleave.bind(this);

    return this;
  }

  setNeedsRedraw(reason) {
    assert(typeof reason === 'string');
    this.needsRedraw = this.needsRedraw || reason;
    return this;
  }

  setProps(props) {
    if ('autoResizeViewport' in props) {
      this.autoResizeViewport = props.autoResizeViewport;
    }
    if ('autoResizeDrawingBuffer' in props) {
      this.autoResizeDrawingBuffer = props.autoResizeDrawingBuffer;
    }
    if ('useDevicePixels' in props) {
      this.useDevicePixels = props.useDevicePixels;
    }
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
          this._createFramebuffer();
          this._startEventHandling();

          // Initialize the callback data
          this._initializeCallbackData();
          this._updateCallbackData();

          // Default viewport setup, in case onInitialize wants to render
          this._resizeCanvasDrawingBuffer();
          this._resizeViewport();

          // Note: onIntialize can return a promise (in case it needs to load resources)
          return this.onInitialize(this.animationProps);
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

  onCreateContext(...args) {
    return this.props.onCreateContext(...args);
  }

  onInitialize(...args) {
    return this.props.onInitialize(...args);
  }

  onRender(...args) {
    return this.props.onRender(...args);
  }

  onFinalize(...args) {
    return this.props.onFinalize(...args);
  }

  // DEPRECATED/REMOVED METHODS

  getHTMLControlValue(id, defaultValue = 1) {
    const element = document.getElementById(id);
    return element ? Number(element.value) : defaultValue;
  }

  // Update parameters
  setViewParameters() {
    log.removed('AnimationLoop.setViewParameters', 'AnimationLoop.setProps')();
    return this;
  }

  // PRIVATE METHODS

  _clearNeedsRedraw() {
    this.needsRedraw = null;
  }

  _setupFrame() {
    if (this._onSetupFrame) {
      // call callback
      this._onSetupFrame(this.animationProps);
      // end callback
    } else {
      this._resizeCanvasDrawingBuffer();
      this._resizeViewport();
      this._resizeFramebuffer();
    }
  }

  /**
   * @private
   * Handles a render loop frame - updates context and calls the application
   * callback
   */
  _renderFrame() {
    if (this._stopped) {
      return;
    }

    this._setupFrame();
    this._updateCallbackData();

    // call callback
    this.onRender(this.animationProps);
    // end callback

    // clear needsRedraw flag
    this._clearNeedsRedraw();

    if (this.offScreen && this.gl.commit) {
      // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/commit
      // commit returns a Promise
      this.gl.commit().then(this._renderFrame);
    } else {
      // Either on-screen or gl.commit not supported (Chrome)
      // Request another render frame now
      this._animationFrameId = requestAnimationFrame(this._renderFrame);
    }
  }

  // Initialize the  object that will be passed to app callbacks
  _initializeCallbackData() {
    this.animationProps = {
      gl: this.gl,

      stop: this.stop,
      canvas: this.gl.canvas,
      framebuffer: this.framebuffer,

      // Initial values
      useDevicePixels: this.useDevicePixels,
      needsRedraw: null,

      // Animation props
      startTime: Date.now(),
      time: 0,
      tick: 0,
      tock: 0,
      // canvas

      // Experimental
      _loop: this,
      _animationLoop: this,
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

    // Increment tick
    this.animationProps.time = Date.now() - this.animationProps.startTime;
    this.animationProps.tick = Math.floor((this.animationProps.time / 1000) * 60);
    this.animationProps.tock++;

    // experimental
    this.animationProps._offScreen = this.offScreen;
  }

  _finalizeCallbackData() {
    // call callback
    this.onFinalize(this.animationProps);
    // end callback
  }

  // Add application's data to the app context object
  _addCallbackData(appContext) {
    if (typeof appContext === 'object' && appContext !== null) {
      this.animationProps = Object.assign({}, this.animationProps, appContext);
    }
  }

  // Either uses supplied or existing context, or calls provided callback to create one
  _createWebGLContext(opts) {
    this.offScreen =
      opts.canvas &&
      typeof OffscreenCanvas !== 'undefined' &&
      opts.canvas instanceof OffscreenCanvas;

    // Create the WebGL context if necessary
    opts = Object.assign({}, opts, DEFAULT_GL_OPTIONS, this.props.glOptions);
    this.gl = this.props.gl || this.onCreateContext(opts);

    if (!isWebGL(this.gl)) {
      throw new Error('AnimationLoop.onCreateContext - illegal context returned');
    }

    if (this.props.debug) {
      this.gl = makeDebugContext(this.gl);
    }

    // Reset the WebGL context.
    resetParameters(this.gl);

    this._createInfoDiv();
  }

  _createInfoDiv() {
    if (this.gl.canvas && this.props.onAddHTML) {
      /* global document */
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
    const {clientWidth, clientHeight} = this.gl.canvas;
    if (clientWidth >= 0 && clientHeight >= 0) {
      aspect = height > 0 ? clientWidth / clientHeight : 1;
    } else if (width > 0 && height > 0) {
      aspect = width / height;
    }

    return {width, height, aspect};
  }

  // Default viewport setup
  _resizeViewport() {
    if (this.autoResizeViewport) {
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
  }

  // Resize the render buffer of the canvas to match canvas client size
  // Optionally multiplying with devicePixel ratio
  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      resizeGLContext(this.gl, {useDevicePixels: this.useDevicePixels});
    }
  }

  // TBD - deprecated?
  _createFramebuffer() {
    // Setup default framebuffer
    if (this.props.createFramebuffer) {
      this.framebuffer = new Framebuffer(this.gl);
    }
  }

  _resizeFramebuffer() {
    if (this.framebuffer) {
      this.framebuffer.resize({
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight
      });
    }
  }

  // Event handling

  _startEventHandling() {
    this.gl.canvas.addEventListener('mousemove', this._onMousemove);
    this.gl.canvas.addEventListener('mouseleave', this._onMouseleave);
  }

  _onMousemove(e) {
    this.animationProps._mousePosition = [e.offsetX, e.offsetY];
  }
  _onMouseleave(e) {
    this.animationProps._mousePosition = null;
  }
}
