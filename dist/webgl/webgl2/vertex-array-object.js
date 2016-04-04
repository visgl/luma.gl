'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // WebGL2 VertexArray Objects Helper


var _context = require('../context');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* eslint-disable max-len */
// WebGLVertexArrayObject? createVertexArray();
// void deleteVertexArray(WebGLVertexArrayObject? vertexArray);
// [WebGLHandlesContextLoss] GLboolean isVertexArray(WebGLVertexArrayObject? vertexArray);
// void bindVertexArray(WebGLVertexArrayObject? array);

var VertexArray = function () {
  function VertexArray(gl) {
    _classCallCheck(this, VertexArray);

    this.handle = gl.createVertexArray();
    (0, _context.glCheckError)(gl);
    this.userData = {};
    Object.seal(this);
  }

  _createClass(VertexArray, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteVertexArray(this.handle);
      (0, _context.glCheckError)(gl);
      return this;
    }
  }, {
    key: 'bind',
    value: function bind() {
      var gl = this.gl;

      gl.bindVertexArray(this.handle);
      (0, _context.glCheckError)(gl);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var gl = this.gl;

      gl.bindVertexArray(null);
      (0, _context.glCheckError)(gl);
      return this;
    }
  }]);

  return VertexArray;
}();

exports.default = VertexArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvdmVydGV4LWFycmF5LW9iamVjdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQTs7Ozs7Ozs7OztJQVFxQjtBQUNuQixXQURtQixXQUNuQixDQUFZLEVBQVosRUFBZ0I7MEJBREcsYUFDSDs7QUFDZCxTQUFLLE1BQUwsR0FBYyxHQUFHLGlCQUFILEVBQWQsQ0FEYztBQUVkLCtCQUFhLEVBQWIsRUFGYztBQUdkLFNBQUssUUFBTCxHQUFnQixFQUFoQixDQUhjO0FBSWQsV0FBTyxJQUFQLENBQVksSUFBWixFQUpjO0dBQWhCOztlQURtQjs7OEJBUVY7VUFDQSxLQUFNLEtBQU4sR0FEQTs7QUFFUCxTQUFHLGlCQUFILENBQXFCLEtBQUssTUFBTCxDQUFyQixDQUZPO0FBR1AsaUNBQWEsRUFBYixFQUhPO0FBSVAsYUFBTyxJQUFQLENBSk87Ozs7MkJBT0Y7VUFDRSxLQUFNLEtBQU4sR0FERjs7QUFFTCxTQUFHLGVBQUgsQ0FBbUIsS0FBSyxNQUFMLENBQW5CLENBRks7QUFHTCxpQ0FBYSxFQUFiLEVBSEs7QUFJTCxhQUFPLElBQVAsQ0FKSzs7Ozs2QkFPRTtVQUNBLEtBQU0sS0FBTixHQURBOztBQUVQLFNBQUcsZUFBSCxDQUFtQixJQUFuQixFQUZPO0FBR1AsaUNBQWEsRUFBYixFQUhPO0FBSVAsYUFBTyxJQUFQLENBSk87Ozs7U0F0QlUiLCJmaWxlIjoidmVydGV4LWFycmF5LW9iamVjdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdlYkdMMiBWZXJ0ZXhBcnJheSBPYmplY3RzIEhlbHBlclxuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4uL2NvbnRleHQnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4vLyBXZWJHTFZlcnRleEFycmF5T2JqZWN0PyBjcmVhdGVWZXJ0ZXhBcnJheSgpO1xuLy8gdm9pZCBkZWxldGVWZXJ0ZXhBcnJheShXZWJHTFZlcnRleEFycmF5T2JqZWN0PyB2ZXJ0ZXhBcnJheSk7XG4vLyBbV2ViR0xIYW5kbGVzQ29udGV4dExvc3NdIEdMYm9vbGVhbiBpc1ZlcnRleEFycmF5KFdlYkdMVmVydGV4QXJyYXlPYmplY3Q/IHZlcnRleEFycmF5KTtcbi8vIHZvaWQgYmluZFZlcnRleEFycmF5KFdlYkdMVmVydGV4QXJyYXlPYmplY3Q/IGFycmF5KTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmVydGV4QXJyYXkge1xuICBjb25zdHJ1Y3RvcihnbCkge1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlVmVydGV4QXJyYXkoKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVWZXJ0ZXhBcnJheSh0aGlzLmhhbmRsZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFZlcnRleEFycmF5KHRoaXMuaGFuZGxlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRWZXJ0ZXhBcnJheShudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuIl19