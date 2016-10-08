'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Sampler Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _webglTypes = require('./webgl-types');

var _context = require('../context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ERR_WEBGL2 = 'WebGL2 required';

// WebGLSampler? createSampler();
// void deleteSampler(WebGLSampler? sampler);
// [WebGLHandlesContextLoss] GLboolean isSampler(WebGLSampler? sampler);
// void bindSampler(GLuint unit, WebGLSampler? sampler);
// void samplerParameteri(WebGLSampler? sampler, GLenum pname, GLint param);
// void samplerParameterf(WebGLSampler? sampler, GLenum pname, GLfloat param);
// any getSamplerParameter(WebGLSampler? sampler, GLenum pname);

var Sampler = function () {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  function Sampler(gl) {
    _classCallCheck(this, Sampler);

    (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
    this.gl = gl;
    this.handle = gl.createSampler();
    (0, _context.glCheckError)(gl);
    this.userData = {};
    Object.seal(this);
  }

  /**
   * @return {Sampler} returns self to enable chaining
   */


  _createClass(Sampler, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteSampler(this.handle);
      this.handle = null;
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {GLuint} unit
     * @return {Sampler} returns self to enable chaining
     */

  }, {
    key: 'bind',
    value: function bind(unit) {
      var gl = this.gl;

      gl.bindSampler(unit, this.handle);
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {GLuint} unit
     * @return {Sampler} returns self to enable chaining
     */

  }, {
    key: 'unbind',
    value: function unbind(unit) {
      var gl = this.gl;

      gl.bindSampler(unit, null);
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * Batch update sampler settings
     *
     * @param {GLenum} compare_func - texture comparison function.
     * @param {GLenum} compare_mode - texture comparison mode.
     * @param {GLenum} mag_filter - texture magnification filter.
     * @param {GLenum} MIN_FILTER - texture minification filter
     * @param {GLfloat} MAX_LOD: maximum level-of-detail value.
     * @param {GLfloat} MIN_LOD: minimum level-of-detail value.
     * @param {GLenum} WRAP_R: texture wrapping function for texture coordinate r.
     * @param {GLenum} WRAP_S: texture wrapping function for texture coordinate s.
     * @param {GLenum} WRAP_T: texture wrapping function for texture coordinate t.
     */
    /* eslint-disable max-statements */

  }, {
    key: 'setParameters',
    value: function setParameters(_ref) {
      var compareFunc = _ref.compareFunc;
      var compareMode = _ref.compareMode;
      var magFilter = _ref.magFilter;
      var minFilter = _ref.minFilter;
      var minLOD = _ref.minLOD;
      var maxLOD = _ref.maxLOD;
      var wrapR = _ref.wrapR;
      var wrapS = _ref.wrapS;
      var wrapT = _ref.wrapT;
      var gl = this.gl;

      if (compareFunc) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_COMPARE_FUNC, compareFunc);
      }
      if (compareMode) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_COMPARE_MODE, compareMode);
      }
      if (magFilter) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_MAG_FILTER, magFilter);
      }
      if (minFilter) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_MIN_FILTER, minFilter);
      }
      if (minLOD) {
        gl.samplerParameterf(this.handle, gl.TEXTURE_MIN_LOD, minLOD);
      }
      if (maxLOD) {
        gl.samplerParameterf(this.handle, gl.TEXTURE_MAX_LOD, maxLOD);
      }
      if (wrapR) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_R, wrapR);
      }
      if (wrapS) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_S, wrapS);
      }
      if (wrapT) {
        gl.samplerParameteri(this.handle, gl.TEXTURE_WRAP_T, wrapT);
      }
    }
    /* eslint-enable max-statements */

    /**
     * @param {GLenum} pname
     * @param {GLint} param
     * @return {Sampler} returns self to enable chaining
     */

  }, {
    key: 'parameteri',
    value: function parameteri(pname, param) {
      var gl = this.gl;

      gl.samplerParameteri(this.handle, pname, param);
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {GLenum} pname
     * @param {GLfloat} param
     * @return {Sampler} returns self to enable chaining
     */

  }, {
    key: 'parameterf',
    value: function parameterf(pname, param) {
      var gl = this.gl;

      gl.samplerParameterf(this.handle, pname, param);
      (0, _context.glCheckError)(gl);
      return this;
    }

    // @param {GLenum} pname
    // @return {*} result

  }, {
    key: 'getParameter',
    value: function getParameter(pname) {
      var gl = this.gl;

      var result = gl.getSamplerParameter(this.handle, pname);
      (0, _context.glCheckError)(gl);
      return result;
    }
  }]);

  return Sampler;
}();

exports.default = Sampler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvc2FtcGxlci5qcyJdLCJuYW1lcyI6WyJFUlJfV0VCR0wyIiwiU2FtcGxlciIsImdsIiwiaGFuZGxlIiwiY3JlYXRlU2FtcGxlciIsInVzZXJEYXRhIiwiT2JqZWN0Iiwic2VhbCIsImRlbGV0ZVNhbXBsZXIiLCJ1bml0IiwiYmluZFNhbXBsZXIiLCJjb21wYXJlRnVuYyIsImNvbXBhcmVNb2RlIiwibWFnRmlsdGVyIiwibWluRmlsdGVyIiwibWluTE9EIiwibWF4TE9EIiwid3JhcFIiLCJ3cmFwUyIsIndyYXBUIiwic2FtcGxlclBhcmFtZXRlcmkiLCJURVhUVVJFX0NPTVBBUkVfRlVOQyIsIlRFWFRVUkVfQ09NUEFSRV9NT0RFIiwiVEVYVFVSRV9NQUdfRklMVEVSIiwiVEVYVFVSRV9NSU5fRklMVEVSIiwic2FtcGxlclBhcmFtZXRlcmYiLCJURVhUVVJFX01JTl9MT0QiLCJURVhUVVJFX01BWF9MT0QiLCJURVhUVVJFX1dSQVBfUiIsIlRFWFRVUkVfV1JBUF9TIiwiVEVYVFVSRV9XUkFQX1QiLCJwbmFtZSIsInBhcmFtIiwicmVzdWx0IiwiZ2V0U2FtcGxlclBhcmFtZXRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNQSxhQUFhLGlCQUFuQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFcUJDLE87O0FBRW5COzs7O0FBSUEsbUJBQVlDLEVBQVosRUFBZ0I7QUFBQTs7QUFDZCwwQkFBT0EsZ0RBQVAsRUFBNkNGLFVBQTdDO0FBQ0EsU0FBS0UsRUFBTCxHQUFVQSxFQUFWO0FBQ0EsU0FBS0MsTUFBTCxHQUFjRCxHQUFHRSxhQUFILEVBQWQ7QUFDQSwrQkFBYUYsRUFBYjtBQUNBLFNBQUtHLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQUMsV0FBT0MsSUFBUCxDQUFZLElBQVo7QUFDRDs7QUFFRDs7Ozs7Ozs4QkFHUztBQUFBLFVB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QUNEOztBQUVEOzs7Ozs7OzsrQkFLVzZCLEssRUFBT0MsSyxFQUFPO0FBQUEsVUFDaEI5QixFQURnQixHQUNWLElBRFUsQ0FDaEJBLEVBRGdCOztBQUV2QkEsU0FBR3VCLGlCQUFILENBQXFCLEtBQUt0QixNQUExQixFQUFrQzRCLEtBQWxDLEVBQXlDQyxLQUF6QztBQUNBLGlDQUFhOUIsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOztBQUVEO0FBQ0E7Ozs7aUNBQ2E2QixLLEVBQU87QUFBQSxVQUNYN0IsRUFEVyxHQUNMLElBREssQ0FDWEEsRUFEVzs7QUFFbEIsVUFBTStCLFNBQVMvQixHQUFHZ0MsbUJBQUgsQ0FBdUIsS0FBSy9CLE1BQTVCLEVBQW9DNEIsS0FBcEMsQ0FBZjtBQUNBLGlDQUFhN0IsRUFBYjtBQUNBLGFBQU8rQixNQUFQO0FBQ0Q7Ozs7OztrQkF2SWtCaEMsTyIsImZpbGUiOiJzYW1wbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFNhbXBsZXIgSGVscGVyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViR0xRdWVyeVxuXG5pbXBvcnQge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBFUlJfV0VCR0wyID0gJ1dlYkdMMiByZXF1aXJlZCc7XG5cbi8vIFdlYkdMU2FtcGxlcj8gY3JlYXRlU2FtcGxlcigpO1xuLy8gdm9pZCBkZWxldGVTYW1wbGVyKFdlYkdMU2FtcGxlcj8gc2FtcGxlcik7XG4vLyBbV2ViR0xIYW5kbGVzQ29udGV4dExvc3NdIEdMYm9vbGVhbiBpc1NhbXBsZXIoV2ViR0xTYW1wbGVyPyBzYW1wbGVyKTtcbi8vIHZvaWQgYmluZFNhbXBsZXIoR0x1aW50IHVuaXQsIFdlYkdMU2FtcGxlcj8gc2FtcGxlcik7XG4vLyB2b2lkIHNhbXBsZXJQYXJhbWV0ZXJpKFdlYkdMU2FtcGxlcj8gc2FtcGxlciwgR0xlbnVtIHBuYW1lLCBHTGludCBwYXJhbSk7XG4vLyB2b2lkIHNhbXBsZXJQYXJhbWV0ZXJmKFdlYkdMU2FtcGxlcj8gc2FtcGxlciwgR0xlbnVtIHBuYW1lLCBHTGZsb2F0IHBhcmFtKTtcbi8vIGFueSBnZXRTYW1wbGVyUGFyYW1ldGVyKFdlYkdMU2FtcGxlcj8gc2FtcGxlciwgR0xlbnVtIHBuYW1lKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2FtcGxlciB7XG5cbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGdsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCkge1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVNhbXBsZXIoKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlU2FtcGxlcih0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTHVpbnR9IHVuaXRcbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgYmluZCh1bml0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFNhbXBsZXIodW5pdCwgdGhpcy5oYW5kbGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTHVpbnR9IHVuaXRcbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgdW5iaW5kKHVuaXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kU2FtcGxlcih1bml0LCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhdGNoIHVwZGF0ZSBzYW1wbGVyIHNldHRpbmdzXG4gICAqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBjb21wYXJlX2Z1bmMgLSB0ZXh0dXJlIGNvbXBhcmlzb24gZnVuY3Rpb24uXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBjb21wYXJlX21vZGUgLSB0ZXh0dXJlIGNvbXBhcmlzb24gbW9kZS5cbiAgICogQHBhcmFtIHtHTGVudW19IG1hZ19maWx0ZXIgLSB0ZXh0dXJlIG1hZ25pZmljYXRpb24gZmlsdGVyLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gTUlOX0ZJTFRFUiAtIHRleHR1cmUgbWluaWZpY2F0aW9uIGZpbHRlclxuICAgKiBAcGFyYW0ge0dMZmxvYXR9IE1BWF9MT0Q6IG1heGltdW0gbGV2ZWwtb2YtZGV0YWlsIHZhbHVlLlxuICAgKiBAcGFyYW0ge0dMZmxvYXR9IE1JTl9MT0Q6IG1pbmltdW0gbGV2ZWwtb2YtZGV0YWlsIHZhbHVlLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gV1JBUF9SOiB0ZXh0dXJlIHdyYXBwaW5nIGZ1bmN0aW9uIGZvciB0ZXh0dXJlIGNvb3JkaW5hdGUgci5cbiAgICogQHBhcmFtIHtHTGVudW19IFdSQVBfUzogdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHMuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBXUkFQX1Q6IHRleHR1cmUgd3JhcHBpbmcgZnVuY3Rpb24gZm9yIHRleHR1cmUgY29vcmRpbmF0ZSB0LlxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgc2V0UGFyYW1ldGVycyh7XG4gICAgY29tcGFyZUZ1bmMsXG4gICAgY29tcGFyZU1vZGUsXG4gICAgbWFnRmlsdGVyLFxuICAgIG1pbkZpbHRlcixcbiAgICBtaW5MT0QsXG4gICAgbWF4TE9ELFxuICAgIHdyYXBSLFxuICAgIHdyYXBTLFxuICAgIHdyYXBUXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAoY29tcGFyZUZ1bmMpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX0NPTVBBUkVfRlVOQywgY29tcGFyZUZ1bmMpO1xuICAgIH1cbiAgICBpZiAoY29tcGFyZU1vZGUpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX0NPTVBBUkVfTU9ERSwgY29tcGFyZU1vZGUpO1xuICAgIH1cbiAgICBpZiAobWFnRmlsdGVyKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBtYWdGaWx0ZXIpO1xuICAgIH1cbiAgICBpZiAobWluRmlsdGVyKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBtaW5GaWx0ZXIpO1xuICAgIH1cbiAgICBpZiAobWluTE9EKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyZih0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NSU5fTE9ELCBtaW5MT0QpO1xuICAgIH1cbiAgICBpZiAobWF4TE9EKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyZih0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NQVhfTE9ELCBtYXhMT0QpO1xuICAgIH1cbiAgICBpZiAod3JhcFIpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX1dSQVBfUiwgd3JhcFIpO1xuICAgIH1cbiAgICBpZiAod3JhcFMpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX1dSQVBfUywgd3JhcFMpO1xuICAgIH1cbiAgICBpZiAod3JhcFQpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX1dSQVBfVCwgd3JhcFQpO1xuICAgIH1cbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBwbmFtZVxuICAgKiBAcGFyYW0ge0dMaW50fSBwYXJhbVxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBwYXJhbWV0ZXJpKHBuYW1lLCBwYXJhbSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBwbmFtZSwgcGFyYW0pO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGVudW19IHBuYW1lXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gcGFyYW1cbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgcGFyYW1ldGVyZihwbmFtZSwgcGFyYW0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5zYW1wbGVyUGFyYW1ldGVyZih0aGlzLmhhbmRsZSwgcG5hbWUsIHBhcmFtKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQHBhcmFtIHtHTGVudW19IHBuYW1lXG4gIC8vIEByZXR1cm4geyp9IHJlc3VsdFxuICBnZXRQYXJhbWV0ZXIocG5hbWUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRTYW1wbGVyUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBwbmFtZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbn1cbiJdfQ==