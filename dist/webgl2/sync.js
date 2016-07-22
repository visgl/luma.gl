'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Sync Object Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _webglTypes = require('./webgl-types');

var _context = require('../context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// WebGLSync? fenceSync(GLenum condition, GLbitfield flags);
// [WebGLHandlesContextLoss] GLboolean isSync(WebGLSync? sync);
// void deleteSync(WebGLSync? sync);
// GLenum clientWaitSync(WebGLSync? sync, GLbitfield flags, GLint64 timeout);
// void waitSync(WebGLSync? sync, GLbitfield flags, GLint64 timeout);
// any getSyncParameter(WebGLSync? sync, GLenum pname);

var Sync = function () {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   * @param {GLenum} condition
   * @param {GLbitfield} flags
   */

  function Sync(gl, _ref) {
    var condition = _ref.condition;
    var flags = _ref.flags;

    _classCallCheck(this, Sync);

    (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext);
    this.gl = gl;
    condition = condition || gl.SYNC_GPU_COMMANDS_COMPLETE;
    this.handle = gl.fenceSync(condition, flags);
    (0, _context.glCheckError)(gl);
    this.userData = {};
    Object.seal(this);
  }

  /**
   * @return {Sync} returns self to enable chaining
   */


  _createClass(Sync, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteSync(this.handle);
      this.handle = null;
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {GLbitfield} flags
     * @param {GLint64} timeout
     * @return {Sync} returns self to enable chaining
     */

  }, {
    key: 'wait',
    value: function wait(flags, timeout) {
      var gl = this.gl;

      gl.waitSync(this.handle, flags, timeout);
      (0, _context.glCheckError)(gl);
      return this;
    }

    /**
     * @param {GLbitfield} flags
     * @param {GLint64} timeout
     * @return {GLenum} result
     */

  }, {
    key: 'clientWait',
    value: function clientWait(flags, timeout) {
      var gl = this.gl;

      var result = gl.clientWaitSync(this.handle, flags, timeout);
      (0, _context.glCheckError)(gl);
      return result;
    }

    // @param {GLenum} pname

  }, {
    key: 'getParameter',
    value: function getParameter(pname) {
      var gl = this.gl;

      var result = gl.getSyncParameter(this.handle, pname);
      (0, _context.glCheckError)(gl);
      return result;
    }
  }]);

  return Sync;
}();

exports.default = Sync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvc3luYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFHQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7O0lBU3FCLEk7Ozs7Ozs7OztBQVFuQixnQkFBWSxFQUFaLFFBQW9DO0FBQUEsUUFBbkIsU0FBbUIsUUFBbkIsU0FBbUI7QUFBQSxRQUFSLEtBQVEsUUFBUixLQUFROztBQUFBOztBQUNsQywwQkFBTyxnREFBUDtBQUNBLFNBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxnQkFBWSxhQUFhLEdBQUcsMEJBQTVCO0FBQ0EsU0FBSyxNQUFMLEdBQWMsR0FBRyxTQUFILENBQWEsU0FBYixFQUF3QixLQUF4QixDQUFkO0FBQ0EsK0JBQWEsRUFBYjtBQUNBLFNBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNBLFdBQU8sSUFBUCxDQUFZLElBQVo7QUFDRDs7Ozs7Ozs7OzhCQUtRO0FBQUEsVUFDQSxFQURBLEdBQ00sSUFETixDQUNBLEVBREE7O0FBRVAsU0FBRyxVQUFILENBQWMsS0FBSyxNQUFuQjtBQUNBLFdBQUssTUFBTCxHQUFjLElBQWQ7QUFDQSxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7Ozs7Ozs7eUJBT0ksSyxFQUFPLE8sRUFBUztBQUFBLFVBQ1osRUFEWSxHQUNOLElBRE0sQ0FDWixFQURZOztBQUVuQixTQUFHLFFBQUgsQ0FBWSxLQUFLLE1BQWpCLEVBQXlCLEtBQXpCLEVBQWdDLE9BQWhDO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7Ozs7OytCQU9VLEssRUFBTyxPLEVBQVM7QUFBQSxVQUNsQixFQURrQixHQUNaLElBRFksQ0FDbEIsRUFEa0I7O0FBRXpCLFVBQU0sU0FBUyxHQUFHLGNBQUgsQ0FBa0IsS0FBSyxNQUF2QixFQUErQixLQUEvQixFQUFzQyxPQUF0QyxDQUFmO0FBQ0EsaUNBQWEsRUFBYjtBQUNBLGFBQU8sTUFBUDtBQUNEOzs7Ozs7aUNBR1ksSyxFQUFPO0FBQUEsVUFDWCxFQURXLEdBQ0wsSUFESyxDQUNYLEVBRFc7O0FBRWxCLFVBQU0sU0FBUyxHQUFHLGdCQUFILENBQW9CLEtBQUssTUFBekIsRUFBaUMsS0FBakMsQ0FBZjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLE1BQVA7QUFDRDs7Ozs7O2tCQTNEa0IsSSIsImZpbGUiOiJzeW5jLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFN5bmMgT2JqZWN0IEhlbHBlclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYkdMUXVlcnlcblxuaW1wb3J0IHtXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuLi9jb250ZXh0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gV2ViR0xTeW5jPyBmZW5jZVN5bmMoR0xlbnVtIGNvbmRpdGlvbiwgR0xiaXRmaWVsZCBmbGFncyk7XG4vLyBbV2ViR0xIYW5kbGVzQ29udGV4dExvc3NdIEdMYm9vbGVhbiBpc1N5bmMoV2ViR0xTeW5jPyBzeW5jKTtcbi8vIHZvaWQgZGVsZXRlU3luYyhXZWJHTFN5bmM/IHN5bmMpO1xuLy8gR0xlbnVtIGNsaWVudFdhaXRTeW5jKFdlYkdMU3luYz8gc3luYywgR0xiaXRmaWVsZCBmbGFncywgR0xpbnQ2NCB0aW1lb3V0KTtcbi8vIHZvaWQgd2FpdFN5bmMoV2ViR0xTeW5jPyBzeW5jLCBHTGJpdGZpZWxkIGZsYWdzLCBHTGludDY0IHRpbWVvdXQpO1xuLy8gYW55IGdldFN5bmNQYXJhbWV0ZXIoV2ViR0xTeW5jPyBzeW5jLCBHTGVudW0gcG5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTeW5jIHtcblxuICAvKipcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZ2xcbiAgICogQHBhcmFtIHtHTGVudW19IGNvbmRpdGlvblxuICAgKiBAcGFyYW0ge0dMYml0ZmllbGR9IGZsYWdzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwge2NvbmRpdGlvbiwgZmxhZ3N9KSB7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIGNvbmRpdGlvbiA9IGNvbmRpdGlvbiB8fCBnbC5TWU5DX0dQVV9DT01NQU5EU19DT01QTEVURTtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmZlbmNlU3luYyhjb25kaXRpb24sIGZsYWdzKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTeW5jfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlU3luYyh0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGJpdGZpZWxkfSBmbGFnc1xuICAgKiBAcGFyYW0ge0dMaW50NjR9IHRpbWVvdXRcbiAgICogQHJldHVybiB7U3luY30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgd2FpdChmbGFncywgdGltZW91dCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLndhaXRTeW5jKHRoaXMuaGFuZGxlLCBmbGFncywgdGltZW91dCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMYml0ZmllbGR9IGZsYWdzXG4gICAqIEBwYXJhbSB7R0xpbnQ2NH0gdGltZW91dFxuICAgKiBAcmV0dXJuIHtHTGVudW19IHJlc3VsdFxuICAgKi9cbiAgY2xpZW50V2FpdChmbGFncywgdGltZW91dCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdCA9IGdsLmNsaWVudFdhaXRTeW5jKHRoaXMuaGFuZGxlLCBmbGFncywgdGltZW91dCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gQHBhcmFtIHtHTGVudW19IHBuYW1lXG4gIGdldFBhcmFtZXRlcihwbmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFN5bmNQYXJhbWV0ZXIodGhpcy5oYW5kbGUsIHBuYW1lKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxufVxuXG4iXX0=