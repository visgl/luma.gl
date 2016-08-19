'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Renderer = exports.cancelAnimationFrame = exports.requestAnimationFrame = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

exports.frame = frame;
exports.endFrame = endFrame;

var _autobindDecorator = require('autobind-decorator');

var _autobindDecorator2 = _interopRequireDefault(_autobindDecorator);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _utils = require('../utils');

var _webgl = require('../webgl');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

var INITIAL_CONTEXT = {
  tick: -1
};

var requestAnimationFrame = exports.requestAnimationFrame = _utils.isBrowser ? window.requestAnimationFrame : nodeRequestAnimationFrame;

var cancelAnimationFrame = exports.cancelAnimationFrame = _utils.isBrowser ? window.cancelAnimationFrame : nodeCancelAnimationFrame;

var animationFrameId = null;

/**
 * Starts a global render loop with the given frame function
 * @param {HTMLCanvasElement} canvas - if provided, with and height will be
 *   passed to context
 * @param {Function} renderFrame - application frame renderer function
 *  expected to take a context parameter
 * @param {Object} context - contains frame specific info
 *  (E.g. tick, width, height, etc)
 */
function frame(canvas, renderFrame) {
  nextFrame(canvas, renderFrame, INITIAL_CONTEXT);
}

/**
 * Stops a render loop with the given frame function
 */
function endFrame() {
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

  animationFrameId = requestAnimationFrame(nextFrame.bind(null, canvas, renderFrame, context));
}

// Resize render buffer to match canvas client size
function resizeCanvasRenderBuffer(canvas) {
  var dpr = window.devicePixelRatio || 1;
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

var bodyLoadPromise = new Promise(function (resolve, reject) {
  window.onload = function () {
    resolve(document.body);
  };
});

var Renderer = exports.Renderer = (_class = function () {
  function Renderer() {
    var _this = this;

    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$gl = _ref.gl;
    var gl = _ref$gl === undefined ? null : _ref$gl;
    var _ref$canvas = _ref.canvas;
    var canvas = _ref$canvas === undefined ? null : _ref$canvas;
    var _ref$width = _ref.width;
    var width = _ref$width === undefined ? null : _ref$width;
    var _ref$height = _ref.height;
    var height = _ref$height === undefined ? null : _ref$height;
    var _ref$autoResizeCanvas = _ref.autoResizeCanvas;
    var autoResizeCanvas = _ref$autoResizeCanvas === undefined ? true : _ref$autoResizeCanvas;
    var _ref$autoResizeViewpo = _ref.autoResizeViewport;
    var autoResizeViewport = _ref$autoResizeViewpo === undefined ? true : _ref$autoResizeViewpo;
    var _ref$autoResizeDrawin = _ref.autoResizeDrawingBuffer;
    var autoResizeDrawingBuffer = _ref$autoResizeDrawin === undefined ? true : _ref$autoResizeDrawin;
    var _ref$useDevicePixelRa = _ref.useDevicePixelRatio;
    var useDevicePixelRatio = _ref$useDevicePixelRa === undefined ? true : _ref$useDevicePixelRa;

    var glOpts = _objectWithoutProperties(_ref, ['gl', 'canvas', 'width', 'height', 'autoResizeCanvas', 'autoResizeViewport', 'autoResizeDrawingBuffer', 'useDevicePixelRatio']);

    _classCallCheck(this, Renderer);

    this.update({
      autoResizeDrawingBuffer: autoResizeDrawingBuffer,
      useDevicePixelRatio: useDevicePixelRatio
    });

    this.autoResizeCanvas = autoResizeCanvas;
    this.width = width;
    this.height = height;

    this._startPromise = bodyLoadPromise.then(function (body) {
      // Deduce or create canvas
      canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
      _this.canvas = canvas || _this._createCanvas(autoResizeCanvas);
      (0, _assert2.default)(_this.canvas instanceof HTMLCanvasElement, 'Illegal parameter canvas');

      // Create gl context if needed
      _this.gl = gl || (0, _webgl.createGLContext)(_extends({
        canvas: _this.canvas
      }, glOpts));

      if (Number.isFinite(width) && Number.isFinite(height)) {
        _this.resize(width, height);
      }

      return {};
    });
  }

  _createClass(Renderer, [{
    key: 'update',
    value: function update(_ref2) {
      var _ref2$autoResizeDrawi = _ref2.autoResizeDrawingBuffer;
      var autoResizeDrawingBuffer = _ref2$autoResizeDrawi === undefined ? true : _ref2$autoResizeDrawi;
      var _ref2$autoResizeViewp = _ref2.autoResizeViewport;
      var autoResizeViewport = _ref2$autoResizeViewp === undefined ? true : _ref2$autoResizeViewp;
      var _ref2$useDevicePixelR = _ref2.useDevicePixelRatio;
      var useDevicePixelRatio = _ref2$useDevicePixelR === undefined ? true : _ref2$useDevicePixelR;

      this.autoResizeDrawingBuffer = autoResizeDrawingBuffer;
      this.autoResizeViewport = autoResizeViewport;
      this.useDevicePixelRatio = useDevicePixelRatio;
      return this;
    }
  }, {
    key: 'init',
    value: function init(onInit) {
      var _this2 = this;

      this._startPromise = this._startPromise.then(function () {
        _this2._context = _extends({}, INITIAL_CONTEXT, {
          gl: _this2.gl,
          canvas: _this2.canvas,
          renderer: _this2,
          stop: _this2.stop
        });
        return onInit(_this2._context) || {};
      });

      return this;
    }

    /**
     * Starts a global render loop with the given frame function
     * @param {HTMLCanvasElement} canvas - if provided, with and height will be
     *   passed to context
     * @param {Function} onRenderFrame - application frame renderer function
     *  expected to take a context parameter
     * @param {Object} context - contains frame specific info
     *  (E.g. tick, width, height, etc)
     */

  }, {
    key: 'frame',
    value: function frame(onRenderFrame) {
      var _this3 = this;

      this.stop();

      this._onRender = onRenderFrame;
      this._context = _extends({}, INITIAL_CONTEXT, {
        gl: this.gl,
        canvas: this.canvas,
        renderer: this,
        stop: this.stop
      });

      // Wait for start promise before rendering frame
      this._startPromise.then(function () {
        var appContext = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        if ((typeof appContext === 'undefined' ? 'undefined' : _typeof(appContext)) === 'object' && appContext !== null) {
          _this3._context = _extends({}, appContext, _this3._context);
        }
        _this3._nextFrame();
      });
      return this;
    }

    /**
     * Stops a render loop with the given frame function
     */

  }, {
    key: 'stop',
    value: function stop() {
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
     */

  }, {
    key: 'resizeCanvas',
    value: function resizeCanvas(width, height) {
      if (this.canvas) {
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
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
     */

  }, {
    key: 'resizeDrawingBuffer',
    value: function resizeDrawingBuffer(width, height) {
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

  }, {
    key: '_nextFrame',
    value: function _nextFrame() {
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

  }, {
    key: '_createCanvas',
    value: function _createCanvas() {
      var canvas = document.createElement('canvas');
      canvas.id = 'lumagl-canvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      // adds the canvas to the body element
      var body = document.body;
      body.insertBefore(canvas, body.firstChild);
      return canvas;
    }

    // Resize the render buffer of the canvas to match canvas client size
    // multiplying with dpr (Optionally can be turned off)

  }, {
    key: '_resizeCanvasDrawingBuffer',
    value: function _resizeCanvasDrawingBuffer() {
      if (this.autoResizeDrawingBuffer) {
        var dpr = this.useDevicePixelRatio ? window.devicePixelRatio || 1 : 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
      }
    }
  }]);

  return Renderer;
}(), (_applyDecoratedDescriptor(_class.prototype, 'stop', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'stop'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, '_nextFrame', [_autobindDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, '_nextFrame'), _class.prototype)), _class);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvZnJhbWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O1FBNEJnQixLLEdBQUEsSztRQU9BLFEsR0FBQSxROztBQW5DaEI7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTSxrQkFBa0I7QUFDdEIsUUFBTSxDQUFDO0FBRGUsQ0FBeEI7O0FBSU8sSUFBTSx3REFBd0IsbUJBQ25DLE9BQU8scUJBRDRCLEdBRW5DLHlCQUZLOztBQUlBLElBQU0sc0RBQXVCLG1CQUNsQyxPQUFPLG9CQUQyQixHQUVsQyx3QkFGSzs7QUFJUCxJQUFJLG1CQUFtQixJQUF2Qjs7QUFFQTs7Ozs7Ozs7O0FBU08sU0FBUyxLQUFULENBQWUsTUFBZixFQUF1QixXQUF2QixFQUFvQztBQUN6QyxZQUFVLE1BQVYsRUFBa0IsV0FBbEIsRUFBK0IsZUFBL0I7QUFDRDs7QUFFRDs7O0FBR08sU0FBUyxRQUFULEdBQW9CO0FBQ3pCLE1BQUksZ0JBQUosRUFBc0I7QUFDcEIseUJBQXFCLGdCQUFyQjtBQUNBLHVCQUFtQixJQUFuQjtBQUNEO0FBQ0Y7O0FBRUQ7Ozs7Ozs7Ozs7QUFVQSxTQUFTLFNBQVQsQ0FBbUIsTUFBbkIsRUFBMkIsV0FBM0IsRUFBd0MsT0FBeEMsRUFBaUQ7QUFDL0MsVUFBUSxJQUFSO0FBQ0EsMkJBQXlCLE1BQXpCO0FBQ0EsVUFBUSxLQUFSLEdBQWdCLE9BQU8sS0FBdkI7QUFDQSxVQUFRLE1BQVIsR0FBaUIsT0FBTyxNQUF4Qjs7QUFFQSxjQUFZLE9BQVo7O0FBRUEscUJBQW1CLHNCQUNqQixVQUFVLElBQVYsQ0FBZSxJQUFmLEVBQXFCLE1BQXJCLEVBQTZCLFdBQTdCLEVBQTBDLE9BQTFDLENBRGlCLENBQW5CO0FBR0Q7O0FBRUQ7QUFDQSxTQUFTLHdCQUFULENBQWtDLE1BQWxDLEVBQTBDO0FBQ3hDLE1BQU0sTUFBTSxPQUFPLGdCQUFQ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LEdBQ1YsT0FBTyxnQkFBUCxJQUEyQixDQURqQixHQUNxQixDQURqQztBQUVBLGFBQUssTUFBTCxDQUFZLEtBQVosR0FBb0IsS0FBSyxNQUFMLENBQVksV0FBWixHQUEwQixHQUE5QztBQUNBLGFBQUssTUFBTCxDQUFZLE1BQVosR0FBcUIsS0FBSyxNQUFMLENBQVksWUFBWixHQUEyQixHQUFoRDtBQUNEO0FBQ0YiLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXV0b2JpbmQgZnJvbSAnYXV0b2JpbmQtZGVjb3JhdG9yJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7aXNCcm93c2VyfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge2NyZWF0ZUdMQ29udGV4dH0gZnJvbSAnLi4vd2ViZ2wnO1xuXG5jb25zdCBJTklUSUFMX0NPTlRFWFQgPSB7XG4gIHRpY2s6IC0xXG59O1xuXG5leHBvcnQgY29uc3QgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gaXNCcm93c2VyID9cbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA6XG4gIG5vZGVSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cbmV4cG9ydCBjb25zdCBjYW5jZWxBbmltYXRpb25GcmFtZSA9IGlzQnJvd3NlciA/XG4gIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA6XG4gIG5vZGVDYW5jZWxBbmltYXRpb25GcmFtZTtcblxubGV0IGFuaW1hdGlvbkZyYW1lSWQgPSBudWxsO1xuXG4vKipcbiAqIFN0YXJ0cyBhIGdsb2JhbCByZW5kZXIgbG9vcCB3aXRoIHRoZSBnaXZlbiBmcmFtZSBmdW5jdGlvblxuICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzIC0gaWYgcHJvdmlkZWQsIHdpdGggYW5kIGhlaWdodCB3aWxsIGJlXG4gKiAgIHBhc3NlZCB0byBjb250ZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZW5kZXJGcmFtZSAtIGFwcGxpY2F0aW9uIGZyYW1lIHJlbmRlcmVyIGZ1bmN0aW9uXG4gKiAgZXhwZWN0ZWQgdG8gdGFrZSBhIGNvbnRleHQgcGFyYW1ldGVyXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIGNvbnRhaW5zIGZyYW1lIHNwZWNpZmljIGluZm9cbiAqICAoRS5nLiB0aWNrLCB3aWR0aCwgaGVpZ2h0LCBldGMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcmFtZShjYW52YXMsIHJlbmRlckZyYW1lKSB7XG4gIG5leHRGcmFtZShjYW52YXMsIHJlbmRlckZyYW1lLCBJTklUSUFMX0NPTlRFWFQpO1xufVxuXG4vKipcbiAqIFN0b3BzIGEgcmVuZGVyIGxvb3Agd2l0aCB0aGUgZ2l2ZW4gZnJhbWUgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuZEZyYW1lKCkge1xuICBpZiAoYW5pbWF0aW9uRnJhbWVJZCkge1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW1hdGlvbkZyYW1lSWQpO1xuICAgIGFuaW1hdGlvbkZyYW1lSWQgPSBudWxsO1xuICB9XG59XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIERyYXdzIG5leHQgZnJhbWUgcmVuZGVyIGxvb3Agd2l0aCB0aGUgZ2l2ZW4gZnJhbWUgZnVuY3Rpb25cbiAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhcyAtIGlmIHByb3ZpZGVkLCB3aXRoIGFuZCBoZWlnaHQgd2lsbCBiZVxuICogICBwYXNzZWQgdG8gY29udGV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVuZGVyRnJhbWUgLSBhcHBsaWNhdGlvbiBmcmFtZSByZW5kZXJlciBmdW5jdGlvblxuICogIGV4cGVjdGVkIHRvIHRha2UgYSBjb250ZXh0IHBhcmFtZXRlclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBjb250YWlucyBmcmFtZSBzcGVjaWZpYyBpbmZvXG4gKiAgKEUuZy4gdGljaywgd2lkdGgsIGhlaWdodCwgZXRjKVxuICovXG5mdW5jdGlvbiBuZXh0RnJhbWUoY2FudmFzLCByZW5kZXJGcmFtZSwgY29udGV4dCkge1xuICBjb250ZXh0LnRpY2srKztcbiAgcmVzaXplQ2FudmFzUmVuZGVyQnVmZmVyKGNhbnZhcyk7XG4gIGNvbnRleHQud2lkdGggPSBjYW52YXMud2lkdGg7XG4gIGNvbnRleHQuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblxuICByZW5kZXJGcmFtZShjb250ZXh0KTtcblxuICBhbmltYXRpb25GcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKFxuICAgIG5leHRGcmFtZS5iaW5kKG51bGwsIGNhbnZhcywgcmVuZGVyRnJhbWUsIGNvbnRleHQpXG4gICk7XG59XG5cbi8vIFJlc2l6ZSByZW5kZXIgYnVmZmVyIHRvIG1hdGNoIGNhbnZhcyBjbGllbnQgc2l6ZVxuZnVuY3Rpb24gcmVzaXplQ2FudmFzUmVuZGVyQnVmZmVyKGNhbnZhcykge1xuICBjb25zdCBkcHIgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xuICBjYW52YXMud2lkdGggPSBjYW52YXMuY2xpZW50V2lkdGggKiBkcHI7XG4gIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMuY2xpZW50SGVpZ2h0ICogZHByO1xufVxuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5mdW5jdGlvbiBub2RlUmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKSB7XG4gIHJldHVybiBzZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xufVxuXG4vLyBQb2x5ZmlsbCBmb3IgY2FuY2VsQW5pbWF0aW9uRnJhbWVcbmZ1bmN0aW9uIG5vZGVDYW5jZWxBbmltYXRpb25GcmFtZShyZXF1ZXN0SWQpIHtcbiAgcmV0dXJuIGNsZWFyVGltZW91dChyZXF1ZXN0SWQpO1xufVxuXG5jb25zdCBib2R5TG9hZFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gIHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXNvbHZlKGRvY3VtZW50LmJvZHkpO1xuICB9XG59KTtcblxuZXhwb3J0IGNsYXNzIFJlbmRlcmVyIHtcblxuICBjb25zdHJ1Y3Rvcih7XG4gICAgZ2wgPSBudWxsLFxuICAgIGNhbnZhcyA9IG51bGwsXG4gICAgd2lkdGggPSBudWxsLFxuICAgIGhlaWdodCA9IG51bGwsXG4gICAgYXV0b1Jlc2l6ZUNhbnZhcyA9IHRydWUsXG4gICAgYXV0b1Jlc2l6ZVZpZXdwb3J0ID0gdHJ1ZSxcbiAgICBhdXRvUmVzaXplRHJhd2luZ0J1ZmZlciA9IHRydWUsXG4gICAgdXNlRGV2aWNlUGl4ZWxSYXRpbyA9IHRydWUsXG4gICAgLi4uZ2xPcHRzXG4gIH0gPSB7fSkge1xuICAgIHRoaXMudXBkYXRlKHtcbiAgICAgIGF1dG9SZXNpemVEcmF3aW5nQnVmZmVyLFxuICAgICAgdXNlRGV2aWNlUGl4ZWxSYXRpb1xuICAgIH0pO1xuXG4gICAgdGhpcy5hdXRvUmVzaXplQ2FudmFzID0gYXV0b1Jlc2l6ZUNhbnZhcztcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICB0aGlzLl9zdGFydFByb21pc2UgPSBib2R5TG9hZFByb21pc2UudGhlbihib2R5ID0+IHtcbiAgICAgIC8vIERlZHVjZSBvciBjcmVhdGUgY2FudmFzXG4gICAgICBjYW52YXMgPSB0eXBlb2YgY2FudmFzID09PSAnc3RyaW5nJyA/XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcykgOiBjYW52YXM7XG4gICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcyB8fCB0aGlzLl9jcmVhdGVDYW52YXMoYXV0b1Jlc2l6ZUNhbnZhcyk7XG4gICAgICBhc3NlcnQodGhpcy5jYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCwgJ0lsbGVnYWwgcGFyYW1ldGVyIGNhbnZhcycpO1xuXG4gICAgICAvLyBDcmVhdGUgZ2wgY29udGV4dCBpZiBuZWVkZWRcbiAgICAgIHRoaXMuZ2wgPSBnbCB8fCBjcmVhdGVHTENvbnRleHQoe1xuICAgICAgICBjYW52YXM6IHRoaXMuY2FudmFzLFxuICAgICAgICAuLi5nbE9wdHNcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHdpZHRoKSAmJiBOdW1iZXIuaXNGaW5pdGUoaGVpZ2h0KSkge1xuICAgICAgICB0aGlzLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt9O1xuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlKHtcbiAgICBhdXRvUmVzaXplRHJhd2luZ0J1ZmZlciA9IHRydWUsXG4gICAgYXV0b1Jlc2l6ZVZpZXdwb3J0ID0gdHJ1ZSxcbiAgICB1c2VEZXZpY2VQaXhlbFJhdGlvID0gdHJ1ZVxuICB9KSB7XG4gICAgdGhpcy5hdXRvUmVzaXplRHJhd2luZ0J1ZmZlciA9IGF1dG9SZXNpemVEcmF3aW5nQnVmZmVyO1xuICAgIHRoaXMuYXV0b1Jlc2l6ZVZpZXdwb3J0ID0gYXV0b1Jlc2l6ZVZpZXdwb3J0O1xuICAgIHRoaXMudXNlRGV2aWNlUGl4ZWxSYXRpbyA9IHVzZURldmljZVBpeGVsUmF0aW87XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpbml0KG9uSW5pdCkge1xuICAgIHRoaXMuX3N0YXJ0UHJvbWlzZSA9IHRoaXMuX3N0YXJ0UHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2NvbnRleHQgPSB7XG4gICAgICAgIC4uLklOSVRJQUxfQ09OVEVYVCxcbiAgICAgICAgZ2w6IHRoaXMuZ2wsXG4gICAgICAgIGNhbnZhczogdGhpcy5jYW52YXMsXG4gICAgICAgIHJlbmRlcmVyOiB0aGlzLFxuICAgICAgICBzdG9wOiB0aGlzLnN0b3BcbiAgICAgIH07XG4gICAgICByZXR1cm4gb25Jbml0KHRoaXMuX2NvbnRleHQpIHx8IHt9O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGEgZ2xvYmFsIHJlbmRlciBsb29wIHdpdGggdGhlIGdpdmVuIGZyYW1lIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhcyAtIGlmIHByb3ZpZGVkLCB3aXRoIGFuZCBoZWlnaHQgd2lsbCBiZVxuICAgKiAgIHBhc3NlZCB0byBjb250ZXh0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVuZGVyRnJhbWUgLSBhcHBsaWNhdGlvbiBmcmFtZSByZW5kZXJlciBmdW5jdGlvblxuICAgKiAgZXhwZWN0ZWQgdG8gdGFrZSBhIGNvbnRleHQgcGFyYW1ldGVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gY29udGFpbnMgZnJhbWUgc3BlY2lmaWMgaW5mb1xuICAgKiAgKEUuZy4gdGljaywgd2lkdGgsIGhlaWdodCwgZXRjKVxuICAgKi9cbiAgZnJhbWUob25SZW5kZXJGcmFtZSkge1xuICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgdGhpcy5fb25SZW5kZXIgPSBvblJlbmRlckZyYW1lO1xuICAgIHRoaXMuX2NvbnRleHQgPSB7XG4gICAgICAuLi5JTklUSUFMX0NPTlRFWFQsXG4gICAgICBnbDogdGhpcy5nbCxcbiAgICAgIGNhbnZhczogdGhpcy5jYW52YXMsXG4gICAgICByZW5kZXJlcjogdGhpcyxcbiAgICAgIHN0b3A6IHRoaXMuc3RvcFxuICAgIH07XG5cbiAgICAvLyBXYWl0IGZvciBzdGFydCBwcm9taXNlIGJlZm9yZSByZW5kZXJpbmcgZnJhbWVcbiAgICB0aGlzLl9zdGFydFByb21pc2UudGhlbigoYXBwQ29udGV4dCA9IHt9KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGFwcENvbnRleHQgPT09ICdvYmplY3QnICYmIGFwcENvbnRleHQgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IHsuLi5hcHBDb250ZXh0LCAuLi50aGlzLl9jb250ZXh0fTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX25leHRGcmFtZSgpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIGEgcmVuZGVyIGxvb3Agd2l0aCB0aGUgZ2l2ZW4gZnJhbWUgZnVuY3Rpb25cbiAgICovXG4gIEBhdXRvYmluZCBzdG9wKCkge1xuICAgIGlmICh0aGlzLl9hbmltYXRpb25GcmFtZUlkKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9hbmltYXRpb25GcmFtZUlkKTtcbiAgICAgIHRoaXMuX2FuaW1hdGlvbkZyYW1lSWQgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNpemUgY2FudmFzIGluIFwiQ1NTIGNvb3JkaW5hdGVzXCIgKG1heSBiZSBkaWZmZXJlbnQgZnJvbSBkZXZpY2UgY29vcmRzKVxuICAgKiBOT1RFOiBObyBlZmZlY3Qgb24gaGVhZGxlc3MgY29udGV4dHNcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHdpZHRoIC0gbmV3IHdpZHRoIG9mIGNhbnZhcyBpbiBDU1MgY29vcmRpbmF0ZXNcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCAtIG5ldyBoZWlnaHQgb2YgY2FudmFzIGluIENTUyBjb29yZGluYXRlc1xuICAgKi9cbiAgcmVzaXplQ2FudmFzKHdpZHRoLCBoZWlnaHQpIHtcbiAgICBpZiAodGhpcy5jYW52YXMpIHtcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgdGhpcy5jYW52YXMuc3R5bGUuaGVpZ2h0ID0gYCR7aGVpZ2h0fXB4YDtcbiAgICAgIHRoaXMuYXV0b1Jlc2l6ZUNhbnZhcyA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNpemUgY2FudmFzIGRyYXdpbmcgYnVmZmVyXG4gICAqIE5PVEU6IFRoZSBkcmF3aW5nIGJ1ZmZlciB3aWxsIGJlIHNjYWxlZCB0byB0aGUgdmlld3BvcnRcbiAgICogZm9yIGJlc3QgdmlzdWFsIHJlc3VsdHMsIHVzdWFsbHkgc2V0IHRvIGVpdGhlcjpcbiAgICogIGNhbnZhcyBDU1Mgd2lkdGggeCBDU1MgaGVpZ2h0XG4gICAqICBjYW52YXMgQ1NTIHdpZHRoICogZGV2aWNlUGl4ZWxSYXRpbyB4IENTUyBoZWlnaHQgKiBkZXZpY2VQaXhlbFJhdGlvXG4gICAqIFRPRE8gLSBhZGQgc2VwYXJhdGUgY2FsbCBmb3IgaGVhZGxlc3MgY29udGV4dHNcbiAgICovXG4gIHJlc2l6ZURyYXdpbmdCdWZmZXIod2lkdGgsIGhlaWdodCkge1xuICAgIGlmICh0aGlzLmNhbnZhcykge1xuICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgIHRoaXMuYXV0b1Jlc2l6ZURyYXdpbmdCdWZmZXIgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogRHJhd3MgbmV4dCBmcmFtZSByZW5kZXIgbG9vcCB3aXRoIHRoZSBnaXZlbiBmcmFtZSBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXMgLSBpZiBwcm92aWRlZCwgd2l0aCBhbmQgaGVpZ2h0IHdpbGwgYmVcbiAgICogICBwYXNzZWQgdG8gY29udGV4dFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZW5kZXJGcmFtZSAtIGFwcGxpY2F0aW9uIGZyYW1lIHJlbmRlcmVyIGZ1bmN0aW9uXG4gICAqICBleHBlY3RlZCB0byB0YWtlIGEgY29udGV4dCBwYXJhbWV0ZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBjb250YWlucyBmcmFtZSBzcGVjaWZpYyBpbmZvXG4gICAqICAoRS5nLiB0aWNrLCB3aWR0aCwgaGVpZ2h0LCBldGMpXG4gICAqL1xuICBAYXV0b2JpbmQgX25leHRGcmFtZSgpIHtcbiAgICB0aGlzLl9yZXNpemVDYW52YXNEcmF3aW5nQnVmZmVyKHRoaXMuY2FudmFzKTtcbiAgICAvLyBDb250ZXh0IHdpZHRoIGFuZCBoZWlnaHQgcmVwcmVzZW50IGRyYXdpbmcgYnVmZmVyIHdpZHRoIGFuZCBoZWlnaHRcbiAgICB0aGlzLl9jb250ZXh0LndpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XG4gICAgdGhpcy5fY29udGV4dC5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG4gICAgLy8gSW5jcmVtZW50IHRpY2tcbiAgICB0aGlzLl9jb250ZXh0LnRpY2srKztcblxuICAgIC8vIERlZmF1bHQgdmlld3BvcnQgc2V0dXBcbiAgICBpZiAodGhpcy5hdXRvUmVzaXplVmlld3BvcnQpIHtcbiAgICAgIHRoaXMuZ2wudmlld3BvcnQoMCwgMCwgdGhpcy5fY29udGV4dC53aWR0aCwgdGhpcy5fY29udGV4dC5oZWlnaHQpO1xuICAgIH1cblxuICAgIHRoaXMuX29uUmVuZGVyKHRoaXMuX2NvbnRleHQpO1xuXG4gICAgdGhpcy5fYW5pbWF0aW9uRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl9uZXh0RnJhbWUpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgY2FudmFzIHNldCB0byAxMDAlXG4gIF9jcmVhdGVDYW52YXMoKSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLmlkID0gJ2x1bWFnbC1jYW52YXMnO1xuICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgIC8vIGFkZHMgdGhlIGNhbnZhcyB0byB0aGUgYm9keSBlbGVtZW50XG4gICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgYm9keS5pbnNlcnRCZWZvcmUoY2FudmFzLCBib2R5LmZpcnN0Q2hpbGQpO1xuICAgIHJldHVybiBjYW52YXM7XG4gIH1cblxuICAvLyBSZXNpemUgdGhlIHJlbmRlciBidWZmZXIgb2YgdGhlIGNhbnZhcyB0byBtYXRjaCBjYW52YXMgY2xpZW50IHNpemVcbiAgLy8gbXVsdGlwbHlpbmcgd2l0aCBkcHIgKE9wdGlvbmFsbHkgY2FuIGJlIHR1cm5lZCBvZmYpXG4gIF9yZXNpemVDYW52YXNEcmF3aW5nQnVmZmVyKCkge1xuICAgIGlmICh0aGlzLmF1dG9SZXNpemVEcmF3aW5nQnVmZmVyKSB7XG4gICAgICBjb25zdCBkcHIgPSB0aGlzLnVzZURldmljZVBpeGVsUmF0aW8gP1xuICAgICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxIDogMTtcbiAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5jYW52YXMuY2xpZW50V2lkdGggKiBkcHI7XG4gICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmNhbnZhcy5jbGllbnRIZWlnaHQgKiBkcHI7XG4gICAgfVxuICB9XG59Il19