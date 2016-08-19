'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Transform Feedback Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _webglTypes = require('./webgl-types');

var _context = require('../context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable max-len */
// void bindTransformFeedback (GLenum target, WebGLTransformFeedback? id);
// void beginTransformFeedback(GLenum primitiveMode);
// void endTransformFeedback();
// void transformFeedbackVaryings(WebGLProgram? program, sequence<DOMString> varyings, GLenum bufferMode);
// WebGLActiveInfo? getTransformFeedbackVarying(WebGLProgram? program, GLuint index);
// void pauseTransformFeedback();
// void resumeTransformFeedback();

var TranformFeedback = function () {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */

  function TranformFeedback(gl) {
    _classCallCheck(this, TranformFeedback);

    (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext);
    this.gl = gl;
    this.handle = gl.createTransformFeedback();
    this.userData = {};
    Object.seal(this);
  }

  /**
   * @param {GLenum} target
   * @return {TransformFeedback} returns self to enable chaining
   */


  _createClass(TranformFeedback, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteTransformFeedback(this.handle);
      this.handle = null;
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {GLenum} target
     * @return {TransformFeedback} returns self to enable chaining
     */

  }, {
    key: 'bind',
    value: function bind(target) {
      var gl = this.gl;

      gl.bindTransformFeedback(target, this.handle);
      (0, _context.glCheckError)(gl);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind(target) {
      var gl = this.gl;

      gl.bindTransformFeedback(target, null);
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {GLenum} primitiveMode
     * @return {TransformFeedback} returns self to enable chaining
     */

  }, {
    key: 'begin',
    value: function begin(primitiveMode) {
      var gl = this.gl;

      gl.beginTransformFeedback(primitiveMode);
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @return {TransformFeedback} returns self to enable chaining
     */

  }, {
    key: 'pause',
    value: function pause() {
      var gl = this.gl;

      gl.pauseTransformFeedback();
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @return {TransformFeedback} returns self to enable chaining
     */

  }, {
    key: 'resume',
    value: function resume() {
      var gl = this.gl;

      gl.resumeTransformFeedback();
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @return {TransformFeedback} returns self to enable chaining
     */

  }, {
    key: 'end',
    value: function end() {
      var gl = this.gl;

      gl.endTransformFeedback();
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {WebGLProgram?} program
     * @param {sequence<DOMString>} varyings
     * @param {GLenum} bufferMode
     * @return {TransformFeedback} returns self to enable chaining
     */

  }, {
    key: 'varyings',
    value: function varyings(program, _varyings, bufferMode) {
      var gl = this.gl;

      var result = gl.transformFeedbackVaryings(program, _varyings, bufferMode);
      (0, _context.glCheckError)(gl);
      return result;
    }

    /**
     * @param {WebGLProgram} program
     * @param {GLuint} index
     * @return {WebGLActiveInfo} - object with {name, size, type}
     */

  }, {
    key: 'getVarying',
    value: function getVarying(program, index) {
      var gl = this.gl;

      var result = gl.getTransformFeedbackVarying(program, index);
      (0, _context.glCheckError)(gl);
      return result;
    }
  }]);

  return TranformFeedback;
}();

exports.default = TranformFeedback;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvdHJhbnNmb3JtLWZlZWRiYWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUdBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztJQVdxQixnQjs7Ozs7OztBQU1uQiw0QkFBWSxFQUFaLEVBQWdCO0FBQUE7O0FBQ2QsMEJBQU8sZ0RBQVA7QUFDQSxTQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsU0FBSyxNQUFMLEdBQWMsR0FBRyx1QkFBSCxFQUFkO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0EsV0FBTyxJQUFQLENBQVksSUFBWjtBQUNEOzs7Ozs7Ozs7OzhCQU1RO0FBQUEsVUFDQSxFQURBLEdBQ00sSUFETixDQUNBLEVBREE7O0FBRVAsU0FBRyx1QkFBSCxDQUEyQixLQUFLLE1BQWhDO0FBQ0EsV0FBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7O3lCQU1JLE0sRUFBUTtBQUFBLFVBQ0osRUFESSxHQUNFLElBREYsQ0FDSixFQURJOztBQUVYLFNBQUcscUJBQUgsQ0FBeUIsTUFBekIsRUFBaUMsS0FBSyxNQUF0QztBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzJCQUVNLE0sRUFBUTtBQUFBLFVBQ04sRUFETSxHQUNBLElBREEsQ0FDTixFQURNOztBQUViLFNBQUcscUJBQUgsQ0FBeUIsTUFBekIsRUFBaUMsSUFBakM7QUFDQSxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7Ozs7OzswQkFNSyxhLEVBQWU7QUFBQSxVQUNaLEVBRFksR0FDTixJQURNLENBQ1osRUFEWTs7QUFFbkIsU0FBRyxzQkFBSCxDQUEwQixhQUExQjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7NEJBS087QUFBQSxVQUNDLEVBREQsR0FDTyxJQURQLENBQ0MsRUFERDs7QUFFTixTQUFHLHNCQUFIO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs2QkFLUTtBQUFBLFVBQ0EsRUFEQSxHQUNNLElBRE4sQ0FDQSxFQURBOztBQUVQLFNBQUcsdUJBQUg7QUFDQSxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7Ozs7OzBCQUtLO0FBQUEsVUFDRyxFQURILEdBQ1MsSUFEVCxDQUNHLEVBREg7O0FBRUosU0FBRyxvQkFBSDtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7Ozs7NkJBUVEsTyxFQUFTLFMsRUFBVSxVLEVBQVk7QUFBQSxVQUMvQixFQUQrQixHQUN6QixJQUR5QixDQUMvQixFQUQrQjs7QUFFdEMsVUFBTSxTQUFTLEdBQUcseUJBQUgsQ0FBNkIsT0FBN0IsRUFBc0MsU0FBdEMsRUFBZ0QsVUFBaEQsQ0FBZjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLE1BQVA7QUFDRDs7Ozs7Ozs7OzsrQkFPVSxPLEVBQVMsSyxFQUFPO0FBQUEsVUFDbEIsRUFEa0IsR0FDWixJQURZLENBQ2xCLEVBRGtCOztBQUV6QixVQUFNLFNBQVMsR0FBRywyQkFBSCxDQUErQixPQUEvQixFQUF3QyxLQUF4QyxDQUFmO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sTUFBUDtBQUNEOzs7Ozs7a0JBNUdrQixnQiIsImZpbGUiOiJ0cmFuc2Zvcm0tZmVlZGJhY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTDIgVHJhbnNmb3JtIEZlZWRiYWNrIEhlbHBlclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYkdMUXVlcnlcblxuaW1wb3J0IHtXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuLi9jb250ZXh0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuLy8gdm9pZCBiaW5kVHJhbnNmb3JtRmVlZGJhY2sgKEdMZW51bSB0YXJnZXQsIFdlYkdMVHJhbnNmb3JtRmVlZGJhY2s/IGlkKTtcbi8vIHZvaWQgYmVnaW5UcmFuc2Zvcm1GZWVkYmFjayhHTGVudW0gcHJpbWl0aXZlTW9kZSk7XG4vLyB2b2lkIGVuZFRyYW5zZm9ybUZlZWRiYWNrKCk7XG4vLyB2b2lkIHRyYW5zZm9ybUZlZWRiYWNrVmFyeWluZ3MoV2ViR0xQcm9ncmFtPyBwcm9ncmFtLCBzZXF1ZW5jZTxET01TdHJpbmc+IHZhcnlpbmdzLCBHTGVudW0gYnVmZmVyTW9kZSk7XG4vLyBXZWJHTEFjdGl2ZUluZm8/IGdldFRyYW5zZm9ybUZlZWRiYWNrVmFyeWluZyhXZWJHTFByb2dyYW0/IHByb2dyYW0sIEdMdWludCBpbmRleCk7XG4vLyB2b2lkIHBhdXNlVHJhbnNmb3JtRmVlZGJhY2soKTtcbi8vIHZvaWQgcmVzdW1lVHJhbnNmb3JtRmVlZGJhY2soKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVHJhbmZvcm1GZWVkYmFjayB7XG5cbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGdsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCkge1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVRyYW5zZm9ybUZlZWRiYWNrKCk7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSB0YXJnZXRcbiAgICogQHJldHVybiB7VHJhbnNmb3JtRmVlZGJhY2t9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVUcmFuc2Zvcm1GZWVkYmFjayh0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGVudW19IHRhcmdldFxuICAgKiBAcmV0dXJuIHtUcmFuc2Zvcm1GZWVkYmFja30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgYmluZCh0YXJnZXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kVHJhbnNmb3JtRmVlZGJhY2sodGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuYmluZCh0YXJnZXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kVHJhbnNmb3JtRmVlZGJhY2sodGFyZ2V0LCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBwcmltaXRpdmVNb2RlXG4gICAqIEByZXR1cm4ge1RyYW5zZm9ybUZlZWRiYWNrfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBiZWdpbihwcmltaXRpdmVNb2RlKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmVnaW5UcmFuc2Zvcm1GZWVkYmFjayhwcmltaXRpdmVNb2RlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1RyYW5zZm9ybUZlZWRiYWNrfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBwYXVzZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5wYXVzZVRyYW5zZm9ybUZlZWRiYWNrKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtUcmFuc2Zvcm1GZWVkYmFja30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgcmVzdW1lKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnJlc3VtZVRyYW5zZm9ybUZlZWRiYWNrKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtUcmFuc2Zvcm1GZWVkYmFja30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmVuZFRyYW5zZm9ybUZlZWRiYWNrKCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1dlYkdMUHJvZ3JhbT99IHByb2dyYW1cbiAgICogQHBhcmFtIHtzZXF1ZW5jZTxET01TdHJpbmc+fSB2YXJ5aW5nc1xuICAgKiBAcGFyYW0ge0dMZW51bX0gYnVmZmVyTW9kZVxuICAgKiBAcmV0dXJuIHtUcmFuc2Zvcm1GZWVkYmFja30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgdmFyeWluZ3MocHJvZ3JhbSwgdmFyeWluZ3MsIGJ1ZmZlck1vZGUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHQgPSBnbC50cmFuc2Zvcm1GZWVkYmFja1ZhcnlpbmdzKHByb2dyYW0sIHZhcnlpbmdzLCBidWZmZXJNb2RlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtXZWJHTFByb2dyYW19IHByb2dyYW1cbiAgICogQHBhcmFtIHtHTHVpbnR9IGluZGV4XG4gICAqIEByZXR1cm4ge1dlYkdMQWN0aXZlSW5mb30gLSBvYmplY3Qgd2l0aCB7bmFtZSwgc2l6ZSwgdHlwZX1cbiAgICovXG4gIGdldFZhcnlpbmcocHJvZ3JhbSwgaW5kZXgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRUcmFuc2Zvcm1GZWVkYmFja1ZhcnlpbmcocHJvZ3JhbSwgaW5kZXgpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG59XG4iXX0=