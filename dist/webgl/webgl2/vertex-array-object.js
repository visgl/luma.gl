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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvdmVydGV4LWFycmF5LW9iamVjdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBU3FCO0FBQ25CLFdBRG1CLFdBQ25CLENBQVksRUFBWixFQUFnQjswQkFERyxhQUNIOztBQUNkLFNBQUssTUFBTCxHQUFjLEdBQUcsaUJBQUgsRUFBZCxDQURjO0FBRWQsK0JBQWEsRUFBYixFQUZjO0FBR2QsU0FBSyxRQUFMLEdBQWdCLEVBQWhCLENBSGM7QUFJZCxXQUFPLElBQVAsQ0FBWSxJQUFaLEVBSmM7R0FBaEI7O2VBRG1COzs4QkFRVjtVQUNBLEtBQU0sS0FBTixHQURBOztBQUVQLFNBQUcsaUJBQUgsQ0FBcUIsS0FBSyxNQUFMLENBQXJCLENBRk87QUFHUCxpQ0FBYSxFQUFiLEVBSE87QUFJUCxhQUFPLElBQVAsQ0FKTzs7OzsyQkFPRjtVQUNFLEtBQU0sS0FBTixHQURGOztBQUVMLFNBQUcsZUFBSCxDQUFtQixLQUFLLE1BQUwsQ0FBbkIsQ0FGSztBQUdMLGlDQUFhLEVBQWIsRUFISztBQUlMLGFBQU8sSUFBUCxDQUpLOzs7OzZCQU9FO1VBQ0EsS0FBTSxLQUFOLEdBREE7O0FBRVAsU0FBRyxlQUFILENBQW1CLElBQW5CLEVBRk87QUFHUCxpQ0FBYSxFQUFiLEVBSE87QUFJUCxhQUFPLElBQVAsQ0FKTzs7OztTQXRCVSIsImZpbGUiOiJ2ZXJ0ZXgtYXJyYXktb2JqZWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV2ViR0wyIFZlcnRleEFycmF5IE9iamVjdHMgSGVscGVyXG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi4vY29udGV4dCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbi8vIFdlYkdMVmVydGV4QXJyYXlPYmplY3Q/IGNyZWF0ZVZlcnRleEFycmF5KCk7XG4vLyB2b2lkIGRlbGV0ZVZlcnRleEFycmF5KFdlYkdMVmVydGV4QXJyYXlPYmplY3Q/IHZlcnRleEFycmF5KTtcbi8vIFtXZWJHTEhhbmRsZXNDb250ZXh0TG9zc10gR0xib29sZWFuIGlzVmVydGV4QXJyYXkoV2ViR0xWZXJ0ZXhBcnJheU9iamVjdD8gdmVydGV4QXJyYXkpO1xuLy8gdm9pZCBiaW5kVmVydGV4QXJyYXkoV2ViR0xWZXJ0ZXhBcnJheU9iamVjdD8gYXJyYXkpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWZXJ0ZXhBcnJheSB7XG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVWZXJ0ZXhBcnJheSgpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVZlcnRleEFycmF5KHRoaXMuaGFuZGxlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kVmVydGV4QXJyYXkodGhpcy5oYW5kbGUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFZlcnRleEFycmF5KG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG4iXX0=