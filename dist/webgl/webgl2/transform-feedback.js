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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvdHJhbnNmb3JtLWZlZWRiYWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWdCcUI7Ozs7Ozs7QUFNbkIsV0FObUIsZ0JBTW5CLENBQVksRUFBWixFQUFnQjswQkFORyxrQkFNSDs7QUFDZCwwQkFBTywyQ0FBUCxFQURjO0FBRWQsU0FBSyxFQUFMLEdBQVUsRUFBVixDQUZjO0FBR2QsU0FBSyxNQUFMLEdBQWMsR0FBRyx1QkFBSCxFQUFkLENBSGM7QUFJZCxTQUFLLFFBQUwsR0FBZ0IsRUFBaEIsQ0FKYztBQUtkLFdBQU8sSUFBUCxDQUFZLElBQVosRUFMYztHQUFoQjs7Ozs7Ozs7ZUFObUI7OzhCQWtCVjtVQUNBLEtBQU0sS0FBTixHQURBOztBQUVQLFNBQUcsdUJBQUgsQ0FBMkIsS0FBSyxNQUFMLENBQTNCLENBRk87QUFHUCxXQUFLLE1BQUwsR0FBYyxJQUFkLENBSE87QUFJUCxpQ0FBYSxFQUFiLEVBSk87QUFLUCxhQUFPLElBQVAsQ0FMTzs7Ozs7Ozs7Ozt5QkFZSixRQUFRO1VBQ0osS0FBTSxLQUFOLEdBREk7O0FBRVgsU0FBRyxxQkFBSCxDQUF5QixNQUF6QixFQUFpQyxLQUFLLE1BQUwsQ0FBakMsQ0FGVztBQUdYLGlDQUFhLEVBQWIsRUFIVztBQUlYLGFBQU8sSUFBUCxDQUpXOzs7OzJCQU9OLFFBQVE7VUFDTixLQUFNLEtBQU4sR0FETTs7QUFFYixTQUFHLHFCQUFILENBQXlCLE1BQXpCLEVBQWlDLElBQWpDLEVBRmE7QUFHYixpQ0FBYSxFQUFiLEVBSGE7QUFJYixhQUFPLElBQVAsQ0FKYTs7Ozs7Ozs7OzswQkFXVCxlQUFlO1VBQ1osS0FBTSxLQUFOLEdBRFk7O0FBRW5CLFNBQUcsc0JBQUgsQ0FBMEIsYUFBMUIsRUFGbUI7QUFHbkIsaUNBQWEsRUFBYixFQUhtQjtBQUluQixhQUFPLElBQVAsQ0FKbUI7Ozs7Ozs7Ozs0QkFVYjtVQUNDLEtBQU0sS0FBTixHQUREOztBQUVOLFNBQUcsc0JBQUgsR0FGTTtBQUdOLGlDQUFhLEVBQWIsRUFITTtBQUlOLGFBQU8sSUFBUCxDQUpNOzs7Ozs7Ozs7NkJBVUM7VUFDQSxLQUFNLEtBQU4sR0FEQTs7QUFFUCxTQUFHLHVCQUFILEdBRk87QUFHUCxpQ0FBYSxFQUFiLEVBSE87QUFJUCxhQUFPLElBQVAsQ0FKTzs7Ozs7Ozs7OzBCQVVIO1VBQ0csS0FBTSxLQUFOLEdBREg7O0FBRUosU0FBRyxvQkFBSCxHQUZJO0FBR0osaUNBQWEsRUFBYixFQUhJO0FBSUosYUFBTyxJQUFQLENBSkk7Ozs7Ozs7Ozs7Ozs2QkFhRyxTQUFTLFdBQVUsWUFBWTtVQUMvQixLQUFNLEtBQU4sR0FEK0I7O0FBRXRDLFVBQU0sU0FBUyxHQUFHLHlCQUFILENBQTZCLE9BQTdCLEVBQXNDLFNBQXRDLEVBQWdELFVBQWhELENBQVQsQ0FGZ0M7QUFHdEMsaUNBQWEsRUFBYixFQUhzQztBQUl0QyxhQUFPLE1BQVAsQ0FKc0M7Ozs7Ozs7Ozs7OytCQVk3QixTQUFTLE9BQU87VUFDbEIsS0FBTSxLQUFOLEdBRGtCOztBQUV6QixVQUFNLFNBQVMsR0FBRywyQkFBSCxDQUErQixPQUEvQixFQUF3QyxLQUF4QyxDQUFULENBRm1CO0FBR3pCLGlDQUFhLEVBQWIsRUFIeUI7QUFJekIsYUFBTyxNQUFQLENBSnlCOzs7O1NBdkdSIiwiZmlsZSI6InRyYW5zZm9ybS1mZWVkYmFjay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdlYkdMMiBUcmFuc2Zvcm0gRmVlZGJhY2sgSGVscGVyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViR0xRdWVyeVxuXG5pbXBvcnQge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4vLyB2b2lkIGJpbmRUcmFuc2Zvcm1GZWVkYmFjayAoR0xlbnVtIHRhcmdldCwgV2ViR0xUcmFuc2Zvcm1GZWVkYmFjaz8gaWQpO1xuLy8gdm9pZCBiZWdpblRyYW5zZm9ybUZlZWRiYWNrKEdMZW51bSBwcmltaXRpdmVNb2RlKTtcbi8vIHZvaWQgZW5kVHJhbnNmb3JtRmVlZGJhY2soKTtcbi8vIHZvaWQgdHJhbnNmb3JtRmVlZGJhY2tWYXJ5aW5ncyhXZWJHTFByb2dyYW0/IHByb2dyYW0sIHNlcXVlbmNlPERPTVN0cmluZz4gdmFyeWluZ3MsIEdMZW51bSBidWZmZXJNb2RlKTtcbi8vIFdlYkdMQWN0aXZlSW5mbz8gZ2V0VHJhbnNmb3JtRmVlZGJhY2tWYXJ5aW5nKFdlYkdMUHJvZ3JhbT8gcHJvZ3JhbSwgR0x1aW50IGluZGV4KTtcbi8vIHZvaWQgcGF1c2VUcmFuc2Zvcm1GZWVkYmFjaygpO1xuLy8gdm9pZCByZXN1bWVUcmFuc2Zvcm1GZWVkYmFjaygpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcmFuZm9ybUZlZWRiYWNrIHtcblxuICAvKipcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZ2xcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlVHJhbnNmb3JtRmVlZGJhY2soKTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGVudW19IHRhcmdldFxuICAgKiBAcmV0dXJuIHtUcmFuc2Zvcm1GZWVkYmFja30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVRyYW5zZm9ybUZlZWRiYWNrKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gdGFyZ2V0XG4gICAqIEByZXR1cm4ge1RyYW5zZm9ybUZlZWRiYWNrfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBiaW5kKHRhcmdldCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRUcmFuc2Zvcm1GZWVkYmFjayh0YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKHRhcmdldCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRUcmFuc2Zvcm1GZWVkYmFjayh0YXJnZXQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGVudW19IHByaW1pdGl2ZU1vZGVcbiAgICogQHJldHVybiB7VHJhbnNmb3JtRmVlZGJhY2t9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGJlZ2luKHByaW1pdGl2ZU1vZGUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iZWdpblRyYW5zZm9ybUZlZWRiYWNrKHByaW1pdGl2ZU1vZGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7VHJhbnNmb3JtRmVlZGJhY2t9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHBhdXNlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnBhdXNlVHJhbnNmb3JtRmVlZGJhY2soKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1RyYW5zZm9ybUZlZWRiYWNrfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICByZXN1bWUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wucmVzdW1lVHJhbnNmb3JtRmVlZGJhY2soKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1RyYW5zZm9ybUZlZWRiYWNrfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBlbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZW5kVHJhbnNmb3JtRmVlZGJhY2soKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7V2ViR0xQcm9ncmFtP30gcHJvZ3JhbVxuICAgKiBAcGFyYW0ge3NlcXVlbmNlPERPTVN0cmluZz59IHZhcnlpbmdzXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBidWZmZXJNb2RlXG4gICAqIEByZXR1cm4ge1RyYW5zZm9ybUZlZWRiYWNrfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICB2YXJ5aW5ncyhwcm9ncmFtLCB2YXJ5aW5ncywgYnVmZmVyTW9kZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdCA9IGdsLnRyYW5zZm9ybUZlZWRiYWNrVmFyeWluZ3MocHJvZ3JhbSwgdmFyeWluZ3MsIGJ1ZmZlck1vZGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1dlYkdMUHJvZ3JhbX0gcHJvZ3JhbVxuICAgKiBAcGFyYW0ge0dMdWludH0gaW5kZXhcbiAgICogQHJldHVybiB7V2ViR0xBY3RpdmVJbmZvfSAtIG9iamVjdCB3aXRoIHtuYW1lLCBzaXplLCB0eXBlfVxuICAgKi9cbiAgZ2V0VmFyeWluZyhwcm9ncmFtLCBpbmRleCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFRyYW5zZm9ybUZlZWRiYWNrVmFyeWluZyhwcm9ncmFtLCBpbmRleCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbn1cbiJdfQ==