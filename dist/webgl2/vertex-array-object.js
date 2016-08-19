'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 VertexArray Objects Helper


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
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbDIvdmVydGV4LWFycmF5LW9iamVjdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7O0FBR0EsSUFBTSwwQkFBMEIseUJBQWhDOztJQUVxQixpQjs7Ozs7O2dDQUdBLEUsRUFBSTtBQUNyQixvREFBNEIsRUFBNUI7QUFDQSxhQUNFLG9EQUNBLEdBQUcsWUFBSCxDQUFnQix5QkFBaEIsQ0FGRjtBQUlEOzs7Ozs7eUJBR1csRSxFQUFJLE0sRUFBUTtBQUN0QixhQUFPLGtCQUFrQixpQkFBbEIsR0FDTCxNQURLLEdBRUwsSUFBSSxpQkFBSixDQUFzQixFQUF0QixFQUEwQixFQUFDLFFBQVEsT0FBTyxNQUFQLElBQWlCLE1BQTFCLEVBQTFCLENBRkY7QUFHRDs7Ozs7O0FBR0QsNkJBQVksRUFBWixFQUErQjtBQUFBLHFFQUFKLEVBQUk7O0FBQUEsUUFBZCxNQUFjLFFBQWQsTUFBYzs7QUFBQTs7QUFDN0Isa0RBQTRCLEVBQTVCO0FBQ0EsMEJBQU8sa0JBQWtCLFdBQWxCLENBQThCLEVBQTlCLENBQVAsRUFDRSwrREFERjs7QUFHQSxhQUFTLFVBQVUsa0JBQWtCLEVBQWxCLENBQW5COzs7QUFHQSxRQUFJLENBQUMsTUFBTCxFQUFhO0FBQ1gsWUFBTSxJQUFJLEtBQUosQ0FBVSxvQ0FBVixDQUFOO0FBQ0Q7O0FBRUQsU0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQSxXQUFPLElBQVAsQ0FBWSxJQUFaO0FBQ0Q7Ozs7OEJBRVE7QUFBQSxVQUNBLEVBREEsR0FDTSxJQUROLENBQ0EsRUFEQTs7QUFFUCx3QkFBa0IsRUFBbEIsRUFBc0IsS0FBSyxNQUEzQjtBQUNBLGlDQUFhLEVBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzJCQUVNO0FBQUEsVUFDRSxFQURGLEdBQ1EsSUFEUixDQUNFLEVBREY7O0FBRUwsc0JBQWdCLEVBQWhCLEVBQW9CLEtBQUssTUFBekI7QUFDQSxhQUFPLElBQVA7QUFDRDs7OzZCQUVRO0FBQUEsVUFDQSxFQURBLEdBQ00sSUFETixDQUNBLEVBREE7O0FBRVAsc0JBQWdCLEVBQWhCLEVBQW9CLElBQXBCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkF0RGtCLGlCOzs7QUF5RHJCLFNBQVMsaUJBQVQsQ0FBMkIsRUFBM0IsRUFBK0I7QUFDN0IsTUFBSSxnREFBSixFQUEwQztBQUN4QyxXQUFPLEdBQUcsaUJBQUgsRUFBUDtBQUNEO0FBQ0QsTUFBTSxNQUFNLEdBQUcsWUFBSCxDQUFnQix1QkFBaEIsQ0FBWjtBQUNBLE1BQUksR0FBSixFQUFTO0FBQ1AsV0FBTyxJQUFJLG9CQUFKLEVBQVA7QUFDRDtBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVMsaUJBQVQsQ0FBMkIsRUFBM0IsRUFBK0IsV0FBL0IsRUFBNEM7QUFDMUMsTUFBSSxnREFBSixFQUEwQztBQUN4QyxPQUFHLGlCQUFILENBQXFCLFdBQXJCO0FBQ0Q7QUFDRCxNQUFNLE1BQU0sR0FBRyxZQUFILENBQWdCLHVCQUFoQixDQUFaO0FBQ0EsTUFBSSxHQUFKLEVBQVM7QUFDUCxRQUFJLG9CQUFKLENBQXlCLFdBQXpCO0FBQ0Q7QUFDRCw2QkFBYSxFQUFiO0FBQ0Q7O0FBRUQsU0FBUyxhQUFULENBQXVCLEVBQXZCLEVBQTJCLFdBQTNCLEVBQXdDO0FBQ3RDLE1BQUksZ0RBQUosRUFBMEM7QUFDeEMsV0FBTyxHQUFHLGFBQUgsQ0FBaUIsV0FBakIsQ0FBUDtBQUNEO0FBQ0QsTUFBTSxNQUFNLEdBQUcsWUFBSCxDQUFnQix1QkFBaEIsQ0FBWjtBQUNBLE1BQUksR0FBSixFQUFTO0FBQ1AsV0FBTyxJQUFJLGdCQUFKLENBQXFCLFdBQXJCLENBQVA7QUFDRDtBQUNELFNBQU8sS0FBUDtBQUNEOztBQUVELFNBQVMsZUFBVCxDQUF5QixFQUF6QixFQUE2QixXQUE3QixFQUEwQztBQUN4QyxNQUFJLGdEQUFKLEVBQTBDO0FBQ3hDLE9BQUcsZUFBSCxDQUFtQixXQUFuQjtBQUNEO0FBQ0QsTUFBTSxNQUFNLEdBQUcsWUFBSCxDQUFnQix1QkFBaEIsQ0FBWjtBQUNBLE1BQUksR0FBSixFQUFTO0FBQ1AsUUFBSSxrQkFBSixDQUF1QixXQUF2QjtBQUNEO0FBQ0QsNkJBQWEsRUFBYjtBQUNEIiwiZmlsZSI6InZlcnRleC1hcnJheS1vYmplY3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTDIgVmVydGV4QXJyYXkgT2JqZWN0cyBIZWxwZXJcbmltcG9ydCB7V2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi4vd2ViZ2wvd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4uL3dlYmdsL3dlYmdsLWNoZWNrcyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi4vd2ViZ2wvY29udGV4dCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIGNhbWVsY2FzZSAqL1xuY29uc3QgT0VTX3ZlcnRleF9hcnJheV9vYmplY3QgPSAnT0VTX3ZlcnRleF9hcnJheV9vYmplY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJ0ZXhBcnJheU9iamVjdCB7XG5cbiAgLy8gUmV0dXJucyB0cnVlIGlmIFZlcnRleEFycmF5T2JqZWN0IGlzIHN1cHBvcnRlZCBieSBpbXBsZW1lbnRhdGlvblxuICBzdGF0aWMgaXNTdXBwb3J0ZWQoZ2wpIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuICAgIHJldHVybiAoXG4gICAgICBnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgfHxcbiAgICAgIGdsLmdldEV4dGVuc2lvbignT0VTX3ZlcnRleF9hcnJheV9vYmplY3QnKVxuICAgICk7XG4gIH1cblxuICAvLyBXcmFwcyBhIFdlYkdMVmVydGV4QXJyYXlPYmplY3QgaW4gYSBWZXJ0ZXhBcnJheU9iamVjdFxuICBzdGF0aWMgd3JhcChnbCwgb2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFZlcnRleEFycmF5T2JqZWN0ID9cbiAgICAgIG9iamVjdCA6XG4gICAgICBuZXcgVmVydGV4QXJyYXlPYmplY3QoZ2wsIHtoYW5kbGU6IG9iamVjdC5oYW5kbGUgfHwgb2JqZWN0fSk7XG4gIH1cblxuICAvLyBDcmVhdGUgYSBWZXJ0ZXhBcnJheU9iamVjdFxuICBjb25zdHJ1Y3RvcihnbCwge2hhbmRsZX0gPSB7fSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG4gICAgYXNzZXJ0KFZlcnRleEFycmF5T2JqZWN0LmlzU3VwcG9ydGVkKGdsKSxcbiAgICAgICdWZXJ0ZXhBcnJheU9iamVjdDogV2ViR0wyIG9yIE9FU192ZXJ0ZXhfYXJyYXlfb2JqZWN0IHJlcXVpcmVkJyk7XG5cbiAgICBoYW5kbGUgPSBoYW5kbGUgfHwgY3JlYXRlVmVydGV4QXJyYXkoZ2wpO1xuICAgIC8vIFRPRE8gaXNWZXJ0ZXhBcnJheSBmYWlscyB3aGVuIHVzaW5nIGV4dGVuc2lvbiBmb3Igc29tZSByZWFzb25cbiAgICAvLyBpZiAoIWlzVmVydGV4QXJyYXkoZ2wsIGhhbmRsZSkpIHtcbiAgICBpZiAoIWhhbmRsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgY3JlYXRlIFZlcnRleEFycmF5T2JqZWN0Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gaGFuZGxlO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBkZWxldGVWZXJ0ZXhBcnJheShnbCwgdGhpcy5oYW5kbGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGJpbmRWZXJ0ZXhBcnJheShnbCwgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGJpbmRWZXJ0ZXhBcnJheShnbCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVmVydGV4QXJyYXkoZ2wpIHtcbiAgaWYgKGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCkge1xuICAgIHJldHVybiBnbC5jcmVhdGVWZXJ0ZXhBcnJheSgpO1xuICB9XG4gIGNvbnN0IGV4dCA9IGdsLmdldEV4dGVuc2lvbihPRVNfdmVydGV4X2FycmF5X29iamVjdCk7XG4gIGlmIChleHQpIHtcbiAgICByZXR1cm4gZXh0LmNyZWF0ZVZlcnRleEFycmF5T0VTKCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGRlbGV0ZVZlcnRleEFycmF5KGdsLCB2ZXJ0ZXhBcnJheSkge1xuICBpZiAoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgZ2wuZGVsZXRlVmVydGV4QXJyYXkodmVydGV4QXJyYXkpO1xuICB9XG4gIGNvbnN0IGV4dCA9IGdsLmdldEV4dGVuc2lvbihPRVNfdmVydGV4X2FycmF5X29iamVjdCk7XG4gIGlmIChleHQpIHtcbiAgICBleHQuZGVsZXRlVmVydGV4QXJyYXlPRVModmVydGV4QXJyYXkpO1xuICB9XG4gIGdsQ2hlY2tFcnJvcihnbCk7XG59XG5cbmZ1bmN0aW9uIGlzVmVydGV4QXJyYXkoZ2wsIHZlcnRleEFycmF5KSB7XG4gIGlmIChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICByZXR1cm4gZ2wuaXNWZXJ0ZXhBcnJheSh2ZXJ0ZXhBcnJheSk7XG4gIH1cbiAgY29uc3QgZXh0ID0gZ2wuZ2V0RXh0ZW5zaW9uKE9FU192ZXJ0ZXhfYXJyYXlfb2JqZWN0KTtcbiAgaWYgKGV4dCkge1xuICAgIHJldHVybiBleHQuaXNWZXJ0ZXhBcnJheU9FUyh2ZXJ0ZXhBcnJheSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBiaW5kVmVydGV4QXJyYXkoZ2wsIHZlcnRleEFycmF5KSB7XG4gIGlmIChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkodmVydGV4QXJyYXkpO1xuICB9XG4gIGNvbnN0IGV4dCA9IGdsLmdldEV4dGVuc2lvbihPRVNfdmVydGV4X2FycmF5X29iamVjdCk7XG4gIGlmIChleHQpIHtcbiAgICBleHQuYmluZFZlcnRleEFycmF5T0VTKHZlcnRleEFycmF5KTtcbiAgfVxuICBnbENoZWNrRXJyb3IoZ2wpO1xufVxuIl19