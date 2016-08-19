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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvc2FtcGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTtBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7Ozs7OztBQUVBLElBQU0sYUFBYSxpQkFBbkI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRXFCLE87O0FBRW5COzs7O0FBSUEsbUJBQVksRUFBWixFQUFnQjtBQUFBOztBQUNkLDBCQUFPLGdEQUFQLEVBQTZDLFVBQTdDO0FBQ0EsU0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFNBQUssTUFBTCxHQUFjLEdBQUcsYUFBSCxFQUFkO0FBQ0EsK0JBQWEsRUFBYjtBQUNBLFNBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNBLFdBQU8sSUFBUCxDQUFZLElBQVo7QUFDRDs7QUFFRDs7Ozs7Ozs4QkFHUztBQUFBLFVBQ0EsRUFEQSxHQUNNLElBRE4sQ0FDQSxFQURBOztBQUVQLFNBQUcsYUFBSCxDQUFpQixLQUFLLE1BQXRCO0FBQ0EsV0FBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7Ozt5QkFJSyxJLEVBQU07QUFBQSxVQUNGLEVBREUsR0FDSSxJQURKLENBQ0YsRUFERTs7QUFFVCxTQUFHLFdBQUgsQ0FBZSxJQUFmLEVBQXFCLEtBQUssTUFBMUI7QUFDQSxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7MkJBSU8sSSxFQUFNO0FBQUEsVUFDSixFQURJLEdBQ0UsSUFERixDQUNKLEVBREk7O0FBRVgsU0FBRyxXQUFILENBQWUsSUFBZixFQUFxQixJQUFyQjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0F1Qkc7QUFBQSxVQVRELFdBU0MsUUFURCxXQVNDO0FBQUEsVUFSRCxXQVFDLFFBUkQsV0FRQztBQUFBLFVBUEQsU0FPQyxRQVBELFNBT0M7QUFBQSxVQU5ELFNBTUMsUUFORCxTQU1DO0FBQUEsVUFMRCxNQUtDLFFBTEQsTUFLQztBQUFBLFVBSkQsTUFJQyxRQUpELE1BSUM7QUFBQSxVQUhELEtBR0MsUUFIRCxLQUdDO0FBQUEsVUFGRCxLQUVDLFFBRkQsS0FFQztBQUFBLFVBREQsS0FDQyxRQURELEtBQ0M7QUFBQSxVQUNNLEVBRE4sR0FDWSxJQURaLENBQ00sRUFETjs7QUFFRCxVQUFJLFdBQUosRUFBaUI7QUFDZixXQUFHLGlCQUFILENBQXFCLEtBQUssTUFBMUIsRUFBa0MsR0FBRyxvQkFBckMsRUFBMkQsV0FBM0Q7QUFDRDtBQUNELFVBQUksV0FBSixFQUFpQjtBQUNmLFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLG9CQUFyQyxFQUEyRCxXQUEzRDtBQUNEO0FBQ0QsVUFBSSxTQUFKLEVBQWU7QUFDYixXQUFHLGlCQUFILENBQXFCLEtBQUssTUFBMUIsRUFBa0MsR0FBRyxrQkFBckMsRUFBeUQsU0FBekQ7QUFDRDtBQUNELFVBQUksU0FBSixFQUFlO0FBQ2IsV0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEdBQUcsa0JBQXJDLEVBQXlELFNBQXpEO0FBQ0Q7QUFDRCxVQUFJLE1BQUosRUFBWTtBQUNWLFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLGVBQXJDLEVBQXNELE1BQXREO0FBQ0Q7QUFDRCxVQUFJLE1BQUosRUFBWTtBQUNWLFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLGVBQXJDLEVBQXNELE1BQXREO0FBQ0Q7QUFDRCxVQUFJLEtBQUosRUFBVztBQUNULFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLGNBQXJDLEVBQXFELEtBQXJEO0FBQ0Q7QUFDRCxVQUFJLEtBQUosRUFBVztBQUNULFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLGNBQXJDLEVBQXFELEtBQXJEO0FBQ0Q7QUFDRCxVQUFJLEtBQUosRUFBVztBQUNULFdBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUExQixFQUFrQyxHQUFHLGNBQXJDLEVBQXFELEtBQXJEO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7Ozs7K0JBS1csSyxFQUFPLEssRUFBTztBQUFBLFVBQ2hCLEVBRGdCLEdBQ1YsSUFEVSxDQUNoQixFQURnQjs7QUFFdkIsU0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCLEVBQWtDLEtBQWxDLEVBQXlDLEtBQXpDO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOztBQUVEOzs7Ozs7OzsrQkFLVyxLLEVBQU8sSyxFQUFPO0FBQUEsVUFDaEIsRUFEZ0IsR0FDVixJQURVLENBQ2hCLEVBRGdCOztBQUV2QixTQUFHLGlCQUFILENBQXFCLEtBQUssTUFBMUIsRUFBa0MsS0FBbEMsRUFBeUMsS0FBekM7QUFDQSxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQ7QUFDQTs7OztpQ0FDYSxLLEVBQU87QUFBQSxVQUNYLEVBRFcsR0FDTCxJQURLLENBQ1gsRUFEVzs7QUFFbEIsVUFBTSxTQUFTLEdBQUcsbUJBQUgsQ0FBdUIsS0FBSyxNQUE1QixFQUFvQyxLQUFwQyxDQUFmO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sTUFBUDtBQUNEOzs7Ozs7a0JBcklrQixPIiwiZmlsZSI6InNhbXBsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTDIgU2FtcGxlciBIZWxwZXJcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJHTFF1ZXJ5XG5cbmltcG9ydCB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi4vY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IEVSUl9XRUJHTDIgPSAnV2ViR0wyIHJlcXVpcmVkJztcblxuLy8gV2ViR0xTYW1wbGVyPyBjcmVhdGVTYW1wbGVyKCk7XG4vLyB2b2lkIGRlbGV0ZVNhbXBsZXIoV2ViR0xTYW1wbGVyPyBzYW1wbGVyKTtcbi8vIFtXZWJHTEhhbmRsZXNDb250ZXh0TG9zc10gR0xib29sZWFuIGlzU2FtcGxlcihXZWJHTFNhbXBsZXI/IHNhbXBsZXIpO1xuLy8gdm9pZCBiaW5kU2FtcGxlcihHTHVpbnQgdW5pdCwgV2ViR0xTYW1wbGVyPyBzYW1wbGVyKTtcbi8vIHZvaWQgc2FtcGxlclBhcmFtZXRlcmkoV2ViR0xTYW1wbGVyPyBzYW1wbGVyLCBHTGVudW0gcG5hbWUsIEdMaW50IHBhcmFtKTtcbi8vIHZvaWQgc2FtcGxlclBhcmFtZXRlcmYoV2ViR0xTYW1wbGVyPyBzYW1wbGVyLCBHTGVudW0gcG5hbWUsIEdMZmxvYXQgcGFyYW0pO1xuLy8gYW55IGdldFNhbXBsZXJQYXJhbWV0ZXIoV2ViR0xTYW1wbGVyPyBzYW1wbGVyLCBHTGVudW0gcG5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTYW1wbGVyIHtcblxuICAvKipcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZ2xcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2FtcGxlcigpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1NhbXBsZXJ9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVTYW1wbGVyKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMdWludH0gdW5pdFxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBiaW5kKHVuaXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kU2FtcGxlcih1bml0LCB0aGlzLmhhbmRsZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMdWludH0gdW5pdFxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICB1bmJpbmQodW5pdCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRTYW1wbGVyKHVuaXQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQmF0Y2ggdXBkYXRlIHNhbXBsZXIgc2V0dGluZ3NcbiAgICpcbiAgICogQHBhcmFtIHtHTGVudW19IGNvbXBhcmVfZnVuYyAtIHRleHR1cmUgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHtHTGVudW19IGNvbXBhcmVfbW9kZSAtIHRleHR1cmUgY29tcGFyaXNvbiBtb2RlLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gbWFnX2ZpbHRlciAtIHRleHR1cmUgbWFnbmlmaWNhdGlvbiBmaWx0ZXIuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBNSU5fRklMVEVSIC0gdGV4dHVyZSBtaW5pZmljYXRpb24gZmlsdGVyXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gTUFYX0xPRDogbWF4aW11bSBsZXZlbC1vZi1kZXRhaWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gTUlOX0xPRDogbWluaW11bSBsZXZlbC1vZi1kZXRhaWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBXUkFQX1I6IHRleHR1cmUgd3JhcHBpbmcgZnVuY3Rpb24gZm9yIHRleHR1cmUgY29vcmRpbmF0ZSByLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gV1JBUF9TOiB0ZXh0dXJlIHdyYXBwaW5nIGZ1bmN0aW9uIGZvciB0ZXh0dXJlIGNvb3JkaW5hdGUgcy5cbiAgICogQHBhcmFtIHtHTGVudW19IFdSQVBfVDogdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHQuXG4gICAqL1xuICBzZXRQYXJhbWV0ZXJzKHtcbiAgICBjb21wYXJlRnVuYyxcbiAgICBjb21wYXJlTW9kZSxcbiAgICBtYWdGaWx0ZXIsXG4gICAgbWluRmlsdGVyLFxuICAgIG1pbkxPRCxcbiAgICBtYXhMT0QsXG4gICAgd3JhcFIsXG4gICAgd3JhcFMsXG4gICAgd3JhcFRcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmIChjb21wYXJlRnVuYykge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfQ09NUEFSRV9GVU5DLCBjb21wYXJlRnVuYyk7XG4gICAgfVxuICAgIGlmIChjb21wYXJlTW9kZSkge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfQ09NUEFSRV9NT0RFLCBjb21wYXJlTW9kZSk7XG4gICAgfVxuICAgIGlmIChtYWdGaWx0ZXIpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX01BR19GSUxURVIsIG1hZ0ZpbHRlcik7XG4gICAgfVxuICAgIGlmIChtaW5GaWx0ZXIpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIG1pbkZpbHRlcik7XG4gICAgfVxuICAgIGlmIChtaW5MT0QpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJmKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX01JTl9MT0QsIG1pbkxPRCk7XG4gICAgfVxuICAgIGlmIChtYXhMT0QpIHtcbiAgICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJmKHRoaXMuaGFuZGxlLCBnbC5URVhUVVJFX01BWF9MT0QsIG1heExPRCk7XG4gICAgfVxuICAgIGlmICh3cmFwUikge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfV1JBUF9SLCB3cmFwUik7XG4gICAgfVxuICAgIGlmICh3cmFwUykge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfV1JBUF9TLCB3cmFwUyk7XG4gICAgfVxuICAgIGlmICh3cmFwVCkge1xuICAgICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIGdsLlRFWFRVUkVfV1JBUF9ULCB3cmFwVCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBwbmFtZVxuICAgKiBAcGFyYW0ge0dMaW50fSBwYXJhbVxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBwYXJhbWV0ZXJpKHBuYW1lLCBwYXJhbSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJpKHRoaXMuaGFuZGxlLCBwbmFtZSwgcGFyYW0pO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGVudW19IHBuYW1lICBcbiAgICogQHBhcmFtIHtHTGZsb2F0fSBwYXJhbVxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBwYXJhbWV0ZXJmKHBuYW1lLCBwYXJhbSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJmKHRoaXMuaGFuZGxlLCBwbmFtZSwgcGFyYW0pO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBAcGFyYW0ge0dMZW51bX0gcG5hbWVcbiAgLy8gQHJldHVybiB7Kn0gcmVzdWx0XG4gIGdldFBhcmFtZXRlcihwbmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFNhbXBsZXJQYXJhbWV0ZXIodGhpcy5oYW5kbGUsIHBuYW1lKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxufVxuIl19