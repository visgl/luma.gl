'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webglChecks = require('./webgl-checks');

var _context = require('./context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderbuffer = function () {
  _createClass(Renderbuffer, null, [{
    key: 'makeFrom',
    value: function makeFrom(gl) {
      var object = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return object instanceof Renderbuffer ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Renderbuffer(gl, { handle: object.handle || object });
    }
  }]);

  function Renderbuffer(gl) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Renderbuffer);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    this.gl = gl;
    this.handle = gl.createRenderbuffer();
    if (!this.handle) {
      throw new Error('Failed to create WebGL Renderbuffer');
    }
  }

  _createClass(Renderbuffer, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteRenderbuffer(this.handle);
      return this;
    }
  }, {
    key: 'bind',
    value: function bind() {
      var gl = this.gl;

      gl.bindRenderbuffer(gl.RENDERBUFFER, this.handle);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var gl = this.gl;

      gl.bindRenderbuffer(gl.RENDERBUFFER, this.handle);
      return this;
    }

    /**
     * Creates and initializes a renderbuffer object's data store
     *
     * @param {GLenum} opt.internalFormat -
     * @param {GLint} opt.width -
     * @param {GLint} opt.height
     * @param {Boolean} opt.autobind=true - method call will bind/unbind object
     * @returns {Renderbuffer} returns itself to enable chaining
     */

  }, {
    key: 'storage',
    value: function storage(_ref) {
      var internalFormat = _ref.internalFormat;
      var width = _ref.width;
      var height = _ref.height;
      var gl = this.gl;

      (0, _assert2.default)(internalFormat, 'Needs internalFormat');
      this.bind();
      gl.renderbufferStorage(gl.RENDERBUFFER, (0, _context.glGet)(gl, internalFormat), width, height);
      this.unbind();
      return this;
    }

    // @param {Boolean} opt.autobind=true - method call will bind/unbind object
    // @returns {GLenum|GLint} - depends on pname

  }, {
    key: 'getParameter',
    value: function getParameter(pname) {
      var gl = this.gl;

      this.bind();
      var value = gl.getRenderbufferParameter(gl.RENDERBUFFER, (0, _context.glGet)(gl, pname));
      this.unbind();
      return value;
    }

    // @returns {GLint} - width of the image of the currently bound renderbuffer.

  }, {
    key: 'storageMultisample',


    // WEBGL2 METHODS

    // (OpenGL ES 3.0.4 §4.4.2)
    value: function storageMultisample() {
      var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var samples = _ref2.samples;
      var internalformat = _ref2.internalformat;
      var width = _ref2.width;
      var height = _ref2.height;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, internalformat, width, height);
      return this;
    }

    // (OpenGL ES 3.0.4 §6.1.15)

  }, {
    key: 'getInternalformatParameter',
    value: function getInternalformatParameter(_ref3) {
      var internalformat = _ref3.internalformat;
      var _ref3$pname = _ref3.pname;
      var pname = _ref3$pname === undefined ? 'SAMPLES' : _ref3$pname;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      return gl.getInternalformatParameter(gl.RENDERBUFFER, internalformat, pname);
    }
  }, {
    key: 'width',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_WIDTH);
    }

    // @returns {GLint} - height of the image of the currently bound renderbuffer.

  }, {
    key: 'height',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_HEIGHT);
    }

    // @returns {GLenum} internal format of the currently bound renderbuffer.
    // The default is gl.RGBA4. Possible return values:
    // gl.RGBA4: 4 red bits, 4 green bits, 4 blue bits 4 alpha bits.
    // gl.RGB565: 5 red bits, 6 green bits, 5 blue bits.
    // gl.RGB5_A1: 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
    // gl.DEPTH_COMPONENT16: 16 depth bits.
    // gl.STENCIL_INDEX8: 8 stencil bits.

  }, {
    key: 'internalFormat',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_INTERNAL_FORMAT);
    }

    //  @returns {GLint} - resolution size (in bits) for the green color.

  }, {
    key: 'greenSize',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_GREEN_SIZE);
    }

    // @returns {GLint} - resolution size (in bits) for the blue color.

  }, {
    key: 'blueSize',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_BLUE_SIZE);
    }

    // @returns {GLint} - resolution size (in bits) for the red color.

  }, {
    key: 'redSize',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_RED_SIZE);
    }

    // @returns {GLint} - resolution size (in bits) for the alpha component.

  }, {
    key: 'alphaSize',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_ALPHA_SIZE);
    }

    // @returns {GLint} - resolution size (in bits) for the depth component.

  }, {
    key: 'depthSize',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_DEPTH_SIZE);
    }

    // @returns {GLint} - resolution size (in bits) for the stencil component.

  }, {
    key: 'stencilSize',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_STENCIL_SIZE);
    }

    // When using a WebGL 2 context, the following value is available

  }, {
    key: 'samples',
    get: function get() {
      return this.getParameter(this.gl.RENDERBUFFER_SAMPLES);
    }
  }]);

  return Renderbuffer;
}();

exports.default = Renderbuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9yZW5kZXJidWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBRUE7Ozs7Ozs7O0lBRXFCLFk7Ozs2QkFFSCxFLEVBQWlCO0FBQUEsVUFBYixNQUFhLHlEQUFKLEVBQUk7O0FBQy9CLGFBQU8sa0JBQWtCLFlBQWxCLEdBQWlDLE1BQWpDO0FBQ0w7QUFDQSxVQUFJLFlBQUosQ0FBaUIsRUFBakIsRUFBcUIsRUFBQyxRQUFRLE9BQU8sTUFBUCxJQUFpQixNQUExQixFQUFyQixDQUZGO0FBR0Q7OztBQUVELHdCQUFZLEVBQVosRUFBMkI7QUFBQSxRQUFYLElBQVcseURBQUosRUFBSTs7QUFBQTs7QUFDekIsa0RBQTRCLEVBQTVCOztBQUVBLFNBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxTQUFLLE1BQUwsR0FBYyxHQUFHLGtCQUFILEVBQWQ7QUFDQSxRQUFJLENBQUMsS0FBSyxNQUFWLEVBQWtCO0FBQ2hCLFlBQU0sSUFBSSxLQUFKLENBQVUscUNBQVYsQ0FBTjtBQUNEO0FBQ0Y7Ozs7OEJBRVE7QUFBQSxVQUNBLEVBREEsR0FDTSxJQUROLENBQ0EsRUFEQTs7QUFFUCxTQUFHLGtCQUFILENBQXNCLEtBQUssTUFBM0I7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzJCQUVNO0FBQUEsVUFDRSxFQURGLEdBQ1EsSUFEUixDQUNFLEVBREY7O0FBRUwsU0FBRyxnQkFBSCxDQUFvQixHQUFHLFlBQXZCLEVBQXFDLEtBQUssTUFBMUM7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzZCQUVRO0FBQUEsVUFDQSxFQURBLEdBQ00sSUFETixDQUNBLEVBREE7O0FBRVAsU0FBRyxnQkFBSCxDQUFvQixHQUFHLFlBQXZCLEVBQXFDLEtBQUssTUFBMUM7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7O2tDQVN5QztBQUFBLFVBQWhDLGNBQWdDLFFBQWhDLGNBQWdDO0FBQUEsVUFBaEIsS0FBZ0IsUUFBaEIsS0FBZ0I7QUFBQSxVQUFULE1BQVMsUUFBVCxNQUFTO0FBQUEsVUFDaEMsRUFEZ0MsR0FDMUIsSUFEMEIsQ0FDaEMsRUFEZ0M7O0FBRXZDLDRCQUFPLGNBQVAsRUFBdUIsc0JBQXZCO0FBQ0EsV0FBSyxJQUFMO0FBQ0EsU0FBRyxtQkFBSCxDQUNFLEdBQUcsWUFETCxFQUNtQixvQkFBTSxFQUFOLEVBQVUsY0FBVixDQURuQixFQUM4QyxLQUQ5QyxFQUNxRCxNQURyRDtBQUdBLFdBQUssTUFBTDtBQUNBLGFBQU8sSUFBUDtBQUNEOztBQUVEO0FBQ0E7Ozs7aUNBQ2EsSyxFQUFPO0FBQUEsVUFDWCxFQURXLEdBQ0wsSUFESyxDQUNYLEVBRFc7O0FBRWxCLFdBQUssSUFBTDtBQUNBLFVBQU0sUUFDSixHQUFHLHdCQUFILENBQTRCLEdBQUcsWUFBL0IsRUFBNkMsb0JBQU0sRUFBTixFQUFVLEtBQVYsQ0FBN0MsQ0FERjtBQUVBLFdBQUssTUFBTDtBQUNBLGFBQU8sS0FBUDtBQUNEOztBQUVEOzs7Ozs7QUF3REE7O0FBRUE7eUNBTVE7QUFBQSx3RUFBSixFQUFJOztBQUFBLFVBSk4sT0FJTSxTQUpOLE9BSU07QUFBQSxVQUhOLGNBR00sU0FITixjQUdNO0FBQUEsVUFGTixLQUVNLFNBRk4sS0FFTTtBQUFBLFVBRE4sTUFDTSxTQUROLE1BQ007QUFBQSxVQUNDLEVBREQsR0FDTyxJQURQLENBQ0MsRUFERDs7QUFFTixpQ0FBYSxFQUFiO0FBQ0EsU0FBRyw4QkFBSCxDQUNFLEdBQUcsWUFETCxFQUNtQixPQURuQixFQUM0QixjQUQ1QixFQUM0QyxLQUQ1QyxFQUNtRCxNQURuRDtBQUdBLGFBQU8sSUFBUDtBQUNEOztBQUVEOzs7O3NEQUNnRTtBQUFBLFVBQXBDLGNBQW9DLFNBQXBDLGNBQW9DO0FBQUEsOEJBQXBCLEtBQW9CO0FBQUEsVUFBcEIsS0FBb0IsK0JBQVosU0FBWTtBQUFBLFVBQ3ZELEVBRHVELEdBQ2pELElBRGlELENBQ3ZELEVBRHVEOztBQUU5RCxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxHQUFHLDBCQUFILENBQ0wsR0FBRyxZQURFLEVBQ1ksY0FEWixFQUM0QixLQUQ1QixDQUFQO0FBR0Q7Ozt3QkEvRVc7QUFDVixhQUFPLEtBQUssWUFBTCxDQUFrQixLQUFLLEVBQUwsQ0FBUSxrQkFBMUIsQ0FBUDtBQUNEOztBQUVEOzs7O3dCQUNhO0FBQ1gsYUFBTyxLQUFLLFlBQUwsQ0FBa0IsS0FBSyxFQUFMLENBQVEsbUJBQTFCLENBQVA7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozt3QkFDcUI7QUFDbkIsYUFBTyxLQUFLLFlBQUwsQ0FBa0IsS0FBSyxFQUFMLENBQVEsNEJBQTFCLENBQVA7QUFDRDs7QUFFRDs7Ozt3QkFDZ0I7QUFDZCxhQUFPLEtBQUssWUFBTCxDQUFrQixLQUFLLEVBQUwsQ0FBUSx1QkFBMUIsQ0FBUDtBQUNEOztBQUVEOzs7O3dCQUNlO0FBQ2IsYUFBTyxLQUFLLFlBQUwsQ0FBa0IsS0FBSyxFQUFMLENBQVEsc0JBQTFCLENBQVA7QUFDRDs7QUFFRDs7Ozt3QkFDYztBQUNaLGFBQU8sS0FBSyxZQUFMLENBQWtCLEtBQUssRUFBTCxDQUFRLHFCQUExQixDQUFQO0FBQ0Q7O0FBRUQ7Ozs7d0JBQ2dCO0FBQ2QsYUFBTyxLQUFLLFlBQUwsQ0FBa0IsS0FBSyxFQUFMLENBQVEsdUJBQTFCLENBQVA7QUFDRDs7QUFFRDs7Ozt3QkFDZ0I7QUFDZCxhQUFPLEtBQUssWUFBTCxDQUFrQixLQUFLLEVBQUwsQ0FBUSx1QkFBMUIsQ0FBUDtBQUNEOztBQUVEOzs7O3dCQUNrQjtBQUNoQixhQUFPLEtBQUssWUFBTCxDQUFrQixLQUFLLEVBQUwsQ0FBUSx5QkFBMUIsQ0FBUDtBQUNEOztBQUVEOzs7O3dCQUNjO0FBQ1osYUFBTyxLQUFLLFlBQUwsQ0FBa0IsS0FBSyxFQUFMLENBQVEsb0JBQTFCLENBQVA7QUFDRDs7Ozs7O2tCQXpIa0IsWSIsImZpbGUiOiJyZW5kZXJidWZmZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2Fzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IHtnbEdldCwgYXNzZXJ0V2ViR0wyfSBmcm9tICcuL2NvbnRleHQnO1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlcmJ1ZmZlciB7XG5cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBSZW5kZXJidWZmZXIgPyBvYmplY3QgOlxuICAgICAgLy8gVXNlIC5oYW5kbGUgKGUuZyBmcm9tIHN0YWNrLmdsJ3MgZ2wtYnVmZmVyKSwgZWxzZSB1c2UgYnVmZmVyIGRpcmVjdGx5XG4gICAgICBuZXcgUmVuZGVyYnVmZmVyKGdsLCB7aGFuZGxlOiBvYmplY3QuaGFuZGxlIHx8IG9iamVjdH0pO1xuICB9XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICBpZiAoIXRoaXMuaGFuZGxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0wgUmVuZGVyYnVmZmVyJyk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIHRoaXMuaGFuZGxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBpbml0aWFsaXplcyBhIHJlbmRlcmJ1ZmZlciBvYmplY3QncyBkYXRhIHN0b3JlXG4gICAqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBvcHQuaW50ZXJuYWxGb3JtYXQgLVxuICAgKiBAcGFyYW0ge0dMaW50fSBvcHQud2lkdGggLVxuICAgKiBAcGFyYW0ge0dMaW50fSBvcHQuaGVpZ2h0XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0LmF1dG9iaW5kPXRydWUgLSBtZXRob2QgY2FsbCB3aWxsIGJpbmQvdW5iaW5kIG9iamVjdFxuICAgKiBAcmV0dXJucyB7UmVuZGVyYnVmZmVyfSByZXR1cm5zIGl0c2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHN0b3JhZ2Uoe2ludGVybmFsRm9ybWF0LCB3aWR0aCwgaGVpZ2h0fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydChpbnRlcm5hbEZvcm1hdCwgJ05lZWRzIGludGVybmFsRm9ybWF0Jyk7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShcbiAgICAgIGdsLlJFTkRFUkJVRkZFUiwgZ2xHZXQoZ2wsIGludGVybmFsRm9ybWF0KSwgd2lkdGgsIGhlaWdodFxuICAgICk7XG4gICAgdGhpcy51bmJpbmQoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEBwYXJhbSB7Qm9vbGVhbn0gb3B0LmF1dG9iaW5kPXRydWUgLSBtZXRob2QgY2FsbCB3aWxsIGJpbmQvdW5iaW5kIG9iamVjdFxuICAvLyBAcmV0dXJucyB7R0xlbnVtfEdMaW50fSAtIGRlcGVuZHMgb24gcG5hbWVcbiAgZ2V0UGFyYW1ldGVyKHBuYW1lKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgY29uc3QgdmFsdWUgPVxuICAgICAgZ2wuZ2V0UmVuZGVyYnVmZmVyUGFyYW1ldGVyKGdsLlJFTkRFUkJVRkZFUiwgZ2xHZXQoZ2wsIHBuYW1lKSk7XG4gICAgdGhpcy51bmJpbmQoKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9IC0gd2lkdGggb2YgdGhlIGltYWdlIG9mIHRoZSBjdXJyZW50bHkgYm91bmQgcmVuZGVyYnVmZmVyLlxuICBnZXQgd2lkdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX1dJRFRIKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH0gLSBoZWlnaHQgb2YgdGhlIGltYWdlIG9mIHRoZSBjdXJyZW50bHkgYm91bmQgcmVuZGVyYnVmZmVyLlxuICBnZXQgaGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcih0aGlzLmdsLlJFTkRFUkJVRkZFUl9IRUlHSFQpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMZW51bX0gaW50ZXJuYWwgZm9ybWF0IG9mIHRoZSBjdXJyZW50bHkgYm91bmQgcmVuZGVyYnVmZmVyLlxuICAvLyBUaGUgZGVmYXVsdCBpcyBnbC5SR0JBNC4gUG9zc2libGUgcmV0dXJuIHZhbHVlczpcbiAgLy8gZ2wuUkdCQTQ6IDQgcmVkIGJpdHMsIDQgZ3JlZW4gYml0cywgNCBibHVlIGJpdHMgNCBhbHBoYSBiaXRzLlxuICAvLyBnbC5SR0I1NjU6IDUgcmVkIGJpdHMsIDYgZ3JlZW4gYml0cywgNSBibHVlIGJpdHMuXG4gIC8vIGdsLlJHQjVfQTE6IDUgcmVkIGJpdHMsIDUgZ3JlZW4gYml0cywgNSBibHVlIGJpdHMsIDEgYWxwaGEgYml0LlxuICAvLyBnbC5ERVBUSF9DT01QT05FTlQxNjogMTYgZGVwdGggYml0cy5cbiAgLy8gZ2wuU1RFTkNJTF9JTkRFWDg6IDggc3RlbmNpbCBiaXRzLlxuICBnZXQgaW50ZXJuYWxGb3JtYXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX0lOVEVSTkFMX0ZPUk1BVCk7XG4gIH1cblxuICAvLyAgQHJldHVybnMge0dMaW50fSAtIHJlc29sdXRpb24gc2l6ZSAoaW4gYml0cykgZm9yIHRoZSBncmVlbiBjb2xvci5cbiAgZ2V0IGdyZWVuU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJhbWV0ZXIodGhpcy5nbC5SRU5ERVJCVUZGRVJfR1JFRU5fU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9IC0gcmVzb2x1dGlvbiBzaXplIChpbiBiaXRzKSBmb3IgdGhlIGJsdWUgY29sb3IuXG4gIGdldCBibHVlU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJhbWV0ZXIodGhpcy5nbC5SRU5ERVJCVUZGRVJfQkxVRV9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH0gLSByZXNvbHV0aW9uIHNpemUgKGluIGJpdHMpIGZvciB0aGUgcmVkIGNvbG9yLlxuICBnZXQgcmVkU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJhbWV0ZXIodGhpcy5nbC5SRU5ERVJCVUZGRVJfUkVEX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fSAtIHJlc29sdXRpb24gc2l6ZSAoaW4gYml0cykgZm9yIHRoZSBhbHBoYSBjb21wb25lbnQuXG4gIGdldCBhbHBoYVNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX0FMUEhBX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fSAtIHJlc29sdXRpb24gc2l6ZSAoaW4gYml0cykgZm9yIHRoZSBkZXB0aCBjb21wb25lbnQuXG4gIGdldCBkZXB0aFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX0RFUFRIX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fSAtIHJlc29sdXRpb24gc2l6ZSAoaW4gYml0cykgZm9yIHRoZSBzdGVuY2lsIGNvbXBvbmVudC5cbiAgZ2V0IHN0ZW5jaWxTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcih0aGlzLmdsLlJFTkRFUkJVRkZFUl9TVEVOQ0lMX1NJWkUpO1xuICB9XG5cbiAgLy8gV2hlbiB1c2luZyBhIFdlYkdMIDIgY29udGV4dCwgdGhlIGZvbGxvd2luZyB2YWx1ZSBpcyBhdmFpbGFibGVcbiAgZ2V0IHNhbXBsZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX1NBTVBMRVMpO1xuICB9XG5cbiAgLy8gV0VCR0wyIE1FVEhPRFNcblxuICAvLyAoT3BlbkdMIEVTIDMuMC40IMKnNC40LjIpXG4gIHN0b3JhZ2VNdWx0aXNhbXBsZSh7XG4gICAgc2FtcGxlcyxcbiAgICBpbnRlcm5hbGZvcm1hdCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHRcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0V2ViR0wyKGdsKTtcbiAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlTXVsdGlzYW1wbGUoXG4gICAgICBnbC5SRU5ERVJCVUZGRVIsIHNhbXBsZXMsIGludGVybmFsZm9ybWF0LCB3aWR0aCwgaGVpZ2h0XG4gICAgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIChPcGVuR0wgRVMgMy4wLjQgwqc2LjEuMTUpXG4gIGdldEludGVybmFsZm9ybWF0UGFyYW1ldGVyKHtpbnRlcm5hbGZvcm1hdCwgcG5hbWUgPSAnU0FNUExFUyd9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0V2ViR0wyKGdsKTtcbiAgICByZXR1cm4gZ2wuZ2V0SW50ZXJuYWxmb3JtYXRQYXJhbWV0ZXIoXG4gICAgICBnbC5SRU5ERVJCVUZGRVIsIGludGVybmFsZm9ybWF0LCBwbmFtZVxuICAgICk7XG4gIH1cbn1cbiJdfQ==