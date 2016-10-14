'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FragmentShader = exports.VertexShader = exports.Shader = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webglTypes = require('./webgl-types');

var _webglFormatGlslError = require('./webgl-format-glsl-error');

var _webglFormatGlslError2 = _interopRequireDefault(_webglFormatGlslError);

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

    this.id = (0, _glslShaderName2.default)(shaderSource) || (0, _utils.uid)(this.getTypeName(shaderType));
    this.gl = gl;
    this.shaderType = shaderType;
    this.source = shaderSource;
    this.handle = gl.createShader(shaderType);
    if (this.handle === null) {
      throw new Error('Error creating shader with type ' + shaderType);
    }
    this.compile();
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
      return (0, _glslShaderName2.default)(this.source);
    }
  }, {
    key: 'getTypeName',
    value: function getTypeName(shaderType) {
      switch (shaderType) {
        case _webglTypes.GL.VERTEX_SHADER:
          return 'vertex-shader';
        case _webglTypes.GL.FRAGMENT_SHADER:
          return 'fragment-shader';
        default:
          return 'shader';
      }
    }
  }, {
    key: 'compile',
    value: function compile() {
      var gl = this.gl;

      gl.shaderSource(this.handle, this.source);
      gl.compileShader(this.handle);
      var compiled = gl.getShaderParameter(this.handle, _webglTypes.GL.COMPILE_STATUS);
      if (!compiled) {
        var infoLog = gl.getShaderInfoLog(this.handle);
        var error = (0, _webglFormatGlslError2.default)(infoLog, this.source, this.shaderType);

        if (_utils.log.priority > 0) {
          this.copyToClipboard(this.source);
        }

        this.delete();

        throw new Error('Error while compiling the shader ' + error);
      }
    }
    /* eslint-enable max-statements */

    // TODO - move to debug utils?

  }, {
    key: 'copyToClipboard',
    value: function copyToClipboard(text) {
      if (_utils.isBrowser) {
        /* global document */
        var input = document.createElement('textarea');
        document.body.appendChild(input);
        input.value = text;
        input.focus();
        input.select();
        if (!document.execCommand('copy')) {
          /* eslint-disable no-console */
          /* global console */
          console.log('Failed to copy to clipboard');
        }
        input.remove();
      }
    }
  }]);

  return Shader;
}();

var VertexShader = exports.VertexShader = function (_Shader) {
  _inherits(VertexShader, _Shader);

  function VertexShader(gl, source) {
    _classCallCheck(this, VertexShader);

    return _possibleConstructorReturn(this, (VertexShader.__proto__ || Object.getPrototypeOf(VertexShader)).call(this, gl, source, _webglTypes.GL.VERTEX_SHADER));
  }

  return VertexShader;
}(Shader);

var FragmentShader = exports.FragmentShader = function (_Shader2) {
  _inherits(FragmentShader, _Shader2);

  function FragmentShader(gl, source) {
    _classCallCheck(this, FragmentShader);

    return _possibleConstructorReturn(this, (FragmentShader.__proto__ || Object.getPrototypeOf(FragmentShader)).call(this, gl, source, _webglTypes.GL.FRAGMENT_SHADER));
  }

  return FragmentShader;
}(Shader);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9zaGFkZXIuanMiXSwibmFtZXMiOlsiU2hhZGVyIiwiZ2wiLCJzaGFkZXJTb3VyY2UiLCJzaGFkZXJUeXBlIiwiaWQiLCJnZXRUeXBlTmFtZSIsInNvdXJjZSIsImhhbmRsZSIsImNyZWF0ZVNoYWRlciIsIkVycm9yIiwiY29tcGlsZSIsImRlbGV0ZVNoYWRlciIsIlZFUlRFWF9TSEFERVIiLCJGUkFHTUVOVF9TSEFERVIiLCJjb21waWxlU2hhZGVyIiwiY29tcGlsZWQiLCJnZXRTaGFkZXJQYXJhbWV0ZXIiLCJDT01QSUxFX1NUQVRVUyIsImluZm9Mb2ciLCJnZXRTaGFkZXJJbmZvTG9nIiwiZXJyb3IiLCJwcmlvcml0eSIsImNvcHlUb0NsaXBib2FyZCIsImRlbGV0ZSIsInRleHQiLCJpbnB1dCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsInZhbHVlIiwiZm9jdXMiLCJzZWxlY3QiLCJleGVjQ29tbWFuZCIsImNvbnNvbGUiLCJsb2ciLCJyZW1vdmUiLCJWZXJ0ZXhTaGFkZXIiLCJGcmFnbWVudFNoYWRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7O0FBRUE7SUFDYUEsTSxXQUFBQSxNOztBQUVYO0FBQ0Esa0JBQVlDLEVBQVosRUFBZ0JDLFlBQWhCLEVBQThCQyxVQUE5QixFQUEwQztBQUFBOztBQUN4QyxTQUFLQyxFQUFMLEdBQVUsOEJBQWNGLFlBQWQsS0FBK0IsZ0JBQUksS0FBS0csV0FBTCxDQUFpQkYsVUFBakIsQ0FBSixDQUF6QztBQUNBLFNBQUtGLEVBQUwsR0FBVUEsRUFBVjtBQUNBLFNBQUtFLFVBQUwsR0FBa0JBLFVBQWxCO0FBQ0EsU0FBS0csTUFBTCxHQUFjSixZQUFkO0FBQ0EsU0FBS0ssTUFBTCxHQUFjTixHQUFHTyxZQUFILENBQWdCTCxVQUFoQixDQUFkO0FBQ0EsUUFBSSxLQUFLSSxNQUFMLEtBQWdCLElBQXBCLEVBQTBCO0FBQ3hCLFlBQU0sSUFBSUUsS0FBSixzQ0FBNkNOLFVBQTdDLENBQU47QUFDRDtBQUNELFNBQUtPLE9BQUw7QUFDRDs7Ozs4QkFFUTtBQUFBLFVBQ0FULEVBREEsR0FDTSxJQUROLENBQ0FBLEVBREE7O0FBRVAsVUFBSSxLQUFLTSxNQUFULEVBQWlCO0FBQ2ZOLFdBQUdVLFlBQUgsQ0FBZ0IsS0FBS0osTUFBckI7QUFDQSxhQUFLQSxNQUFMLEdBQWMsSUFBZDtBQUNEO0FBQ0Y7Ozs4QkFFUztBQUNSLGFBQU8sOEJBQWMsS0FBS0QsTUFBbkIsQ0FBUDtBQUNEOzs7Z0NBRVdILFUsRUFBWTtBQUN0QixjQUFRQSxVQUFSO0FBQ0EsYUFBSyxlQUFHUyxhQUFSO0FBQXVCLGlCQUFPLGVBQVA7QUFDdkIsYUFBSyxlQUFHQyxlQUFSO0FBQXlCLGlCQUFPLGlCQUFQO0FBQ3pCO0FBQVMsaUJBQU8sUUFBUDtBQUhUO0FBS0Q7Ozs4QkFFUztBQUFBLFVBQ0RaLEVBREMsR0FDSyxJQURMLENBQ0RBLEVBREM7O0FBRVJBLFNBQUdDLFlBQUgsQ0FBZ0IsS0FBS0ssTUFBckIsRUFBNkIsS0FBS0QsTUFBbEM7QUFDQUwsU0FBR2EsYUFBSCxDQUFpQixLQUFLUCxNQUF0QjtBQUNBLFVBQU1RLFdBQVdkLEdBQUdlLGtCQUFILENBQXNCLEtBQUtULE1BQTNCLEVBQW1DLGVBQUdVLGNBQXRDLENBQWpCO0FBQ0EsVUFBSSxDQUFDRixRQUFMLEVBQWU7QUFDYixZQUFNRyxVQUFVakIsR0FBR2tCLGdCQUFILENBQW9CLEtBQUtaLE1BQXpCLENBQWhCO0FBQ0EsWUFBTWEsUUFBUSxvQ0FBb0JGLE9BQXBCLEVBQTZCLEtBQUtaLE1BQWxDLEVBQTBDLEtBQUtILFVBQS9DLENBQWQ7O0FBRUEsWUFBSSxXQUFJa0IsUUFBSixHQUFlLENBQW5CLEVBQXNCO0FBQ3BCLGVBQUtDLGVBQUwsQ0FBcUIsS0FBS2hCLE1BQTFCO0FBQ0Q7O0FBRUQsYUFBS2lCLE1BQUw7O0FBRUEsY0FBTSxJQUFJZCxLQUFKLHVDQUE4Q1csS0FBOUMsQ0FBTjtBQUNEO0FBQ0Y7QUFDRDs7QUFFQTs7OztvQ0FDZ0JJLEksRUFBTTtBQUNwQiw0QkFBZTtBQUNiO0FBQ0EsWUFBTUMsUUFBUUMsU0FBU0MsYUFBVCxDQUF1QixVQUF2QixDQUFkO0FBQ0FELGlCQUFTRSxJQUFULENBQWNDLFdBQWQsQ0FBMEJKLEtBQTFCO0FBQ0FBLGNBQU1LLEtBQU4sR0FBY04sSUFBZDtBQUNBQyxjQUFNTSxLQUFOO0FBQ0FOLGNBQU1PLE1BQU47QUFDQSxZQUFJLENBQUNOLFNBQVNPLFdBQVQsQ0FBcUIsTUFBckIsQ0FBTCxFQUFtQztBQUNqQztBQUNBO0FBQ0FDLGtCQUFRQyxHQUFSLENBQVksNkJBQVo7QUFDRDtBQUNEVixjQUFNVyxNQUFOO0FBQ0Q7QUFDRjs7Ozs7O0lBR1VDLFksV0FBQUEsWTs7O0FBQ1gsd0JBQVlwQyxFQUFaLEVBQWdCSyxNQUFoQixFQUF3QjtBQUFBOztBQUFBLHVIQUNoQkwsRUFEZ0IsRUFDWkssTUFEWSxFQUNKLGVBQUdNLGFBREM7QUFFdkI7OztFQUgrQlosTTs7SUFNckJzQyxjLFdBQUFBLGM7OztBQUNYLDBCQUFZckMsRUFBWixFQUFnQkssTUFBaEIsRUFBd0I7QUFBQTs7QUFBQSwySEFDaEJMLEVBRGdCLEVBQ1pLLE1BRFksRUFDSixlQUFHTyxlQURDO0FBRXZCOzs7RUFIaUNiLE0iLCJmaWxlIjoic2hhZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtHTH0gZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQgZm9ybWF0Q29tcGlsZXJFcnJvciBmcm9tICcuL3dlYmdsLWZvcm1hdC1nbHNsLWVycm9yJztcbmltcG9ydCBnZXRTaGFkZXJOYW1lIGZyb20gJ2dsc2wtc2hhZGVyLW5hbWUnO1xuaW1wb3J0IHtsb2csIHVpZCwgaXNCcm93c2VyfSBmcm9tICcuLi91dGlscyc7XG5cbi8vIEZvciBub3cgdGhpcyBpcyBhbiBpbnRlcm5hbCBjbGFzc1xuZXhwb3J0IGNsYXNzIFNoYWRlciB7XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgY29uc3RydWN0b3IoZ2wsIHNoYWRlclNvdXJjZSwgc2hhZGVyVHlwZSkge1xuICAgIHRoaXMuaWQgPSBnZXRTaGFkZXJOYW1lKHNoYWRlclNvdXJjZSkgfHwgdWlkKHRoaXMuZ2V0VHlwZU5hbWUoc2hhZGVyVHlwZSkpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnNoYWRlclR5cGUgPSBzaGFkZXJUeXBlO1xuICAgIHRoaXMuc291cmNlID0gc2hhZGVyU291cmNlO1xuICAgIHRoaXMuaGFuZGxlID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuICAgIGlmICh0aGlzLmhhbmRsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBjcmVhdGluZyBzaGFkZXIgd2l0aCB0eXBlICR7c2hhZGVyVHlwZX1gKTtcbiAgICB9XG4gICAgdGhpcy5jb21waWxlKCk7XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaGFuZGxlKSB7XG4gICAgICBnbC5kZWxldGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIGdldFNoYWRlck5hbWUodGhpcy5zb3VyY2UpO1xuICB9XG5cbiAgZ2V0VHlwZU5hbWUoc2hhZGVyVHlwZSkge1xuICAgIHN3aXRjaCAoc2hhZGVyVHlwZSkge1xuICAgIGNhc2UgR0wuVkVSVEVYX1NIQURFUjogcmV0dXJuICd2ZXJ0ZXgtc2hhZGVyJztcbiAgICBjYXNlIEdMLkZSQUdNRU5UX1NIQURFUjogcmV0dXJuICdmcmFnbWVudC1zaGFkZXInO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnc2hhZGVyJztcbiAgICB9XG4gIH1cblxuICBjb21waWxlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnNoYWRlclNvdXJjZSh0aGlzLmhhbmRsZSwgdGhpcy5zb3VyY2UpO1xuICAgIGdsLmNvbXBpbGVTaGFkZXIodGhpcy5oYW5kbGUpO1xuICAgIGNvbnN0IGNvbXBpbGVkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBHTC5DT01QSUxFX1NUQVRVUyk7XG4gICAgaWYgKCFjb21waWxlZCkge1xuICAgICAgY29uc3QgaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2codGhpcy5oYW5kbGUpO1xuICAgICAgY29uc3QgZXJyb3IgPSBmb3JtYXRDb21waWxlckVycm9yKGluZm9Mb2csIHRoaXMuc291cmNlLCB0aGlzLnNoYWRlclR5cGUpO1xuXG4gICAgICBpZiAobG9nLnByaW9yaXR5ID4gMCkge1xuICAgICAgICB0aGlzLmNvcHlUb0NsaXBib2FyZCh0aGlzLnNvdXJjZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZGVsZXRlKCk7XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3Igd2hpbGUgY29tcGlsaW5nIHRoZSBzaGFkZXIgJHtlcnJvcn1gKTtcbiAgICB9XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIC8vIFRPRE8gLSBtb3ZlIHRvIGRlYnVnIHV0aWxzP1xuICBjb3B5VG9DbGlwYm9hcmQodGV4dCkge1xuICAgIGlmIChpc0Jyb3dzZXIpIHtcbiAgICAgIC8qIGdsb2JhbCBkb2N1bWVudCAqL1xuICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICBpbnB1dC52YWx1ZSA9IHRleHQ7XG4gICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgaW5wdXQuc2VsZWN0KCk7XG4gICAgICBpZiAoIWRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5JykpIHtcbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgICBjb25zb2xlLmxvZygnRmFpbGVkIHRvIGNvcHkgdG8gY2xpcGJvYXJkJyk7XG4gICAgICB9XG4gICAgICBpbnB1dC5yZW1vdmUoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZlcnRleFNoYWRlciBleHRlbmRzIFNoYWRlciB7XG4gIGNvbnN0cnVjdG9yKGdsLCBzb3VyY2UpIHtcbiAgICBzdXBlcihnbCwgc291cmNlLCBHTC5WRVJURVhfU0hBREVSKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRnJhZ21lbnRTaGFkZXIgZXh0ZW5kcyBTaGFkZXIge1xuICBjb25zdHJ1Y3RvcihnbCwgc291cmNlKSB7XG4gICAgc3VwZXIoZ2wsIHNvdXJjZSwgR0wuRlJBR01FTlRfU0hBREVSKTtcbiAgfVxufVxuIl19