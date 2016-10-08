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
          _utils.log.warn('Error formatting glsl compiler error:', error);
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

    return _possibleConstructorReturn(this, (VertexShader.__proto__ || Object.getPrototypeOf(VertexShader)).call(this, gl, shaderSource, _webglTypes.GL.VERTEX_SHADER));
  }

  return VertexShader;
}(Shader);

var FragmentShader = exports.FragmentShader = function (_Shader2) {
  _inherits(FragmentShader, _Shader2);

  function FragmentShader(gl, shaderSource) {
    _classCallCheck(this, FragmentShader);

    return _possibleConstructorReturn(this, (FragmentShader.__proto__ || Object.getPrototypeOf(FragmentShader)).call(this, gl, shaderSource, _webglTypes.GL.FRAGMENT_SHADER));
  }

  return FragmentShader;
}(Shader);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9zaGFkZXIuanMiXSwibmFtZXMiOlsiU2hhZGVyIiwiZ2wiLCJzaGFkZXJTb3VyY2UiLCJzaGFkZXJUeXBlIiwiaWQiLCJfZ2V0TmFtZSIsImhhbmRsZSIsImNyZWF0ZVNoYWRlciIsIkVycm9yIiwiX2NvbXBpbGUiLCJkZWxldGVTaGFkZXIiLCJjb21waWxlU2hhZGVyIiwiY29tcGlsZWQiLCJnZXRTaGFkZXJQYXJhbWV0ZXIiLCJDT01QSUxFX1NUQVRVUyIsImluZm8iLCJnZXRTaGFkZXJJbmZvTG9nIiwiZm9ybWF0dGVkTG9nIiwiZXJyb3IiLCJ3YXJuIiwibG9uZyIsIlZFUlRFWF9TSEFERVIiLCJGUkFHTUVOVF9TSEFERVIiLCJWZXJ0ZXhTaGFkZXIiLCJGcmFnbWVudFNoYWRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7O0FBRUE7SUFDYUEsTSxXQUFBQSxNOztBQUVYO0FBQ0Esa0JBQVlDLEVBQVosRUFBZ0JDLFlBQWhCLEVBQThCQyxVQUE5QixFQUEwQztBQUFBOztBQUN4QyxTQUFLQyxFQUFMLEdBQVUsOEJBQWNGLFlBQWQsS0FBK0IsZ0JBQUksS0FBS0csUUFBTCxDQUFjRixVQUFkLENBQUosQ0FBekM7QUFDQSxTQUFLRixFQUFMLEdBQVVBLEVBQVY7QUFDQSxTQUFLRSxVQUFMLEdBQWtCQSxVQUFsQjtBQUNBLFNBQUtELFlBQUwsR0FBb0JBLFlBQXBCO0FBQ0EsU0FBS0ksTUFBTCxHQUFjTCxHQUFHTSxZQUFILENBQWdCSixVQUFoQixDQUFkO0FBQ0EsUUFBSSxLQUFLRyxNQUFMLEtBQWdCLElBQXBCLEVBQTBCO0FBQ3hCLFlBQU0sSUFBSUUsS0FBSixzQ0FBNkNMLFVBQTdDLENBQU47QUFDRDtBQUNELFNBQUtNLFFBQUwsQ0FBY1AsWUFBZDtBQUNEOzs7OzhCQUVRO0FBQUEsVUFDQUQsRUFEQSxHQUNNLElBRE4sQ0FDQUEsRUFEQTs7QUFFUCxVQUFJLEtBQUtLLE1BQVQsRUFBaUI7QUFDZkwsV0FBR1MsWUFBSCxDQUFnQixLQUFLSixNQUFyQjtBQUNBLGFBQUtBLE1BQUwsR0FBYyxJQUFkO0FBQ0Q7QUFDRjs7OzhCQUVTO0FBQ1IsYUFBTyw4QkFBYyxLQUFLSixZQUFuQixDQUFQO0FBQ0Q7Ozs2QkFFUUEsWSxFQUFjO0FBQUEsVUFDZEQsRUFEYyxHQUNSLElBRFEsQ0FDZEEsRUFEYzs7QUFFckJBLFNBQUdDLFlBQUgsQ0FBZ0IsS0FBS0ksTUFBckIsRUFBNkJKLFlBQTdCO0FBQ0FELFNBQUdVLGFBQUgsQ0FBaUIsS0FBS0wsTUFBdEI7QUFDQSxVQUFNTSxXQUFXWCxHQUFHWSxrQkFBSCxDQUFzQixLQUFLUCxNQUEzQixFQUFtQyxlQUFHUSxjQUF0QyxDQUFqQjtBQUNBLFVBQUksQ0FBQ0YsUUFBTCxFQUFlO0FBQ2IsWUFBTUcsT0FBT2QsR0FBR2UsZ0JBQUgsQ0FBb0IsS0FBS1YsTUFBekIsQ0FBYjtBQUNBTCxXQUFHUyxZQUFILENBQWdCLEtBQUtKLE1BQXJCO0FBQ0E7QUFDQSxZQUFJVyxxQkFBSjtBQUNBLFlBQUk7QUFDRkEseUJBQWUscUNBQW9CRixJQUFwQixFQUEwQmIsWUFBMUIsRUFBd0MsS0FBS0MsVUFBN0MsQ0FBZjtBQUNELFNBRkQsQ0FFRSxPQUFPZSxLQUFQLEVBQWM7QUFDZCxxQkFBSUMsSUFBSixDQUFTLHVDQUFULEVBQWtERCxLQUFsRDtBQUNBLGdCQUFNLElBQUlWLEtBQUosdUNBQThDTyxJQUE5QyxDQUFOO0FBQ0Q7QUFDRDtBQUNBLGNBQU0sSUFBSVAsS0FBSixDQUFVUyxhQUFhRyxJQUF2QixDQUFOO0FBQ0Q7QUFDRjtBQUNEOzs7OzZCQUVTakIsVSxFQUFZO0FBQ25CLGNBQVFBLFVBQVI7QUFDQSxhQUFLLGVBQUdrQixhQUFSO0FBQXVCLGlCQUFPLGVBQVA7QUFDdkIsYUFBSyxlQUFHQyxlQUFSO0FBQXlCLGlCQUFPLGlCQUFQO0FBQ3pCO0FBQVMsaUJBQU8sUUFBUDtBQUhUO0FBS0Q7Ozs7OztJQUdVQyxZLFdBQUFBLFk7OztBQUNYLHdCQUFZdEIsRUFBWixFQUFnQkMsWUFBaEIsRUFBOEI7QUFBQTs7QUFBQSx1SEFDdEJELEVBRHNCLEVBQ2xCQyxZQURrQixFQUNKLGVBQUdtQixhQURDO0FBRTdCOzs7RUFIK0JyQixNOztJQU1yQndCLGMsV0FBQUEsYzs7O0FBQ1gsMEJBQVl2QixFQUFaLEVBQWdCQyxZQUFoQixFQUE4QjtBQUFBOztBQUFBLDJIQUN0QkQsRUFEc0IsRUFDbEJDLFlBRGtCLEVBQ0osZUFBR29CLGVBREM7QUFFN0I7OztFQUhpQ3RCLE0iLCJmaWxlIjoic2hhZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtHTH0gZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQgZm9ybWF0Q29tcGlsZXJFcnJvciBmcm9tICdnbC1mb3JtYXQtY29tcGlsZXItZXJyb3InO1xuaW1wb3J0IGdldFNoYWRlck5hbWUgZnJvbSAnZ2xzbC1zaGFkZXItbmFtZSc7XG5pbXBvcnQge2xvZywgdWlkfSBmcm9tICcuLi91dGlscyc7XG5cbi8vIEZvciBub3cgdGhpcyBpcyBhbiBpbnRlcm5hbCBjbGFzc1xuZXhwb3J0IGNsYXNzIFNoYWRlciB7XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSwgc2hhZGVyVHlwZSkge1xuICAgIHRoaXMuaWQgPSBnZXRTaGFkZXJOYW1lKHNoYWRlclNvdXJjZSkgfHwgdWlkKHRoaXMuX2dldE5hbWUoc2hhZGVyVHlwZSkpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnNoYWRlclR5cGUgPSBzaGFkZXJUeXBlO1xuICAgIHRoaXMuc2hhZGVyU291cmNlID0gc2hhZGVyU291cmNlO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuICAgIGlmICh0aGlzLmhhbmRsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBjcmVhdGluZyBzaGFkZXIgd2l0aCB0eXBlICR7c2hhZGVyVHlwZX1gKTtcbiAgICB9XG4gICAgdGhpcy5fY29tcGlsZShzaGFkZXJTb3VyY2UpO1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLmhhbmRsZSkge1xuICAgICAgZ2wuZGVsZXRlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBnZXROYW1lKCkge1xuICAgIHJldHVybiBnZXRTaGFkZXJOYW1lKHRoaXMuc2hhZGVyU291cmNlKTtcbiAgfVxuXG4gIF9jb21waWxlKHNoYWRlclNvdXJjZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnNoYWRlclNvdXJjZSh0aGlzLmhhbmRsZSwgc2hhZGVyU291cmNlKTtcbiAgICBnbC5jb21waWxlU2hhZGVyKHRoaXMuaGFuZGxlKTtcbiAgICBjb25zdCBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcih0aGlzLmhhbmRsZSwgR0wuQ09NUElMRV9TVEFUVVMpO1xuICAgIGlmICghY29tcGlsZWQpIHtcbiAgICAgIGNvbnN0IGluZm8gPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHRoaXMuaGFuZGxlKTtcbiAgICAgIGdsLmRlbGV0ZVNoYWRlcih0aGlzLmhhbmRsZSk7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2ggKi9cbiAgICAgIGxldCBmb3JtYXR0ZWRMb2c7XG4gICAgICB0cnkge1xuICAgICAgICBmb3JtYXR0ZWRMb2cgPSBmb3JtYXRDb21waWxlckVycm9yKGluZm8sIHNoYWRlclNvdXJjZSwgdGhpcy5zaGFkZXJUeXBlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZy53YXJuKCdFcnJvciBmb3JtYXR0aW5nIGdsc2wgY29tcGlsZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIHdoaWxlIGNvbXBpbGluZyB0aGUgc2hhZGVyICR7aW5mb31gKTtcbiAgICAgIH1cbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tdHJ5LWNhdGNoICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0dGVkTG9nLmxvbmcpO1xuICAgIH1cbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgX2dldE5hbWUoc2hhZGVyVHlwZSkge1xuICAgIHN3aXRjaCAoc2hhZGVyVHlwZSkge1xuICAgIGNhc2UgR0wuVkVSVEVYX1NIQURFUjogcmV0dXJuICd2ZXJ0ZXgtc2hhZGVyJztcbiAgICBjYXNlIEdMLkZSQUdNRU5UX1NIQURFUjogcmV0dXJuICdmcmFnbWVudC1zaGFkZXInO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnc2hhZGVyJztcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZlcnRleFNoYWRlciBleHRlbmRzIFNoYWRlciB7XG4gIGNvbnN0cnVjdG9yKGdsLCBzaGFkZXJTb3VyY2UpIHtcbiAgICBzdXBlcihnbCwgc2hhZGVyU291cmNlLCBHTC5WRVJURVhfU0hBREVSKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRnJhZ21lbnRTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc2hhZGVyU291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNoYWRlclNvdXJjZSwgR0wuRlJBR01FTlRfU0hBREVSKTtcbiAgfVxufVxuIl19