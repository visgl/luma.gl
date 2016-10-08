'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webglTypes = require('./webgl-types');

var _webglChecks = require('./webgl-checks');

var _context = require('./context');

var _texture = require('./texture');

var _renderbuffer = require('./renderbuffer');

var _renderbuffer2 = _interopRequireDefault(_renderbuffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function glFormatComponents(format) {
  switch (format) {
    case _webglTypes.WebGL.ALPHA:
      return 1;
    case _webglTypes.WebGL.RGB:
      return 3;
    case _webglTypes.WebGL.RGBA:
      return 4;
    default:
      throw new Error('Unknown format');
  }
}

var Framebuffer = function () {
  _createClass(Framebuffer, null, [{
    key: 'makeFrom',
    value: function makeFrom(gl) {
      var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return object instanceof Framebuffer ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Framebuffer(gl, { handle: object.handle || object });
    }
  }]);

  function Framebuffer(gl) {
    _classCallCheck(this, Framebuffer);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    this.gl = gl;
    this.handle = gl.createFramebuffer();
    if (!this.handle) {
      throw new Error('Failed to create WebGL Framebuffer');
    }
  }

  _createClass(Framebuffer, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteFramebuffer(this.handle);
    }

    // SIMPLIFIED INTERFACE

    // WEBGL INTERFACE

  }, {
    key: 'bind',
    value: function bind() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref$target = _ref.target;
      var target = _ref$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref$target;
      var gl = this.gl;

      gl.bindFramebuffer((0, _context.glGet)(gl, target), this.handle);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref2$target = _ref2.target;
      var target = _ref2$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref2$target;
      var gl = this.gl;

      gl.bindFramebuffer((0, _context.glGet)(gl, target), null);
      return this;
    }

    //
    // NOTE: Slow requires roundtrip to GPU
    // App can provide pixelArray or have it auto allocated by this method
    // @returns {Uint8Array|Uint16Array|FloatArray} - pixel array,
    //  newly allocated by this method unless provided by app.

  }, {
    key: 'readPixels',
    value: function readPixels(_ref3) {
      var _ref3$x = _ref3.x;
      var x = _ref3$x === undefined ? 0 : _ref3$x;
      var _ref3$y = _ref3.y;
      var y = _ref3$y === undefined ? 0 : _ref3$y;
      var width = _ref3.width;
      var height = _ref3.height;
      var _ref3$format = _ref3.format;
      var format = _ref3$format === undefined ? _webglTypes.WebGL.RGBA : _ref3$format;
      var type = _ref3.type;
      var _ref3$pixelArray = _ref3.pixelArray;
      var pixelArray = _ref3$pixelArray === undefined ? null : _ref3$pixelArray;
      var gl = this.gl;

      // Deduce type and allocated pixelArray if needed

      if (!pixelArray) {
        // Allocate pixel array if not already available, using supplied type
        type = type || _webglTypes.WebGL.UNSIGNED_BYTE;
        var ArrayType = (0, _context.glArrayFromType)(type);
        var components = glFormatComponents(format);
        // TODO - check for composite type (components = 1).
        pixelArray = pixelArray || new ArrayType(width * height * components);
      }

      // Pixel array available, if necessary, deduce type from it.
      type = type || (0, _context.glTypeFromArray)(pixelArray);

      this.bind();
      gl.readPixels(x, y, width, height, format, type, pixelArray);
      this.unbind();

      return pixelArray;
    }

    /**
     * Used to attach textures to a framebuffer, the textures will store
     * the various buffers.
     *
     *  The set of available attachments is larger in WebGL2, and also the
     *  extensions WEBGL_draw_buffers and WEBGL_depth_texture provide additional
     *  attachments that match or exceed the WebGL2 set.
     *
     * @param {Texture2D|TextureCube|WebGLTexture|null} opt.texture=null -
     *    default is null which unbinds the texture for the attachment
     * @param {String|Number} opt.attachment= - which attachment to bind
     *    defaults to gl.COLOR_ATTACHMENT0.
     * @param {String|Number} opt.target= - bind point, normally gl.FRAMEBUFFER
     *    (WebGL2 support separating bet)
     * @param {String|Number} opt.textureTarget= - can be used to specify
     *    faces of a cube map.
     * @returns {FrameBuffer} returns itself to enable chaining
     */

  }, {
    key: 'attachTexture',
    value: function attachTexture() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref4$texture = _ref4.texture;
      var texture = _ref4$texture === undefined ? null : _ref4$texture;
      var _ref4$target = _ref4.target;
      var target = _ref4$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref4$target;
      var _ref4$attachment = _ref4.attachment;
      var attachment = _ref4$attachment === undefined ? _webglTypes.WebGL.COLOR_ATTACHMENT0 : _ref4$attachment;
      var _ref4$textureTarget = _ref4.textureTarget;
      var textureTarget = _ref4$textureTarget === undefined ? _webglTypes.WebGL.TEXTURE_2D : _ref4$textureTarget;
      var _ref4$mipmapLevel = _ref4.mipmapLevel;
      var mipmapLevel = _ref4$mipmapLevel === undefined ? 0 : _ref4$mipmapLevel;
      var gl = this.gl;


      texture = texture && _texture.Texture2D.makeFrom(gl, texture);

      this.bind({ target: target });

      gl.framebufferTexture2D((0, _context.glGet)(gl, target), (0, _context.glGet)(gl, attachment), (0, _context.glGet)(gl, textureTarget), texture.handle, mipmapLevel);

      this.unbind();
      return this;
    }

    /**
     * Used to attach a framebuffer to a framebuffer, the textures will store
     * the various buffers.
     * @param {Object} opts= - named parameters
     * @param {RenderBuffer|WebGLRenderBuffer|null} opts.renderbuffer=null -
     *    renderbuffer to bind
     *    default is null which unbinds the renderbuffer for the attachment
     * @param {String|Number} opts.attachment= - which buffer to bind
     * @returns {FrameBuffer} returns itself to enable chaining
     */

  }, {
    key: 'attachRenderbuffer',
    value: function attachRenderbuffer() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref5$renderbuffer = _ref5.renderbuffer;
      var renderbuffer = _ref5$renderbuffer === undefined ? null : _ref5$renderbuffer;
      var _ref5$attachment = _ref5.attachment;
      var attachment = _ref5$attachment === undefined ? _webglTypes.WebGL.COLOR_ATTACHMENT0 : _ref5$attachment;
      var _ref5$target = _ref5.target;
      var target = _ref5$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref5$target;
      var _ref5$renderbufferTar = _ref5.renderbufferTarget;
      var renderbufferTarget = _ref5$renderbufferTar === undefined ? _webglTypes.WebGL.RENDERBUFFER : _ref5$renderbufferTar;
      var gl = this.gl;

      renderbuffer = renderbuffer && _renderbuffer2.default.makeFrom(gl, renderbuffer);

      this.bind({ target: target });

      gl.framebufferRenderbuffer((0, _context.glGet)(gl, target), (0, _context.glGet)(gl, attachment), (0, _context.glGet)(gl, renderbufferTarget), renderbuffer.handle);

      this.unbind({ target: target });

      return this;
    }
  }, {
    key: 'checkStatus',
    value: function checkStatus() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref6$target = _ref6.target;
      var target = _ref6$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref6$target;
      var gl = this.gl;


      this.bind({ target: target });

      var status = gl.checkFramebufferStatus((0, _context.glGet)(gl, target));

      this.unbind({ target: target });

      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error(this._getFrameBufferStatus(status));
      }

      return this;
    }

    // WEBGL2 INTERFACE

  }, {
    key: 'blit',
    value: function blit(_ref7) {
      var srcX0 = _ref7.srcX0;
      var srcY0 = _ref7.srcY0;
      var srcX1 = _ref7.srcX1;
      var srcY1 = _ref7.srcY1;
      var dstX0 = _ref7.dstX0;
      var dstY0 = _ref7.dstY0;
      var dstX1 = _ref7.dstX1;
      var dstY1 = _ref7.dstY1;
      var mask = _ref7.mask;
      var _ref7$filter = _ref7.filter;
      var filter = _ref7$filter === undefined ? _webglTypes.WebGL.NEAREST : _ref7$filter;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
      return this;
    }
  }, {
    key: 'textureLayer',
    value: function textureLayer() {
      var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref8$target = _ref8.target;
      var target = _ref8$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref8$target;
      var attachment = _ref8.attachment;
      var texture = _ref8.texture;
      var level = _ref8.level;
      var layer = _ref8.layer;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      gl.framebufferTextureLayer(target, attachment, texture, level, layer);
      return this;
    }
  }, {
    key: 'invalidate',
    value: function invalidate(_ref9) {
      var _ref9$target = _ref9.target;
      var target = _ref9$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref9$target;
      var _ref9$attachments = _ref9.attachments;
      var attachments = _ref9$attachments === undefined ? [] : _ref9$attachments;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      gl.invalidateFramebuffer((0, _context.glConstant)(target), attachments);
      return this;
    }
  }, {
    key: 'invalidateSub',
    value: function invalidateSub(_ref10) {
      var _ref10$target = _ref10.target;
      var target = _ref10$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref10$target;
      var _ref10$attachments = _ref10.attachments;
      var attachments = _ref10$attachments === undefined ? [] : _ref10$attachments;
      var _ref10$x = _ref10.x;
      var x = _ref10$x === undefined ? 0 : _ref10$x;
      var _ref10$y = _ref10.y;
      var y = _ref10$y === undefined ? 0 : _ref10$y;
      var width = _ref10.width;
      var height = _ref10.height;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      gl.invalidateFramebuffer((0, _context.glConstant)(target), attachments, x, y, width, height);
      return this;
    }

    // Selects a color buffer as the source for pixels for subsequent calls to
    // copyTexImage2D, copyTexSubImage2D, copyTexSubImage3D or readPixels.
    // src
    //  gl.BACK: Reads from the back color buffer.
    //  gl.NONE: Reads from no color buffer.
    //  gl.COLOR_ATTACHMENT{0-15}: Reads from one of 16 color attachment buffers.

  }, {
    key: 'readBuffer',
    value: function readBuffer(_ref11) {
      var src = _ref11.src;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      gl.readBuffer(src);
      return this;
    }

    // @returns {GLint}

  }, {
    key: 'alphaSize',
    value: function alphaSize() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE);
    }

    // @returns {GLint}

  }, {
    key: 'blueSize',
    value: function blueSize() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE);
    }

    // @returns {GLenum}

  }, {
    key: 'colorEncoding',
    value: function colorEncoding() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING);
    }

    // @returns {GLenum}

  }, {
    key: 'componentType',
    value: function componentType() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE);
    }

    // @returns {GLint}

  }, {
    key: 'depthSize',
    value: function depthSize() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE);
    }

    // @returns {GLint}

  }, {
    key: 'greenSize',
    value: function greenSize() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE);
    }

    // @returns {WebGLRenderbuffer|WebGLTexture}

  }, {
    key: 'objectName',
    value: function objectName() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
    }

    // @returns {GLenum}

  }, {
    key: 'objectType',
    value: function objectType() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE);
    }

    // @returns {GLint}

  }, {
    key: 'redSize',
    value: function redSize() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_RED_SIZE);
    }

    // @returns {GLint}

  }, {
    key: 'stencilSize',
    value: function stencilSize() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE);
    }

    // @returns {GLint}

  }, {
    key: 'cubeMapFace',
    value: function cubeMapFace() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE);
    }

    // @returns {GLint}

  }, {
    key: 'layer',
    value: function layer() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER);
    }

    // @returns {GLint}

  }, {
    key: 'level',
    value: function level() {
      return this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL);
    }
  }, {
    key: 'getParameters',
    value: function getParameters() {
      return {
        alphaSize: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE),
        blueSize: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE),
        colorEncoding: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING),
        componentType: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE),
        depthSize: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE),
        greenSize: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE),
        objectName: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME),
        objectType: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE),
        redSize: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_RED_SIZE),
        stencilSize: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE),
        cubeMapFace: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE),
        layer: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER),
        level: this.getAttachmentParameter(_webglTypes.WebGL.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL)
      };
    }

    // (OpenGL ES 3.0.4 §6.1.13, similar to glGetFramebufferAttachmentParameteriv)
    // Return the value for the passed pname given the target and attachment.
    // The type returned is the natural type for the requested pname:
    // pname returned type
    // FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE GLint
    // FRAMEBUFFER_ATTACHMENT_BLUE_SIZE  GLint
    // FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING GLenum
    // FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE GLenum
    // FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE GLint
    // FRAMEBUFFER_ATTACHMENT_GREEN_SIZE GLint
    // FRAMEBUFFER_ATTACHMENT_OBJECT_NAME  WebGLRenderbuffer or WebGLTexture
    // FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE  GLenum
    // FRAMEBUFFER_ATTACHMENT_RED_SIZE GLint
    // FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE GLint
    // FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE  GLint
    // FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER  GLint
    // FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL  GLint
    // If pname is not in the table above, generates an INVALID_ENUM error.
    // If an OpenGL error is generated, returns null.

  }, {
    key: 'getAttachmentParameter',
    value: function getAttachmentParameter() {
      var _ref12 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var pname = _ref12.pname;
      var target = _ref12.target;
      var attachment = _ref12.attachment;
      var gl = this.gl;

      (0, _context.assertWebGL2)(gl);
      var value = gl.getFramebufferAttachmentParameter(target, attachment, pname);
      return value;
    }

    /* eslint-disable max-len */

  }, {
    key: '_getFrameBufferStatus',
    value: function _getFrameBufferStatus(status) {
      var gl = this.gl;

      var error = void 0;
      switch (status) {
        case gl.FRAMEBUFFER_COMPLETE:
          error = 'Success. Framebuffer is correctly set up';
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
          error = 'The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete.';
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
          error = 'There is no attachment.';
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
          error = 'Height and width of the attachment are not the same.';
          break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
          error = 'The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer.';
          break;
        // When using a WebGL 2 context, the following values can be returned
        case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
          error = 'The values of gl.RENDERBUFFER_SAMPLES are different among attached renderbuffers, or are non-zero if the attached images are a mix of renderbuffers and textures.';
          break;
        default:
          error = 'Framebuffer error ' + status;
          break;
      }
      return error;
    }
    /* eslint-enable max-len */

  }]);

  return Framebuffer;
}();

exports.default = Framebuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9mcmFtZWJ1ZmZlci5qcyJdLCJuYW1lcyI6WyJnbEZvcm1hdENvbXBvbmVudHMiLCJmb3JtYXQiLCJBTFBIQSIsIlJHQiIsIlJHQkEiLCJFcnJvciIsIkZyYW1lYnVmZmVyIiwiZ2wiLCJvYmplY3QiLCJoYW5kbGUiLCJjcmVhdGVGcmFtZWJ1ZmZlciIsImRlbGV0ZUZyYW1lYnVmZmVyIiwidGFyZ2V0IiwiRlJBTUVCVUZGRVIiLCJiaW5kRnJhbWVidWZmZXIiLCJ4IiwieSIsIndpZHRoIiwiaGVpZ2h0IiwidHlwZSIsInBpeGVsQXJyYXkiLCJVTlNJR05FRF9CWVRFIiwiQXJyYXlUeXBlIiwiY29tcG9uZW50cyIsImJpbmQiLCJyZWFkUGl4ZWxzIiwidW5iaW5kIiwidGV4dHVyZSIsImF0dGFjaG1lbnQiLCJDT0xPUl9BVFRBQ0hNRU5UMCIsInRleHR1cmVUYXJnZXQiLCJURVhUVVJFXzJEIiwibWlwbWFwTGV2ZWwiLCJtYWtlRnJvbSIsImZyYW1lYnVmZmVyVGV4dHVyZTJEIiwicmVuZGVyYnVmZmVyIiwicmVuZGVyYnVmZmVyVGFyZ2V0IiwiUkVOREVSQlVGRkVSIiwiZnJhbWVidWZmZXJSZW5kZXJidWZmZXIiLCJzdGF0dXMiLCJjaGVja0ZyYW1lYnVmZmVyU3RhdHVzIiwiRlJBTUVCVUZGRVJfQ09NUExFVEUiLCJfZ2V0RnJhbWVCdWZmZXJTdGF0dXMiLCJzcmNYMCIsInNyY1kwIiwic3JjWDEiLCJzcmNZMSIsImRzdFgwIiwiZHN0WTAiLCJkc3RYMSIsImRzdFkxIiwibWFzayIsImZpbHRlciIsIk5FQVJFU1QiLCJibGl0RnJhbWVidWZmZXIiLCJsZXZlbCIsImxheWVyIiwiZnJhbWVidWZmZXJUZXh0dXJlTGF5ZXIiLCJhdHRhY2htZW50cyIsImludmFsaWRhdGVGcmFtZWJ1ZmZlciIsInNyYyIsInJlYWRCdWZmZXIiLCJnZXRBdHRhY2htZW50UGFyYW1ldGVyIiwiRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9BTFBIQV9TSVpFIiwiRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9CTFVFX1NJWkUiLCJGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0NPTE9SX0VOQ09ESU5HIiwiRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT01QT05FTlRfVFlQRSIsIkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfREVQVEhfU0laRSIsIkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfR1JFRU5fU0laRSIsIkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX05BTUUiLCJGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9UWVBFIiwiRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9SRURfU0laRSIsIkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfU1RFTkNJTF9TSVpFIiwiRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0NVQkVfTUFQX0ZBQ0UiLCJGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEFZRVIiLCJGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEVWRUwiLCJhbHBoYVNpemUiLCJibHVlU2l6ZSIsImNvbG9yRW5jb2RpbmciLCJjb21wb25lbnRUeXBlIiwiZGVwdGhTaXplIiwiZ3JlZW5TaXplIiwib2JqZWN0TmFtZSIsIm9iamVjdFR5cGUiLCJyZWRTaXplIiwic3RlbmNpbFNpemUiLCJjdWJlTWFwRmFjZSIsInBuYW1lIiwidmFsdWUiLCJnZXRGcmFtZWJ1ZmZlckF0dGFjaG1lbnRQYXJhbWV0ZXIiLCJlcnJvciIsIkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVCIsIkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5UIiwiRlJBTUVCVUZGRVJfSU5DT01QTEVURV9ESU1FTlNJT05TIiwiRlJBTUVCVUZGRVJfVU5TVVBQT1JURUQiLCJGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01VTFRJU0FNUExFIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7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Q0EsY0FBUW5ELE1BQVI7QUFDQSxhQUFLaEMsR0FBR2tDLG9CQUFSO0FBQ0VpRCxrQkFBUSwwQ0FBUjtBQUNBO0FBQ0YsYUFBS25GLEdBQUdvRixpQ0FBUjtBQUNFRCxrQkFBUSxtSEFBUjtBQUNBO0FBQ0YsYUFBS25GLEdBQUdxRix5Q0FBUjtBQUNFRixrQkFBUSx5QkFBUjtBQUNBO0FBQ0YsYUFBS25GLEdBQUdzRixpQ0FBUjtBQUNFSCxrQkFBUSxzREFBUjtBQUNBO0FBQ0YsYUFBS25GLEdBQUd1Rix1QkFBUjtBQUNFSixrQkFBUSxrSEFBUjtBQUNBO0FBQ0Y7QUFDQSxhQUFLbkYsR0FBR3dGLGtDQUFSO0FBQ0VMLGtCQUFRLG1LQUFSO0FBQ0E7QUFDRjtBQUNFQSx5Q0FBNkJuRCxNQUE3QjtBQUNBO0FBdEJGO0FBd0JBLGFBQU9tRCxLQUFQO0FBQ0Q7QUFDRDs7Ozs7OztrQkExWm1CcEYsVyIsImZpbGUiOiJmcmFtZWJ1ZmZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7V2ViR0x9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCB7Z2xHZXQsIGdsQ29uc3RhbnQsIGdsQXJyYXlGcm9tVHlwZSwgZ2xUeXBlRnJvbUFycmF5LFxuICBhc3NlcnRXZWJHTDJ9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge1RleHR1cmUyRH0gZnJvbSAnLi90ZXh0dXJlJztcbmltcG9ydCBSZW5kZXJidWZmZXIgZnJvbSAnLi9yZW5kZXJidWZmZXInO1xuXG5mdW5jdGlvbiBnbEZvcm1hdENvbXBvbmVudHMoZm9ybWF0KSB7XG4gIHN3aXRjaCAoZm9ybWF0KSB7XG4gIGNhc2UgV2ViR0wuQUxQSEE6IHJldHVybiAxO1xuICBjYXNlIFdlYkdMLlJHQjogcmV0dXJuIDM7XG4gIGNhc2UgV2ViR0wuUkdCQTogcmV0dXJuIDQ7XG4gIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignVW5rbm93biBmb3JtYXQnKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGcmFtZWJ1ZmZlciB7XG5cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBGcmFtZWJ1ZmZlciA/IG9iamVjdCA6XG4gICAgICAvLyBVc2UgLmhhbmRsZSAoZS5nIGZyb20gc3RhY2suZ2wncyBnbC1idWZmZXIpLCBlbHNlIHVzZSBidWZmZXIgZGlyZWN0bHlcbiAgICAgIG5ldyBGcmFtZWJ1ZmZlcihnbCwge2hhbmRsZTogb2JqZWN0LmhhbmRsZSB8fCBvYmplY3R9KTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgaWYgKCF0aGlzLmhhbmRsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIFdlYkdMIEZyYW1lYnVmZmVyJyk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuaGFuZGxlKTtcbiAgfVxuXG4gIC8vIFNJTVBMSUZJRUQgSU5URVJGQUNFXG5cbiAgLy8gV0VCR0wgSU5URVJGQUNFXG5cbiAgYmluZCh7dGFyZ2V0ID0gV2ViR0wuRlJBTUVCVUZGRVJ9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2xHZXQoZ2wsIHRhcmdldCksIHRoaXMuaGFuZGxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuYmluZCh7dGFyZ2V0ID0gV2ViR0wuRlJBTUVCVUZGRVJ9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2xHZXQoZ2wsIHRhcmdldCksIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy9cbiAgLy8gTk9URTogU2xvdyByZXF1aXJlcyByb3VuZHRyaXAgdG8gR1BVXG4gIC8vIEFwcCBjYW4gcHJvdmlkZSBwaXhlbEFycmF5IG9yIGhhdmUgaXQgYXV0byBhbGxvY2F0ZWQgYnkgdGhpcyBtZXRob2RcbiAgLy8gQHJldHVybnMge1VpbnQ4QXJyYXl8VWludDE2QXJyYXl8RmxvYXRBcnJheX0gLSBwaXhlbCBhcnJheSxcbiAgLy8gIG5ld2x5IGFsbG9jYXRlZCBieSB0aGlzIG1ldGhvZCB1bmxlc3MgcHJvdmlkZWQgYnkgYXBwLlxuICByZWFkUGl4ZWxzKHtcbiAgICB4ID0gMCxcbiAgICB5ID0gMCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgZm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICB0eXBlLFxuICAgIHBpeGVsQXJyYXkgPSBudWxsXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcblxuICAgIC8vIERlZHVjZSB0eXBlIGFuZCBhbGxvY2F0ZWQgcGl4ZWxBcnJheSBpZiBuZWVkZWRcbiAgICBpZiAoIXBpeGVsQXJyYXkpIHtcbiAgICAgIC8vIEFsbG9jYXRlIHBpeGVsIGFycmF5IGlmIG5vdCBhbHJlYWR5IGF2YWlsYWJsZSwgdXNpbmcgc3VwcGxpZWQgdHlwZVxuICAgICAgdHlwZSA9IHR5cGUgfHwgV2ViR0wuVU5TSUdORURfQllURTtcbiAgICAgIGNvbnN0IEFycmF5VHlwZSA9IGdsQXJyYXlGcm9tVHlwZSh0eXBlKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBnbEZvcm1hdENvbXBvbmVudHMoZm9ybWF0KTtcbiAgICAgIC8vIFRPRE8gLSBjaGVjayBmb3IgY29tcG9zaXRlIHR5cGUgKGNvbXBvbmVudHMgPSAxKS5cbiAgICAgIHBpeGVsQXJyYXkgPSBwaXhlbEFycmF5IHx8IG5ldyBBcnJheVR5cGUod2lkdGggKiBoZWlnaHQgKiBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBQaXhlbCBhcnJheSBhdmFpbGFibGUsIGlmIG5lY2Vzc2FyeSwgZGVkdWNlIHR5cGUgZnJvbSBpdC5cbiAgICB0eXBlID0gdHlwZSB8fCBnbFR5cGVGcm9tQXJyYXkocGl4ZWxBcnJheSk7XG5cbiAgICB0aGlzLmJpbmQoKTtcbiAgICBnbC5yZWFkUGl4ZWxzKHgsIHksIHdpZHRoLCBoZWlnaHQsIGZvcm1hdCwgdHlwZSwgcGl4ZWxBcnJheSk7XG4gICAgdGhpcy51bmJpbmQoKTtcblxuICAgIHJldHVybiBwaXhlbEFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gYXR0YWNoIHRleHR1cmVzIHRvIGEgZnJhbWVidWZmZXIsIHRoZSB0ZXh0dXJlcyB3aWxsIHN0b3JlXG4gICAqIHRoZSB2YXJpb3VzIGJ1ZmZlcnMuXG4gICAqXG4gICAqICBUaGUgc2V0IG9mIGF2YWlsYWJsZSBhdHRhY2htZW50cyBpcyBsYXJnZXIgaW4gV2ViR0wyLCBhbmQgYWxzbyB0aGVcbiAgICogIGV4dGVuc2lvbnMgV0VCR0xfZHJhd19idWZmZXJzIGFuZCBXRUJHTF9kZXB0aF90ZXh0dXJlIHByb3ZpZGUgYWRkaXRpb25hbFxuICAgKiAgYXR0YWNobWVudHMgdGhhdCBtYXRjaCBvciBleGNlZWQgdGhlIFdlYkdMMiBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7VGV4dHVyZTJEfFRleHR1cmVDdWJlfFdlYkdMVGV4dHVyZXxudWxsfSBvcHQudGV4dHVyZT1udWxsIC1cbiAgICogICAgZGVmYXVsdCBpcyBudWxsIHdoaWNoIHVuYmluZHMgdGhlIHRleHR1cmUgZm9yIHRoZSBhdHRhY2htZW50XG4gICAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gb3B0LmF0dGFjaG1lbnQ9IC0gd2hpY2ggYXR0YWNobWVudCB0byBiaW5kXG4gICAqICAgIGRlZmF1bHRzIHRvIGdsLkNPTE9SX0FUVEFDSE1FTlQwLlxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IG9wdC50YXJnZXQ9IC0gYmluZCBwb2ludCwgbm9ybWFsbHkgZ2wuRlJBTUVCVUZGRVJcbiAgICogICAgKFdlYkdMMiBzdXBwb3J0IHNlcGFyYXRpbmcgYmV0KVxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IG9wdC50ZXh0dXJlVGFyZ2V0PSAtIGNhbiBiZSB1c2VkIHRvIHNwZWNpZnlcbiAgICogICAgZmFjZXMgb2YgYSBjdWJlIG1hcC5cbiAgICogQHJldHVybnMge0ZyYW1lQnVmZmVyfSByZXR1cm5zIGl0c2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGF0dGFjaFRleHR1cmUoe1xuICAgIHRleHR1cmUgPSBudWxsLFxuICAgIHRhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSLFxuICAgIGF0dGFjaG1lbnQgPSBXZWJHTC5DT0xPUl9BVFRBQ0hNRU5UMCxcbiAgICB0ZXh0dXJlVGFyZ2V0ID0gV2ViR0wuVEVYVFVSRV8yRCxcbiAgICAvLyBtaXBtYXBMZXZlbCwgY3VycmVudGx5IG9ubHkgMCBpcyBzdXBwb3J0ZWQgYnkgV2ViR0xcbiAgICBtaXBtYXBMZXZlbCA9IDBcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICB0ZXh0dXJlID0gdGV4dHVyZSAmJiBUZXh0dXJlMkQubWFrZUZyb20oZ2wsIHRleHR1cmUpO1xuXG4gICAgdGhpcy5iaW5kKHt0YXJnZXR9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2xHZXQoZ2wsIHRhcmdldCksXG4gICAgICBnbEdldChnbCwgYXR0YWNobWVudCksXG4gICAgICBnbEdldChnbCwgdGV4dHVyZVRhcmdldCksXG4gICAgICB0ZXh0dXJlLmhhbmRsZSxcbiAgICAgIG1pcG1hcExldmVsXG4gICAgKTtcblxuICAgIHRoaXMudW5iaW5kKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBhdHRhY2ggYSBmcmFtZWJ1ZmZlciB0byBhIGZyYW1lYnVmZmVyLCB0aGUgdGV4dHVyZXMgd2lsbCBzdG9yZVxuICAgKiB0aGUgdmFyaW91cyBidWZmZXJzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cz0gLSBuYW1lZCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7UmVuZGVyQnVmZmVyfFdlYkdMUmVuZGVyQnVmZmVyfG51bGx9IG9wdHMucmVuZGVyYnVmZmVyPW51bGwgLVxuICAgKiAgICByZW5kZXJidWZmZXIgdG8gYmluZFxuICAgKiAgICBkZWZhdWx0IGlzIG51bGwgd2hpY2ggdW5iaW5kcyB0aGUgcmVuZGVyYnVmZmVyIGZvciB0aGUgYXR0YWNobWVudFxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IG9wdHMuYXR0YWNobWVudD0gLSB3aGljaCBidWZmZXIgdG8gYmluZFxuICAgKiBAcmV0dXJucyB7RnJhbWVCdWZmZXJ9IHJldHVybnMgaXRzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgYXR0YWNoUmVuZGVyYnVmZmVyKHtcbiAgICByZW5kZXJidWZmZXIgPSBudWxsLFxuICAgIGF0dGFjaG1lbnQgPSBXZWJHTC5DT0xPUl9BVFRBQ0hNRU5UMCxcbiAgICB0YXJnZXQgPSBXZWJHTC5GUkFNRUJVRkZFUixcbiAgICByZW5kZXJidWZmZXJUYXJnZXQgPSBXZWJHTC5SRU5ERVJCVUZGRVJcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgcmVuZGVyYnVmZmVyID0gcmVuZGVyYnVmZmVyICYmIFJlbmRlcmJ1ZmZlci5tYWtlRnJvbShnbCwgcmVuZGVyYnVmZmVyKTtcblxuICAgIHRoaXMuYmluZCh7dGFyZ2V0fSk7XG5cbiAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihcbiAgICAgIGdsR2V0KGdsLCB0YXJnZXQpLFxuICAgICAgZ2xHZXQoZ2wsIGF0dGFjaG1lbnQpLFxuICAgICAgZ2xHZXQoZ2wsIHJlbmRlcmJ1ZmZlclRhcmdldCksXG4gICAgICByZW5kZXJidWZmZXIuaGFuZGxlXG4gICAgKTtcblxuICAgIHRoaXMudW5iaW5kKHt0YXJnZXR9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY2hlY2tTdGF0dXMoe3RhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICB0aGlzLmJpbmQoe3RhcmdldH0pO1xuXG4gICAgY29uc3Qgc3RhdHVzID0gZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbEdldChnbCwgdGFyZ2V0KSk7XG5cbiAgICB0aGlzLnVuYmluZCh7dGFyZ2V0fSk7XG5cbiAgICBpZiAoc3RhdHVzICE9PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuX2dldEZyYW1lQnVmZmVyU3RhdHVzKHN0YXR1cykpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gV0VCR0wyIElOVEVSRkFDRVxuXG4gIGJsaXQoe1xuICAgIHNyY1gwLCBzcmNZMCwgc3JjWDEsIHNyY1kxLFxuICAgIGRzdFgwLCBkc3RZMCwgZHN0WDEsIGRzdFkxLFxuICAgIG1hc2ssXG4gICAgZmlsdGVyID0gV2ViR0wuTkVBUkVTVFxuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0V2ViR0wyKGdsKTtcbiAgICBnbC5ibGl0RnJhbWVidWZmZXIoXG4gICAgICBzcmNYMCwgc3JjWTAsIHNyY1gxLCBzcmNZMSxcbiAgICAgIGRzdFgwLCBkc3RZMCwgZHN0WDEsIGRzdFkxLFxuICAgICAgbWFzayxcbiAgICAgIGZpbHRlclxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB0ZXh0dXJlTGF5ZXIoe1xuICAgIHRhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSLFxuICAgIGF0dGFjaG1lbnQsXG4gICAgdGV4dHVyZSxcbiAgICBsZXZlbCxcbiAgICBsYXllclxuICB9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnRXZWJHTDIoZ2wpO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZUxheWVyKHRhcmdldCwgYXR0YWNobWVudCwgdGV4dHVyZSwgbGV2ZWwsIGxheWVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGludmFsaWRhdGUoe1xuICAgIHRhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSLFxuICAgIGF0dGFjaG1lbnRzID0gW11cbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wuaW52YWxpZGF0ZUZyYW1lYnVmZmVyKGdsQ29uc3RhbnQodGFyZ2V0KSwgYXR0YWNobWVudHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaW52YWxpZGF0ZVN1Yih7XG4gICAgdGFyZ2V0ID0gV2ViR0wuRlJBTUVCVUZGRVIsXG4gICAgYXR0YWNobWVudHMgPSBbXSxcbiAgICB4ID0gMCxcbiAgICB5ID0gMCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHRcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wuaW52YWxpZGF0ZUZyYW1lYnVmZmVyKFxuICAgICAgZ2xDb25zdGFudCh0YXJnZXQpLCBhdHRhY2htZW50cywgeCwgeSwgd2lkdGgsIGhlaWdodFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBTZWxlY3RzIGEgY29sb3IgYnVmZmVyIGFzIHRoZSBzb3VyY2UgZm9yIHBpeGVscyBmb3Igc3Vic2VxdWVudCBjYWxscyB0b1xuICAvLyBjb3B5VGV4SW1hZ2UyRCwgY29weVRleFN1YkltYWdlMkQsIGNvcHlUZXhTdWJJbWFnZTNEIG9yIHJlYWRQaXhlbHMuXG4gIC8vIHNyY1xuICAvLyAgZ2wuQkFDSzogUmVhZHMgZnJvbSB0aGUgYmFjayBjb2xvciBidWZmZXIuXG4gIC8vICBnbC5OT05FOiBSZWFkcyBmcm9tIG5vIGNvbG9yIGJ1ZmZlci5cbiAgLy8gIGdsLkNPTE9SX0FUVEFDSE1FTlR7MC0xNX06IFJlYWRzIGZyb20gb25lIG9mIDE2IGNvbG9yIGF0dGFjaG1lbnQgYnVmZmVycy5cbiAgcmVhZEJ1ZmZlcih7c3JjfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wucmVhZEJ1ZmZlcihzcmMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBhbHBoYVNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQUxQSEFfU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9XG4gIGJsdWVTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0JMVUVfU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xlbnVtfVxuICBjb2xvckVuY29kaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0NPTE9SX0VOQ09ESU5HKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGVudW19XG4gIGNvbXBvbmVudFR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQ09NUE9ORU5UX1RZUEUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBkZXB0aFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfREVQVEhfU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9XG4gIGdyZWVuU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9HUkVFTl9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtXZWJHTFJlbmRlcmJ1ZmZlcnxXZWJHTFRleHR1cmV9XG4gIG9iamVjdE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX05BTUUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMZW51bX1cbiAgb2JqZWN0VHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfVFlQRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9XG4gIHJlZFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfUkVEX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBzdGVuY2lsU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9TVEVOQ0lMX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBjdWJlTWFwRmFjZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0NVQkVfTUFQX0ZBQ0UpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBsYXllcigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0xBWUVSKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH1cbiAgbGV2ZWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MRVZFTCk7XG4gIH1cblxuICBnZXRQYXJhbWV0ZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbHBoYVNpemU6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9BTFBIQV9TSVpFKSxcbiAgICAgIGJsdWVTaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQkxVRV9TSVpFKSxcbiAgICAgIGNvbG9yRW5jb2Rpbmc6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT0xPUl9FTkNPRElORyksXG4gICAgICBjb21wb25lbnRUeXBlOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQ09NUE9ORU5UX1RZUEUpLFxuICAgICAgZGVwdGhTaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfREVQVEhfU0laRSksXG4gICAgICBncmVlblNpemU6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9HUkVFTl9TSVpFKSxcbiAgICAgIG9iamVjdE5hbWU6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfTkFNRSksXG4gICAgICBvYmplY3RUeXBlOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX1RZUEUpLFxuICAgICAgcmVkU2l6ZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1JFRF9TSVpFKSxcbiAgICAgIHN0ZW5jaWxTaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfU1RFTkNJTF9TSVpFKSxcbiAgICAgIGN1YmVNYXBGYWNlOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9DVUJFX01BUF9GQUNFKSxcbiAgICAgIGxheWVyOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MQVlFUiksXG4gICAgICBsZXZlbDogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEVWRUwpXG4gICAgfTtcbiAgfVxuXG4gIC8vIChPcGVuR0wgRVMgMy4wLjQgwqc2LjEuMTMsIHNpbWlsYXIgdG8gZ2xHZXRGcmFtZWJ1ZmZlckF0dGFjaG1lbnRQYXJhbWV0ZXJpdilcbiAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmb3IgdGhlIHBhc3NlZCBwbmFtZSBnaXZlbiB0aGUgdGFyZ2V0IGFuZCBhdHRhY2htZW50LlxuICAvLyBUaGUgdHlwZSByZXR1cm5lZCBpcyB0aGUgbmF0dXJhbCB0eXBlIGZvciB0aGUgcmVxdWVzdGVkIHBuYW1lOlxuICAvLyBwbmFtZSByZXR1cm5lZCB0eXBlXG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQUxQSEFfU0laRSBHTGludFxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0JMVUVfU0laRSAgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT0xPUl9FTkNPRElORyBHTGVudW1cbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT01QT05FTlRfVFlQRSBHTGVudW1cbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9ERVBUSF9TSVpFIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfR1JFRU5fU0laRSBHTGludFxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9OQU1FICBXZWJHTFJlbmRlcmJ1ZmZlciBvciBXZWJHTFRleHR1cmVcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfVFlQRSAgR0xlbnVtXG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfUkVEX1NJWkUgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9TVEVOQ0lMX1NJWkUgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0NVQkVfTUFQX0ZBQ0UgIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MQVlFUiAgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0xFVkVMICBHTGludFxuICAvLyBJZiBwbmFtZSBpcyBub3QgaW4gdGhlIHRhYmxlIGFib3ZlLCBnZW5lcmF0ZXMgYW4gSU5WQUxJRF9FTlVNIGVycm9yLlxuICAvLyBJZiBhbiBPcGVuR0wgZXJyb3IgaXMgZ2VuZXJhdGVkLCByZXR1cm5zIG51bGwuXG4gIGdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoe1xuICAgIHBuYW1lLFxuICAgIHRhcmdldCxcbiAgICBhdHRhY2htZW50XG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgY29uc3QgdmFsdWUgPSBnbC5nZXRGcmFtZWJ1ZmZlckF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICB0YXJnZXQsIGF0dGFjaG1lbnQsIHBuYW1lXG4gICAgKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gIF9nZXRGcmFtZUJ1ZmZlclN0YXR1cyhzdGF0dXMpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBsZXQgZXJyb3I7XG4gICAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFOlxuICAgICAgZXJyb3IgPSAnU3VjY2Vzcy4gRnJhbWVidWZmZXIgaXMgY29ycmVjdGx5IHNldCB1cCc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVDpcbiAgICAgIGVycm9yID0gJ1RoZSBhdHRhY2htZW50IHR5cGVzIGFyZSBtaXNtYXRjaGVkIG9yIG5vdCBhbGwgZnJhbWVidWZmZXIgYXR0YWNobWVudCBwb2ludHMgYXJlIGZyYW1lYnVmZmVyIGF0dGFjaG1lbnQgY29tcGxldGUuJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlQ6XG4gICAgICBlcnJvciA9ICdUaGVyZSBpcyBubyBhdHRhY2htZW50Lic7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfRElNRU5TSU9OUzpcbiAgICAgIGVycm9yID0gJ0hlaWdodCBhbmQgd2lkdGggb2YgdGhlIGF0dGFjaG1lbnQgYXJlIG5vdCB0aGUgc2FtZS4nO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9VTlNVUFBPUlRFRDpcbiAgICAgIGVycm9yID0gJ1RoZSBmb3JtYXQgb2YgdGhlIGF0dGFjaG1lbnQgaXMgbm90IHN1cHBvcnRlZCBvciBpZiBkZXB0aCBhbmQgc3RlbmNpbCBhdHRhY2htZW50cyBhcmUgbm90IHRoZSBzYW1lIHJlbmRlcmJ1ZmZlci4nO1xuICAgICAgYnJlYWs7XG4gICAgLy8gV2hlbiB1c2luZyBhIFdlYkdMIDIgY29udGV4dCwgdGhlIGZvbGxvd2luZyB2YWx1ZXMgY2FuIGJlIHJldHVybmVkXG4gICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01VTFRJU0FNUExFOlxuICAgICAgZXJyb3IgPSAnVGhlIHZhbHVlcyBvZiBnbC5SRU5ERVJCVUZGRVJfU0FNUExFUyBhcmUgZGlmZmVyZW50IGFtb25nIGF0dGFjaGVkIHJlbmRlcmJ1ZmZlcnMsIG9yIGFyZSBub24temVybyBpZiB0aGUgYXR0YWNoZWQgaW1hZ2VzIGFyZSBhIG1peCBvZiByZW5kZXJidWZmZXJzIGFuZCB0ZXh0dXJlcy4nO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGVycm9yID0gYEZyYW1lYnVmZmVyIGVycm9yICR7c3RhdHVzfWA7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGVycm9yO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xufVxuIl19