'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvc3luYy5qcyJdLCJuYW1lcyI6WyJTeW5jIiwiZ2wiLCJjb25kaXRpb24iLCJmbGFncyIsIlNZTkNfR1BVX0NPTU1BTkRTX0NPTVBMRVRFIiwiaGFuZGxlIiwiZmVuY2VTeW5jIiwidXNlckRhdGEiLCJPYmplY3QiLCJzZWFsIiwiZGVsZXRlU3luYyIsInRpbWVvdXQiLCJ3YWl0U3luYyIsInJlc3VsdCIsImNsaWVudFdhaXRTeW5jIiwicG5hbWUiLCJnZXRTeW5jUGFyYW1ldGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTtBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7Ozs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFcUJBLEk7O0FBRW5COzs7Ozs7QUFNQSxnQkFBWUMsRUFBWixRQUFvQztBQUFBLFFBQW5CQyxTQUFtQixRQUFuQkEsU0FBbUI7QUFBQSxRQUFSQyxLQUFRLFFBQVJBLEtBQVE7O0FBQUE7O0FBQ2xDLDBCQUFPRixnREFBUDtBQUNBLFNBQUtBLEVBQUwsR0FBVUEsRUFBVjtBQUNBQyxnQkFBWUEsYUFBYUQsR0FBR0csMEJBQTVCO0FBQ0EsU0FBS0MsTUFBTCxHQUFjSixHQUFHSyxTQUFILENBQWFKLFNBQWIsRUFBd0JDLEtBQXhCLENBQWQ7QUFDQSwrQkFBYUYsRUFBYjtBQUNBLFNBQUtNLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQUMsV0FBT0MsSUFBUCxDQUFZLElBQVo7QUFDRDs7QUFFRDs7Ozs7Ozs4QkFHUztBQUFBLFVBQ0FSLEVBREEsR0FDTSxJQUROLENBQ0FBLEVBREE7O0FBRVBBLFNBQUdTLFVBQUgsQ0FBYyxLQUFLTCxNQUFuQjtBQUNBLFdBQUtBLE1BQUwsR0FBYyxJQUFkO0FBQ0EsaUNBQWFKLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7eUJBS0tFLEssRUFBT1EsTyxFQUFTO0FBQUEsVUFDWlYsRUFEWSxHQUNOLElBRE0sQ0FDWkEsRUFEWTs7QUFFbkJBLFNBQUdXLFFBQUgsQ0FBWSxLQUFLUCxNQUFqQixFQUF5QkYsS0FBekIsRUFBZ0NRLE9BQWhDO0FBQ0EsaUNBQWFWLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7K0JBS1dFLEssRUFBT1EsTyxFQUFTO0FBQUEsVUFDbEJWLEVBRGtCLEdBQ1osSUFEWSxDQUNsQkEsRUFEa0I7O0FBRXpCLFVBQU1ZLFNBQVNaLEdBQUdhLGNBQUgsQ0FBa0IsS0FBS1QsTUFBdkIsRUFBK0JGLEtBQS9CLEVBQXNDUSxPQUF0QyxDQUFmO0FBQ0EsaUNBQWFWLEVBQWI7QUFDQSxhQUFPWSxNQUFQO0FBQ0Q7O0FBRUQ7Ozs7aUNBQ2FFLEssRUFBTztBQUFBLFVBQ1hkLEVBRFcsR0FDTCxJQURLLENBQ1hBLEVBRFc7O0FBRWxCLFVBQU1ZLFNBQVNaLEdBQUdlLGdCQUFILENBQW9CLEtBQUtYLE1BQXpCLEVBQWlDVSxLQUFqQyxDQUFmO0FBQ0EsaUNBQWFkLEVBQWI7QUFDQSxhQUFPWSxNQUFQO0FBQ0Q7Ozs7OztrQkEzRGtCYixJIiwiZmlsZSI6InN5bmMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTDIgU3luYyBPYmplY3QgSGVscGVyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViR0xRdWVyeVxuXG5pbXBvcnQge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBXZWJHTFN5bmM/IGZlbmNlU3luYyhHTGVudW0gY29uZGl0aW9uLCBHTGJpdGZpZWxkIGZsYWdzKTtcbi8vIFtXZWJHTEhhbmRsZXNDb250ZXh0TG9zc10gR0xib29sZWFuIGlzU3luYyhXZWJHTFN5bmM/IHN5bmMpO1xuLy8gdm9pZCBkZWxldGVTeW5jKFdlYkdMU3luYz8gc3luYyk7XG4vLyBHTGVudW0gY2xpZW50V2FpdFN5bmMoV2ViR0xTeW5jPyBzeW5jLCBHTGJpdGZpZWxkIGZsYWdzLCBHTGludDY0IHRpbWVvdXQpO1xuLy8gdm9pZCB3YWl0U3luYyhXZWJHTFN5bmM/IHN5bmMsIEdMYml0ZmllbGQgZmxhZ3MsIEdMaW50NjQgdGltZW91dCk7XG4vLyBhbnkgZ2V0U3luY1BhcmFtZXRlcihXZWJHTFN5bmM/IHN5bmMsIEdMZW51bSBwbmFtZSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN5bmMge1xuXG4gIC8qKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBnbFxuICAgKiBAcGFyYW0ge0dMZW51bX0gY29uZGl0aW9uXG4gICAqIEBwYXJhbSB7R0xiaXRmaWVsZH0gZmxhZ3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCB7Y29uZGl0aW9uLCBmbGFnc30pIHtcbiAgICBhc3NlcnQoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgY29uZGl0aW9uID0gY29uZGl0aW9uIHx8IGdsLlNZTkNfR1BVX0NPTU1BTkRTX0NPTVBMRVRFO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuZmVuY2VTeW5jKGNvbmRpdGlvbiwgZmxhZ3MpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N5bmN9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVTeW5jKHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dMYml0ZmllbGR9IGZsYWdzXG4gICAqIEBwYXJhbSB7R0xpbnQ2NH0gdGltZW91dFxuICAgKiBAcmV0dXJuIHtTeW5jfSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICB3YWl0KGZsYWdzLCB0aW1lb3V0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wud2FpdFN5bmModGhpcy5oYW5kbGUsIGZsYWdzLCB0aW1lb3V0KTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xiaXRmaWVsZH0gZmxhZ3NcbiAgICogQHBhcmFtIHtHTGludDY0fSB0aW1lb3V0XG4gICAqIEByZXR1cm4ge0dMZW51bX0gcmVzdWx0XG4gICAqL1xuICBjbGllbnRXYWl0KGZsYWdzLCB0aW1lb3V0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0ID0gZ2wuY2xpZW50V2FpdFN5bmModGhpcy5oYW5kbGUsIGZsYWdzLCB0aW1lb3V0KTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBAcGFyYW0ge0dMZW51bX0gcG5hbWVcbiAgZ2V0UGFyYW1ldGVyKHBuYW1lKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0U3luY1BhcmFtZXRlcih0aGlzLmhhbmRsZSwgcG5hbWUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG59XG5cbiJdfQ==