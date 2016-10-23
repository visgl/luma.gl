'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Sync Object Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery


var _webglTypes = require('./webgl-types');

var _context = require('../context');

var _queryManager = require('./queryManager');

var _queryManager2 = _interopRequireDefault(_queryManager);

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
   */
  function Sync(gl) {
    _classCallCheck(this, Sync);

    (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext);

    var handle = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    (0, _context.glCheckError)(gl);

    this.gl = gl;
    this.handle = handle;
    this.userData = {};

    // query manager needs a promise field
    this.promise = null;

    Object.seal(this);
  }

  /**
   * @return {Sync} returns self to enable chaining
   */


  _createClass(Sync, [{
    key: 'delete',
    value: function _delete() {
      _queryManager2.default.deleteQuery(this);
      if (this.handle) {
        this.gl.deleteSync(this.handle);
        this.handle = null;
        (0, _context.glCheckError)(this.gl);
      }
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
      this.gl.waitSync(this.handle, flags, timeout);
      (0, _context.glCheckError)(this.gl);
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
      var result = this.gl.clientWaitSync(this.handle, flags, timeout);
      (0, _context.glCheckError)(this.gl);
      return result;
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      _queryManager2.default.cancelQuery(this);
    }
  }, {
    key: 'isResultAvailable',
    value: function isResultAvailable() {
      var status = this.gl.getSyncParameter(this.handle, this.gl.SYNC_STATUS);
      return status === this.gl.SIGNALED;
    }
  }, {
    key: 'getResult',
    value: function getResult() {
      return this.gl.SIGNALED;
    }
  }]);

  return Sync;
}();

exports.default = Sync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvc3luYy5qcyJdLCJuYW1lcyI6WyJTeW5jIiwiZ2wiLCJoYW5kbGUiLCJmZW5jZVN5bmMiLCJTWU5DX0dQVV9DT01NQU5EU19DT01QTEVURSIsInVzZXJEYXRhIiwicHJvbWlzZSIsIk9iamVjdCIsInNlYWwiLCJkZWxldGVRdWVyeSIsImRlbGV0ZVN5bmMiLCJmbGFncyIsInRpbWVvdXQiLCJ3YWl0U3luYyIsInJlc3VsdCIsImNsaWVudFdhaXRTeW5jIiwiY2FuY2VsUXVlcnkiLCJzdGF0dXMiLCJnZXRTeW5jUGFyYW1ldGVyIiwiU1lOQ19TVEFUVVMiLCJTSUdOQUxFRCJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7QUFDQTs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRXFCQSxJOztBQUVuQjs7OztBQUlBLGdCQUFZQyxFQUFaLEVBQWdCO0FBQUE7O0FBQ2QsMEJBQU9BLGdEQUFQOztBQUVBLFFBQU1DLFNBQVNELEdBQUdFLFNBQUgsQ0FBYUYsR0FBR0csMEJBQWhCLEVBQTRDLENBQTVDLENBQWY7QUFDQSwrQkFBYUgsRUFBYjs7QUFFQSxTQUFLQSxFQUFMLEdBQVVBLEVBQVY7QUFDQSxTQUFLQyxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLRyxRQUFMLEdBQWdCLEVBQWhCOztBQUVBO0FBQ0EsU0FBS0MsT0FBTCxHQUFlLElBQWY7O0FBRUFDLFdBQU9DLElBQVAsQ0FBWSxJQUFaO0FBQ0Q7O0FBRUQ7Ozs7Ozs7OEJBR1M7QUFDUCw2QkFBYUMsV0FBYixDQUF5QixJQUF6QjtBQUNBLFVBQUksS0FBS1AsTUFBVCxFQUFpQjtBQUNmLGFBQUtELEVBQUwsQ0FBUVMsVUFBUixDQUFtQixLQUFLUixNQUF4QjtBQUNBLGFBQUtBLE1BQUwsR0FBYyxJQUFkO0FBQ0EsbUNBQWEsS0FBS0QsRUFBbEI7QUFDRDtBQUNELGFBQU8sSUFBUDtBQUNEOztBQUVEOzs7Ozs7Ozt5QkFLS1UsSyxFQUFPQyxPLEVBQVM7QUFDbkIsV0FBS1gsRUFBTCxDQUFRWSxRQUFSLENBQWlCLEtBQUtYLE1BQXRCLEVBQThCUyxLQUE5QixFQUFxQ0MsT0FBckM7QUFDQSxpQ0FBYSxLQUFLWCxFQUFsQjtBQUNBLGFBQU8sSUFBUDtBQUNEOztBQUVEOzs7Ozs7OzsrQkFLV1UsSyxFQUFPQyxPLEVBQVM7QUFDekIsVUFBTUUsU0FBUyxLQUFLYixFQUFMLENBQVFjLGNBQVIsQ0FBdUIsS0FBS2IsTUFBNUIsRUFBb0NTLEtBQXBDLEVBQTJDQyxPQUEzQyxDQUFmO0FBQ0EsaUNBQWEsS0FBS1gsRUFBbEI7QUFDQSxhQUFPYSxNQUFQO0FBQ0Q7Ozs2QkFFUTtBQUNQLDZCQUFhRSxXQUFiLENBQXlCLElBQXpCO0FBQ0Q7Ozt3Q0FFbUI7QUFDbEIsVUFBTUMsU0FBUyxLQUFLaEIsRUFBTCxDQUFRaUIsZ0JBQVIsQ0FBeUIsS0FBS2hCLE1BQTlCLEVBQXNDLEtBQUtELEVBQUwsQ0FBUWtCLFdBQTlDLENBQWY7QUFDQSxhQUFPRixXQUFXLEtBQUtoQixFQUFMLENBQVFtQixRQUExQjtBQUNEOzs7Z0NBRVc7QUFDVixhQUFPLEtBQUtuQixFQUFMLENBQVFtQixRQUFmO0FBQ0Q7Ozs7OztrQkFwRWtCcEIsSSIsImZpbGUiOiJzeW5jLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFN5bmMgT2JqZWN0IEhlbHBlclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYkdMUXVlcnlcbmltcG9ydCB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi4vY29udGV4dCc7XG5pbXBvcnQgcXVlcnlNYW5hZ2VyIGZyb20gJy4vcXVlcnlNYW5hZ2VyJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gV2ViR0xTeW5jPyBmZW5jZVN5bmMoR0xlbnVtIGNvbmRpdGlvbiwgR0xiaXRmaWVsZCBmbGFncyk7XG4vLyBbV2ViR0xIYW5kbGVzQ29udGV4dExvc3NdIEdMYm9vbGVhbiBpc1N5bmMoV2ViR0xTeW5jPyBzeW5jKTtcbi8vIHZvaWQgZGVsZXRlU3luYyhXZWJHTFN5bmM/IHN5bmMpO1xuLy8gR0xlbnVtIGNsaWVudFdhaXRTeW5jKFdlYkdMU3luYz8gc3luYywgR0xiaXRmaWVsZCBmbGFncywgR0xpbnQ2NCB0aW1lb3V0KTtcbi8vIHZvaWQgd2FpdFN5bmMoV2ViR0xTeW5jPyBzeW5jLCBHTGJpdGZpZWxkIGZsYWdzLCBHTGludDY0IHRpbWVvdXQpO1xuLy8gYW55IGdldFN5bmNQYXJhbWV0ZXIoV2ViR0xTeW5jPyBzeW5jLCBHTGVudW0gcG5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTeW5jIHtcblxuICAvKipcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZ2xcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG5cbiAgICBjb25zdCBoYW5kbGUgPSBnbC5mZW5jZVN5bmMoZ2wuU1lOQ19HUFVfQ09NTUFORFNfQ09NUExFVEUsIDApO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBoYW5kbGU7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuXG4gICAgLy8gcXVlcnkgbWFuYWdlciBuZWVkcyBhIHByb21pc2UgZmllbGRcbiAgICB0aGlzLnByb21pc2UgPSBudWxsO1xuXG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U3luY30gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZGVsZXRlKCkge1xuICAgIHF1ZXJ5TWFuYWdlci5kZWxldGVRdWVyeSh0aGlzKTtcbiAgICBpZiAodGhpcy5oYW5kbGUpIHtcbiAgICAgIHRoaXMuZ2wuZGVsZXRlU3luYyh0aGlzLmhhbmRsZSk7XG4gICAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgICBnbENoZWNrRXJyb3IodGhpcy5nbCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xiaXRmaWVsZH0gZmxhZ3NcbiAgICogQHBhcmFtIHtHTGludDY0fSB0aW1lb3V0XG4gICAqIEByZXR1cm4ge1N5bmN9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIHdhaXQoZmxhZ3MsIHRpbWVvdXQpIHtcbiAgICB0aGlzLmdsLndhaXRTeW5jKHRoaXMuaGFuZGxlLCBmbGFncywgdGltZW91dCk7XG4gICAgZ2xDaGVja0Vycm9yKHRoaXMuZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R0xiaXRmaWVsZH0gZmxhZ3NcbiAgICogQHBhcmFtIHtHTGludDY0fSB0aW1lb3V0XG4gICAqIEByZXR1cm4ge0dMZW51bX0gcmVzdWx0XG4gICAqL1xuICBjbGllbnRXYWl0KGZsYWdzLCB0aW1lb3V0KSB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5nbC5jbGllbnRXYWl0U3luYyh0aGlzLmhhbmRsZSwgZmxhZ3MsIHRpbWVvdXQpO1xuICAgIGdsQ2hlY2tFcnJvcih0aGlzLmdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgY2FuY2VsKCkge1xuICAgIHF1ZXJ5TWFuYWdlci5jYW5jZWxRdWVyeSh0aGlzKTtcbiAgfVxuXG4gIGlzUmVzdWx0QXZhaWxhYmxlKCkge1xuICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuZ2wuZ2V0U3luY1BhcmFtZXRlcih0aGlzLmhhbmRsZSwgdGhpcy5nbC5TWU5DX1NUQVRVUyk7XG4gICAgcmV0dXJuIHN0YXR1cyA9PT0gdGhpcy5nbC5TSUdOQUxFRDtcbiAgfVxuXG4gIGdldFJlc3VsdCgpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5TSUdOQUxFRDtcbiAgfVxufVxuXG4iXX0=