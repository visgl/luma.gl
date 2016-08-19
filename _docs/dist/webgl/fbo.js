'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webglTypes = require('./webgl-types');

var _webglChecks = require('./webgl-checks');

var _framebuffer = require('./framebuffer');

var _framebuffer2 = _interopRequireDefault(_framebuffer);

var _renderbuffer = require('./renderbuffer');

var _renderbuffer2 = _interopRequireDefault(_renderbuffer);

var _texture = require('./texture');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FramebufferObject = function () {

  /* eslint-disable max-statements */

  function FramebufferObject(gl) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var _ref$width = _ref.width;
    var width = _ref$width === undefined ? 1 : _ref$width;
    var _ref$height = _ref.height;
    var height = _ref$height === undefined ? 1 : _ref$height;
    var _ref$depth = _ref.depth;
    var depth = _ref$depth === undefined ? true : _ref$depth;
    var _ref$minFilter = _ref.minFilter;
    var minFilter = _ref$minFilter === undefined ? _webglTypes.WebGL.NEAREST : _ref$minFilter;
    var _ref$magFilter = _ref.magFilter;
    var magFilter = _ref$magFilter === undefined ? _webglTypes.WebGL.NEAREST : _ref$magFilter;
    var _ref$format = _ref.format;
    var format = _ref$format === undefined ? _webglTypes.WebGL.RGBA : _ref$format;
    var _ref$type = _ref.type;
    var type = _ref$type === undefined ? _webglTypes.WebGL.UNSIGNED_BYTE : _ref$type;

    _classCallCheck(this, FramebufferObject);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    this.gl = gl;
    this.depth = depth;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.format = format;
    this.type = type;

    this.resize(width, height);
  }

  _createClass(FramebufferObject, [{
    key: 'resize',
    value: function resize(width, height) {
      (0, _assert2.default)(width >= 0 && height >= 0, 'Width and height need to be integers');
      if (width === this.width && height === this.height) {
        return;
      }

      var gl = this.gl;

      // TODO - do we need to reallocate the framebuffer?

      var fb = new _framebuffer2.default(gl);

      var colorBuffer = new _texture.Texture2D(gl, {
        minFilter: this.minFilter,
        magFilter: this.magFilter
      })
      // TODO - should be handled by Texture2D constructor?
      .setImageData({
        data: null,
        width: width,
        height: height,
        type: this.type,
        format: this.format
      });

      fb.attachTexture({
        attachment: _webglTypes.WebGL.COLOR_ATTACHMENT0,
        texture: colorBuffer
      });

      if (this.colorBuffer) {
        this.colorBuffer.delete();
      }
      this.colorBuffer = colorBuffer;

      // Add a depth buffer if requested
      if (this.depth) {
        var depthBuffer = new _renderbuffer2.default(gl).storage({
          internalFormat: _webglTypes.WebGL.DEPTH_COMPONENT16,
          width: width,
          height: height
        });
        fb.attachRenderbuffer({
          attachment: _webglTypes.WebGL.DEPTH_ATTACHMENT,
          renderbuffer: depthBuffer
        });

        if (this.depthBuffer) {
          this.depthBuffer.delete();
        }
        this.depthBuffer = depthBuffer;
      }

      // Checks that framebuffer was properly set up,
      // if not, throws an explanatory error
      fb.checkStatus();

      this.width = width;
      this.height = height;

      // Immediately dispose of old buffer
      if (this.fb) {
        this.fb.delete();
      }
      this.fb = fb;
    }
    /* eslint-enable max-statements */

  }, {
    key: 'bind',
    value: function bind() {
      this.fb.bind();
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      this.fb.unbind();
    }
  }]);

  return FramebufferObject;
}();

exports.default = FramebufferObject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9mYm8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0lBRXFCLGlCOzs7O0FBR25CLDZCQUFZLEVBQVosRUFRUTtBQUFBLHFFQUFKLEVBQUk7O0FBQUEsMEJBUE4sS0FPTTtBQUFBLFFBUE4sS0FPTSw4QkFQRSxDQU9GO0FBQUEsMkJBTk4sTUFNTTtBQUFBLFFBTk4sTUFNTSwrQkFORyxDQU1IO0FBQUEsMEJBTE4sS0FLTTtBQUFBLFFBTE4sS0FLTSw4QkFMRSxJQUtGO0FBQUEsOEJBSk4sU0FJTTtBQUFBLFFBSk4sU0FJTSxrQ0FKTSxrQkFBTSxPQUlaO0FBQUEsOEJBSE4sU0FHTTtBQUFBLFFBSE4sU0FHTSxrQ0FITSxrQkFBTSxPQUdaO0FBQUEsMkJBRk4sTUFFTTtBQUFBLFFBRk4sTUFFTSwrQkFGRyxrQkFBTSxJQUVUO0FBQUEseUJBRE4sSUFDTTtBQUFBLFFBRE4sSUFDTSw2QkFEQyxrQkFBTSxhQUNQOztBQUFBOztBQUNOLGtEQUE0QixFQUE1Qjs7QUFFQSxTQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsU0FBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLFNBQUssU0FBTCxHQUFpQixTQUFqQjtBQUNBLFNBQUssU0FBTCxHQUFpQixTQUFqQjtBQUNBLFNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxTQUFLLElBQUwsR0FBWSxJQUFaOztBQUVBLFNBQUssTUFBTCxDQUFZLEtBQVosRUFBbUIsTUFBbkI7QUFDRDs7OzsyQkFFTSxLLEVBQU8sTSxFQUFRO0FBQ3BCLDRCQUFPLFNBQVMsQ0FBVCxJQUFjLFVBQVUsQ0FBL0IsRUFBa0Msc0NBQWxDO0FBQ0EsVUFBSSxVQUFVLEtBQUssS0FBZixJQUF3QixXQUFXLEtBQUssTUFBNUMsRUFBb0Q7QUFDbEQ7QUFDRDs7QUFKbUIsVUFNYixFQU5hLEdBTVAsSUFOTyxDQU1iLEVBTmE7Ozs7QUFTcEIsVUFBTSxLQUFLLDBCQUFnQixFQUFoQixDQUFYOztBQUVBLFVBQU0sY0FBYyx1QkFBYyxFQUFkLEVBQWtCO0FBQ3BDLG1CQUFXLEtBQUssU0FEb0I7QUFFcEMsbUJBQVcsS0FBSztBQUZvQixPQUFsQjs7QUFBQSxPQUtuQixZQUxtQixDQUtOO0FBQ1osY0FBTSxJQURNO0FBRVosb0JBRlk7QUFHWixzQkFIWTtBQUlaLGNBQU0sS0FBSyxJQUpDO0FBS1osZ0JBQVEsS0FBSztBQUxELE9BTE0sQ0FBcEI7O0FBYUEsU0FBRyxhQUFILENBQWlCO0FBQ2Ysb0JBQVksa0JBQU0saUJBREg7QUFFZixpQkFBUztBQUZNLE9BQWpCOztBQUtBLFVBQUksS0FBSyxXQUFULEVBQXNCO0FBQ3BCLGFBQUssV0FBTCxDQUFpQixNQUFqQjtBQUNEO0FBQ0QsV0FBSyxXQUFMLEdBQW1CLFdBQW5COzs7QUFHQSxVQUFJLEtBQUssS0FBVCxFQUFnQjtBQUNkLFlBQU0sY0FBYywyQkFBaUIsRUFBakIsRUFBcUIsT0FBckIsQ0FBNkI7QUFDL0MsMEJBQWdCLGtCQUFNLGlCQUR5QjtBQUUvQyxzQkFGK0M7QUFHL0M7QUFIK0MsU0FBN0IsQ0FBcEI7QUFLQSxXQUFHLGtCQUFILENBQXNCO0FBQ3BCLHNCQUFZLGtCQUFNLGdCQURFO0FBRXBCLHdCQUFjO0FBRk0sU0FBdEI7O0FBS0EsWUFBSSxLQUFLLFdBQVQsRUFBc0I7QUFDcEIsZUFBSyxXQUFMLENBQWlCLE1BQWpCO0FBQ0Q7QUFDRCxhQUFLLFdBQUwsR0FBbUIsV0FBbkI7QUFDRDs7OztBQUlELFNBQUcsV0FBSDs7QUFFQSxXQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EsV0FBSyxNQUFMLEdBQWMsTUFBZDs7O0FBR0EsVUFBSSxLQUFLLEVBQVQsRUFBYTtBQUNYLGFBQUssRUFBTCxDQUFRLE1BQVI7QUFDRDtBQUNELFdBQUssRUFBTCxHQUFVLEVBQVY7QUFDRDs7Ozs7MkJBR007QUFDTCxXQUFLLEVBQUwsQ0FBUSxJQUFSO0FBQ0Q7Ozs2QkFFUTtBQUNQLFdBQUssRUFBTCxDQUFRLE1BQVI7QUFDRDs7Ozs7O2tCQWpHa0IsaUIiLCJmaWxlIjoiZmJvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtXZWJHTH0gZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQge2Fzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IEZyYW1lYnVmZmVyIGZyb20gJy4vZnJhbWVidWZmZXInO1xuaW1wb3J0IFJlbmRlcmJ1ZmZlciBmcm9tICcuL3JlbmRlcmJ1ZmZlcic7XG5pbXBvcnQge1RleHR1cmUyRH0gZnJvbSAnLi90ZXh0dXJlJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnJhbWVidWZmZXJPYmplY3Qge1xuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIGNvbnN0cnVjdG9yKGdsLCB7XG4gICAgd2lkdGggPSAxLFxuICAgIGhlaWdodCA9IDEsXG4gICAgZGVwdGggPSB0cnVlLFxuICAgIG1pbkZpbHRlciA9IFdlYkdMLk5FQVJFU1QsXG4gICAgbWFnRmlsdGVyID0gV2ViR0wuTkVBUkVTVCxcbiAgICBmb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIHR5cGUgPSBXZWJHTC5VTlNJR05FRF9CWVRFXG4gIH0gPSB7fSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5kZXB0aCA9IGRlcHRoO1xuICAgIHRoaXMubWluRmlsdGVyID0gbWluRmlsdGVyO1xuICAgIHRoaXMubWFnRmlsdGVyID0gbWFnRmlsdGVyO1xuICAgIHRoaXMuZm9ybWF0ID0gZm9ybWF0O1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG5cbiAgICB0aGlzLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgfVxuXG4gIHJlc2l6ZSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgYXNzZXJ0KHdpZHRoID49IDAgJiYgaGVpZ2h0ID49IDAsICdXaWR0aCBhbmQgaGVpZ2h0IG5lZWQgdG8gYmUgaW50ZWdlcnMnKTtcbiAgICBpZiAod2lkdGggPT09IHRoaXMud2lkdGggJiYgaGVpZ2h0ID09PSB0aGlzLmhlaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuXG4gICAgLy8gVE9ETyAtIGRvIHdlIG5lZWQgdG8gcmVhbGxvY2F0ZSB0aGUgZnJhbWVidWZmZXI/XG4gICAgY29uc3QgZmIgPSBuZXcgRnJhbWVidWZmZXIoZ2wpO1xuXG4gICAgY29uc3QgY29sb3JCdWZmZXIgPSBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICBtaW5GaWx0ZXI6IHRoaXMubWluRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiB0aGlzLm1hZ0ZpbHRlclxuICAgIH0pXG4gICAgLy8gVE9ETyAtIHNob3VsZCBiZSBoYW5kbGVkIGJ5IFRleHR1cmUyRCBjb25zdHJ1Y3Rvcj9cbiAgICAuc2V0SW1hZ2VEYXRhKHtcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXRcbiAgICB9KTtcblxuICAgIGZiLmF0dGFjaFRleHR1cmUoe1xuICAgICAgYXR0YWNobWVudDogV2ViR0wuQ09MT1JfQVRUQUNITUVOVDAsXG4gICAgICB0ZXh0dXJlOiBjb2xvckJ1ZmZlclxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuY29sb3JCdWZmZXIpIHtcbiAgICAgIHRoaXMuY29sb3JCdWZmZXIuZGVsZXRlKCk7XG4gICAgfVxuICAgIHRoaXMuY29sb3JCdWZmZXIgPSBjb2xvckJ1ZmZlcjtcblxuICAgIC8vIEFkZCBhIGRlcHRoIGJ1ZmZlciBpZiByZXF1ZXN0ZWRcbiAgICBpZiAodGhpcy5kZXB0aCkge1xuICAgICAgY29uc3QgZGVwdGhCdWZmZXIgPSBuZXcgUmVuZGVyYnVmZmVyKGdsKS5zdG9yYWdlKHtcbiAgICAgICAgaW50ZXJuYWxGb3JtYXQ6IFdlYkdMLkRFUFRIX0NPTVBPTkVOVDE2LFxuICAgICAgICB3aWR0aCxcbiAgICAgICAgaGVpZ2h0XG4gICAgICB9KTtcbiAgICAgIGZiLmF0dGFjaFJlbmRlcmJ1ZmZlcih7XG4gICAgICAgIGF0dGFjaG1lbnQ6IFdlYkdMLkRFUFRIX0FUVEFDSE1FTlQsXG4gICAgICAgIHJlbmRlcmJ1ZmZlcjogZGVwdGhCdWZmZXJcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5kZXB0aEJ1ZmZlcikge1xuICAgICAgICB0aGlzLmRlcHRoQnVmZmVyLmRlbGV0ZSgpO1xuICAgICAgfVxuICAgICAgdGhpcy5kZXB0aEJ1ZmZlciA9IGRlcHRoQnVmZmVyO1xuICAgIH1cblxuICAgIC8vIENoZWNrcyB0aGF0IGZyYW1lYnVmZmVyIHdhcyBwcm9wZXJseSBzZXQgdXAsXG4gICAgLy8gaWYgbm90LCB0aHJvd3MgYW4gZXhwbGFuYXRvcnkgZXJyb3JcbiAgICBmYi5jaGVja1N0YXR1cygpO1xuXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgLy8gSW1tZWRpYXRlbHkgZGlzcG9zZSBvZiBvbGQgYnVmZmVyXG4gICAgaWYgKHRoaXMuZmIpIHtcbiAgICAgIHRoaXMuZmIuZGVsZXRlKCk7XG4gICAgfVxuICAgIHRoaXMuZmIgPSBmYjtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgYmluZCgpIHtcbiAgICB0aGlzLmZiLmJpbmQoKTtcbiAgfVxuXG4gIHVuYmluZCgpIHtcbiAgICB0aGlzLmZiLnVuYmluZCgpO1xuICB9XG59XG4iXX0=