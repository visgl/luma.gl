'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FragmentShader = exports.VertexShader = exports.Shader = undefined;

var _glFormatCompilerError = require('gl-format-compiler-error');

var _glFormatCompilerError2 = _interopRequireDefault(_glFormatCompilerError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// For now this is an internal class

var Shader = exports.Shader = function Shader(gl, shaderSource, shaderType) {
  _classCallCheck(this, Shader);

  this.gl = gl;
  this.handle = gl.createShader(shaderType);
  if (this.handle === null) {
    throw new Error('Error creating shader with type ' + shaderType);
  }
  gl.shaderSource(this.handle, shaderSource);
  gl.compileShader(this.handle);
  var compiled = gl.getShaderParameter(this.handle, gl.COMPILE_STATUS);
  if (!compiled) {
    var info = gl.getShaderInfoLog(this.handle);
    gl.deleteShader(this.handle);
    /* eslint-disable no-try-catch */
    var formattedLog;
    try {
      formattedLog = (0, _glFormatCompilerError2.default)(info, shaderSource, shaderType);
    } catch (error) {
      /* eslint-disable no-console */
      /* global console */
      console.warn('Error formatting glsl compiler error:', error);
      /* eslint-enable no-console */
      throw new Error('Error while compiling the shader ' + info);
    }
    /* eslint-enable no-try-catch */
    throw new Error(formattedLog.long);
  }
};

var VertexShader = exports.VertexShader = function (_Shader) {
  _inherits(VertexShader, _Shader);

  function VertexShader(gl, shaderSource) {
    _classCallCheck(this, VertexShader);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(VertexShader).call(this, gl, shaderSource, gl.VERTEX_SHADER));
  }

  return VertexShader;
}(Shader);

var FragmentShader = exports.FragmentShader = function (_Shader2) {
  _inherits(FragmentShader, _Shader2);

  function FragmentShader(gl, shaderSource) {
    _classCallCheck(this, FragmentShader);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(FragmentShader).call(this, gl, shaderSource, gl.FRAGMENT_SHADER));
  }

  return FragmentShader;
}(Shader);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9zaGFkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7OztJQUdhLDBCQUVYLFNBRlcsTUFFWCxDQUFZLEVBQVosRUFBZ0IsWUFBaEIsRUFBOEIsVUFBOUIsRUFBMEM7d0JBRi9CLFFBRStCOztBQUN4QyxPQUFLLEVBQUwsR0FBVSxFQUFWLENBRHdDO0FBRXhDLE9BQUssTUFBTCxHQUFjLEdBQUcsWUFBSCxDQUFnQixVQUFoQixDQUFkLENBRndDO0FBR3hDLE1BQUksS0FBSyxNQUFMLEtBQWdCLElBQWhCLEVBQXNCO0FBQ3hCLFVBQU0sSUFBSSxLQUFKLHNDQUE2QyxVQUE3QyxDQUFOLENBRHdCO0dBQTFCO0FBR0EsS0FBRyxZQUFILENBQWdCLEtBQUssTUFBTCxFQUFhLFlBQTdCLEVBTndDO0FBT3hDLEtBQUcsYUFBSCxDQUFpQixLQUFLLE1BQUwsQ0FBakIsQ0FQd0M7QUFReEMsTUFBSSxXQUFXLEdBQUcsa0JBQUgsQ0FBc0IsS0FBSyxNQUFMLEVBQWEsR0FBRyxjQUFILENBQTlDLENBUm9DO0FBU3hDLE1BQUksQ0FBQyxRQUFELEVBQVc7QUFDYixRQUFJLE9BQU8sR0FBRyxnQkFBSCxDQUFvQixLQUFLLE1BQUwsQ0FBM0IsQ0FEUztBQUViLE9BQUcsWUFBSCxDQUFnQixLQUFLLE1BQUwsQ0FBaEI7O0FBRmEsUUFJVCxZQUFKLENBSmE7QUFLYixRQUFJO0FBQ0YscUJBQWUscUNBQW9CLElBQXBCLEVBQTBCLFlBQTFCLEVBQXdDLFVBQXhDLENBQWYsQ0FERTtLQUFKLENBRUUsT0FBTyxLQUFQLEVBQWM7OztBQUdkLGNBQVEsSUFBUixDQUFhLHVDQUFiLEVBQXNELEtBQXREOztBQUhjLFlBS1IsSUFBSSxLQUFKLHVDQUE4QyxJQUE5QyxDQUFOLENBTGM7S0FBZDs7QUFQVyxVQWVQLElBQUksS0FBSixDQUFVLGFBQWEsSUFBYixDQUFoQixDQWZhO0dBQWY7Q0FURjs7SUE4Qlc7OztBQUNYLFdBRFcsWUFDWCxDQUFZLEVBQVosRUFBZ0IsWUFBaEIsRUFBOEI7MEJBRG5CLGNBQ21COztrRUFEbkIseUJBRUgsSUFBSSxjQUFjLEdBQUcsYUFBSCxHQURJO0dBQTlCOztTQURXO0VBQXFCOztJQU1yQjs7O0FBQ1gsV0FEVyxjQUNYLENBQVksRUFBWixFQUFnQixZQUFoQixFQUE4QjswQkFEbkIsZ0JBQ21COztrRUFEbkIsMkJBRUgsSUFBSSxjQUFjLEdBQUcsZUFBSCxHQURJO0dBQTlCOztTQURXO0VBQXVCIiwiZmlsZSI6InNoYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmb3JtYXRDb21waWxlckVycm9yIGZyb20gJ2dsLWZvcm1hdC1jb21waWxlci1lcnJvcic7XG5cbi8vIEZvciBub3cgdGhpcyBpcyBhbiBpbnRlcm5hbCBjbGFzc1xuZXhwb3J0IGNsYXNzIFNoYWRlciB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSwgc2hhZGVyVHlwZSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVNoYWRlcihzaGFkZXJUeXBlKTtcbiAgICBpZiAodGhpcy5oYW5kbGUgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgY3JlYXRpbmcgc2hhZGVyIHdpdGggdHlwZSAke3NoYWRlclR5cGV9YCk7XG4gICAgfVxuICAgIGdsLnNoYWRlclNvdXJjZSh0aGlzLmhhbmRsZSwgc2hhZGVyU291cmNlKTtcbiAgICBnbC5jb21waWxlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICB2YXIgY29tcGlsZWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIodGhpcy5oYW5kbGUsIGdsLkNPTVBJTEVfU1RBVFVTKTtcbiAgICBpZiAoIWNvbXBpbGVkKSB7XG4gICAgICB2YXIgaW5mbyA9IGdsLmdldFNoYWRlckluZm9Mb2codGhpcy5oYW5kbGUpO1xuICAgICAgZ2wuZGVsZXRlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCAqL1xuICAgICAgdmFyIGZvcm1hdHRlZExvZztcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvcm1hdHRlZExvZyA9IGZvcm1hdENvbXBpbGVyRXJyb3IoaW5mbywgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgLyogZ2xvYmFsIGNvbnNvbGUgKi9cbiAgICAgICAgY29uc29sZS53YXJuKCdFcnJvciBmb3JtYXR0aW5nIGdsc2wgY29tcGlsZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciB3aGlsZSBjb21waWxpbmcgdGhlIHNoYWRlciAke2luZm99YCk7XG4gICAgICB9XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXRyeS1jYXRjaCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGZvcm1hdHRlZExvZy5sb25nKTtcbiAgICB9XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVmVydGV4U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLlZFUlRFWF9TSEFERVIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGcmFnbWVudFNoYWRlciBleHRlbmRzIFNoYWRlciB7XG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXJTb3VyY2UpIHtcbiAgICBzdXBlcihnbCwgc2hhZGVyU291cmNlLCBnbC5GUkFHTUVOVF9TSEFERVIpO1xuICB9XG59XG4iXX0=