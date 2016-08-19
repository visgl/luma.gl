'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

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
//# sourceMappingURL=data:application/json;base64,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SUFBUjtBQUNEOzs7NkJBRVE7QUFDUCxXQUFLLEVBQUwsQ0FBUSxNQUFSO0FBQ0Q7Ozs7OztrQkFqR2tCLGlCIiwiZmlsZSI6ImZiby5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7V2ViR0x9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCBGcmFtZWJ1ZmZlciBmcm9tICcuL2ZyYW1lYnVmZmVyJztcbmltcG9ydCBSZW5kZXJidWZmZXIgZnJvbSAnLi9yZW5kZXJidWZmZXInO1xuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vdGV4dHVyZSc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZyYW1lYnVmZmVyT2JqZWN0IHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3RvcihnbCwge1xuICAgIHdpZHRoID0gMSxcbiAgICBoZWlnaHQgPSAxLFxuICAgIGRlcHRoID0gdHJ1ZSxcbiAgICBtaW5GaWx0ZXIgPSBXZWJHTC5ORUFSRVNULFxuICAgIG1hZ0ZpbHRlciA9IFdlYkdMLk5FQVJFU1QsXG4gICAgZm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICB0eXBlID0gV2ViR0wuVU5TSUdORURfQllURVxuICB9ID0ge30pIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuZGVwdGggPSBkZXB0aDtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG1pbkZpbHRlcjtcbiAgICB0aGlzLm1hZ0ZpbHRlciA9IG1hZ0ZpbHRlcjtcbiAgICB0aGlzLmZvcm1hdCA9IGZvcm1hdDtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuXG4gICAgdGhpcy5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gIH1cblxuICByZXNpemUod2lkdGgsIGhlaWdodCkge1xuICAgIGFzc2VydCh3aWR0aCA+PSAwICYmIGhlaWdodCA+PSAwLCAnV2lkdGggYW5kIGhlaWdodCBuZWVkIHRvIGJlIGludGVnZXJzJyk7XG4gICAgaWYgKHdpZHRoID09PSB0aGlzLndpZHRoICYmIGhlaWdodCA9PT0gdGhpcy5oZWlnaHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcblxuICAgIC8vIFRPRE8gLSBkbyB3ZSBuZWVkIHRvIHJlYWxsb2NhdGUgdGhlIGZyYW1lYnVmZmVyP1xuICAgIGNvbnN0IGZiID0gbmV3IEZyYW1lYnVmZmVyKGdsKTtcblxuICAgIGNvbnN0IGNvbG9yQnVmZmVyID0gbmV3IFRleHR1cmUyRChnbCwge1xuICAgICAgbWluRmlsdGVyOiB0aGlzLm1pbkZpbHRlcixcbiAgICAgIG1hZ0ZpbHRlcjogdGhpcy5tYWdGaWx0ZXJcbiAgICB9KVxuICAgIC8vIFRPRE8gLSBzaG91bGQgYmUgaGFuZGxlZCBieSBUZXh0dXJlMkQgY29uc3RydWN0b3I/XG4gICAgLnNldEltYWdlRGF0YSh7XG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHQsXG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBmb3JtYXQ6IHRoaXMuZm9ybWF0XG4gICAgfSk7XG5cbiAgICBmYi5hdHRhY2hUZXh0dXJlKHtcbiAgICAgIGF0dGFjaG1lbnQ6IFdlYkdMLkNPTE9SX0FUVEFDSE1FTlQwLFxuICAgICAgdGV4dHVyZTogY29sb3JCdWZmZXJcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLmNvbG9yQnVmZmVyKSB7XG4gICAgICB0aGlzLmNvbG9yQnVmZmVyLmRlbGV0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmNvbG9yQnVmZmVyID0gY29sb3JCdWZmZXI7XG5cbiAgICAvLyBBZGQgYSBkZXB0aCBidWZmZXIgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHRoaXMuZGVwdGgpIHtcbiAgICAgIGNvbnN0IGRlcHRoQnVmZmVyID0gbmV3IFJlbmRlcmJ1ZmZlcihnbCkuc3RvcmFnZSh7XG4gICAgICAgIGludGVybmFsRm9ybWF0OiBXZWJHTC5ERVBUSF9DT01QT05FTlQxNixcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodFxuICAgICAgfSk7XG4gICAgICBmYi5hdHRhY2hSZW5kZXJidWZmZXIoe1xuICAgICAgICBhdHRhY2htZW50OiBXZWJHTC5ERVBUSF9BVFRBQ0hNRU5ULFxuICAgICAgICByZW5kZXJidWZmZXI6IGRlcHRoQnVmZmVyXG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuZGVwdGhCdWZmZXIpIHtcbiAgICAgICAgdGhpcy5kZXB0aEJ1ZmZlci5kZWxldGUoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGVwdGhCdWZmZXIgPSBkZXB0aEJ1ZmZlcjtcbiAgICB9XG5cbiAgICAvLyBDaGVja3MgdGhhdCBmcmFtZWJ1ZmZlciB3YXMgcHJvcGVybHkgc2V0IHVwLFxuICAgIC8vIGlmIG5vdCwgdGhyb3dzIGFuIGV4cGxhbmF0b3J5IGVycm9yXG4gICAgZmIuY2hlY2tTdGF0dXMoKTtcblxuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIC8vIEltbWVkaWF0ZWx5IGRpc3Bvc2Ugb2Ygb2xkIGJ1ZmZlclxuICAgIGlmICh0aGlzLmZiKSB7XG4gICAgICB0aGlzLmZiLmRlbGV0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmZiID0gZmI7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIGJpbmQoKSB7XG4gICAgdGhpcy5mYi5iaW5kKCk7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgdGhpcy5mYi51bmJpbmQoKTtcbiAgfVxufVxuIl19