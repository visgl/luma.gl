'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Query Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _webglTypes = require('./webgl-types');

var _context = require('../context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable max-len */
// gl.ANY_SAMPLES_PASSED // Specifies an occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
// gl.ANY_SAMPLES_PASSED_CONSERVATIVE // Same as above above, but less accurate and faster version.
// gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN // Number of primitives that are written to transform feedback buffers.

// gl.QUERY_RESULT: Returns a GLuint containing the query result.
// gl.QUERY_RESULT_AVAILABLE: Returns a GLboolean indicating whether or not a query result is available.

var Query = function () {

  /**
   * @class
   * @param {WebGL2RenderingContext} gl
   */
  function Query(gl) {
    _classCallCheck(this, Query);

    (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext);
    this.gl = gl;
    this.handle = gl.createQuery();
    (0, _context.glCheckError)(gl);
    this.userData = {};
    Object.seal(this);
  }

  /*
   * @return {Query} returns self to enable chaining
   */


  _createClass(Query, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteQuery(this.handle);
      this.handle = null;
      (0, _context.glCheckError)(gl);
      return this;
    }

    /*
     * @return {Query} returns self to enable chaining
     */

  }, {
    key: 'begin',
    value: function begin(target) {
      var gl = this.gl;

      gl.beginQuery(target, this.handle);
      (0, _context.glCheckError)(gl);
      return this;
    }

    /*
     * @return {Query} returns self to enable chaining
     */

  }, {
    key: 'end',
    value: function end(target) {
      var gl = this.gl;

      gl.endQuery(target);
      (0, _context.glCheckError)(gl);
      return this;
    }

    // @param {GLenum} pname

  }, {
    key: 'getParameters',
    value: function getParameters(pname) {
      var gl = this.gl;

      var result = gl.getQueryParameters(this.handle, pname);
      (0, _context.glCheckError)(gl);
      return result;
    }
  }, {
    key: 'isResultAvailable',
    value: function isResultAvailable() {
      var gl = this.gl;

      return this.getParameters(gl.QUERY_RESULT_AVAILBLE);
    }
  }, {
    key: 'getResult',
    value: function getResult() {
      var gl = this.gl;

      return this.getParameters(gl.QUERY_RESULT);
    }
  }]);

  return Query;
}();

exports.default = Query;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvcXVlcnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztxakJBQUE7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztJQUVxQixLOztBQUVuQjs7OztBQUlBLGlCQUFZLEVBQVosRUFBZ0I7QUFBQTs7QUFDZCwwQkFBTyxnREFBUDtBQUNBLFNBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxTQUFLLE1BQUwsR0FBYyxHQUFHLFdBQUgsRUFBZDtBQUNBLCtCQUFhLEVBQWI7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQSxXQUFPLElBQVAsQ0FBWSxJQUFaO0FBQ0Q7O0FBRUQ7Ozs7Ozs7OEJBR1M7QUFBQSxVQUNBLEVBREEsR0FDTSxJQUROLENBQ0EsRUFEQTs7QUFFUCxTQUFHLFdBQUgsQ0FBZSxLQUFLLE1BQXBCO0FBQ0EsV0FBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7OzBCQUdNLE0sRUFBUTtBQUFBLFVBQ0wsRUFESyxHQUNDLElBREQsQ0FDTCxFQURLOztBQUVaLFNBQUcsVUFBSCxDQUFjLE1BQWQsRUFBc0IsS0FBSyxNQUEzQjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7O3dCQUdJLE0sRUFBUTtBQUFBLFVBQ0gsRUFERyxHQUNHLElBREgsQ0FDSCxFQURHOztBQUVWLFNBQUcsUUFBSCxDQUFZLE1BQVo7QUFDQSxpQ0FBYSxFQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQ7Ozs7a0NBQ2MsSyxFQUFPO0FBQUEsVUFDWixFQURZLEdBQ04sSUFETSxDQUNaLEVBRFk7O0FBRW5CLFVBQU0sU0FBUyxHQUFHLGtCQUFILENBQXNCLEtBQUssTUFBM0IsRUFBbUMsS0FBbkMsQ0FBZjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLE1BQVA7QUFDRDs7O3dDQUVtQjtBQUFBLFVBQ1gsRUFEVyxHQUNMLElBREssQ0FDWCxFQURXOztBQUVsQixhQUFPLEtBQUssYUFBTCxDQUFtQixHQUFHLHFCQUF0QixDQUFQO0FBQ0Q7OztnQ0FFVztBQUFBLFVBQ0gsRUFERyxHQUNHLElBREgsQ0FDSCxFQURHOztBQUVWLGFBQU8sS0FBSyxhQUFMLENBQW1CLEdBQUcsWUFBdEIsQ0FBUDtBQUNEOzs7Ozs7a0JBOURrQixLIiwiZmlsZSI6InF1ZXJ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFF1ZXJ5IEhlbHBlclxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYkdMUXVlcnlcblxuaW1wb3J0IHtXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuLi9jb250ZXh0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuLy8gZ2wuQU5ZX1NBTVBMRVNfUEFTU0VEIC8vIFNwZWNpZmllcyBhbiBvY2NsdXNpb24gcXVlcnk6IHRoZXNlIHF1ZXJpZXMgZGV0ZWN0IHdoZXRoZXIgYW4gb2JqZWN0IGlzIHZpc2libGUgKHdoZXRoZXIgdGhlIHNjb3BlZCBkcmF3aW5nIGNvbW1hbmRzIHBhc3MgdGhlIGRlcHRoIHRlc3QgYW5kIGlmIHNvLCBob3cgbWFueSBzYW1wbGVzIHBhc3MpLlxuLy8gZ2wuQU5ZX1NBTVBMRVNfUEFTU0VEX0NPTlNFUlZBVElWRSAvLyBTYW1lIGFzIGFib3ZlIGFib3ZlLCBidXQgbGVzcyBhY2N1cmF0ZSBhbmQgZmFzdGVyIHZlcnNpb24uXG4vLyBnbC5UUkFOU0ZPUk1fRkVFREJBQ0tfUFJJTUlUSVZFU19XUklUVEVOIC8vIE51bWJlciBvZiBwcmltaXRpdmVzIHRoYXQgYXJlIHdyaXR0ZW4gdG8gdHJhbnNmb3JtIGZlZWRiYWNrIGJ1ZmZlcnMuXG5cbi8vIGdsLlFVRVJZX1JFU1VMVDogUmV0dXJucyBhIEdMdWludCBjb250YWluaW5nIHRoZSBxdWVyeSByZXN1bHQuXG4vLyBnbC5RVUVSWV9SRVNVTFRfQVZBSUxBQkxFOiBSZXR1cm5zIGEgR0xib29sZWFuIGluZGljYXRpbmcgd2hldGhlciBvciBub3QgYSBxdWVyeSByZXN1bHQgaXMgYXZhaWxhYmxlLlxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBRdWVyeSB7XG5cbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGdsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCkge1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVF1ZXJ5KCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICAvKlxuICAgKiBAcmV0dXJuIHtRdWVyeX0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVF1ZXJ5KHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEByZXR1cm4ge1F1ZXJ5fSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBiZWdpbih0YXJnZXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iZWdpblF1ZXJ5KHRhcmdldCwgdGhpcy5oYW5kbGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAcmV0dXJuIHtRdWVyeX0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZW5kKHRhcmdldCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmVuZFF1ZXJ5KHRhcmdldCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEBwYXJhbSB7R0xlbnVtfSBwbmFtZVxuICBnZXRQYXJhbWV0ZXJzKHBuYW1lKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0UXVlcnlQYXJhbWV0ZXJzKHRoaXMuaGFuZGxlLCBwbmFtZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaXNSZXN1bHRBdmFpbGFibGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVycyhnbC5RVUVSWV9SRVNVTFRfQVZBSUxCTEUpO1xuICB9XG5cbiAgZ2V0UmVzdWx0KCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIHJldHVybiB0aGlzLmdldFBhcmFtZXRlcnMoZ2wuUVVFUllfUkVTVUxUKTtcbiAgfVxuXG59XG4iXX0=