'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Query Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _webglChecks = require('./webgl-checks');

var _context = require('../context');

var _queryManager = require('./helpers/query-manager');

var _queryManager2 = _interopRequireDefault(_queryManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable max-len */
// gl.ANY_SAMPLES_PASSED // Specifies an occlusion query: these queries detect whether an object is visible (whether the scoped drawing commands pass the depth test and if so, how many samples pass).
// gl.ANY_SAMPLES_PASSED_CONSERVATIVE // Same as above above, but less accurate and faster version.
// gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN // Number of primitives that are written to transform feedback buffers.

// gl.QUERY_RESULT: Returns a GLuint containing the query result.
// gl.QUERY_RESULT_AVAILABLE: Returns a GLboolean indicating whether or not a query result is available.

var Query = function () {
  _createClass(Query, null, [{
    key: 'isSupported',
    value: function isSupported(gl) {
      return (0, _webglChecks.isWebGL2RenderingContext)(gl);
    }

    /**
     * @class
     * @param {WebGL2RenderingContext} gl
     */

  }]);

  function Query(gl) {
    _classCallCheck(this, Query);

    (0, _webglChecks.assertWebGL2RenderingContext)(gl);
    var handle = gl.createQuery();
    (0, _context.glCheckError)(gl);

    this.gl = gl;
    this.handle = handle;
    this.target = null;
    this.userData = {};

    // query manager needs a promise field
    this.promise = null;

    Object.seal(this);
  }

  /*
   * @return {Query} returns self to enable chaining
   */


  _createClass(Query, [{
    key: 'delete',
    value: function _delete() {
      _queryManager2.default.deleteQuery(this);
      if (this.handle) {
        this.gl.deleteQuery(this.handle);
        this.handle = null;
        (0, _context.glCheckError)(this.gl);
      }
      return this;
    }

    /*
     * @return {Query} returns self to enable chaining
     */

  }, {
    key: 'begin',
    value: function begin(target) {
      _queryManager2.default.beginQuery(this);
      this.target = target;
      this.gl.beginQuery(target, this.handle);
      (0, _context.glCheckError)(this.gl);
      return this;
    }

    /*
     * @return {Query} returns self to enable chaining
     */

  }, {
    key: 'end',
    value: function end() {
      if (this.target) {
        this.target = null;
        this.gl.endQuery(this.target);
        (0, _context.glCheckError)(this.gl);
      }
      return this;
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.end();
      _queryManager2.default.cancelQuery(this);
      return this;
    }
  }, {
    key: 'isResultAvailable',
    value: function isResultAvailable() {
      return this.gl.getQueryParameter(this.handle, this.gl.QUERY_RESULT_AVAILBLE);
    }
  }, {
    key: 'getResult',
    value: function getResult() {
      return this.gl.getQueryParameter(this.handle, this.gl.QUERY_RESULT);
    }
  }], [{
    key: 'poll',
    value: function poll(gl) {
      _queryManager2.default.poll(gl);
    }
  }]);

  return Query;
}();

exports.default = Query;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvcXVlcnkuanMiXSwibmFtZXMiOlsiUXVlcnkiLCJnbCIsImhhbmRsZSIsImNyZWF0ZVF1ZXJ5IiwidGFyZ2V0IiwidXNlckRhdGEiLCJwcm9taXNlIiwiT2JqZWN0Iiwic2VhbCIsImRlbGV0ZVF1ZXJ5IiwiYmVnaW5RdWVyeSIsImVuZFF1ZXJ5IiwiZW5kIiwiY2FuY2VsUXVlcnkiLCJnZXRRdWVyeVBhcmFtZXRlciIsIlFVRVJZX1JFU1VMVF9BVkFJTEJMRSIsIlFVRVJZX1JFU1VMVCIsInBvbGwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7cWpCQUFBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBQ0E7Ozs7Ozs7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7SUFFcUJBLEs7OztnQ0FFQUMsRSxFQUFJO0FBQ3JCLGFBQU8sMkNBQXlCQSxFQUF6QixDQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7QUFJQSxpQkFBWUEsRUFBWixFQUFnQjtBQUFBOztBQUNkLG1EQUE2QkEsRUFBN0I7QUFDQSxRQUFNQyxTQUFTRCxHQUFHRSxXQUFILEVBQWY7QUFDQSwrQkFBYUYsRUFBYjs7QUFFQSxTQUFLQSxFQUFMLEdBQVVBLEVBQVY7QUFDQSxTQUFLQyxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLRSxNQUFMLEdBQWMsSUFBZDtBQUNBLFNBQUtDLFFBQUwsR0FBZ0IsRUFBaEI7O0FBRUE7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBZjs7QUFFQUMsV0FBT0MsSUFBUCxDQUFZLElBQVo7QUFDRDs7QUFFRDs7Ozs7Ozs4QkFHUztBQUNQLDZCQUFhQyxXQUFiLENBQXlCLElBQXpCO0FBQ0EsVUFBSSxLQUFLUCxNQUFULEVBQWlCO0FBQ2YsYUFBS0QsRUFBTCxDQUFRUSxXQUFSLENBQW9CLEtBQUtQLE1BQXpCO0FBQ0EsYUFBS0EsTUFBTCxHQUFjLElBQWQ7QUFDQSxtQ0FBYSxLQUFLRCxFQUFsQjtBQUNEO0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7O0FBRUQ7Ozs7OzswQkFHTUcsTSxFQUFRO0FBQ1osNkJBQWFNLFVBQWIsQ0FBd0IsSUFBeEI7QUFDQSxXQUFLTixNQUFMLEdBQWNBLE1BQWQ7QUFDQSxXQUFLSCxFQUFMLENBQVFTLFVBQVIsQ0FBbUJOLE1BQW5CLEVBQTJCLEtBQUtGLE1BQWhDO0FBQ0EsaUNBQWEsS0FBS0QsRUFBbEI7QUFDQSxhQUFPLElBQVA7QUFDRDs7QUFFRDs7Ozs7OzBCQUdNO0FBQ0osVUFBSSxLQUFLRyxNQUFULEVBQWlCO0FBQ2YsYUFBS0EsTUFBTCxHQUFjLElBQWQ7QUFDQSxhQUFLSCxFQUFMLENBQVFVLFFBQVIsQ0FBaUIsS0FBS1AsTUFBdEI7QUFDQSxtQ0FBYSxLQUFLSCxFQUFsQjtBQUNEO0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7Ozs2QkFFUTtBQUNQLFdBQUtXLEdBQUw7QUFDQSw2QkFBYUMsV0FBYixDQUF5QixJQUF6QjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7d0NBRW1CO0FBQ2xCLGFBQU8sS0FBS1osRUFBTCxDQUFRYSxpQkFBUixDQUEwQixLQUFLWixNQUEvQixFQUNMLEtBQUtELEVBQUwsQ0FBUWMscUJBREgsQ0FBUDtBQUVEOzs7Z0NBRVc7QUFDVixhQUFPLEtBQUtkLEVBQUwsQ0FBUWEsaUJBQVIsQ0FBMEIsS0FBS1osTUFBL0IsRUFBdUMsS0FBS0QsRUFBTCxDQUFRZSxZQUEvQyxDQUFQO0FBQ0Q7Ozt5QkFFV2YsRSxFQUFJO0FBQ2QsNkJBQWFnQixJQUFiLENBQWtCaEIsRUFBbEI7QUFDRDs7Ozs7O2tCQS9Fa0JELEsiLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTDIgUXVlcnkgSGVscGVyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViR0xRdWVyeVxuXG5pbXBvcnQge2lzV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgYXNzZXJ0V2ViR0wyUmVuZGVyaW5nQ29udGV4dH1cbiAgZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuaW1wb3J0IHF1ZXJ5TWFuYWdlciBmcm9tICcuL2hlbHBlcnMvcXVlcnktbWFuYWdlcic7XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbi8vIGdsLkFOWV9TQU1QTEVTX1BBU1NFRCAvLyBTcGVjaWZpZXMgYW4gb2NjbHVzaW9uIHF1ZXJ5OiB0aGVzZSBxdWVyaWVzIGRldGVjdCB3aGV0aGVyIGFuIG9iamVjdCBpcyB2aXNpYmxlICh3aGV0aGVyIHRoZSBzY29wZWQgZHJhd2luZyBjb21tYW5kcyBwYXNzIHRoZSBkZXB0aCB0ZXN0IGFuZCBpZiBzbywgaG93IG1hbnkgc2FtcGxlcyBwYXNzKS5cbi8vIGdsLkFOWV9TQU1QTEVTX1BBU1NFRF9DT05TRVJWQVRJVkUgLy8gU2FtZSBhcyBhYm92ZSBhYm92ZSwgYnV0IGxlc3MgYWNjdXJhdGUgYW5kIGZhc3RlciB2ZXJzaW9uLlxuLy8gZ2wuVFJBTlNGT1JNX0ZFRURCQUNLX1BSSU1JVElWRVNfV1JJVFRFTiAvLyBOdW1iZXIgb2YgcHJpbWl0aXZlcyB0aGF0IGFyZSB3cml0dGVuIHRvIHRyYW5zZm9ybSBmZWVkYmFjayBidWZmZXJzLlxuXG4vLyBnbC5RVUVSWV9SRVNVTFQ6IFJldHVybnMgYSBHTHVpbnQgY29udGFpbmluZyB0aGUgcXVlcnkgcmVzdWx0LlxuLy8gZ2wuUVVFUllfUkVTVUxUX0FWQUlMQUJMRTogUmV0dXJucyBhIEdMYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgb3Igbm90IGEgcXVlcnkgcmVzdWx0IGlzIGF2YWlsYWJsZS5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUXVlcnkge1xuXG4gIHN0YXRpYyBpc1N1cHBvcnRlZChnbCkge1xuICAgIHJldHVybiBpc1dlYkdMMlJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGdsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCkge1xuICAgIGFzc2VydFdlYkdMMlJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuICAgIGNvbnN0IGhhbmRsZSA9IGdsLmNyZWF0ZVF1ZXJ5KCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGhhbmRsZTtcbiAgICB0aGlzLnRhcmdldCA9IG51bGw7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuXG4gICAgLy8gcXVlcnkgbWFuYWdlciBuZWVkcyBhIHByb21pc2UgZmllbGRcbiAgICB0aGlzLnByb21pc2UgPSBudWxsO1xuXG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICAvKlxuICAgKiBAcmV0dXJuIHtRdWVyeX0gcmV0dXJucyBzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgZGVsZXRlKCkge1xuICAgIHF1ZXJ5TWFuYWdlci5kZWxldGVRdWVyeSh0aGlzKTtcbiAgICBpZiAodGhpcy5oYW5kbGUpIHtcbiAgICAgIHRoaXMuZ2wuZGVsZXRlUXVlcnkodGhpcy5oYW5kbGUpO1xuICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgICAgZ2xDaGVja0Vycm9yKHRoaXMuZ2wpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEByZXR1cm4ge1F1ZXJ5fSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBiZWdpbih0YXJnZXQpIHtcbiAgICBxdWVyeU1hbmFnZXIuYmVnaW5RdWVyeSh0aGlzKTtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLmdsLmJlZ2luUXVlcnkodGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG4gICAgZ2xDaGVja0Vycm9yKHRoaXMuZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQHJldHVybiB7UXVlcnl9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGVuZCgpIHtcbiAgICBpZiAodGhpcy50YXJnZXQpIHtcbiAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICAgIHRoaXMuZ2wuZW5kUXVlcnkodGhpcy50YXJnZXQpO1xuICAgICAgZ2xDaGVja0Vycm9yKHRoaXMuZ2wpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNhbmNlbCgpIHtcbiAgICB0aGlzLmVuZCgpO1xuICAgIHF1ZXJ5TWFuYWdlci5jYW5jZWxRdWVyeSh0aGlzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGlzUmVzdWx0QXZhaWxhYmxlKCkge1xuICAgIHJldHVybiB0aGlzLmdsLmdldFF1ZXJ5UGFyYW1ldGVyKHRoaXMuaGFuZGxlLFxuICAgICAgdGhpcy5nbC5RVUVSWV9SRVNVTFRfQVZBSUxCTEUpO1xuICB9XG5cbiAgZ2V0UmVzdWx0KCkge1xuICAgIHJldHVybiB0aGlzLmdsLmdldFF1ZXJ5UGFyYW1ldGVyKHRoaXMuaGFuZGxlLCB0aGlzLmdsLlFVRVJZX1JFU1VMVCk7XG4gIH1cblxuICBzdGF0aWMgcG9sbChnbCkge1xuICAgIHF1ZXJ5TWFuYWdlci5wb2xsKGdsKTtcbiAgfVxufVxuIl19