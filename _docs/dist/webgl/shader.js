'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FragmentShader = exports.VertexShader = exports.Shader = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webglTypes = require('./webgl-types');

var _glFormatCompilerError = require('gl-format-compiler-error');

var _glFormatCompilerError2 = _interopRequireDefault(_glFormatCompilerError);

var _glslShaderName = require('glsl-shader-name');

var _glslShaderName2 = _interopRequireDefault(_glslShaderName);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// For now this is an internal class
var Shader = exports.Shader = function () {

  /* eslint-disable max-statements */
  function Shader(gl, shaderSource, shaderType) {
    _classCallCheck(this, Shader);

    this.id = (0, _glslShaderName2.default)(shaderSource) || (0, _utils.uid)(this._getName(shaderType));
    this.gl = gl;
    this.shaderType = shaderType;
    this.shaderSource = shaderSource;
    this.handle = gl.createShader(shaderType);
    if (this.handle === null) {
      throw new Error('Error creating shader with type ' + shaderType);
    }
    this._compile(shaderSource);
  }

  _createClass(Shader, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      if (this.handle) {
        gl.deleteShader(this.handle);
        this.handle = null;
      }
    }
  }, {
    key: 'getName',
    value: function getName() {
      return (0, _glslShaderName2.default)(this.shaderSource);
    }
  }, {
    key: '_compile',
    value: function _compile(shaderSource) {
      var gl = this.gl;

      gl.shaderSource(this.handle, shaderSource);
      gl.compileShader(this.handle);
      var compiled = gl.getShaderParameter(this.handle, _webglTypes.GL.COMPILE_STATUS);
      if (!compiled) {
        var info = gl.getShaderInfoLog(this.handle);
        gl.deleteShader(this.handle);
        /* eslint-disable no-try-catch */
        var formattedLog = void 0;
        try {
          formattedLog = (0, _glFormatCompilerError2.default)(info, shaderSource, this.shaderType);
        } catch (error) {
          /* eslint-disable no-console */
          /* global console */
          _utils.log.warn('Error formatting glsl compiler error:', error);
          /* eslint-enable no-console */
          throw new Error('Error while compiling the shader ' + info);
        }
        /* eslint-enable no-try-catch */
        throw new Error(formattedLog.long);
      }
    }
    /* eslint-enable max-statements */

  }, {
    key: '_getName',
    value: function _getName(shaderType) {
      switch (shaderType) {
        case _webglTypes.GL.VERTEX_SHADER:
          return 'vertex-shader';
        case _webglTypes.GL.FRAGMENT_SHADER:
          return 'fragment-shader';
        default:
          return 'shader';
      }
    }
  }]);

  return Shader;
}();

var VertexShader = exports.VertexShader = function (_Shader) {
  _inherits(VertexShader, _Shader);

  function VertexShader(gl, shaderSource) {
    _classCallCheck(this, VertexShader);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(VertexShader).call(this, gl, shaderSource, _webglTypes.GL.VERTEX_SHADER));
  }

  return VertexShader;
}(Shader);

var FragmentShader = exports.FragmentShader = function (_Shader2) {
  _inherits(FragmentShader, _Shader2);

  function FragmentShader(gl, shaderSource) {
    _classCallCheck(this, FragmentShader);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(FragmentShader).call(this, gl, shaderSource, _webglTypes.GL.FRAGMENT_SHADER));
  }

  return FragmentShader;
}(Shader);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9zaGFkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7O0FBRUE7SUFDYSxNLFdBQUEsTTs7QUFFWDtBQUNBLGtCQUFZLEVBQVosRUFBZ0IsWUFBaEIsRUFBOEIsVUFBOUIsRUFBMEM7QUFBQTs7QUFDeEMsU0FBSyxFQUFMLEdBQVUsOEJBQWMsWUFBZCxLQUErQixnQkFBSSxLQUFLLFFBQUwsQ0FBYyxVQUFkLENBQUosQ0FBekM7QUFDQSxTQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsU0FBSyxVQUFMLEdBQWtCLFVBQWxCO0FBQ0EsU0FBSyxZQUFMLEdBQW9CLFlBQXBCO0FBQ0EsU0FBSyxNQUFMLEdBQWMsR0FBRyxZQUFILENBQWdCLFVBQWhCLENBQWQ7QUFDQSxRQUFJLEtBQUssTUFBTCxLQUFnQixJQUFwQixFQUEwQjtBQUN4QixZQUFNLElBQUksS0FBSixzQ0FBNkMsVUFBN0MsQ0FBTjtBQUNEO0FBQ0QsU0FBSyxRQUFMLENBQWMsWUFBZDtBQUNEOzs7OzhCQUVRO0FBQUEsVUFDQSxFQURBLEdBQ00sSUFETixDQUNBLEVBREE7O0FBRVAsVUFBSSxLQUFLLE1BQVQsRUFBaUI7QUFDZixXQUFHLFlBQUgsQ0FBZ0IsS0FBSyxNQUFyQjtBQUNBLGFBQUssTUFBTCxHQUFjLElBQWQ7QUFDRDtBQUNGOzs7OEJBRVM7QUFDUixhQUFPLDhCQUFjLEtBQUssWUFBbkIsQ0FBUDtBQUNEOzs7NkJBRVEsWSxFQUFjO0FBQUEsVUFDZCxFQURjLEdBQ1IsSUFEUSxDQUNkLEVBRGM7O0FBRXJCLFNBQUcsWUFBSCxDQUFnQixLQUFLLE1BQXJCLEVBQTZCLFlBQTdCO0FBQ0EsU0FBRyxhQUFILENBQWlCLEtBQUssTUFBdEI7QUFDQSxVQUFNLFdBQVcsR0FBRyxrQkFBSCxDQUFzQixLQUFLLE1BQTNCLEVBQW1DLGVBQUcsY0FBdEMsQ0FBakI7QUFDQSxVQUFJLENBQUMsUUFBTCxFQUFlO0FBQ2IsWUFBTSxPQUFPLEdBQUcsZ0JBQUgsQ0FBb0IsS0FBSyxNQUF6QixDQUFiO0FBQ0EsV0FBRyxZQUFILENBQWdCLEtBQUssTUFBckI7QUFDQTtBQUNBLFlBQUkscUJBQUo7QUFDQSxZQUFJO0FBQ0YseUJBQWUscUNBQW9CLElBQXBCLEVBQTBCLFlBQTFCLEVBQXdDLEtBQUssVUFBN0MsQ0FBZjtBQUNELFNBRkQsQ0FFRSxPQUFPLEtBQVAsRUFBYztBQUNkO0FBQ0E7QUFDQSxxQkFBSSxJQUFKLENBQVMsdUNBQVQsRUFBa0QsS0FBbEQ7QUFDQTtBQUNBLGdCQUFNLElBQUksS0FBSix1Q0FBOEMsSUFBOUMsQ0FBTjtBQUNEO0FBQ0Q7QUFDQSxjQUFNLElBQUksS0FBSixDQUFVLGFBQWEsSUFBdkIsQ0FBTjtBQUNEO0FBQ0Y7QUFDRDs7Ozs2QkFFUyxVLEVBQVk7QUFDbkIsY0FBUSxVQUFSO0FBQ0EsYUFBSyxlQUFHLGFBQVI7QUFBdUIsaUJBQU8sZUFBUDtBQUN2QixhQUFLLGVBQUcsZUFBUjtBQUF5QixpQkFBTyxpQkFBUDtBQUN6QjtBQUFTLGlCQUFPLFFBQVA7QUFIVDtBQUtEOzs7Ozs7SUFHVSxZLFdBQUEsWTs7O0FBQ1gsd0JBQVksRUFBWixFQUFnQixZQUFoQixFQUE4QjtBQUFBOztBQUFBLDJGQUN0QixFQURzQixFQUNsQixZQURrQixFQUNKLGVBQUcsYUFEQztBQUU3Qjs7O0VBSCtCLE07O0lBTXJCLGMsV0FBQSxjOzs7QUFDWCwwQkFBWSxFQUFaLEVBQWdCLFlBQWhCLEVBQThCO0FBQUE7O0FBQUEsNkZBQ3RCLEVBRHNCLEVBQ2xCLFlBRGtCLEVBQ0osZUFBRyxlQURDO0FBRTdCOzs7RUFIaUMsTSIsImZpbGUiOiJzaGFkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0dMfSBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCBmb3JtYXRDb21waWxlckVycm9yIGZyb20gJ2dsLWZvcm1hdC1jb21waWxlci1lcnJvcic7XG5pbXBvcnQgZ2V0U2hhZGVyTmFtZSBmcm9tICdnbHNsLXNoYWRlci1uYW1lJztcbmltcG9ydCB7bG9nLCB1aWR9IGZyb20gJy4uL3V0aWxzJztcblxuLy8gRm9yIG5vdyB0aGlzIGlzIGFuIGludGVybmFsIGNsYXNzXG5leHBvcnQgY2xhc3MgU2hhZGVyIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKSB7XG4gICAgdGhpcy5pZCA9IGdldFNoYWRlck5hbWUoc2hhZGVyU291cmNlKSB8fCB1aWQodGhpcy5fZ2V0TmFtZShzaGFkZXJUeXBlKSk7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuc2hhZGVyVHlwZSA9IHNoYWRlclR5cGU7XG4gICAgdGhpcy5zaGFkZXJTb3VyY2UgPSBzaGFkZXJTb3VyY2U7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSk7XG4gICAgaWYgKHRoaXMuaGFuZGxlID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGNyZWF0aW5nIHNoYWRlciB3aXRoIHR5cGUgJHtzaGFkZXJUeXBlfWApO1xuICAgIH1cbiAgICB0aGlzLl9jb21waWxlKHNoYWRlclNvdXJjZSk7XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaGFuZGxlKSB7XG4gICAgICBnbC5kZWxldGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIGdldFNoYWRlck5hbWUodGhpcy5zaGFkZXJTb3VyY2UpO1xuICB9XG5cbiAgX2NvbXBpbGUoc2hhZGVyU291cmNlKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuc2hhZGVyU291cmNlKHRoaXMuaGFuZGxlLCBzaGFkZXJTb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgIGNvbnN0IGNvbXBpbGVkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBHTC5DT01QSUxFX1NUQVRVUyk7XG4gICAgaWYgKCFjb21waWxlZCkge1xuICAgICAgY29uc3QgaW5mbyA9IGdsLmdldFNoYWRlckluZm9Mb2codGhpcy5oYW5kbGUpO1xuICAgICAgZ2wuZGVsZXRlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCAqL1xuICAgICAgbGV0IGZvcm1hdHRlZExvZztcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvcm1hdHRlZExvZyA9IGZvcm1hdENvbXBpbGVyRXJyb3IoaW5mbywgc2hhZGVyU291cmNlLCB0aGlzLnNoYWRlclR5cGUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgICBsb2cud2FybignRXJyb3IgZm9ybWF0dGluZyBnbHNsIGNvbXBpbGVyIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3Igd2hpbGUgY29tcGlsaW5nIHRoZSBzaGFkZXIgJHtpbmZvfWApO1xuICAgICAgfVxuICAgICAgLyogZXNsaW50LWVuYWJsZSBuby10cnktY2F0Y2ggKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihmb3JtYXR0ZWRMb2cubG9uZyk7XG4gICAgfVxuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cblxuICBfZ2V0TmFtZShzaGFkZXJUeXBlKSB7XG4gICAgc3dpdGNoIChzaGFkZXJUeXBlKSB7XG4gICAgY2FzZSBHTC5WRVJURVhfU0hBREVSOiByZXR1cm4gJ3ZlcnRleC1zaGFkZXInO1xuICAgIGNhc2UgR0wuRlJBR01FTlRfU0hBREVSOiByZXR1cm4gJ2ZyYWdtZW50LXNoYWRlcic7XG4gICAgZGVmYXVsdDogcmV0dXJuICdzaGFkZXInO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmVydGV4U2hhZGVyIGV4dGVuZHMgU2hhZGVyIHtcbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSkge1xuICAgIHN1cGVyKGdsLCBzaGFkZXJTb3VyY2UsIEdMLlZFUlRFWF9TSEFERVIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBGcmFnbWVudFNoYWRlciBleHRlbmRzIFNoYWRlciB7XG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXJTb3VyY2UpIHtcbiAgICBzdXBlcihnbCwgc2hhZGVyU291cmNlLCBHTC5GUkFHTUVOVF9TSEFERVIpO1xuICB9XG59XG4iXX0=