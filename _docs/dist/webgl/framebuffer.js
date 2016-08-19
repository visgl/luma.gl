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

require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

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
  }
  throw new Error('Unknown format');
}

var Framebuffer = function () {
  _createClass(Framebuffer, null, [{
    key: 'makeFrom',
    value: function makeFrom(gl) {
      var object = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
      var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref$target = _ref.target;
      var target = _ref$target === undefined ? _webglTypes.WebGL.FRAMEBUFFER : _ref$target;
      var gl = this.gl;

      gl.bindFramebuffer((0, _context.glGet)(gl, target), this.handle);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var _ref4 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var _ref5 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var _ref6 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var _ref8 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var _ref12 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9mcmFtZWJ1ZmZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7OztBQUVBLFNBQVMsa0JBQVQsQ0FBNEIsTUFBNUIsRUFBb0M7QUFDbEMsVUFBUSxNQUFSO0FBQ0EsU0FBSyxrQkFBTSxLQUFYO0FBQWtCLGFBQU8sQ0FBUDtBQUNsQixTQUFLLGtCQUFNLEdBQVg7QUFBZ0IsYUFBTyxDQUFQO0FBQ2hCLFNBQUssa0JBQU0sSUFBWDtBQUFpQixhQUFPLENBQVA7QUFIakI7QUFLQSxRQUFNLElBQUksS0FBSixrQkFBTjtBQUNEOztJQUVvQixXOzs7NkJBRUgsRSxFQUFpQjtBQUFBLFVBQWIsTUFBYSx5REFBSixFQUFJOztBQUMvQixhQUFPLGtCQUFrQixXQUFsQixHQUFnQyxNQUFoQztBQUNMO0FBQ0EsVUFBSSxXQUFKLENBQWdCLEVBQWhCLEVBQW9CLEVBQUMsUUFBUSxPQUFPLE1BQVAsSUFBaUIsTUFBMUIsRUFBcEIsQ0FGRjtBQUdEOzs7QUFFRCx1QkFBWSxFQUFaLEVBQWdCO0FBQUE7O0FBQ2Qsa0RBQTRCLEVBQTVCOztBQUVBLFNBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxTQUFLLE1BQUwsR0FBYyxHQUFHLGlCQUFILEVBQWQ7QUFDQSxRQUFJLENBQUMsS0FBSyxNQUFWLEVBQWtCO0FBQ2hCLFlBQU0sSUFBSSxLQUFKLENBQVUsb0NBQVYsQ0FBTjtBQUNEO0FBQ0Y7Ozs7OEJBRVE7QUFBQSxVQUNBLEVBREEsR0FDTSxJQUROLENBQ0EsRUFEQTs7QUFFUCxTQUFHLGlCQUFILENBQXFCLEtBQUssTUFBMUI7QUFDRDs7QUFFRDs7QUFFQTs7OzsyQkFFd0M7QUFBQSx1RUFBSixFQUFJOztBQUFBLDZCQUFsQyxNQUFrQztBQUFBLFVBQWxDLE1BQWtDLCtCQUF6QixrQkFBTSxXQUFtQjtBQUFBLFVBQy9CLEVBRCtCLEdBQ3pC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cG9ydCB7V2ViR0x9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCB7Z2xHZXQsIGdsQ29uc3RhbnQsIGdsQXJyYXlGcm9tVHlwZSwgZ2xUeXBlRnJvbUFycmF5LFxuICBhc3NlcnRXZWJHTDJ9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge1RleHR1cmUyRH0gZnJvbSAnLi90ZXh0dXJlJztcbmltcG9ydCBSZW5kZXJidWZmZXIgZnJvbSAnLi9yZW5kZXJidWZmZXInO1xuaW1wb3J0IHt9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZnVuY3Rpb24gZ2xGb3JtYXRDb21wb25lbnRzKGZvcm1hdCkge1xuICBzd2l0Y2ggKGZvcm1hdCkge1xuICBjYXNlIFdlYkdMLkFMUEhBOiByZXR1cm4gMTtcbiAgY2FzZSBXZWJHTC5SR0I6IHJldHVybiAzO1xuICBjYXNlIFdlYkdMLlJHQkE6IHJldHVybiA0O1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBmb3JtYXRgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnJhbWVidWZmZXIge1xuXG4gIHN0YXRpYyBtYWtlRnJvbShnbCwgb2JqZWN0ID0ge30pIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgRnJhbWVidWZmZXIgPyBvYmplY3QgOlxuICAgICAgLy8gVXNlIC5oYW5kbGUgKGUuZyBmcm9tIHN0YWNrLmdsJ3MgZ2wtYnVmZmVyKSwgZWxzZSB1c2UgYnVmZmVyIGRpcmVjdGx5XG4gICAgICBuZXcgRnJhbWVidWZmZXIoZ2wsIHtoYW5kbGU6IG9iamVjdC5oYW5kbGUgfHwgb2JqZWN0fSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihnbCkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIGlmICghdGhpcy5oYW5kbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBXZWJHTCBGcmFtZWJ1ZmZlcicpO1xuICAgIH1cbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmhhbmRsZSk7XG4gIH1cblxuICAvLyBTSU1QTElGSUVEIElOVEVSRkFDRVxuXG4gIC8vIFdFQkdMIElOVEVSRkFDRVxuXG4gIGJpbmQoe3RhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsR2V0KGdsLCB0YXJnZXQpLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoe3RhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsR2V0KGdsLCB0YXJnZXQpLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vXG4gIC8vIE5PVEU6IFNsb3cgcmVxdWlyZXMgcm91bmR0cmlwIHRvIEdQVVxuICAvLyBBcHAgY2FuIHByb3ZpZGUgcGl4ZWxBcnJheSBvciBoYXZlIGl0IGF1dG8gYWxsb2NhdGVkIGJ5IHRoaXMgbWV0aG9kXG4gIC8vIEByZXR1cm5zIHtVaW50OEFycmF5fFVpbnQxNkFycmF5fEZsb2F0QXJyYXl9IC0gcGl4ZWwgYXJyYXksXG4gIC8vICBuZXdseSBhbGxvY2F0ZWQgYnkgdGhpcyBtZXRob2QgdW5sZXNzIHByb3ZpZGVkIGJ5IGFwcC5cbiAgcmVhZFBpeGVscyh7XG4gICAgeCA9IDAsXG4gICAgeSA9IDAsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGZvcm1hdCA9IFdlYkdMLlJHQkEsXG4gICAgdHlwZSxcbiAgICBwaXhlbEFycmF5ID0gbnVsbFxuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICAvLyBEZWR1Y2UgdHlwZSBhbmQgYWxsb2NhdGVkIHBpeGVsQXJyYXkgaWYgbmVlZGVkXG4gICAgaWYgKCFwaXhlbEFycmF5KSB7XG4gICAgICAvLyBBbGxvY2F0ZSBwaXhlbCBhcnJheSBpZiBub3QgYWxyZWFkeSBhdmFpbGFibGUsIHVzaW5nIHN1cHBsaWVkIHR5cGVcbiAgICAgIHR5cGUgPSB0eXBlIHx8IFdlYkdMLlVOU0lHTkVEX0JZVEU7XG4gICAgICBjb25zdCBBcnJheVR5cGUgPSBnbEFycmF5RnJvbVR5cGUodHlwZSk7XG4gICAgICBjb25zdCBjb21wb25lbnRzID0gZ2xGb3JtYXRDb21wb25lbnRzKGZvcm1hdCk7XG4gICAgICAvLyBUT0RPIC0gY2hlY2sgZm9yIGNvbXBvc2l0ZSB0eXBlIChjb21wb25lbnRzID0gMSkuXG4gICAgICBwaXhlbEFycmF5ID0gcGl4ZWxBcnJheSB8fCBuZXcgQXJyYXlUeXBlKHdpZHRoICogaGVpZ2h0ICogY29tcG9uZW50cyk7XG4gICAgfVxuXG4gICAgLy8gUGl4ZWwgYXJyYXkgYXZhaWxhYmxlLCBpZiBuZWNlc3NhcnksIGRlZHVjZSB0eXBlIGZyb20gaXQuXG4gICAgdHlwZSA9IHR5cGUgfHwgZ2xUeXBlRnJvbUFycmF5KHBpeGVsQXJyYXkpO1xuXG4gICAgdGhpcy5iaW5kKCk7XG4gICAgZ2wucmVhZFBpeGVscyh4LCB5LCB3aWR0aCwgaGVpZ2h0LCBmb3JtYXQsIHR5cGUsIHBpeGVsQXJyYXkpO1xuICAgIHRoaXMudW5iaW5kKCk7XG5cbiAgICByZXR1cm4gcGl4ZWxBcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VkIHRvIGF0dGFjaCB0ZXh0dXJlcyB0byBhIGZyYW1lYnVmZmVyLCB0aGUgdGV4dHVyZXMgd2lsbCBzdG9yZVxuICAgKiB0aGUgdmFyaW91cyBidWZmZXJzLlxuICAgKlxuICAgKiAgVGhlIHNldCBvZiBhdmFpbGFibGUgYXR0YWNobWVudHMgaXMgbGFyZ2VyIGluIFdlYkdMMiwgYW5kIGFsc28gdGhlXG4gICAqICBleHRlbnNpb25zIFdFQkdMX2RyYXdfYnVmZmVycyBhbmQgV0VCR0xfZGVwdGhfdGV4dHVyZSBwcm92aWRlIGFkZGl0aW9uYWxcbiAgICogIGF0dGFjaG1lbnRzIHRoYXQgbWF0Y2ggb3IgZXhjZWVkIHRoZSBXZWJHTDIgc2V0LlxuICAgKlxuICAgKiBAcGFyYW0ge1RleHR1cmUyRHxUZXh0dXJlQ3ViZXxXZWJHTFRleHR1cmV8bnVsbH0gb3B0LnRleHR1cmU9bnVsbCAtXG4gICAqICAgIGRlZmF1bHQgaXMgbnVsbCB3aGljaCB1bmJpbmRzIHRoZSB0ZXh0dXJlIGZvciB0aGUgYXR0YWNobWVudFxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IG9wdC5hdHRhY2htZW50PSAtIHdoaWNoIGF0dGFjaG1lbnQgdG8gYmluZFxuICAgKiAgICBkZWZhdWx0cyB0byBnbC5DT0xPUl9BVFRBQ0hNRU5UMC5cbiAgICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSBvcHQudGFyZ2V0PSAtIGJpbmQgcG9pbnQsIG5vcm1hbGx5IGdsLkZSQU1FQlVGRkVSXG4gICAqICAgIChXZWJHTDIgc3VwcG9ydCBzZXBhcmF0aW5nIGJldClcbiAgICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSBvcHQudGV4dHVyZVRhcmdldD0gLSBjYW4gYmUgdXNlZCB0byBzcGVjaWZ5XG4gICAqICAgIGZhY2VzIG9mIGEgY3ViZSBtYXAuXG4gICAqIEByZXR1cm5zIHtGcmFtZUJ1ZmZlcn0gcmV0dXJucyBpdHNlbGYgdG8gZW5hYmxlIGNoYWluaW5nXG4gICAqL1xuICBhdHRhY2hUZXh0dXJlKHtcbiAgICB0ZXh0dXJlID0gbnVsbCxcbiAgICB0YXJnZXQgPSBXZWJHTC5GUkFNRUJVRkZFUixcbiAgICBhdHRhY2htZW50ID0gV2ViR0wuQ09MT1JfQVRUQUNITUVOVDAsXG4gICAgdGV4dHVyZVRhcmdldCA9IFdlYkdMLlRFWFRVUkVfMkQsXG4gICAgLy8gbWlwbWFwTGV2ZWwsIGN1cnJlbnRseSBvbmx5IDAgaXMgc3VwcG9ydGVkIGJ5IFdlYkdMXG4gICAgbWlwbWFwTGV2ZWwgPSAwXG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuXG4gICAgdGV4dHVyZSA9IHRleHR1cmUgJiYgVGV4dHVyZTJELm1ha2VGcm9tKGdsLCB0ZXh0dXJlKTtcblxuICAgIHRoaXMuYmluZCh7dGFyZ2V0fSk7XG5cbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChcbiAgICAgIGdsR2V0KGdsLCB0YXJnZXQpLFxuICAgICAgZ2xHZXQoZ2wsIGF0dGFjaG1lbnQpLFxuICAgICAgZ2xHZXQoZ2wsIHRleHR1cmVUYXJnZXQpLFxuICAgICAgdGV4dHVyZS5oYW5kbGUsXG4gICAgICBtaXBtYXBMZXZlbFxuICAgICk7XG5cbiAgICB0aGlzLnVuYmluZCgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gYXR0YWNoIGEgZnJhbWVidWZmZXIgdG8gYSBmcmFtZWJ1ZmZlciwgdGhlIHRleHR1cmVzIHdpbGwgc3RvcmVcbiAgICogdGhlIHZhcmlvdXMgYnVmZmVycy5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHM9IC0gbmFtZWQgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge1JlbmRlckJ1ZmZlcnxXZWJHTFJlbmRlckJ1ZmZlcnxudWxsfSBvcHRzLnJlbmRlcmJ1ZmZlcj1udWxsIC1cbiAgICogICAgcmVuZGVyYnVmZmVyIHRvIGJpbmRcbiAgICogICAgZGVmYXVsdCBpcyBudWxsIHdoaWNoIHVuYmluZHMgdGhlIHJlbmRlcmJ1ZmZlciBmb3IgdGhlIGF0dGFjaG1lbnRcbiAgICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSBvcHRzLmF0dGFjaG1lbnQ9IC0gd2hpY2ggYnVmZmVyIHRvIGJpbmRcbiAgICogQHJldHVybnMge0ZyYW1lQnVmZmVyfSByZXR1cm5zIGl0c2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGF0dGFjaFJlbmRlcmJ1ZmZlcih7XG4gICAgcmVuZGVyYnVmZmVyID0gbnVsbCxcbiAgICBhdHRhY2htZW50ID0gV2ViR0wuQ09MT1JfQVRUQUNITUVOVDAsXG4gICAgdGFyZ2V0ID0gV2ViR0wuRlJBTUVCVUZGRVIsXG4gICAgcmVuZGVyYnVmZmVyVGFyZ2V0ID0gV2ViR0wuUkVOREVSQlVGRkVSXG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIHJlbmRlcmJ1ZmZlciA9IHJlbmRlcmJ1ZmZlciAmJiBSZW5kZXJidWZmZXIubWFrZUZyb20oZ2wsIHJlbmRlcmJ1ZmZlcik7XG5cbiAgICB0aGlzLmJpbmQoe3RhcmdldH0pO1xuXG4gICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoXG4gICAgICBnbEdldChnbCwgdGFyZ2V0KSxcbiAgICAgIGdsR2V0KGdsLCBhdHRhY2htZW50KSxcbiAgICAgIGdsR2V0KGdsLCByZW5kZXJidWZmZXJUYXJnZXQpLFxuICAgICAgcmVuZGVyYnVmZmVyLmhhbmRsZVxuICAgICk7XG5cbiAgICB0aGlzLnVuYmluZCh7dGFyZ2V0fSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNoZWNrU3RhdHVzKHt0YXJnZXQgPSBXZWJHTC5GUkFNRUJVRkZFUn0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuXG4gICAgdGhpcy5iaW5kKHt0YXJnZXR9KTtcblxuICAgIGNvbnN0IHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2xHZXQoZ2wsIHRhcmdldCkpO1xuXG4gICAgdGhpcy51bmJpbmQoe3RhcmdldH0pO1xuXG4gICAgaWYgKHN0YXR1cyAhPT0gZ2wuRlJBTUVCVUZGRVJfQ09NUExFVEUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLl9nZXRGcmFtZUJ1ZmZlclN0YXR1cyhzdGF0dXMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFdFQkdMMiBJTlRFUkZBQ0VcblxuICBibGl0KHtcbiAgICBzcmNYMCwgc3JjWTAsIHNyY1gxLCBzcmNZMSxcbiAgICBkc3RYMCwgZHN0WTAsIGRzdFgxLCBkc3RZMSxcbiAgICBtYXNrLFxuICAgIGZpbHRlciA9IFdlYkdMLk5FQVJFU1RcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wuYmxpdEZyYW1lYnVmZmVyKFxuICAgICAgc3JjWDAsIHNyY1kwLCBzcmNYMSwgc3JjWTEsXG4gICAgICBkc3RYMCwgZHN0WTAsIGRzdFgxLCBkc3RZMSxcbiAgICAgIG1hc2ssXG4gICAgICBmaWx0ZXJcbiAgICApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdGV4dHVyZUxheWVyKHtcbiAgICB0YXJnZXQgPSBXZWJHTC5GUkFNRUJVRkZFUixcbiAgICBhdHRhY2htZW50LFxuICAgIHRleHR1cmUsXG4gICAgbGV2ZWwsXG4gICAgbGF5ZXJcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0V2ViR0wyKGdsKTtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmVMYXllcih0YXJnZXQsIGF0dGFjaG1lbnQsIHRleHR1cmUsIGxldmVsLCBsYXllcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpbnZhbGlkYXRlKHtcbiAgICB0YXJnZXQgPSBXZWJHTC5GUkFNRUJVRkZFUixcbiAgICBhdHRhY2htZW50cyA9IFtdXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnRXZWJHTDIoZ2wpO1xuICAgIGdsLmludmFsaWRhdGVGcmFtZWJ1ZmZlcihnbENvbnN0YW50KHRhcmdldCksIGF0dGFjaG1lbnRzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGludmFsaWRhdGVTdWIoe1xuICAgIHRhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSLFxuICAgIGF0dGFjaG1lbnRzID0gW10sXG4gICAgeCA9IDAsXG4gICAgeSA9IDAsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0XG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnRXZWJHTDIoZ2wpO1xuICAgIGdsLmludmFsaWRhdGVGcmFtZWJ1ZmZlcihcbiAgICAgIGdsQ29uc3RhbnQodGFyZ2V0KSwgYXR0YWNobWVudHMsIHgsIHksIHdpZHRoLCBoZWlnaHRcbiAgICApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gU2VsZWN0cyBhIGNvbG9yIGJ1ZmZlciBhcyB0aGUgc291cmNlIGZvciBwaXhlbHMgZm9yIHN1YnNlcXVlbnQgY2FsbHMgdG9cbiAgLy8gY29weVRleEltYWdlMkQsIGNvcHlUZXhTdWJJbWFnZTJELCBjb3B5VGV4U3ViSW1hZ2UzRCBvciByZWFkUGl4ZWxzLlxuICAvLyBzcmNcbiAgLy8gIGdsLkJBQ0s6IFJlYWRzIGZyb20gdGhlIGJhY2sgY29sb3IgYnVmZmVyLlxuICAvLyAgZ2wuTk9ORTogUmVhZHMgZnJvbSBubyBjb2xvciBidWZmZXIuXG4gIC8vICBnbC5DT0xPUl9BVFRBQ0hNRU5UezAtMTV9OiBSZWFkcyBmcm9tIG9uZSBvZiAxNiBjb2xvciBhdHRhY2htZW50IGJ1ZmZlcnMuXG4gIHJlYWRCdWZmZXIoe3NyY30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnRXZWJHTDIoZ2wpO1xuICAgIGdsLnJlYWRCdWZmZXIoc3JjKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH1cbiAgYWxwaGFTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0FMUEhBX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBibHVlU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9CTFVFX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMZW51bX1cbiAgY29sb3JFbmNvZGluZygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT0xPUl9FTkNPRElORyk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xlbnVtfVxuICBjb21wb25lbnRUeXBlKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0NPTVBPTkVOVF9UWVBFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH1cbiAgZGVwdGhTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0RFUFRIX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBncmVlblNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfR1JFRU5fU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7V2ViR0xSZW5kZXJidWZmZXJ8V2ViR0xUZXh0dXJlfVxuICBvYmplY3ROYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9OQU1FKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGVudW19XG4gIG9iamVjdFR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX1RZUEUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICByZWRTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1JFRF9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH1cbiAgc3RlbmNpbFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfU1RFTkNJTF9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH1cbiAgY3ViZU1hcEZhY2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9DVUJFX01BUF9GQUNFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH1cbiAgbGF5ZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MQVlFUik7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9XG4gIGxldmVsKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEVWRUwpO1xuICB9XG5cbiAgZ2V0UGFyYW1ldGVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWxwaGFTaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQUxQSEFfU0laRSksXG4gICAgICBibHVlU2l6ZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0JMVUVfU0laRSksXG4gICAgICBjb2xvckVuY29kaW5nOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQ09MT1JfRU5DT0RJTkcpLFxuICAgICAgY29tcG9uZW50VHlwZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0NPTVBPTkVOVF9UWVBFKSxcbiAgICAgIGRlcHRoU2l6ZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0RFUFRIX1NJWkUpLFxuICAgICAgZ3JlZW5TaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfR1JFRU5fU0laRSksXG4gICAgICBvYmplY3ROYW1lOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX05BTUUpLFxuICAgICAgb2JqZWN0VHlwZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9UWVBFKSxcbiAgICAgIHJlZFNpemU6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9SRURfU0laRSksXG4gICAgICBzdGVuY2lsU2l6ZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1NURU5DSUxfU0laRSksXG4gICAgICBjdWJlTWFwRmFjZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfQ1VCRV9NQVBfRkFDRSksXG4gICAgICBsYXllcjogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEFZRVIpLFxuICAgICAgbGV2ZWw6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0xFVkVMKVxuICAgIH07XG4gIH1cblxuICAvLyAoT3BlbkdMIEVTIDMuMC40IMKnNi4xLjEzLCBzaW1pbGFyIHRvIGdsR2V0RnJhbWVidWZmZXJBdHRhY2htZW50UGFyYW1ldGVyaXYpXG4gIC8vIFJldHVybiB0aGUgdmFsdWUgZm9yIHRoZSBwYXNzZWQgcG5hbWUgZ2l2ZW4gdGhlIHRhcmdldCBhbmQgYXR0YWNobWVudC5cbiAgLy8gVGhlIHR5cGUgcmV0dXJuZWQgaXMgdGhlIG5hdHVyYWwgdHlwZSBmb3IgdGhlIHJlcXVlc3RlZCBwbmFtZTpcbiAgLy8gcG5hbWUgcmV0dXJuZWQgdHlwZVxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0FMUEhBX1NJWkUgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9CTFVFX1NJWkUgIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQ09MT1JfRU5DT0RJTkcgR0xlbnVtXG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQ09NUE9ORU5UX1RZUEUgR0xlbnVtXG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfREVQVEhfU0laRSBHTGludFxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0dSRUVOX1NJWkUgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfTkFNRSAgV2ViR0xSZW5kZXJidWZmZXIgb3IgV2ViR0xUZXh0dXJlXG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX1RZUEUgIEdMZW51bVxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1JFRF9TSVpFIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfU1RFTkNJTF9TSVpFIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9DVUJFX01BUF9GQUNFICBHTGludFxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEFZRVIgIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MRVZFTCAgR0xpbnRcbiAgLy8gSWYgcG5hbWUgaXMgbm90IGluIHRoZSB0YWJsZSBhYm92ZSwgZ2VuZXJhdGVzIGFuIElOVkFMSURfRU5VTSBlcnJvci5cbiAgLy8gSWYgYW4gT3BlbkdMIGVycm9yIGlzIGdlbmVyYXRlZCwgcmV0dXJucyBudWxsLlxuICBnZXRBdHRhY2htZW50UGFyYW1ldGVyKHtcbiAgICBwbmFtZSxcbiAgICB0YXJnZXQsXG4gICAgYXR0YWNobWVudFxuICB9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnRXZWJHTDIoZ2wpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2wuZ2V0RnJhbWVidWZmZXJBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgdGFyZ2V0LCBhdHRhY2htZW50LCBwbmFtZVxuICAgICk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuICBfZ2V0RnJhbWVCdWZmZXJTdGF0dXMoc3RhdHVzKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgbGV0IGVycm9yO1xuICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURTpcbiAgICAgIGVycm9yID0gJ1N1Y2Nlc3MuIEZyYW1lYnVmZmVyIGlzIGNvcnJlY3RseSBzZXQgdXAnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlQ6XG4gICAgICBlcnJvciA9IGBUaGUgYXR0YWNobWVudCB0eXBlcyBhcmUgbWlzbWF0Y2hlZCBvciBub3QgYWxsIGZyYW1lYnVmZmVyIGF0dGFjaG1lbnQgcG9pbnRzIGFyZSBmcmFtZWJ1ZmZlciBhdHRhY2htZW50IGNvbXBsZXRlLmA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5UOlxuICAgICAgZXJyb3IgPSBgVGhlcmUgaXMgbm8gYXR0YWNobWVudC5gO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlM6XG4gICAgICBlcnJvciA9IGBIZWlnaHQgYW5kIHdpZHRoIG9mIHRoZSBhdHRhY2htZW50IGFyZSBub3QgdGhlIHNhbWUuYDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRlJBTUVCVUZGRVJfVU5TVVBQT1JURUQ6XG4gICAgICBlcnJvciA9IGBUaGUgZm9ybWF0IG9mIHRoZSBhdHRhY2htZW50IGlzIG5vdCBzdXBwb3J0ZWQgb3IgaWYgZGVwdGggYW5kIHN0ZW5jaWwgYXR0YWNobWVudHMgYXJlIG5vdCB0aGUgc2FtZSByZW5kZXJidWZmZXIuYDtcbiAgICAgIGJyZWFrO1xuICAgIC8vIFdoZW4gdXNpbmcgYSBXZWJHTCAyIGNvbnRleHQsIHRoZSBmb2xsb3dpbmcgdmFsdWVzIGNhbiBiZSByZXR1cm5lZFxuICAgIGNhc2UgZ2wuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NVUxUSVNBTVBMRTpcbiAgICAgIGVycm9yID0gYFRoZSB2YWx1ZXMgb2YgZ2wuUkVOREVSQlVGRkVSX1NBTVBMRVMgYXJlIGRpZmZlcmVudCBhbW9uZyBhdHRhY2hlZCByZW5kZXJidWZmZXJzLCBvciBhcmUgbm9uLXplcm8gaWYgdGhlIGF0dGFjaGVkIGltYWdlcyBhcmUgYSBtaXggb2YgcmVuZGVyYnVmZmVycyBhbmQgdGV4dHVyZXMuYDtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBlcnJvciA9IGBGcmFtZWJ1ZmZlciBlcnJvciAke3N0YXR1c31gO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cbn1cbiJdfQ==