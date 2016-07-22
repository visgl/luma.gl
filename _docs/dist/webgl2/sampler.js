'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvc2FtcGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFHQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNLGFBQWEsaUJBQW5COzs7Ozs7Ozs7O0lBVXFCLE87Ozs7Ozs7QUFNbkIsbUJBQVksRUFBWixFQUFnQjtBQUFBOztBQUNkLDBCQUFPLGdEQUFQLEVBQTZDLFVBQTdDO0FBQ0EsU0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFNBQUssTUFBTCxHQUFjLEdBQUcsYUFBSCxFQUFkO0FBQ0EsK0JBQWEsRUFBYjtBQUNBLFNBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNBLFdBQU8sSUFBUCxDQUFZLElBQVo7QUFDRDs7Ozs7Ozs7OzhCQUtRO0FBQUEsVUFDQSxFQURBLEdBQ00sSUFETixDQUNBLEVBREE7O0FBRVAsU0FBRyxhQUFILENBQWlCLEtBQUssTUFBdEI7QUFDQSxXQUFLLE1BQUwsR0FBYyxJQUFkO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7eUJBTUksSSxFQUFNO0FBQUEsVUFDRixFQURFLEdBQ0ksSUFESixDQUNGLEVBREU7O0FBRVQsU0FBRyxXQUFILENBQWUsSUFBZixFQUFxQixLQUFLLE1BQTFCO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7MkJBTU0sSSxFQUFNO0FBQUEsVUFDSixFQURJLEdBQ0UsSUFERixDQUNKLEVBREk7O0FBRVgsU0FBRyxXQUFILENBQWUsSUFBZixFQUFxQixJQUFyQjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dDQXlCRTtBQUFBLFVBVEQsV0FTQyxRQVRELFdBU0M7QUFBQSxVQVJELFdBUUMsUUFSRCxXQVFDO0FBQUEsVUFQRCxTQU9DLFFBUEQsU0FPQztBQUFBLFVBTkQsU0FNQyxRQU5ELFNBTUM7QUFBQSxVQUxELE1BS0MsUUFMRCxNQUtDO0FBQUEsVUFKRCxNQUlDLFFBSkQsTUFJQztBQUFBLFVBSEQsS0FHQyxRQUhELEtBR0M7QUFBQSxVQUZELEtBRUMsUUFGRCxLQUVDO0FBQUEsVUFERCxLQUNDLFFBREQsS0FDQztBQUFBLFVBQ00sRUFETixHQUNZLElBRFosQ0FDTSxFQUROOztBQUVELFVBQUksV0FBSixFQUFpQjtBQUNmLFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLG9CQUFyQyxFQUEyRCxXQUEzRDtBQUNEO0FBQ0QsVUFBSSxXQUFKLEVBQWlCO0FBQ2YsV0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEdBQUcsb0JBQXJDLEVBQTJELFdBQTNEO0FBQ0Q7QUFDRCxVQUFJLFNBQUosRUFBZTtBQUNiLFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLGtCQUFyQyxFQUF5RCxTQUF6RDtBQUNEO0FBQ0QsVUFBSSxTQUFKLEVBQWU7QUFDYixXQUFHLGlCQUFILENBQXFCLEtBQUssTUFBMUIsRUFBa0MsR0FBRyxrQkFBckMsRUFBeUQsU0FBekQ7QUFDRDtBQUNELFVBQUksTUFBSixFQUFZO0FBQ1YsV0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEdBQUcsZUFBckMsRUFBc0QsTUFBdEQ7QUFDRDtBQUNELFVBQUksTUFBSixFQUFZO0FBQ1YsV0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEdBQUcsZUFBckMsRUFBc0QsTUFBdEQ7QUFDRDtBQUNELFVBQUksS0FBSixFQUFXO0FBQ1QsV0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEdBQUcsY0FBckMsRUFBcUQsS0FBckQ7QUFDRDtBQUNELFVBQUksS0FBSixFQUFXO0FBQ1QsV0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEdBQUcsY0FBckMsRUFBcUQsS0FBckQ7QUFDRDtBQUNELFVBQUksS0FBSixFQUFXO0FBQ1QsV0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEdBQUcsY0FBckMsRUFBcUQsS0FBckQ7QUFDRDtBQUNGOzs7Ozs7Ozs7OytCQU9VLEssRUFBTyxLLEVBQU87QUFBQSxVQUNoQixFQURnQixHQUNWLElBRFUsQ0FDaEIsRUFEZ0I7O0FBRXZCLFNBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxLQUFsQyxFQUF5QyxLQUF6QztBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7OzsrQkFPVSxLLEVBQU8sSyxFQUFPO0FBQUEsVUFDaEIsRUFEZ0IsR0FDVixJQURVLENBQ2hCLEVBRGdCOztBQUV2QixTQUFHLGlCQUFILENBQXFCLEtBQUssTUFBMUIsRUFBa0MsS0FBbEMsRUFBeUMsS0FBekM7QUFDQSxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7Ozs7aUNBSVksSyxFQUFPO0FBQUEsVUFDWCxFQURXLEdBQ0wsSUFESyxDQUNYLEVBRFc7O0FBRWxCLFVBQU0sU0FBUyxHQUFHLG1CQUFILENBQXVCLEtBQUssTUFBNUIsRUFBb0MsS0FBcEMsQ0FBZjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLE1BQVA7QUFDRDs7Ozs7O2tCQXJJa0IsTyIsImZpbGUiOiJzYW1wbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFNhbXBsZXIgSGVscGVyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViR0xRdWVyeVxuXG5pbXBvcnQge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBFUlJfV0VCR0wyID0gJ1dlYkdMMiByZXF1aXJlZCc7XG5cbi8vIFdlYkdMU2FtcGxlcj8gY3JlYXRlU2FtcGxlcigpO1xuLy8gdm9pZCBkZWxldGVTYW1wbGVyKFdlYkdMU2FtcGxlcj8gc2FtcGxlcik7XG4vLyBbV2ViR0xIYW5kbGVzQ29udGV4dExvc3NdIEdMYm9vbGVhbiBpc1NhbXBsZXIoV2ViR0xTYW1wbGVyPyBzYW1wbGVyKTtcbi8vIHZvaWQgYmluZFNhbXBsZXIoR0x1aW50IHVuaXQsIFdlYkdMU2FtcGxlcj8gc2FtcGxlcik7XG4vLyB2b2lkIHNhbXBsZXJQYXJhbWV0ZXJpKFdlYkdMU2FtcGxlcj8gc2FtcGxlciwgR0xlbnVtIHBuYW1lLCBHTGludCBwYXJhbSk7XG4vLyB2b2lkIHNhbXBsZXJQYXJhbWV0ZXJmKFdlYkdMU2FtcGxlcj8gc2FtcGxlciwgR0xlbnVtIHBuYW1lLCBHTGZsb2F0IHBhcmFtKTtcbi8vIGFueSBnZXRTYW1wbGVyUGFyYW1ldGVyKFdlYkdMU2FtcGxlcj8gc2FtcGxlciwgR0xlbnVtIHBuYW1lKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2FtcGxlciB7XG5cbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGdsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCkge1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVNhbXBsZXIoKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlU2FtcGxlcih0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTHVpbnR9IHVuaXRcbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgYmluZCh1bml0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFNhbXBsZXIodW5pdCwgdGhpcy5oYW5kbGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTHVpbnR9IHVuaXRcbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgdW5iaW5kKHVuaXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kU2FtcGxlcih1bml0LCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhdGNoIHVwZGF0ZSBzYW1wbGVyIHNldHRpbmdzXG4gICAqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBjb21wYXJlX2Z1bmMgLSB0ZXh0dXJlIGNvbXBhcmlzb24gZnVuY3Rpb24uXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBjb21wYXJlX21vZGUgLSB0ZXh0dXJlIGNvbXBhcmlzb24gbW9kZS5cbiAgICogQHBhcmFtIHtHTGVudW19IG1hZ19maWx0ZXIgLSB0ZXh0dXJlIG1hZ25pZmljYXRpb24gZmlsdGVyLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gTUlOX0ZJTFRFUiAtIHRleHR1cmUgbWluaWZpY2F0aW9uIGZpbHRlclxuICAgKiBAcGFyYW0ge0dMZmxvYXR9IE1BWF9MT0Q6IG1heGltdW0gbGV2ZWwtb2YtZGV0YWlsIHZhbHVlLlxuICAgKiBAcGFyYW0ge0dMZmxvYXR9IE1JTl9MT0Q6IG1pbmltdW0gbGV2ZWwtb2YtZGV0YWlsIHZhbHVlLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gV1JBUF9SOiB0ZXh0dXJlIHdyYXBwaW5nIGZ1bmN0aW9uIGZvciB0ZXh0dXJlIGNvb3JkaW5hdGUgci5cbiAgICogQHBhcmFtIHtHTGVudW19IFdSQVBfUzogdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHMuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBXUkFQX1Q6IHRleHR1cmUgd3JhcHBpbmcgZnVuY3Rpb24gZm9yIHRleHR1cmUgY29vcmRpbmF0ZSB0LlxuICAgKi9cbiAgc2V0UGFyYW1ldGVycyh7XG4gICAgY29tcGFyZUZ1bmMsXG4gICAgY29tcGFyZU1vZGUsXG4gICAgbWFnRmlsdGVyLFxuICAgIG1pbkZpbHRlcixcbiAgICBtaW5MT0QsXG4gICAgbWF4TE9ELFxuICAgIHdyYXBSLFxuICAgIHdyYXBTLFxuICAgIHdyYXBUXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAoY29tcGFyZUZ1bmMpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX0NPTVBBUkVfRlVOQywgY29tcGFyZUZ1bmMpO1xuICAgIH1cbiAgICBpZiAoY29tcGFyZU1vZGUpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX0NPTVBBUkVfTU9ERSwgY29tcGFyZU1vZGUpO1xuICAgIH1cbiAgICBpZiAobWFnRmlsdGVyKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBtYWdGaWx0ZXIpO1xuICAgIH1cbiAgICBpZiAobWluRmlsdGVyKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBtaW5GaWx0ZXIpO1xuICAgIH1cbiAgICBpZiAobWluTE9EKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyZih0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NSU5fTE9ELCBtaW5MT0QpO1xuICAgIH1cbiAgICBpZiAobWF4TE9EKSB7XG4gICAgICBnbC5zYW1wbGVyUGFyYW1ldGVyZih0aGlzLmhhbmRsZSwgZ2wuVEVYVFVSRV9NQVhfTE9ELCBtYXhMT0QpO1xuICAgIH1cbiAgICBpZiAod3JhcFIpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX1dSQVBfUiwgd3JhcFIpO1xuICAgIH1cbiAgICBpZiAod3JhcFMpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX1dSQVBfUywgd3JhcFMpO1xuICAgIH1cbiAgICBpZiAod3JhcFQpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX1dSQVBfVCwgd3JhcFQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gcG5hbWVcbiAgICogQHBhcmFtIHtHTGludH0gcGFyYW1cbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgcGFyYW1ldGVyaShwbmFtZSwgcGFyYW0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5zYW1wbGVyUGFyYW1ldGVyaSh0aGlzLmhhbmRsZSwgcG5hbWUsIHBhcmFtKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBwbmFtZSAgXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gcGFyYW1cbiAgICogQHJldHVybiB7U2FtcGxlcn0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgcGFyYW1ldGVyZihwbmFtZSwgcGFyYW0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5zYW1wbGVyUGFyYW1ldGVyZih0aGlzLmhhbmRsZSwgcG5hbWUsIHBhcmFtKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQHBhcmFtIHtHTGVudW19IHBuYW1lXG4gIC8vIEByZXR1cm4geyp9IHJlc3VsdFxuICBnZXRQYXJhbWV0ZXIocG5hbWUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRTYW1wbGVyUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBwbmFtZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbn1cbiJdfQ==