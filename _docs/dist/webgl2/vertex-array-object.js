'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 VertexArray Objects Helper


exports.isVertexArray = isVertexArray;

var _webglTypes = require('../webgl/webgl-types');

var _webglChecks = require('../webgl/webgl-checks');

var _context = require('../webgl/context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable camelcase */
var OES_vertex_array_object = 'OES_vertex_array_object';

var VertexArrayObject = function () {
  _createClass(VertexArrayObject, null, [{
    key: 'isSupported',


    // Returns true if VertexArrayObject is supported by implementation
    value: function isSupported(gl) {
      (0, _webglChecks.assertWebGLRenderingContext)(gl);
      return gl instanceof _webglTypes.WebGL2RenderingContext || gl.getExtension('OES_vertex_array_object');
    }

    // Wraps a WebGLVertexArrayObject in a VertexArrayObject

  }, {
    key: 'wrap',
    value: function wrap(gl, object) {
      return object instanceof VertexArrayObject ? object : new VertexArrayObject(gl, { handle: object.handle || object });
    }

    // Create a VertexArrayObject

  }]);

  function VertexArrayObject(gl) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var handle = _ref.handle;

    _classCallCheck(this, VertexArrayObject);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);
    (0, _assert2.default)(VertexArrayObject.isSupported(gl), 'VertexArrayObject: WebGL2 or OES_vertex_array_object required');

    handle = handle || createVertexArray(gl);
    // TODO isVertexArray fails when using extension for some reason
    // if (!isVertexArray(gl, handle)) {
    if (!handle) {
      throw new Error('Could not create VertexArrayObject');
    }

    this.gl = gl;
    this.handle = handle;
    this.userData = {};
    Object.seal(this);
  }

  _createClass(VertexArrayObject, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      deleteVertexArray(gl, this.handle);
      (0, _context.glCheckError)(gl);
      return this;
    }
  }, {
    key: 'bind',
    value: function bind() {
      var gl = this.gl;

      bindVertexArray(gl, this.handle);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var gl = this.gl;

      bindVertexArray(gl, null);
      return this;
    }
  }]);

  return VertexArrayObject;
}();

exports.default = VertexArrayObject;


function createVertexArray(gl) {
  if (gl instanceof _webglTypes.WebGL2RenderingContext) {
    return gl.createVertexArray();
  }
  var ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    return ext.createVertexArrayOES();
  }
  return null;
}

function deleteVertexArray(gl, vertexArray) {
  if (gl instanceof _webglTypes.WebGL2RenderingContext) {
    gl.deleteVertexArray(vertexArray);
  }
  var ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    ext.deleteVertexArrayOES(vertexArray);
  }
  (0, _context.glCheckError)(gl);
}

function isVertexArray(gl, vertexArray) {
  if (gl instanceof _webglTypes.WebGL2RenderingContext) {
    return gl.isVertexArray(vertexArray);
  }
  var ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    return ext.isVertexArrayOES(vertexArray);
  }
  return false;
}

function bindVertexArray(gl, vertexArray) {
  if (gl instanceof _webglTypes.WebGL2RenderingContext) {
    gl.bindVertexArray(vertexArray);
  }
  var ext = gl.getExtension(OES_vertex_array_object);
  if (ext) {
    ext.bindVertexArrayOES(vertexArray);
  }
  (0, _context.glCheckError)(gl);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvdmVydGV4LWFycmF5LW9iamVjdC5qcyJdLCJuYW1lcyI6WyJpc1ZlcnRleEFycmF5IiwiT0VTX3ZlcnRleF9hcnJheV9vYmplY3QiLCJWZXJ0ZXhBcnJheU9iamVjdCIsImdsIiwiZ2V0RXh0ZW5zaW9uIiwib2JqZWN0IiwiaGFuZGxlIiwiaXNTdXBwb3J0ZWQiLCJjcmVhdGVWZXJ0ZXhBcnJheSIsIkVycm9yIiwidXNlckRhdGEiLCJPYmplY3QiLCJzZWFsIiwiZGVsZXRlVmVydGV4QXJyYXkiLCJiaW5kVmVydGV4QXJyYXkiLCJleHQiLCJjcmVhdGVWZXJ0ZXhBcnJheU9FUyIsInZlcnRleEFycmF5IiwiZGVsZXRlVmVydGV4QXJyYXlPRVMiLCJpc1ZlcnRleEFycmF5T0VTIiwiYmluZFZlcnRleEFycmF5T0VTIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTs7O1FBd0ZnQkEsYSxHQUFBQSxhOztBQXZGaEI7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBRUE7QUFDQSxJQUFNQywwQkFBMEIseUJBQWhDOztJQUVxQkMsaUI7Ozs7O0FBRW5CO2dDQUNtQkMsRSxFQUFJO0FBQ3JCLG9EQUE0QkEsRUFBNUI7QUFDQSxhQUNFQSxvREFDQUEsR0FBR0MsWUFBSCxDQUFnQix5QkFBaEIsQ0FGRjtBQUlEOztBQUVEOzs7O3lCQUNZRCxFLEVBQUlFLE0sRUFBUTtBQUN0QixhQUFPQSxrQkFBa0JILGlCQUFsQixHQUNMRyxNQURLLEdBRUwsSUFBSUgsaUJBQUosQ0FBc0JDLEVBQXRCLEVBQTBCLEVBQUNHLFFBQVFELE9BQU9DLE1BQVAsSUFBaUJELE1BQTFCLEVBQTFCLENBRkY7QUFHRDs7QUFFRDs7OztBQUNBLDZCQUFZRixFQUFaLEVBQStCO0FBQUEsbUZBQUosRUFBSTs7QUFBQSxRQUFkRyxNQUFjLFFBQWRBLE1BQWM7O0FBQUE7O0FBQzdCLGtEQUE0QkgsRUFBNUI7QUFDQSwwQkFBT0Qsa0JBQWtCSyxXQUFsQixDQUE4QkosRUFBOUIsQ0FBUCxFQUNFLCtEQURGOztBQUdBRyxhQUFTQSxVQUFVRSxrQkFBa0JMLEVBQWxCLENBQW5CO0FBQ0E7QUFDQTtBQUNBLFFBQUksQ0FBQ0csTUFBTCxFQUFhO0FBQ1gsWUFBTSxJQUFJRyxLQUFKLENBQVUsb0NBQVYsQ0FBTjtBQUNEOztBQUVELFNBQUtOLEVBQUwsR0FBVUEsRUFBVjtBQUNBLFNBQUtHLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtJLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQUMsV0FBT0MsSUFBUCxDQUFZLElBQVo7QUFDRDs7Ozs4QkFFUTtBQUFBLFVBQ0FULEVBREEsR0FDTSxJQUROLENBQ0FBLEVBREE7O0FBRVBVLHdCQUFrQlYsRUFBbEIsRUFBc0IsS0FBS0csTUFBM0I7QUFDQSxpQ0FBYUgsRUFBYjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7MkJBRU07QUFBQSxVQUNFQSxFQURGLEdBQ1EsSUFEUixDQUNFQSxFQURGOztBQUVMVyxzQkFBZ0JYLEVBQWhCLEVBQW9CLEtBQUtHLE1BQXpCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs2QkFFUTtBQUFBLFVBQ0FILEVBREEsR0FDTSxJQUROLENBQ0FBLEVBREE7O0FBRVBXLHNCQUFnQlgsRUFBaEIsRUFBb0IsSUFBcEI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQXREa0JELGlCOzs7QUF5RHJCLFNBQVNNLGlCQUFULENBQTJCTCxFQUEzQixFQUErQjtBQUM3QixNQUFJQSxnREFBSixFQUEwQztBQUN4QyxXQUFPQSxHQUFHSyxpQkFBSCxFQUFQO0FBQ0Q7QUFDRCxNQUFNTyxNQUFNWixHQUFHQyxZQUFILENBQWdCSCx1QkFBaEIsQ0FBWjtBQUNBLE1BQUljLEdBQUosRUFBUztBQUNQLFdBQU9BLElBQUlDLG9CQUFKLEVBQVA7QUFDRDtBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVNILGlCQUFULENBQTJCVixFQUEzQixFQUErQmMsV0FBL0IsRUFBNEM7QUFDMUMsTUFBSWQsZ0RBQUosRUFBMEM7QUFDeENBLE9BQUdVLGlCQUFILENBQXFCSSxXQUFyQjtBQUNEO0FBQ0QsTUFBTUYsTUFBTVosR0FBR0MsWUFBSCxDQUFnQkgsdUJBQWhCLENBQVo7QUFDQSxNQUFJYyxHQUFKLEVBQVM7QUFDUEEsUUFBSUcsb0JBQUosQ0FBeUJELFdBQXpCO0FBQ0Q7QUFDRCw2QkFBYWQsRUFBYjtBQUNEOztBQUVNLFNBQVNILGFBQVQsQ0FBdUJHLEVBQXZCLEVBQTJCYyxXQUEzQixFQUF3QztBQUM3QyxNQUFJZCxnREFBSixFQUEwQztBQUN4QyxXQUFPQSxHQUFHSCxhQUFILENBQWlCaUIsV0FBakIsQ0FBUDtBQUNEO0FBQ0QsTUFBTUYsTUFBTVosR0FBR0MsWUFBSCxDQUFnQkgsdUJBQWhCLENBQVo7QUFDQSxNQUFJYyxHQUFKLEVBQVM7QUFDUCxXQUFPQSxJQUFJSSxnQkFBSixDQUFxQkYsV0FBckIsQ0FBUDtBQUNEO0FBQ0QsU0FBTyxLQUFQO0FBQ0Q7O0FBRUQsU0FBU0gsZUFBVCxDQUF5QlgsRUFBekIsRUFBNkJjLFdBQTdCLEVBQTBDO0FBQ3hDLE1BQUlkLGdEQUFKLEVBQTBDO0FBQ3hDQSxPQUFHVyxlQUFILENBQW1CRyxXQUFuQjtBQUNEO0FBQ0QsTUFBTUYsTUFBTVosR0FBR0MsWUFBSCxDQUFnQkgsdUJBQWhCLENBQVo7QUFDQSxNQUFJYyxHQUFKLEVBQVM7QUFDUEEsUUFBSUssa0JBQUosQ0FBdUJILFdBQXZCO0FBQ0Q7QUFDRCw2QkFBYWQsRUFBYjtBQUNEIiwiZmlsZSI6InZlcnRleC1hcnJheS1vYmplY3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTDIgVmVydGV4QXJyYXkgT2JqZWN0cyBIZWxwZXJcbmltcG9ydCB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi4vd2ViZ2wvd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4uL3dlYmdsL3dlYmdsLWNoZWNrcyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi4vd2ViZ2wvY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgT0VTX3ZlcnRleF9hcnJheV9vYmplY3QgPSAnT0VTX3ZlcnRleF9hcnJheV9vYmplY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJ0ZXhBcnJheU9iamVjdCB7XG5cbiAgLy8gUmV0dXJucyB0cnVlIGlmIFZlcnRleEFycmF5T2JqZWN0IGlzIHN1cHBvcnRlZCBieSBpbXBsZW1lbnRhdGlvblxuICBzdGF0aWMgaXNTdXBwb3J0ZWQoZ2wpIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuICAgIHJldHVybiAoXG4gICAgICBnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgfHxcbiAgICAgIGdsLmdldEV4dGVuc2lvbignT0VTX3ZlcnRleF9hcnJheV9vYmplY3QnKVxuICAgICk7XG4gIH1cblxuICAvLyBXcmFwcyBhIFdlYkdMVmVydGV4QXJyYXlPYmplY3QgaW4gYSBWZXJ0ZXhBcnJheU9iamVjdFxuICBzdGF0aWMgd3JhcChnbCwgb2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFZlcnRleEFycmF5T2JqZWN0ID9cbiAgICAgIG9iamVjdCA6XG4gICAgICBuZXcgVmVydGV4QXJyYXlPYmplY3QoZ2wsIHtoYW5kbGU6IG9iamVjdC5oYW5kbGUgfHwgb2JqZWN0fSk7XG4gIH1cblxuICAvLyBDcmVhdGUgYSBWZXJ0ZXhBcnJheU9iamVjdFxuICBjb25zdHJ1Y3RvcihnbCwge2hhbmRsZX0gPSB7fSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG4gICAgYXNzZXJ0KFZlcnRleEFycmF5T2JqZWN0LmlzU3VwcG9ydGVkKGdsKSxcbiAgICAgICdWZXJ0ZXhBcnJheU9iamVjdDogV2ViR0wyIG9yIE9FU192ZXJ0ZXhfYXJyYXlfb2JqZWN0IHJlcXVpcmVkJyk7XG5cbiAgICBoYW5kbGUgPSBoYW5kbGUgfHwgY3JlYXRlVmVydGV4QXJyYXkoZ2wpO1xuICAgIC8vIFRPRE8gaXNWZXJ0ZXhBcnJheSBmYWlscyB3aGVuIHVzaW5nIGV4dGVuc2lvbiBmb3Igc29tZSByZWFzb25cbiAgICAvLyBpZiAoIWlzVmVydGV4QXJyYXkoZ2wsIGhhbmRsZSkpIHtcbiAgICBpZiAoIWhhbmRsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgY3JlYXRlIFZlcnRleEFycmF5T2JqZWN0Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gaGFuZGxlO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBkZWxldGVWZXJ0ZXhBcnJheShnbCwgdGhpcy5oYW5kbGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGJpbmRWZXJ0ZXhBcnJheShnbCwgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGJpbmRWZXJ0ZXhBcnJheShnbCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVmVydGV4QXJyYXkoZ2wpIHtcbiAgaWYgKGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCkge1xuICAgIHJldHVybiBnbC5jcmVhdGVWZXJ0ZXhBcnJheSgpO1xuICB9XG4gIGNvbnN0IGV4dCA9IGdsLmdldEV4dGVuc2lvbihPRVNfdmVydGV4X2FycmF5X29iamVjdCk7XG4gIGlmIChleHQpIHtcbiAgICByZXR1cm4gZXh0LmNyZWF0ZVZlcnRleEFycmF5T0VTKCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGRlbGV0ZVZlcnRleEFycmF5KGdsLCB2ZXJ0ZXhBcnJheSkge1xuICBpZiAoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgZ2wuZGVsZXRlVmVydGV4QXJyYXkodmVydGV4QXJyYXkpO1xuICB9XG4gIGNvbnN0IGV4dCA9IGdsLmdldEV4dGVuc2lvbihPRVNfdmVydGV4X2FycmF5X29iamVjdCk7XG4gIGlmIChleHQpIHtcbiAgICBleHQuZGVsZXRlVmVydGV4QXJyYXlPRVModmVydGV4QXJyYXkpO1xuICB9XG4gIGdsQ2hlY2tFcnJvcihnbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ZlcnRleEFycmF5KGdsLCB2ZXJ0ZXhBcnJheSkge1xuICBpZiAoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgcmV0dXJuIGdsLmlzVmVydGV4QXJyYXkodmVydGV4QXJyYXkpO1xuICB9XG4gIGNvbnN0IGV4dCA9IGdsLmdldEV4dGVuc2lvbihPRVNfdmVydGV4X2FycmF5X29iamVjdCk7XG4gIGlmIChleHQpIHtcbiAgICByZXR1cm4gZXh0LmlzVmVydGV4QXJyYXlPRVModmVydGV4QXJyYXkpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gYmluZFZlcnRleEFycmF5KGdsLCB2ZXJ0ZXhBcnJheSkge1xuICBpZiAoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgZ2wuYmluZFZlcnRleEFycmF5KHZlcnRleEFycmF5KTtcbiAgfVxuICBjb25zdCBleHQgPSBnbC5nZXRFeHRlbnNpb24oT0VTX3ZlcnRleF9hcnJheV9vYmplY3QpO1xuICBpZiAoZXh0KSB7XG4gICAgZXh0LmJpbmRWZXJ0ZXhBcnJheU9FUyh2ZXJ0ZXhBcnJheSk7XG4gIH1cbiAgZ2xDaGVja0Vycm9yKGdsKTtcbn1cbiJdfQ==