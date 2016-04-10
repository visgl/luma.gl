'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Sync Object Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _types = require('./types');

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

    (0, _assert2.default)(gl instanceof _types.WebGL2RenderingContext);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvc3luYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFHQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7O0lBU3FCOzs7Ozs7Ozs7QUFRbkIsV0FSbUIsSUFRbkIsQ0FBWSxFQUFaLFFBQW9DO1FBQW5CLDJCQUFtQjtRQUFSLG1CQUFROzswQkFSakIsTUFRaUI7O0FBQ2xDLDBCQUFPLDJDQUFQLEVBRGtDO0FBRWxDLFNBQUssRUFBTCxHQUFVLEVBQVYsQ0FGa0M7QUFHbEMsZ0JBQVksYUFBYSxHQUFHLDBCQUFILENBSFM7QUFJbEMsU0FBSyxNQUFMLEdBQWMsR0FBRyxTQUFILENBQWEsU0FBYixFQUF3QixLQUF4QixDQUFkLENBSmtDO0FBS2xDLCtCQUFhLEVBQWIsRUFMa0M7QUFNbEMsU0FBSyxRQUFMLEdBQWdCLEVBQWhCLENBTmtDO0FBT2xDLFdBQU8sSUFBUCxDQUFZLElBQVosRUFQa0M7R0FBcEM7Ozs7Ozs7ZUFSbUI7OzhCQXFCVjtVQUNBLEtBQU0sS0FBTixHQURBOztBQUVQLFNBQUcsVUFBSCxDQUFjLEtBQUssTUFBTCxDQUFkLENBRk87QUFHUCxXQUFLLE1BQUwsR0FBYyxJQUFkLENBSE87QUFJUCxpQ0FBYSxFQUFiLEVBSk87QUFLUCxhQUFPLElBQVAsQ0FMTzs7Ozs7Ozs7Ozs7eUJBYUosT0FBTyxTQUFTO1VBQ1osS0FBTSxLQUFOLEdBRFk7O0FBRW5CLFNBQUcsUUFBSCxDQUFZLEtBQUssTUFBTCxFQUFhLEtBQXpCLEVBQWdDLE9BQWhDLEVBRm1CO0FBR25CLGlDQUFhLEVBQWIsRUFIbUI7QUFJbkIsYUFBTyxJQUFQLENBSm1COzs7Ozs7Ozs7OzsrQkFZVixPQUFPLFNBQVM7VUFDbEIsS0FBTSxLQUFOLEdBRGtCOztBQUV6QixVQUFNLFNBQVMsR0FBRyxjQUFILENBQWtCLEtBQUssTUFBTCxFQUFhLEtBQS9CLEVBQXNDLE9BQXRDLENBQVQsQ0FGbUI7QUFHekIsaUNBQWEsRUFBYixFQUh5QjtBQUl6QixhQUFPLE1BQVAsQ0FKeUI7Ozs7Ozs7aUNBUWQsT0FBTztVQUNYLEtBQU0sS0FBTixHQURXOztBQUVsQixVQUFNLFNBQVMsR0FBRyxnQkFBSCxDQUFvQixLQUFLLE1BQUwsRUFBYSxLQUFqQyxDQUFULENBRlk7QUFHbEIsaUNBQWEsRUFBYixFQUhrQjtBQUlsQixhQUFPLE1BQVAsQ0FKa0I7Ozs7U0F0REQiLCJmaWxlIjoic3luYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdlYkdMMiBTeW5jIE9iamVjdCBIZWxwZXJcbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJHTFF1ZXJ5XG5cbmltcG9ydCB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi4vY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIFdlYkdMU3luYz8gZmVuY2VTeW5jKEdMZW51bSBjb25kaXRpb24sIEdMYml0ZmllbGQgZmxhZ3MpO1xuLy8gW1dlYkdMSGFuZGxlc0NvbnRleHRMb3NzXSBHTGJvb2xlYW4gaXNTeW5jKFdlYkdMU3luYz8gc3luYyk7XG4vLyB2b2lkIGRlbGV0ZVN5bmMoV2ViR0xTeW5jPyBzeW5jKTtcbi8vIEdMZW51bSBjbGllbnRXYWl0U3luYyhXZWJHTFN5bmM/IHN5bmMsIEdMYml0ZmllbGQgZmxhZ3MsIEdMaW50NjQgdGltZW91dCk7XG4vLyB2b2lkIHdhaXRTeW5jKFdlYkdMU3luYz8gc3luYywgR0xiaXRmaWVsZCBmbGFncywgR0xpbnQ2NCB0aW1lb3V0KTtcbi8vIGFueSBnZXRTeW5jUGFyYW1ldGVyKFdlYkdMU3luYz8gc3luYywgR0xlbnVtIHBuYW1lKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3luYyB7XG5cbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGdsXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBjb25kaXRpb25cbiAgICogQHBhcmFtIHtHTGJpdGZpZWxkfSBmbGFnc1xuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wsIHtjb25kaXRpb24sIGZsYWdzfSkge1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICBjb25kaXRpb24gPSBjb25kaXRpb24gfHwgZ2wuU1lOQ19HUFVfQ09NTUFORFNfQ09NUExFVEU7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5mZW5jZVN5bmMoY29uZGl0aW9uLCBmbGFncyk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U3luY30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVN5bmModGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xiaXRmaWVsZH0gZmxhZ3NcbiAgICogQHBhcmFtIHtHTGludDY0fSB0aW1lb3V0XG4gICAqIEByZXR1cm4ge1N5bmN9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHdhaXQoZmxhZ3MsIHRpbWVvdXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC53YWl0U3luYyh0aGlzLmhhbmRsZSwgZmxhZ3MsIHRpbWVvdXQpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHTGJpdGZpZWxkfSBmbGFnc1xuICAgKiBAcGFyYW0ge0dMaW50NjR9IHRpbWVvdXRcbiAgICogQHJldHVybiB7R0xlbnVtfSByZXN1bHRcbiAgICovXG4gIGNsaWVudFdhaXQoZmxhZ3MsIHRpbWVvdXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHQgPSBnbC5jbGllbnRXYWl0U3luYyh0aGlzLmhhbmRsZSwgZmxhZ3MsIHRpbWVvdXQpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIEBwYXJhbSB7R0xlbnVtfSBwbmFtZVxuICBnZXRQYXJhbWV0ZXIocG5hbWUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRTeW5jUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBwbmFtZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbn1cblxuIl19