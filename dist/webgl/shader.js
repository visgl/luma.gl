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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9zaGFkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBR2EsMEJBRVgsU0FGVyxNQUVYLENBQVksRUFBWixFQUFnQixZQUFoQixFQUE4QixVQUE5QixFQUEwQzt3QkFGL0IsUUFFK0I7O0FBQ3hDLE9BQUssRUFBTCxHQUFVLEVBQVYsQ0FEd0M7QUFFeEMsT0FBSyxNQUFMLEdBQWMsR0FBRyxZQUFILENBQWdCLFVBQWhCLENBQWQsQ0FGd0M7QUFHeEMsTUFBSSxLQUFLLE1BQUwsS0FBZ0IsSUFBaEIsRUFBc0I7QUFDeEIsVUFBTSxJQUFJLEtBQUosc0NBQTZDLFVBQTdDLENBQU4sQ0FEd0I7R0FBMUI7QUFHQSxLQUFHLFlBQUgsQ0FBZ0IsS0FBSyxNQUFMLEVBQWEsWUFBN0IsRUFOd0M7QUFPeEMsS0FBRyxhQUFILENBQWlCLEtBQUssTUFBTCxDQUFqQixDQVB3QztBQVF4QyxNQUFJLFdBQVcsR0FBRyxrQkFBSCxDQUFzQixLQUFLLE1BQUwsRUFBYSxHQUFHLGNBQUgsQ0FBOUMsQ0FSb0M7QUFTeEMsTUFBSSxDQUFDLFFBQUQsRUFBVztBQUNiLFFBQUksT0FBTyxHQUFHLGdCQUFILENBQW9CLEtBQUssTUFBTCxDQUEzQixDQURTO0FBRWIsT0FBRyxZQUFILENBQWdCLEtBQUssTUFBTCxDQUFoQjs7QUFGYSxRQUlULFlBQUosQ0FKYTtBQUtiLFFBQUk7QUFDRixxQkFBZSxxQ0FBb0IsSUFBcEIsRUFBMEIsWUFBMUIsRUFBd0MsVUFBeEMsQ0FBZixDQURFO0tBQUosQ0FFRSxPQUFPLEtBQVAsRUFBYzs7O0FBR2QsY0FBUSxJQUFSLENBQWEsdUNBQWIsRUFBc0QsS0FBdEQ7O0FBSGMsWUFLUixJQUFJLEtBQUosdUNBQThDLElBQTlDLENBQU4sQ0FMYztLQUFkOztBQVBXLFVBZVAsSUFBSSxLQUFKLENBQVUsYUFBYSxJQUFiLENBQWhCLENBZmE7R0FBZjtDQVRGOztJQThCVzs7O0FBQ1gsV0FEVyxZQUNYLENBQVksRUFBWixFQUFnQixZQUFoQixFQUE4QjswQkFEbkIsY0FDbUI7O2tFQURuQix5QkFFSCxJQUFJLGNBQWMsR0FBRyxhQUFILEdBREk7R0FBOUI7O1NBRFc7RUFBcUI7O0lBTXJCOzs7QUFDWCxXQURXLGNBQ1gsQ0FBWSxFQUFaLEVBQWdCLFlBQWhCLEVBQThCOzBCQURuQixnQkFDbUI7O2tFQURuQiwyQkFFSCxJQUFJLGNBQWMsR0FBRyxlQUFILEdBREk7R0FBOUI7O1NBRFc7RUFBdUIiLCJmaWxlIjoic2hhZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZvcm1hdENvbXBpbGVyRXJyb3IgZnJvbSAnZ2wtZm9ybWF0LWNvbXBpbGVyLWVycm9yJztcblxuLy8gRm9yIG5vdyB0aGlzIGlzIGFuIGludGVybmFsIGNsYXNzXG5leHBvcnQgY2xhc3MgU2hhZGVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuICAgIGlmICh0aGlzLmhhbmRsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBjcmVhdGluZyBzaGFkZXIgd2l0aCB0eXBlICR7c2hhZGVyVHlwZX1gKTtcbiAgICB9XG4gICAgZ2wuc2hhZGVyU291cmNlKHRoaXMuaGFuZGxlLCBzaGFkZXJTb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgIHZhciBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcih0aGlzLmhhbmRsZSwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgIHZhciBpbmZvID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyh0aGlzLmhhbmRsZSk7XG4gICAgICBnbC5kZWxldGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB2YXIgZm9ybWF0dGVkTG9nO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZm9ybWF0dGVkTG9nID0gZm9ybWF0Q29tcGlsZXJFcnJvcihpbmZvLCBzaGFkZXJTb3VyY2UsIHNoYWRlclR5cGUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLndhcm4oJ0Vycm9yIGZvcm1hdHRpbmcgZ2xzbCBjb21waWxlciBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgc2hhZGVyICR7aW5mb31gKTtcbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0dGVkTG9nLmxvbmcpO1xuICAgIH1cbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBWZXJ0ZXhTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNoYWRlclNvdXJjZSwgZ2wuVkVSVEVYX1NIQURFUik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZyYWdtZW50U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIH1cbn1cbiJdfQ==