'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Sampler Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _types = require('./types');

var _context = require('../context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

    (0, _assert2.default)(gl instanceof _types.WebGL2RenderingContext);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvc2FtcGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVxQjs7Ozs7OztBQU1uQixXQU5tQixPQU1uQixDQUFZLEVBQVosRUFBZ0I7MEJBTkcsU0FNSDs7QUFDZCwwQkFBTywyQ0FBUCxFQURjO0FBRWQsU0FBSyxFQUFMLEdBQVUsRUFBVixDQUZjO0FBR2QsU0FBSyxNQUFMLEdBQWMsR0FBRyxhQUFILEVBQWQsQ0FIYztBQUlkLCtCQUFhLEVBQWIsRUFKYztBQUtkLFNBQUssUUFBTCxHQUFnQixFQUFoQixDQUxjO0FBTWQsV0FBTyxJQUFQLENBQVksSUFBWixFQU5jO0dBQWhCOzs7Ozs7O2VBTm1COzs4QkFrQlY7VUFDQSxLQUFNLEtBQU4sR0FEQTs7QUFFUCxTQUFHLGFBQUgsQ0FBaUIsS0FBSyxNQUFMLENBQWpCLENBRk87QUFHUCxXQUFLLE1BQUwsR0FBYyxJQUFkLENBSE87QUFJUCxpQ0FBYSxFQUFiLEVBSk87QUFLUCxhQUFPLElBQVAsQ0FMTzs7Ozs7Ozs7Ozt5QkFZSixNQUFNO1VBQ0YsS0FBTSxLQUFOLEdBREU7O0FBRVQsU0FBRyxXQUFILENBQWUsSUFBZixFQUFxQixLQUFLLE1BQUwsQ0FBckIsQ0FGUztBQUdULGlDQUFhLEVBQWIsRUFIUztBQUlULGFBQU8sSUFBUCxDQUpTOzs7Ozs7Ozs7OzJCQVdKLE1BQU07VUFDSixLQUFNLEtBQU4sR0FESTs7QUFFWCxTQUFHLFdBQUgsQ0FBZSxJQUFmLEVBQXFCLElBQXJCLEVBRlc7QUFHWCxpQ0FBYSxFQUFiLEVBSFc7QUFJWCxhQUFPLElBQVAsQ0FKVzs7Ozs7Ozs7Ozs7K0JBWUYsT0FBTyxPQUFPO1VBQ2hCLEtBQU0sS0FBTixHQURnQjs7QUFFdkIsU0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQUwsRUFBYSxLQUFsQyxFQUF5QyxLQUF6QyxFQUZ1QjtBQUd2QixpQ0FBYSxFQUFiLEVBSHVCO0FBSXZCLGFBQU8sSUFBUCxDQUp1Qjs7Ozs7Ozs7Ozs7K0JBWWQsT0FBTyxPQUFPO1VBQ2hCLEtBQU0sS0FBTixHQURnQjs7QUFFdkIsU0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQUwsRUFBYSxLQUFsQyxFQUF5QyxLQUF6QyxFQUZ1QjtBQUd2QixpQ0FBYSxFQUFiLEVBSHVCO0FBSXZCLGFBQU8sSUFBUCxDQUp1Qjs7Ozs7Ozs7aUNBU1osT0FBTztVQUNYLEtBQU0sS0FBTixHQURXOztBQUVsQixVQUFNLFNBQVMsR0FBRyxtQkFBSCxDQUF1QixLQUFLLE1BQUwsRUFBYSxLQUFwQyxDQUFULENBRlk7QUFHbEIsaUNBQWEsRUFBYixFQUhrQjtBQUlsQixhQUFPLE1BQVAsQ0FKa0I7Ozs7U0ExRUQiLCJmaWxlIjoic2FtcGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdlYkdMMiBTYW1wbGVyIEhlbHBlclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYkdMUXVlcnlcblxuaW1wb3J0IHtXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuLi9jb250ZXh0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gV2ViR0xTYW1wbGVyPyBjcmVhdGVTYW1wbGVyKCk7XG4vLyB2b2lkIGRlbGV0ZVNhbXBsZXIoV2ViR0xTYW1wbGVyPyBzYW1wbGVyKTtcbi8vIFtXZWJHTEhhbmRsZXNDb250ZXh0TG9zc10gR0xib29sZWFuIGlzU2FtcGxlcihXZWJHTFNhbXBsZXI/IHNhbXBsZXIpO1xuLy8gdm9pZCBiaW5kU2FtcGxlcihHTHVpbnQgdW5pdCwgV2ViR0xTYW1wbGVyPyBzYW1wbGVyKTtcbi8vIHZvaWQgc2FtcGxlclBhcmFtZXRlcmkoV2ViR0xTYW1wbGVyPyBzYW1wbGVyLCBHTGVudW0gcG5hbWUsIEdMaW50IHBhcmFtKTtcbi8vIHZvaWQgc2FtcGxlclBhcmFtZXRlcmYoV2ViR0xTYW1wbGVyPyBzYW1wbGVyLCBHTGVudW0gcG5hbWUsIEdMZmxvYXQgcGFyYW0pO1xuLy8gYW55IGdldFNhbXBsZXJQYXJhbWV0ZXIoV2ViR0xTYW1wbGVyPyBzYW1wbGVyLCBHTGVudW0gcG5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTYW1wbGVyIHtcblxuICAvKipcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZ2xcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2FtcGxlcigpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1NhbXBsZXJ9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVTYW1wbGVyKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMdWludH0gdW5pdFxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBiaW5kKHVuaXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kU2FtcGxlcih1bml0LCB0aGlzLmhhbmRsZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMdWludH0gdW5pdFxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICB1bmJpbmQodW5pdCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRTYW1wbGVyKHVuaXQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGVudW19IHBuYW1lXG4gICAqIEBwYXJhbSB7R0xpbnR9IHBhcmFtXG4gICAqIEByZXR1cm4ge1NhbXBsZXJ9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHBhcmFtZXRlcmkocG5hbWUsIHBhcmFtKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuc2FtcGxlclBhcmFtZXRlcmkodGhpcy5oYW5kbGUsIHBuYW1lLCBwYXJhbSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gcG5hbWVcbiAgICogQHBhcmFtIHtHTGZsb2F0fSBwYXJhbVxuICAgKiBAcmV0dXJuIHtTYW1wbGVyfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBwYXJhbWV0ZXJmKHBuYW1lLCBwYXJhbSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnNhbXBsZXJQYXJhbWV0ZXJmKHRoaXMuaGFuZGxlLCBwbmFtZSwgcGFyYW0pO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBAcGFyYW0ge0dMZW51bX0gcG5hbWVcbiAgLy8gQHJldHVybiB7Kn0gcmVzdWx0XG4gIGdldFBhcmFtZXRlcihwbmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFNhbXBsZXJQYXJhbWV0ZXIodGhpcy5oYW5kbGUsIHBuYW1lKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxufVxuIl19