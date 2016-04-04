'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Transform Feedback Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _types = require('./types');

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

    (0, _assert2.default)(gl instanceof _types.WebGL2RenderingContext);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvdHJhbnNmb3JtLWZlZWRiYWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUdBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztJQVdxQjs7Ozs7OztBQU1uQixXQU5tQixnQkFNbkIsQ0FBWSxFQUFaLEVBQWdCOzBCQU5HLGtCQU1IOztBQUNkLDBCQUFPLDJDQUFQLEVBRGM7QUFFZCxTQUFLLEVBQUwsR0FBVSxFQUFWLENBRmM7QUFHZCxTQUFLLE1BQUwsR0FBYyxHQUFHLHVCQUFILEVBQWQsQ0FIYztBQUlkLFNBQUssUUFBTCxHQUFnQixFQUFoQixDQUpjO0FBS2QsV0FBTyxJQUFQLENBQVksSUFBWixFQUxjO0dBQWhCOzs7Ozs7OztlQU5tQjs7OEJBa0JWO1VBQ0EsS0FBTSxLQUFOLEdBREE7O0FBRVAsU0FBRyx1QkFBSCxDQUEyQixLQUFLLE1BQUwsQ0FBM0IsQ0FGTztBQUdQLFdBQUssTUFBTCxHQUFjLElBQWQsQ0FITztBQUlQLGlDQUFhLEVBQWIsRUFKTztBQUtQLGFBQU8sSUFBUCxDQUxPOzs7Ozs7Ozs7O3lCQVlKLFFBQVE7VUFDSixLQUFNLEtBQU4sR0FESTs7QUFFWCxTQUFHLHFCQUFILENBQXlCLE1BQXpCLEVBQWlDLEtBQUssTUFBTCxDQUFqQyxDQUZXO0FBR1gsaUNBQWEsRUFBYixFQUhXO0FBSVgsYUFBTyxJQUFQLENBSlc7Ozs7MkJBT04sUUFBUTtVQUNOLEtBQU0sS0FBTixHQURNOztBQUViLFNBQUcscUJBQUgsQ0FBeUIsTUFBekIsRUFBaUMsSUFBakMsRUFGYTtBQUdiLGlDQUFhLEVBQWIsRUFIYTtBQUliLGFBQU8sSUFBUCxDQUphOzs7Ozs7Ozs7OzBCQVdULGVBQWU7VUFDWixLQUFNLEtBQU4sR0FEWTs7QUFFbkIsU0FBRyxzQkFBSCxDQUEwQixhQUExQixFQUZtQjtBQUduQixpQ0FBYSxFQUFiLEVBSG1CO0FBSW5CLGFBQU8sSUFBUCxDQUptQjs7Ozs7Ozs7OzRCQVViO1VBQ0MsS0FBTSxLQUFOLEdBREQ7O0FBRU4sU0FBRyxzQkFBSCxHQUZNO0FBR04saUNBQWEsRUFBYixFQUhNO0FBSU4sYUFBTyxJQUFQLENBSk07Ozs7Ozs7Ozs2QkFVQztVQUNBLEtBQU0sS0FBTixHQURBOztBQUVQLFNBQUcsdUJBQUgsR0FGTztBQUdQLGlDQUFhLEVBQWIsRUFITztBQUlQLGFBQU8sSUFBUCxDQUpPOzs7Ozs7Ozs7MEJBVUg7VUFDRyxLQUFNLEtBQU4sR0FESDs7QUFFSixTQUFHLG9CQUFILEdBRkk7QUFHSixpQ0FBYSxFQUFiLEVBSEk7QUFJSixhQUFPLElBQVAsQ0FKSTs7Ozs7Ozs7Ozs7OzZCQWFHLFNBQVMsV0FBVSxZQUFZO1VBQy9CLEtBQU0sS0FBTixHQUQrQjs7QUFFdEMsVUFBTSxTQUFTLEdBQUcseUJBQUgsQ0FBNkIsT0FBN0IsRUFBc0MsU0FBdEMsRUFBZ0QsVUFBaEQsQ0FBVCxDQUZnQztBQUd0QyxpQ0FBYSxFQUFiLEVBSHNDO0FBSXRDLGFBQU8sTUFBUCxDQUpzQzs7Ozs7Ozs7Ozs7K0JBWTdCLFNBQVMsT0FBTztVQUNsQixLQUFNLEtBQU4sR0FEa0I7O0FBRXpCLFVBQU0sU0FBUyxHQUFHLDJCQUFILENBQStCLE9BQS9CLEVBQXdDLEtBQXhDLENBQVQsQ0FGbUI7QUFHekIsaUNBQWEsRUFBYixFQUh5QjtBQUl6QixhQUFPLE1BQVAsQ0FKeUI7Ozs7U0F2R1IiLCJmaWxlIjoidHJhbnNmb3JtLWZlZWRiYWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFRyYW5zZm9ybSBGZWVkYmFjayBIZWxwZXJcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJHTFF1ZXJ5XG5cbmltcG9ydCB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi4vY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbi8vIHZvaWQgYmluZFRyYW5zZm9ybUZlZWRiYWNrIChHTGVudW0gdGFyZ2V0LCBXZWJHTFRyYW5zZm9ybUZlZWRiYWNrPyBpZCk7XG4vLyB2b2lkIGJlZ2luVHJhbnNmb3JtRmVlZGJhY2soR0xlbnVtIHByaW1pdGl2ZU1vZGUpO1xuLy8gdm9pZCBlbmRUcmFuc2Zvcm1GZWVkYmFjaygpO1xuLy8gdm9pZCB0cmFuc2Zvcm1GZWVkYmFja1ZhcnlpbmdzKFdlYkdMUHJvZ3JhbT8gcHJvZ3JhbSwgc2VxdWVuY2U8RE9NU3RyaW5nPiB2YXJ5aW5ncywgR0xlbnVtIGJ1ZmZlck1vZGUpO1xuLy8gV2ViR0xBY3RpdmVJbmZvPyBnZXRUcmFuc2Zvcm1GZWVkYmFja1ZhcnlpbmcoV2ViR0xQcm9ncmFtPyBwcm9ncmFtLCBHTHVpbnQgaW5kZXgpO1xuLy8gdm9pZCBwYXVzZVRyYW5zZm9ybUZlZWRiYWNrKCk7XG4vLyB2b2lkIHJlc3VtZVRyYW5zZm9ybUZlZWRiYWNrKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRyYW5mb3JtRmVlZGJhY2sge1xuXG4gIC8qKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBnbFxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wpIHtcbiAgICBhc3NlcnQoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVUcmFuc2Zvcm1GZWVkYmFjaygpO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gdGFyZ2V0XG4gICAqIEByZXR1cm4ge1RyYW5zZm9ybUZlZWRiYWNrfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlVHJhbnNmb3JtRmVlZGJhY2sodGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xlbnVtfSB0YXJnZXRcbiAgICogQHJldHVybiB7VHJhbnNmb3JtRmVlZGJhY2t9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGJpbmQodGFyZ2V0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFRyYW5zZm9ybUZlZWRiYWNrKHRhcmdldCwgdGhpcy5oYW5kbGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQodGFyZ2V0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFRyYW5zZm9ybUZlZWRiYWNrKHRhcmdldCwgbnVsbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gcHJpbWl0aXZlTW9kZVxuICAgKiBAcmV0dXJuIHtUcmFuc2Zvcm1GZWVkYmFja30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgYmVnaW4ocHJpbWl0aXZlTW9kZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJlZ2luVHJhbnNmb3JtRmVlZGJhY2socHJpbWl0aXZlTW9kZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtUcmFuc2Zvcm1GZWVkYmFja30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgcGF1c2UoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wucGF1c2VUcmFuc2Zvcm1GZWVkYmFjaygpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7VHJhbnNmb3JtRmVlZGJhY2t9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHJlc3VtZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5yZXN1bWVUcmFuc2Zvcm1GZWVkYmFjaygpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7VHJhbnNmb3JtRmVlZGJhY2t9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGVuZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5lbmRUcmFuc2Zvcm1GZWVkYmFjaygpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtXZWJHTFByb2dyYW0/fSBwcm9ncmFtXG4gICAqIEBwYXJhbSB7c2VxdWVuY2U8RE9NU3RyaW5nPn0gdmFyeWluZ3NcbiAgICogQHBhcmFtIHtHTGVudW19IGJ1ZmZlck1vZGVcbiAgICogQHJldHVybiB7VHJhbnNmb3JtRmVlZGJhY2t9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHZhcnlpbmdzKHByb2dyYW0sIHZhcnlpbmdzLCBidWZmZXJNb2RlKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0ID0gZ2wudHJhbnNmb3JtRmVlZGJhY2tWYXJ5aW5ncyhwcm9ncmFtLCB2YXJ5aW5ncywgYnVmZmVyTW9kZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7V2ViR0xQcm9ncmFtfSBwcm9ncmFtXG4gICAqIEBwYXJhbSB7R0x1aW50fSBpbmRleFxuICAgKiBAcmV0dXJuIHtXZWJHTEFjdGl2ZUluZm99IC0gb2JqZWN0IHdpdGgge25hbWUsIHNpemUsIHR5cGV9XG4gICAqL1xuICBnZXRWYXJ5aW5nKHByb2dyYW0sIGluZGV4KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0VHJhbnNmb3JtRmVlZGJhY2tWYXJ5aW5nKHByb2dyYW0sIGluZGV4KTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxufVxuIl19