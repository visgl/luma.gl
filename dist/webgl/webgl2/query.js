'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 Query Helper
// https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery

var _types = require('./types');

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

    (0, _assert2.default)(gl instanceof _types.WebGL2RenderingContext);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvcXVlcnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7SUFVcUI7Ozs7Ozs7QUFNbkIsV0FObUIsS0FNbkIsQ0FBWSxFQUFaLEVBQWdCOzBCQU5HLE9BTUg7O0FBQ2QsMEJBQU8sMkNBQVAsRUFEYztBQUVkLFNBQUssRUFBTCxHQUFVLEVBQVYsQ0FGYztBQUdkLFNBQUssTUFBTCxHQUFjLEdBQUcsV0FBSCxFQUFkLENBSGM7QUFJZCwrQkFBYSxFQUFiLEVBSmM7QUFLZCxTQUFLLFFBQUwsR0FBZ0IsRUFBaEIsQ0FMYztBQU1kLFdBQU8sSUFBUCxDQUFZLElBQVosRUFOYztHQUFoQjs7Ozs7OztlQU5tQjs7OEJBa0JWO1VBQ0EsS0FBTSxLQUFOLEdBREE7O0FBRVAsU0FBRyxXQUFILENBQWUsS0FBSyxNQUFMLENBQWYsQ0FGTztBQUdQLFdBQUssTUFBTCxHQUFjLElBQWQsQ0FITztBQUlQLGlDQUFhLEVBQWIsRUFKTztBQUtQLGFBQU8sSUFBUCxDQUxPOzs7Ozs7Ozs7MEJBV0gsUUFBUTtVQUNMLEtBQU0sS0FBTixHQURLOztBQUVaLFNBQUcsVUFBSCxDQUFjLE1BQWQsRUFBc0IsS0FBSyxNQUFMLENBQXRCLENBRlk7QUFHWixpQ0FBYSxFQUFiLEVBSFk7QUFJWixhQUFPLElBQVAsQ0FKWTs7Ozs7Ozs7O3dCQVVWLFFBQVE7VUFDSCxLQUFNLEtBQU4sR0FERzs7QUFFVixTQUFHLFFBQUgsQ0FBWSxNQUFaLEVBRlU7QUFHVixpQ0FBYSxFQUFiLEVBSFU7QUFJVixhQUFPLElBQVAsQ0FKVTs7Ozs7OztrQ0FRRSxPQUFPO1VBQ1osS0FBTSxLQUFOLEdBRFk7O0FBRW5CLFVBQU0sU0FBUyxHQUFHLGtCQUFILENBQXNCLEtBQUssTUFBTCxFQUFhLEtBQW5DLENBQVQsQ0FGYTtBQUduQixpQ0FBYSxFQUFiLEVBSG1CO0FBSW5CLGFBQU8sTUFBUCxDQUptQjs7Ozt3Q0FPRDtVQUNYLEtBQU0sS0FBTixHQURXOztBQUVsQixhQUFPLEtBQUssYUFBTCxDQUFtQixHQUFHLHFCQUFILENBQTFCLENBRmtCOzs7O2dDQUtSO1VBQ0gsS0FBTSxLQUFOLEdBREc7O0FBRVYsYUFBTyxLQUFLLGFBQUwsQ0FBbUIsR0FBRyxZQUFILENBQTFCLENBRlU7Ozs7U0EzRE8iLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTDIgUXVlcnkgSGVscGVyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViR0xRdWVyeVxuXG5pbXBvcnQge1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4vLyBnbC5BTllfU0FNUExFU19QQVNTRUQgLy8gU3BlY2lmaWVzIGFuIG9jY2x1c2lvbiBxdWVyeTogdGhlc2UgcXVlcmllcyBkZXRlY3Qgd2hldGhlciBhbiBvYmplY3QgaXMgdmlzaWJsZSAod2hldGhlciB0aGUgc2NvcGVkIGRyYXdpbmcgY29tbWFuZHMgcGFzcyB0aGUgZGVwdGggdGVzdCBhbmQgaWYgc28sIGhvdyBtYW55IHNhbXBsZXMgcGFzcykuXG4vLyBnbC5BTllfU0FNUExFU19QQVNTRURfQ09OU0VSVkFUSVZFIC8vIFNhbWUgYXMgYWJvdmUgYWJvdmUsIGJ1dCBsZXNzIGFjY3VyYXRlIGFuZCBmYXN0ZXIgdmVyc2lvbi5cbi8vIGdsLlRSQU5TRk9STV9GRUVEQkFDS19QUklNSVRJVkVTX1dSSVRURU4gLy8gTnVtYmVyIG9mIHByaW1pdGl2ZXMgdGhhdCBhcmUgd3JpdHRlbiB0byB0cmFuc2Zvcm0gZmVlZGJhY2sgYnVmZmVycy5cblxuLy8gZ2wuUVVFUllfUkVTVUxUOiBSZXR1cm5zIGEgR0x1aW50IGNvbnRhaW5pbmcgdGhlIHF1ZXJ5IHJlc3VsdC5cbi8vIGdsLlFVRVJZX1JFU1VMVF9BVkFJTEFCTEU6IFJldHVybnMgYSBHTGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIG9yIG5vdCBhIHF1ZXJ5IHJlc3VsdCBpcyBhdmFpbGFibGUuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFF1ZXJ5IHtcblxuICAvKipcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZ2xcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlUXVlcnkoKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIC8qXG4gICAqIEByZXR1cm4ge1F1ZXJ5fSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZGVsZXRlUXVlcnkodGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQHJldHVybiB7UXVlcnl9IHJldHVybnMgc2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGJlZ2luKHRhcmdldCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJlZ2luUXVlcnkodGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEByZXR1cm4ge1F1ZXJ5fSByZXR1cm5zIHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBlbmQodGFyZ2V0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuZW5kUXVlcnkodGFyZ2V0KTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQHBhcmFtIHtHTGVudW19IHBuYW1lXG4gIGdldFBhcmFtZXRlcnMocG5hbWUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRRdWVyeVBhcmFtZXRlcnModGhpcy5oYW5kbGUsIHBuYW1lKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpc1Jlc3VsdEF2YWlsYWJsZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcy5nZXRQYXJhbWV0ZXJzKGdsLlFVRVJZX1JFU1VMVF9BVkFJTEJMRSk7XG4gIH1cblxuICBnZXRSZXN1bHQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UGFyYW1ldGVycyhnbC5RVUVSWV9SRVNVTFQpO1xuICB9XG5cbn1cbiJdfQ==