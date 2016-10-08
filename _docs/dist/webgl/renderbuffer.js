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
      var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return object instanceof Renderbuffer ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Renderbuffer(gl, { handle: object.handle || object });
    }
  }]);

  function Renderbuffer(gl) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

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
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9yZW5kZXJidWZmZXIuanMiXSwibmFtZXMiOlsiUmVuZGVyYnVmZmVyIiwiZ2wiLCJvYmplY3QiLCJoYW5kbGUiLCJvcHRzIiwiY3JlYXRlUmVuZGVyYnVmZmVyIiwiRXJyb3IiLCJkZWxldGVSZW5kZXJidWZmZXIiLCJiaW5kUmVuZGVyYnVmZmVyIiwiUkVOREVSQlVGRkVSIiwiaW50ZXJuYWxGb3JtYXQiLCJ3aWR0aCIsImhlaWdodCIsImJpbmQiLCJyZW5kZXJidWZmZXJTdG9yYWdlIiwidW5iaW5kIiwicG5hbWUiLCJ2YWx1ZSIsImdldFJlbmRlcmJ1ZmZlclBhcmFtZXRlciIsInNhbXBsZXMiLCJpbnRlcm5hbGZvcm1hdCIsInJlbmRlcmJ1ZmZlclN0b3JhZ2VNdWx0aXNhbXBsZSIsImdldEludGVybmFsZm9ybWF0UGFyYW1ldGVyIiwiZ2V0UGFyYW1ldGVyIiwiUkVOREVSQlVGRkVSX1dJRFRIIiwiUkVOREVSQlVGRkVSX0hFSUdIVCIsIlJFTkRFUkJVRkZFUl9JTlRFUk5BTF9GT1JNQVQiLCJSRU5ERVJCVUZGRVJfR1JFRU5fU0laRSIsIlJFTkRFUkJVRkZFUl9CTFVFX1NJWkUiLCJSRU5ERVJCVUZGRVJfUkVEX1NJWkUiLCJSRU5ERVJCVUZGRVJfQUxQSEFfU0laRSIsIlJFTkRFUkJVRkZFUl9ERVBUSF9TSVpFIiwiUkVOREVSQlVGRkVSX1NURU5DSUxfU0laRSIsIlJFTkRFUkJVRkZFUl9TQU1QTEVTIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFFQTs7Ozs7Ozs7SUFFcUJBLFk7Ozs2QkFFSEMsRSxFQUFpQjtBQUFBLFVBQWJDLE1BQWEsdUVBQUosRUFBSTs7QUFDL0IsYUFBT0Esa0JBQWtCRixZQUFsQixHQUFpQ0UsTUFBakM7QUFDTDtBQUNBLFVBQUlGLFlBQUosQ0FBaUJDLEVBQWpCLEVBQXFCLEVBQUNFLFFBQVFELE9BQU9DLE1BQVAsSUFBaUJELE1BQTFCLEVBQXJCLENBRkY7QUFHRDs7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LG1CQUExQixDQUFQO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7d0JBQ3FCO0FBQ25CLGFBQU8sS0FBS0YsWUFBTCxDQUFrQixLQUFLdEIsRUFBTCxDQUFReUIsNEJBQTFCLENBQVA7QUFDRDs7QUFFRDs7Ozt3QkFDZ0I7QUFDZCxhQUFPLEtBQUtILFlBQUwsQ0FBa0IsS0FBS3RCLEVBQUwsQ0FBUTBCLHVCQUExQixDQUFQO0FBQ0Q7O0FBRUQ7Ozs7d0JBQ2U7QUFDYixhQUFPLEtBQUtKLFlBQUwsQ0FBa0IsS0FBS3RCLEVBQUwsQ0FBUTJCLHNCQUExQixDQUFQO0FBQ0Q7O0FBRUQ7Ozs7d0JBQ2M7QUFDWixhQUFPLEtBQUtMLFlBQUwsQ0FBa0IsS0FBS3RCLEVBQUwsQ0FBUTRCLHFCQUExQixDQUFQO0FBQ0Q7O0FBRUQ7Ozs7d0JBQ2dCO0FBQ2QsYUFBTyxLQUFLTixZQUFMLENBQWtCLEtBQUt0QixFQUFMLENBQVE2Qix1QkFBMUIsQ0FBUDtBQUNEOztBQUVEOzs7O3dCQUNnQjtBQUNkLGFBQU8sS0FBS1AsWUFBTCxDQUFrQixLQUFLdEIsRUFBTCxDQUFROEIsdUJBQTFCLENBQVA7QUFDRDs7QUFFRDs7Ozt3QkFDa0I7QUFDaEIsYUFBTyxLQUFLUixZQUFMLENBQWtCLEtBQUt0QixFQUFMLENBQVErQix5QkFBMUIsQ0FBUDtBQUNEOztBQUVEOzs7O3dCQUNjO0FBQ1osYUFBTyxLQUFLVCxZQUFMLENBQWtCLEtBQUt0QixFQUFMLENBQVFnQyxvQkFBMUIsQ0FBUDtBQUNEOzs7Ozs7a0JBekhrQmpDLFkiLCJmaWxlIjoicmVuZGVyYnVmZmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCB7Z2xHZXQsIGFzc2VydFdlYkdMMn0gZnJvbSAnLi9jb250ZXh0JztcblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJidWZmZXIge1xuXG4gIHN0YXRpYyBtYWtlRnJvbShnbCwgb2JqZWN0ID0ge30pIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUmVuZGVyYnVmZmVyID8gb2JqZWN0IDpcbiAgICAgIC8vIFVzZSAuaGFuZGxlIChlLmcgZnJvbSBzdGFjay5nbCdzIGdsLWJ1ZmZlciksIGVsc2UgdXNlIGJ1ZmZlciBkaXJlY3RseVxuICAgICAgbmV3IFJlbmRlcmJ1ZmZlcihnbCwge2hhbmRsZTogb2JqZWN0LmhhbmRsZSB8fCBvYmplY3R9KTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzID0ge30pIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gICAgaWYgKCF0aGlzLmhhbmRsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIFdlYkdMIFJlbmRlcmJ1ZmZlcicpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgaW5pdGlhbGl6ZXMgYSByZW5kZXJidWZmZXIgb2JqZWN0J3MgZGF0YSBzdG9yZVxuICAgKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gb3B0LmludGVybmFsRm9ybWF0IC1cbiAgICogQHBhcmFtIHtHTGludH0gb3B0LndpZHRoIC1cbiAgICogQHBhcmFtIHtHTGludH0gb3B0LmhlaWdodFxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdC5hdXRvYmluZD10cnVlIC0gbWV0aG9kIGNhbGwgd2lsbCBiaW5kL3VuYmluZCBvYmplY3RcbiAgICogQHJldHVybnMge1JlbmRlcmJ1ZmZlcn0gcmV0dXJucyBpdHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBzdG9yYWdlKHtpbnRlcm5hbEZvcm1hdCwgd2lkdGgsIGhlaWdodH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnQoaW50ZXJuYWxGb3JtYXQsICdOZWVkcyBpbnRlcm5hbEZvcm1hdCcpO1xuICAgIHRoaXMuYmluZCgpO1xuICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoXG4gICAgICBnbC5SRU5ERVJCVUZGRVIsIGdsR2V0KGdsLCBpbnRlcm5hbEZvcm1hdCksIHdpZHRoLCBoZWlnaHRcbiAgICApO1xuICAgIHRoaXMudW5iaW5kKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBAcGFyYW0ge0Jvb2xlYW59IG9wdC5hdXRvYmluZD10cnVlIC0gbWV0aG9kIGNhbGwgd2lsbCBiaW5kL3VuYmluZCBvYmplY3RcbiAgLy8gQHJldHVybnMge0dMZW51bXxHTGludH0gLSBkZXBlbmRzIG9uIHBuYW1lXG4gIGdldFBhcmFtZXRlcihwbmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIHRoaXMuYmluZCgpO1xuICAgIGNvbnN0IHZhbHVlID1cbiAgICAgIGdsLmdldFJlbmRlcmJ1ZmZlclBhcmFtZXRlcihnbC5SRU5ERVJCVUZGRVIsIGdsR2V0KGdsLCBwbmFtZSkpO1xuICAgIHRoaXMudW5iaW5kKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fSAtIHdpZHRoIG9mIHRoZSBpbWFnZSBvZiB0aGUgY3VycmVudGx5IGJvdW5kIHJlbmRlcmJ1ZmZlci5cbiAgZ2V0IHdpZHRoKCkge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcih0aGlzLmdsLlJFTkRFUkJVRkZFUl9XSURUSCk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9IC0gaGVpZ2h0IG9mIHRoZSBpbWFnZSBvZiB0aGUgY3VycmVudGx5IGJvdW5kIHJlbmRlcmJ1ZmZlci5cbiAgZ2V0IGhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJhbWV0ZXIodGhpcy5nbC5SRU5ERVJCVUZGRVJfSEVJR0hUKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGVudW19IGludGVybmFsIGZvcm1hdCBvZiB0aGUgY3VycmVudGx5IGJvdW5kIHJlbmRlcmJ1ZmZlci5cbiAgLy8gVGhlIGRlZmF1bHQgaXMgZ2wuUkdCQTQuIFBvc3NpYmxlIHJldHVybiB2YWx1ZXM6XG4gIC8vIGdsLlJHQkE0OiA0IHJlZCBiaXRzLCA0IGdyZWVuIGJpdHMsIDQgYmx1ZSBiaXRzIDQgYWxwaGEgYml0cy5cbiAgLy8gZ2wuUkdCNTY1OiA1IHJlZCBiaXRzLCA2IGdyZWVuIGJpdHMsIDUgYmx1ZSBiaXRzLlxuICAvLyBnbC5SR0I1X0ExOiA1IHJlZCBiaXRzLCA1IGdyZWVuIGJpdHMsIDUgYmx1ZSBiaXRzLCAxIGFscGhhIGJpdC5cbiAgLy8gZ2wuREVQVEhfQ09NUE9ORU5UMTY6IDE2IGRlcHRoIGJpdHMuXG4gIC8vIGdsLlNURU5DSUxfSU5ERVg4OiA4IHN0ZW5jaWwgYml0cy5cbiAgZ2V0IGludGVybmFsRm9ybWF0KCkge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcih0aGlzLmdsLlJFTkRFUkJVRkZFUl9JTlRFUk5BTF9GT1JNQVQpO1xuICB9XG5cbiAgLy8gIEByZXR1cm5zIHtHTGludH0gLSByZXNvbHV0aW9uIHNpemUgKGluIGJpdHMpIGZvciB0aGUgZ3JlZW4gY29sb3IuXG4gIGdldCBncmVlblNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX0dSRUVOX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fSAtIHJlc29sdXRpb24gc2l6ZSAoaW4gYml0cykgZm9yIHRoZSBibHVlIGNvbG9yLlxuICBnZXQgYmx1ZVNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX0JMVUVfU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9IC0gcmVzb2x1dGlvbiBzaXplIChpbiBiaXRzKSBmb3IgdGhlIHJlZCBjb2xvci5cbiAgZ2V0IHJlZFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVyKHRoaXMuZ2wuUkVOREVSQlVGRkVSX1JFRF9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH0gLSByZXNvbHV0aW9uIHNpemUgKGluIGJpdHMpIGZvciB0aGUgYWxwaGEgY29tcG9uZW50LlxuICBnZXQgYWxwaGFTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcih0aGlzLmdsLlJFTkRFUkJVRkZFUl9BTFBIQV9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH0gLSByZXNvbHV0aW9uIHNpemUgKGluIGJpdHMpIGZvciB0aGUgZGVwdGggY29tcG9uZW50LlxuICBnZXQgZGVwdGhTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcih0aGlzLmdsLlJFTkRFUkJVRkZFUl9ERVBUSF9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH0gLSByZXNvbHV0aW9uIHNpemUgKGluIGJpdHMpIGZvciB0aGUgc3RlbmNpbCBjb21wb25lbnQuXG4gIGdldCBzdGVuY2lsU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJhbWV0ZXIodGhpcy5nbC5SRU5ERVJCVUZGRVJfU1RFTkNJTF9TSVpFKTtcbiAgfVxuXG4gIC8vIFdoZW4gdXNpbmcgYSBXZWJHTCAyIGNvbnRleHQsIHRoZSBmb2xsb3dpbmcgdmFsdWUgaXMgYXZhaWxhYmxlXG4gIGdldCBzYW1wbGVzKCkge1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcih0aGlzLmdsLlJFTkRFUkJVRkZFUl9TQU1QTEVTKTtcbiAgfVxuXG4gIC8vIFdFQkdMMiBNRVRIT0RTXG5cbiAgLy8gKE9wZW5HTCBFUyAzLjAuNCDCpzQuNC4yKVxuICBzdG9yYWdlTXVsdGlzYW1wbGUoe1xuICAgIHNhbXBsZXMsXG4gICAgaW50ZXJuYWxmb3JtYXQsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0XG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZU11bHRpc2FtcGxlKFxuICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzYW1wbGVzLCBpbnRlcm5hbGZvcm1hdCwgd2lkdGgsIGhlaWdodFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyAoT3BlbkdMIEVTIDMuMC40IMKnNi4xLjE1KVxuICBnZXRJbnRlcm5hbGZvcm1hdFBhcmFtZXRlcih7aW50ZXJuYWxmb3JtYXQsIHBuYW1lID0gJ1NBTVBMRVMnfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgcmV0dXJuIGdsLmdldEludGVybmFsZm9ybWF0UGFyYW1ldGVyKFxuICAgICAgZ2wuUkVOREVSQlVGRkVSLCBpbnRlcm5hbGZvcm1hdCwgcG5hbWVcbiAgICApO1xuICB9XG59XG4iXX0=