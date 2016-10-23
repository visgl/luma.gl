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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvc2FtcGxlci5qcyJdLCJuYW1lcyI6WyJFUlJfV0VCR0wyIiwiU2FtcGxlciIsImdsIiwiaGFuZGxlIiwiY3JlYXRlU2FtcGxlciIsInVzZXJEYXRhIiwiT2JqZWN0Iiwic2VhbCIsImRlbGV0ZVNhbXBsZXIiLCJ1bml0IiwiYmluZFNhbXBsZXIiLCJjb21wYXJlRnVuYyIsImNvbXBhcmVNb2RlIiwibWFnRmlsdGVyIiwibWluRmlsdGVyIiwibWluTE9EIiwibWF4TE9EIiwid3JhcFIiLCJ3cmFwUyIsIndyYXBUIiwic2FtcGxlclBhcmFtZXRlcmkiLCJURVhUVVJFX0NPTVBBUkVfRlVOQyIsIlRFWFRVUkVfQ09NUEFSRV9NT0RFIiwiVEVYVFVSRV9NQUdfRklMVEVSIiwiVEVYVFVSRV9NSU5fRklMVEVSIiwic2FtcGxlclBhcmFtZXRlcmYiLCJURVhUVVJFX01JTl9MT0QiLCJURVhUVVJFX01BWF9MT0QiLCJURVhUVVJFX1dSQVBfUiIsIlRFWFRVUkVfV1JBUF9TIiwiVEVYVFVSRV9XUkFQX1QiLCJwbmFtZSIsInBhcmFtIiwicmVzdWx0IiwiZ2V0U2FtcGxlclBhcmFtZXRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNQSxhQUFhLGlCQUFuQjs7SUFFcUJDLE87O0FBRW5COzs7O0FBSUEsbUJBQVlDLEVBQVosRUFBZ0I7QUFBQTs7QUFDZCwwQkFBT0EsZ0RBQVAsRUFBNkNGLFVBQTdDO0FBQ0EsU0FBS0UsRUFBTCxHQUFVQSxFQUFWO0FBQ0EsU0FBS0MsTUFBTCxHQUFjRCxHQUFHRSxhQUFILEVBQWQ7QUFDQSwrQkFBYUYsRUFBYjtBQUNBLFNBQUtHLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQUMsV0FBT0MsSUFBUCxDQUFZLElBQVo7QUFDRDs7QUFFRDs7Ozs7Ozs4QkFHUztBQUFBLFVBQ0FMLEVBREEsR0FDTSxJQUROLENBQ0FBLEVBREE7O0FBRVBB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QUFPO0FBQUEsVUFDaEI5QixFQURnQixHQUNWLElBRFUsQ0FDaEJBLEVBRGdCOztBQUV2QkEsU0FBR3VCLGlCQUFILENBQXFCLEtBQUt0QixNQUExQixFQUFrQzRCLEtBQWxDLEVBQXlDQyxLQUF6QztBQUNBLGlDQUFhOUIsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOztBQUVEO0FBQ0E7Ozs7aUNBQ2E2QixLLEVBQU87QUFBQSxVQUNYN0IsRUFEVyxHQUNMLElBREssQ0FDWEEsRUFEVzs7QUFFbEIsVUFBTStCLFNBQVMvQixHQUFHZ0MsbUJBQUgsQ0FBdUIsS0FBSy9CLE1BQTVCLEVBQW9DNEIsS0FBcEMsQ0FBZjtBQUNBLGlDQUFhN0IsRUFBYjtBQUNBLGFBQU8rQixNQUFQO0FBQ0Q7Ozs7OztrQkF2SWtCaEMsTyIsImZpbGUiOiJzYW1wbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFNhbXBsZXIgSGVscGVyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViR0xRdWVyeVxuXG5pbXBvcnQge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBFUlJfV0VCR0wyID0gJ1dlYkdMMiByZXF1aXJlZCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNhbXBsZXIge1xuXG4gIC8qKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBnbFxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wpIHtcbiAgICBhc3NlcnQoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBFUlJfV0VCR0wyKTtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVTYW1wbGVyKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVNhbXBsZXIodGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0x1aW50fSB1bml0XG4gICAqIEByZXR1cm4ge1NhbXBsZXJ9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGJpbmQodW5pdCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRTYW1wbGVyKHVuaXQsIHRoaXMuaGFuZGxlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0x1aW50fSB1bml0XG4gICAqIEByZXR1cm4ge1NhbXBsZXJ9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHVuYmluZCh1bml0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFNhbXBsZXIodW5pdCwgbnVsbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBCYXRjaCB1cGRhdGUgc2FtcGxlciBzZXR0aW5nc1xuICAgKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gY29tcGFyZV9mdW5jIC0gdGV4dHVyZSBjb21wYXJpc29uIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gY29tcGFyZV9tb2RlIC0gdGV4dHVyZSBjb21wYXJpc29uIG1vZGUuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBtYWdfZmlsdGVyIC0gdGV4dHVyZSBtYWduaWZpY2F0aW9uIGZpbHRlci5cbiAgICogQHBhcmFtIHtHTGVudW19IE1JTl9GSUxURVIgLSB0ZXh0dXJlIG1pbmlmaWNhdGlvbiBmaWx0ZXJcbiAgICogQHBhcmFtIHtHTGZsb2F0fSBNQVhfTE9EOiBtYXhpbXVtIGxldmVsLW9mLWRldGFpbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtHTGZsb2F0fSBNSU5fTE9EOiBtaW5pbXVtIGxldmVsLW9mLWRldGFpbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtHTGVudW19IFdSQVBfUjogdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHIuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBXUkFQX1M6IHRleHR1cmUgd3JhcHBpbmcgZnVuY3Rpb24gZm9yIHRleHR1cmUgY29vcmRpbmF0ZSBzLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gV1JBUF9UOiB0ZXh0dXJlIHdyYXBwaW5nIGZ1bmN0aW9uIGZvciB0ZXh0dXJlIGNvb3JkaW5hdGUgdC5cbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHNldFBhcmFtZXRlcnMoe1xuICAgIGNvbXBhcmVGdW5jLFxuICAgIGNvbXBhcmVNb2RlLFxuICAgIG1hZ0ZpbHRlcixcbiAgICBtaW5GaWx0ZXIsXG4gICAgbWluTE9ELFxuICAgIG1heExPRCxcbiAgICB3cmFwUixcbiAgICB3cmFwUyxcbiAgICB3cmFwVFxuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKGNvbXBhcmVGdW5jKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9DT01QQVJFX0ZVTkMsIGNvbXBhcmVGdW5jKTtcbiAgICB9XG4gICAgaWYgKGNvbXBhcmVNb2RlKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9DT01QQVJFX01PREUsIGNvbXBhcmVNb2RlKTtcbiAgICB9XG4gICAgaWYgKG1hZ0ZpbHRlcikge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgbWFnRmlsdGVyKTtcbiAgICB9XG4gICAgaWYgKG1pbkZpbHRlcikge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgbWluRmlsdGVyKTtcbiAgICB9XG4gICAgaWYgKG1pbkxPRCkge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmYodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfTUlOX0xPRCwgbWluTE9EKTtcbiAgICB9XG4gICAgaWYgKG1heExPRCkge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmYodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfTUFYX0xPRCwgbWF4TE9EKTtcbiAgICB9XG4gICAgaWYgKHdyYXBSKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9XUkFQX1IsIHdyYXBSKTtcbiAgICB9XG4gICAgaWYgKHdyYXBTKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9XUkFQX1MsIHdyYXBTKTtcbiAgICB9XG4gICAgaWYgKHdyYXBUKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9XUkFQX1QsIHdyYXBUKTtcbiAgICB9XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gcG5hbWVcbiAgICogQHBhcmFtIHtHTGludH0gcGFyYW1cbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgcGFyYW1ldGVyaShwbmFtZSwgcGFyYW0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgcG5hbWUsIHBhcmFtKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBwbmFtZVxuICAgKiBAcGFyYW0ge0dMZmxvYXR9IHBhcmFtXG4gICAqIEByZXR1cm4ge1NhbXBsZXJ9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHBhcmFtZXRlcmYocG5hbWUsIHBhcmFtKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuc2FtcGxlclBhcmFtZXRlcmYodGhpcy5oYW5kbGUsIHBuYW1lLCBwYXJhbSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEBwYXJhbSB7R0xlbnVtfSBwbmFtZVxuICAvLyBAcmV0dXJuIHsqfSByZXN1bHRcbiAgZ2V0UGFyYW1ldGVyKHBuYW1lKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0U2FtcGxlclBhcmFtZXRlcih0aGlzLmhhbmRsZSwgcG5hbWUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG59XG4iXX0=