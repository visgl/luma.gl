'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Renderer = exports.cancelAnimationFrame = exports.requestAnimationFrame = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class; /* global window, document, setTimeout, clearTimeout, HTMLCanvasElement */


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
    return resolve(document.body);
  };
});

var Renderer = exports.Renderer = (_class = function () {

  /*
   * @param {HTMLCanvasElement} canvas - if provided, with and height will be
   *   passed to context
   */
  function Renderer() {
    var _this = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
     * @param {Function} onRenderFrame - application frame renderer function
     *  expected to take a context parameter
     * @param {Object} context - contains frame specific info
     *  (E.g. tick, width, height, etc)
     * @return {Renderer} - returns self for chaining
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
        var appContext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
     * @return {Renderer} - returns self for chaining
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
     * @param {Number} width - new width of canvas in CSS coordinates
     * @param {Number} height - new height of canvas in CSS coordinates
     * @return {Renderer} - returns self for chaining
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvZnJhbWUuanMiXSwibmFtZXMiOlsiZnJhbWUiLCJlbmRGcmFtZSIsIklOSVRJQUxfQ09OVEVYVCIsInRpY2siLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ3aW5kb3ciLCJub2RlUmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJub2RlQ2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJhbmltYXRpb25GcmFtZUlkIiwiY2FudmFzIiwicmVuZGVyRnJhbWUiLCJuZXh0RnJhbWUiLCJjb250ZXh0IiwicmVzaXplQ2FudmFzUmVuZGVyQnVmZmVyIiwid2lkdGgiLCJoZWlnaHQiLCJiaW5kIiwiZHByIiwiZGV2aWNlUGl4ZWxSYXRpbyIsImNsaWVudFdpZHRoIiwiY2xpZW50SGVpZ2h0IiwiY2FsbGJhY2siLCJzZXRUaW1lb3V0IiwicmVxdWVzdElkIiwiY2xlYXJUaW1lb3V0IiwiYm9keUxvYWRQcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJvbmxvYWQiLCJkb2N1bWVudCIsImJvZHkiLCJSZW5kZXJlciIsImdsIiwiYXV0b1Jlc2l6ZUNhbnZhcyIsImF1dG9SZXNpemVWaWV3cG9ydCIsImF1dG9SZXNpemVEcmF3aW5nQnVmZmVyIiwidXNlRGV2aWNlUGl4ZWxSYXRpbyIsImdsT3B0cyIsInVwZGF0ZSIsIl9zdGFydFByb21pc2UiLCJ0aGVuIiwiZ2V0RWxlbWVudEJ5SWQiLCJfY3JlYXRlQ2FudmFzIiwiSFRNTENhbnZhc0VsZW1lbnQiLCJOdW1iZXIiLCJpc0Zpbml0ZSIsInJlc2l6ZSIsIm9uSW5pdCIsIl9jb250ZXh0IiwicmVuZGVyZXIiLCJzdG9wIiwib25SZW5kZXJGcmFtZSIsIl9vblJlbmRlciIsImFwcENvbnRleHQiLCJfbmV4dEZyYW1lIiwiX2FuaW1hdGlvbkZyYW1lSWQiLCJzdHlsZSIsIl9yZXNpemVDYW52YXNEcmF3aW5nQnVmZmVyIiwidmlld3BvcnQiLCJj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QUFNOUMsU0FBU3FCLFNBQVM4QixhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQW5ELGFBQU9vRCxFQUFQLEdBQVksZUFBWjtBQUNBcEQsYUFBT2dELEtBQVAsQ0FBYTNDLEtBQWIsR0FBcUIsTUFBckI7QUFDQUwsYUFBT2dELEtBQVAsQ0FBYTFDLE1BQWIsR0FBc0IsTUFBdEI7QUFDQTtBQUNBLFVBQU1nQixPQUFPRCxTQUFTQyxJQUF0QjtBQUNBQSxXQUFLK0IsWUFBTCxDQUFrQnJELE1BQWxCLEVBQTBCc0IsS0FBS2dDLFVBQS9CO0FBQ0EsYUFBT3RELE1BQVA7QUFDRDs7QUFFRDtBQUNBOzs7O2lEQUM2QjtBQUMzQixVQUFJLEtBQUsyQix1QkFBVCxFQUFrQztBQUNoQyxZQUFNbkIsTUFBTSxLQUFLb0IsbUJBQUwsR0FDVmpDLE9BQU9jLGdCQUFQLElBQTJCLENBRGpCLEdBQ3FCLENBRGpDO0FBRUEsYUFBS1QsTUFBTCxDQUFZSyxLQUFaLEdBQW9CLEtBQUtMLE1BQUwsQ0FBWVUsV0FBWixHQUEwQkYsR0FBOUM7QUFDQSxhQUFLUixNQUFMLENBQVlNLE1BQVosR0FBcUIsS0FBS04sTUFBTCxDQUFZVyxZQUFaLEdBQTJCSCxHQUFoRDtBQUNEO0FBQ0YiLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgc2V0VGltZW91dCwgY2xlYXJUaW1lb3V0LCBIVE1MQ2FudmFzRWxlbWVudCAqL1xuaW1wb3J0IGF1dG9iaW5kIGZyb20gJ2F1dG9iaW5kLWRlY29yYXRvcic7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge2lzQnJvd3Nlcn0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHtjcmVhdGVHTENvbnRleHR9IGZyb20gJy4uL3dlYmdsJztcblxuY29uc3QgSU5JVElBTF9DT05URVhUID0ge1xuICB0aWNrOiAtMVxufTtcblxuZXhwb3J0IGNvbnN0IHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGlzQnJvd3NlciA/XG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgOlxuICBub2RlUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXG5leHBvcnQgY29uc3QgY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBpc0Jyb3dzZXIgP1xuICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgOlxuICBub2RlQ2FuY2VsQW5pbWF0aW9uRnJhbWU7XG5cbmxldCBhbmltYXRpb25GcmFtZUlkID0gbnVsbDtcblxuLyoqXG4gKiBTdGFydHMgYSBnbG9iYWwgcmVuZGVyIGxvb3Agd2l0aCB0aGUgZ2l2ZW4gZnJhbWUgZnVuY3Rpb25cbiAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhcyAtIGlmIHByb3ZpZGVkLCB3aXRoIGFuZCBoZWlnaHQgd2lsbCBiZVxuICogICBwYXNzZWQgdG8gY29udGV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVuZGVyRnJhbWUgLSBhcHBsaWNhdGlvbiBmcmFtZSByZW5kZXJlciBmdW5jdGlvblxuICogIGV4cGVjdGVkIHRvIHRha2UgYSBjb250ZXh0IHBhcmFtZXRlclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHQgLSBjb250YWlucyBmcmFtZSBzcGVjaWZpYyBpbmZvXG4gKiAgKEUuZy4gdGljaywgd2lkdGgsIGhlaWdodCwgZXRjKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJhbWUoY2FudmFzLCByZW5kZXJGcmFtZSkge1xuICBuZXh0RnJhbWUoY2FudmFzLCByZW5kZXJGcmFtZSwgSU5JVElBTF9DT05URVhUKTtcbn1cblxuLyoqXG4gKiBTdG9wcyBhIHJlbmRlciBsb29wIHdpdGggdGhlIGdpdmVuIGZyYW1lIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmRGcmFtZSgpIHtcbiAgaWYgKGFuaW1hdGlvbkZyYW1lSWQpIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZShhbmltYXRpb25GcmFtZUlkKTtcbiAgICBhbmltYXRpb25GcmFtZUlkID0gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBEcmF3cyBuZXh0IGZyYW1lIHJlbmRlciBsb29wIHdpdGggdGhlIGdpdmVuIGZyYW1lIGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXMgLSBpZiBwcm92aWRlZCwgd2l0aCBhbmQgaGVpZ2h0IHdpbGwgYmVcbiAqICAgcGFzc2VkIHRvIGNvbnRleHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IHJlbmRlckZyYW1lIC0gYXBwbGljYXRpb24gZnJhbWUgcmVuZGVyZXIgZnVuY3Rpb25cbiAqICBleHBlY3RlZCB0byB0YWtlIGEgY29udGV4dCBwYXJhbWV0ZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gY29udGFpbnMgZnJhbWUgc3BlY2lmaWMgaW5mb1xuICogIChFLmcuIHRpY2ssIHdpZHRoLCBoZWlnaHQsIGV0YylcbiAqL1xuZnVuY3Rpb24gbmV4dEZyYW1lKGNhbnZhcywgcmVuZGVyRnJhbWUsIGNvbnRleHQpIHtcbiAgY29udGV4dC50aWNrKys7XG4gIHJlc2l6ZUNhbnZhc1JlbmRlckJ1ZmZlcihjYW52YXMpO1xuICBjb250ZXh0LndpZHRoID0gY2FudmFzLndpZHRoO1xuICBjb250ZXh0LmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgcmVuZGVyRnJhbWUoY29udGV4dCk7XG5cbiAgYW5pbWF0aW9uRnJhbWVJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShcbiAgICBuZXh0RnJhbWUuYmluZChudWxsLCBjYW52YXMsIHJlbmRlckZyYW1lLCBjb250ZXh0KVxuICApO1xufVxuXG4vLyBSZXNpemUgcmVuZGVyIGJ1ZmZlciB0byBtYXRjaCBjYW52YXMgY2xpZW50IHNpemVcbmZ1bmN0aW9uIHJlc2l6ZUNhbnZhc1JlbmRlckJ1ZmZlcihjYW52YXMpIHtcbiAgY29uc3QgZHByID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgY2FudmFzLndpZHRoID0gY2FudmFzLmNsaWVudFdpZHRoICogZHByO1xuICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLmNsaWVudEhlaWdodCAqIGRwcjtcbn1cblxuLy8gUG9seWZpbGwgZm9yIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuZnVuY3Rpb24gbm9kZVJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuICByZXR1cm4gc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcbn1cblxuLy8gUG9seWZpbGwgZm9yIGNhbmNlbEFuaW1hdGlvbkZyYW1lXG5mdW5jdGlvbiBub2RlQ2FuY2VsQW5pbWF0aW9uRnJhbWUocmVxdWVzdElkKSB7XG4gIHJldHVybiBjbGVhclRpbWVvdXQocmVxdWVzdElkKTtcbn1cblxuY29uc3QgYm9keUxvYWRQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICB3aW5kb3cub25sb2FkID0gKCkgPT4gcmVzb2x2ZShkb2N1bWVudC5ib2R5KTtcbn0pO1xuXG5leHBvcnQgY2xhc3MgUmVuZGVyZXIge1xuXG4gIC8qXG4gICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhcyAtIGlmIHByb3ZpZGVkLCB3aXRoIGFuZCBoZWlnaHQgd2lsbCBiZVxuICAgKiAgIHBhc3NlZCB0byBjb250ZXh0XG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgZ2wgPSBudWxsLFxuICAgIGNhbnZhcyA9IG51bGwsXG4gICAgd2lkdGggPSBudWxsLFxuICAgIGhlaWdodCA9IG51bGwsXG4gICAgYXV0b1Jlc2l6ZUNhbnZhcyA9IHRydWUsXG4gICAgYXV0b1Jlc2l6ZVZpZXdwb3J0ID0gdHJ1ZSxcbiAgICBhdXRvUmVzaXplRHJhd2luZ0J1ZmZlciA9IHRydWUsXG4gICAgdXNlRGV2aWNlUGl4ZWxSYXRpbyA9IHRydWUsXG4gICAgLi4uZ2xPcHRzXG4gIH0gPSB7fSkge1xuICAgIHRoaXMudXBkYXRlKHtcbiAgICAgIGF1dG9SZXNpemVEcmF3aW5nQnVmZmVyLFxuICAgICAgdXNlRGV2aWNlUGl4ZWxSYXRpb1xuICAgIH0pO1xuXG4gICAgdGhpcy5hdXRvUmVzaXplQ2FudmFzID0gYXV0b1Jlc2l6ZUNhbnZhcztcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICB0aGlzLl9zdGFydFByb21pc2UgPSBib2R5TG9hZFByb21pc2UudGhlbihib2R5ID0+IHtcbiAgICAgIC8vIERlZHVjZSBvciBjcmVhdGUgY2FudmFzXG4gICAgICBjYW52YXMgPSB0eXBlb2YgY2FudmFzID09PSAnc3RyaW5nJyA/XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcykgOiBjYW52YXM7XG4gICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcyB8fCB0aGlzLl9jcmVhdGVDYW52YXMoYXV0b1Jlc2l6ZUNhbnZhcyk7XG4gICAgICBhc3NlcnQodGhpcy5jYW52YXMgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCwgJ0lsbGVnYWwgcGFyYW1ldGVyIGNhbnZhcycpO1xuXG4gICAgICAvLyBDcmVhdGUgZ2wgY29udGV4dCBpZiBuZWVkZWRcbiAgICAgIHRoaXMuZ2wgPSBnbCB8fCBjcmVhdGVHTENvbnRleHQoe1xuICAgICAgICBjYW52YXM6IHRoaXMuY2FudmFzLFxuICAgICAgICAuLi5nbE9wdHNcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHdpZHRoKSAmJiBOdW1iZXIuaXNGaW5pdGUoaGVpZ2h0KSkge1xuICAgICAgICB0aGlzLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt9O1xuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlKHtcbiAgICBhdXRvUmVzaXplRHJhd2luZ0J1ZmZlciA9IHRydWUsXG4gICAgYXV0b1Jlc2l6ZVZpZXdwb3J0ID0gdHJ1ZSxcbiAgICB1c2VEZXZpY2VQaXhlbFJhdGlvID0gdHJ1ZVxuICB9KSB7XG4gICAgdGhpcy5hdXRvUmVzaXplRHJhd2luZ0J1ZmZlciA9IGF1dG9SZXNpemVEcmF3aW5nQnVmZmVyO1xuICAgIHRoaXMuYXV0b1Jlc2l6ZVZpZXdwb3J0ID0gYXV0b1Jlc2l6ZVZpZXdwb3J0O1xuICAgIHRoaXMudXNlRGV2aWNlUGl4ZWxSYXRpbyA9IHVzZURldmljZVBpeGVsUmF0aW87XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpbml0KG9uSW5pdCkge1xuICAgIHRoaXMuX3N0YXJ0UHJvbWlzZSA9IHRoaXMuX3N0YXJ0UHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2NvbnRleHQgPSB7XG4gICAgICAgIC4uLklOSVRJQUxfQ09OVEVYVCxcbiAgICAgICAgZ2w6IHRoaXMuZ2wsXG4gICAgICAgIGNhbnZhczogdGhpcy5jYW52YXMsXG4gICAgICAgIHJlbmRlcmVyOiB0aGlzLFxuICAgICAgICBzdG9wOiB0aGlzLnN0b3BcbiAgICAgIH07XG4gICAgICByZXR1cm4gb25Jbml0KHRoaXMuX2NvbnRleHQpIHx8IHt9O1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnRzIGEgZ2xvYmFsIHJlbmRlciBsb29wIHdpdGggdGhlIGdpdmVuIGZyYW1lIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVuZGVyRnJhbWUgLSBhcHBsaWNhdGlvbiBmcmFtZSByZW5kZXJlciBmdW5jdGlvblxuICAgKiAgZXhwZWN0ZWQgdG8gdGFrZSBhIGNvbnRleHQgcGFyYW1ldGVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gY29udGFpbnMgZnJhbWUgc3BlY2lmaWMgaW5mb1xuICAgKiAgKEUuZy4gdGljaywgd2lkdGgsIGhlaWdodCwgZXRjKVxuICAgKiBAcmV0dXJuIHtSZW5kZXJlcn0gLSByZXR1cm5zIHNlbGYgZm9yIGNoYWluaW5nXG4gICAqL1xuICBmcmFtZShvblJlbmRlckZyYW1lKSB7XG4gICAgdGhpcy5zdG9wKCk7XG5cbiAgICB0aGlzLl9vblJlbmRlciA9IG9uUmVuZGVyRnJhbWU7XG4gICAgdGhpcy5fY29udGV4dCA9IHtcbiAgICAgIC4uLklOSVRJQUxfQ09OVEVYVCxcbiAgICAgIGdsOiB0aGlzLmdsLFxuICAgICAgY2FudmFzOiB0aGlzLmNhbnZhcyxcbiAgICAgIHJlbmRlcmVyOiB0aGlzLFxuICAgICAgc3RvcDogdGhpcy5zdG9wXG4gICAgfTtcblxuICAgIC8vIFdhaXQgZm9yIHN0YXJ0IHByb21pc2UgYmVmb3JlIHJlbmRlcmluZyBmcmFtZVxuICAgIHRoaXMuX3N0YXJ0UHJvbWlzZS50aGVuKChhcHBDb250ZXh0ID0ge30pID0+IHtcbiAgICAgIGlmICh0eXBlb2YgYXBwQ29udGV4dCA9PT0gJ29iamVjdCcgJiYgYXBwQ29udGV4dCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0ID0gey4uLmFwcENvbnRleHQsIC4uLnRoaXMuX2NvbnRleHR9O1xuICAgICAgfVxuICAgICAgdGhpcy5fbmV4dEZyYW1lKCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgYSByZW5kZXIgbG9vcCB3aXRoIHRoZSBnaXZlbiBmcmFtZSBmdW5jdGlvblxuICAgKi9cbiAgQGF1dG9iaW5kIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX2FuaW1hdGlvbkZyYW1lSWQpIHtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX2FuaW1hdGlvbkZyYW1lSWQpO1xuICAgICAgdGhpcy5fYW5pbWF0aW9uRnJhbWVJZCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2l6ZSBjYW52YXMgaW4gXCJDU1MgY29vcmRpbmF0ZXNcIiAobWF5IGJlIGRpZmZlcmVudCBmcm9tIGRldmljZSBjb29yZHMpXG4gICAqIE5PVEU6IE5vIGVmZmVjdCBvbiBoZWFkbGVzcyBjb250ZXh0c1xuICAgKiBAcGFyYW0ge051bWJlcn0gd2lkdGggLSBuZXcgd2lkdGggb2YgY2FudmFzIGluIENTUyBjb29yZGluYXRlc1xuICAgKiBAcGFyYW0ge051bWJlcn0gaGVpZ2h0IC0gbmV3IGhlaWdodCBvZiBjYW52YXMgaW4gQ1NTIGNvb3JkaW5hdGVzXG4gICAqIEByZXR1cm4ge1JlbmRlcmVyfSAtIHJldHVybnMgc2VsZiBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHJlc2l6ZUNhbnZhcyh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY2FudmFzKSB7XG4gICAgICB0aGlzLmNhbnZhcy5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodH1weGA7XG4gICAgICB0aGlzLmF1dG9SZXNpemVDYW52YXMgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmVzaXplIGNhbnZhcyBkcmF3aW5nIGJ1ZmZlclxuICAgKiBOT1RFOiBUaGUgZHJhd2luZyBidWZmZXIgd2lsbCBiZSBzY2FsZWQgdG8gdGhlIHZpZXdwb3J0XG4gICAqIGZvciBiZXN0IHZpc3VhbCByZXN1bHRzLCB1c3VhbGx5IHNldCB0byBlaXRoZXI6XG4gICAqICBjYW52YXMgQ1NTIHdpZHRoIHggQ1NTIGhlaWdodFxuICAgKiAgY2FudmFzIENTUyB3aWR0aCAqIGRldmljZVBpeGVsUmF0aW8geCBDU1MgaGVpZ2h0ICogZGV2aWNlUGl4ZWxSYXRpb1xuICAgKiBUT0RPIC0gYWRkIHNlcGFyYXRlIGNhbGwgZm9yIGhlYWRsZXNzIGNvbnRleHRzXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB3aWR0aCAtIG5ldyB3aWR0aCBvZiBjYW52YXMgaW4gQ1NTIGNvb3JkaW5hdGVzXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgLSBuZXcgaGVpZ2h0IG9mIGNhbnZhcyBpbiBDU1MgY29vcmRpbmF0ZXNcbiAgICogQHJldHVybiB7UmVuZGVyZXJ9IC0gcmV0dXJucyBzZWxmIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgcmVzaXplRHJhd2luZ0J1ZmZlcih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY2FudmFzKSB7XG4gICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgdGhpcy5hdXRvUmVzaXplRHJhd2luZ0J1ZmZlciA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBEcmF3cyBuZXh0IGZyYW1lIHJlbmRlciBsb29wIHdpdGggdGhlIGdpdmVuIGZyYW1lIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhcyAtIGlmIHByb3ZpZGVkLCB3aXRoIGFuZCBoZWlnaHQgd2lsbCBiZVxuICAgKiAgIHBhc3NlZCB0byBjb250ZXh0XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHJlbmRlckZyYW1lIC0gYXBwbGljYXRpb24gZnJhbWUgcmVuZGVyZXIgZnVuY3Rpb25cbiAgICogIGV4cGVjdGVkIHRvIHRha2UgYSBjb250ZXh0IHBhcmFtZXRlclxuICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dCAtIGNvbnRhaW5zIGZyYW1lIHNwZWNpZmljIGluZm9cbiAgICogIChFLmcuIHRpY2ssIHdpZHRoLCBoZWlnaHQsIGV0YylcbiAgICovXG4gIEBhdXRvYmluZCBfbmV4dEZyYW1lKCkge1xuICAgIHRoaXMuX3Jlc2l6ZUNhbnZhc0RyYXdpbmdCdWZmZXIodGhpcy5jYW52YXMpO1xuICAgIC8vIENvbnRleHQgd2lkdGggYW5kIGhlaWdodCByZXByZXNlbnQgZHJhd2luZyBidWZmZXIgd2lkdGggYW5kIGhlaWdodFxuICAgIHRoaXMuX2NvbnRleHQud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICB0aGlzLl9jb250ZXh0LmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcbiAgICAvLyBJbmNyZW1lbnQgdGlja1xuICAgIHRoaXMuX2NvbnRleHQudGljaysrO1xuXG4gICAgLy8gRGVmYXVsdCB2aWV3cG9ydCBzZXR1cFxuICAgIGlmICh0aGlzLmF1dG9SZXNpemVWaWV3cG9ydCkge1xuICAgICAgdGhpcy5nbC52aWV3cG9ydCgwLCAwLCB0aGlzLl9jb250ZXh0LndpZHRoLCB0aGlzLl9jb250ZXh0LmhlaWdodCk7XG4gICAgfVxuXG4gICAgdGhpcy5fb25SZW5kZXIodGhpcy5fY29udGV4dCk7XG5cbiAgICB0aGlzLl9hbmltYXRpb25GcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX25leHRGcmFtZSk7XG4gIH1cblxuICAvLyBDcmVhdGUgYSBjYW52YXMgc2V0IHRvIDEwMCVcbiAgX2NyZWF0ZUNhbnZhcygpIHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMuaWQgPSAnbHVtYWdsLWNhbnZhcyc7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgLy8gYWRkcyB0aGUgY2FudmFzIHRvIHRoZSBib2R5IGVsZW1lbnRcbiAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICBib2R5Lmluc2VydEJlZm9yZShjYW52YXMsIGJvZHkuZmlyc3RDaGlsZCk7XG4gICAgcmV0dXJuIGNhbnZhcztcbiAgfVxuXG4gIC8vIFJlc2l6ZSB0aGUgcmVuZGVyIGJ1ZmZlciBvZiB0aGUgY2FudmFzIHRvIG1hdGNoIGNhbnZhcyBjbGllbnQgc2l6ZVxuICAvLyBtdWx0aXBseWluZyB3aXRoIGRwciAoT3B0aW9uYWxseSBjYW4gYmUgdHVybmVkIG9mZilcbiAgX3Jlc2l6ZUNhbnZhc0RyYXdpbmdCdWZmZXIoKSB7XG4gICAgaWYgKHRoaXMuYXV0b1Jlc2l6ZURyYXdpbmdCdWZmZXIpIHtcbiAgICAgIGNvbnN0IGRwciA9IHRoaXMudXNlRGV2aWNlUGl4ZWxSYXRpbyA/XG4gICAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEgOiAxO1xuICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aCAqIGRwcjtcbiAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuY2FudmFzLmNsaWVudEhlaWdodCAqIGRwcjtcbiAgICB9XG4gIH1cbn1cbiJdfQ==