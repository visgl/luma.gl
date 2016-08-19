'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
      var
      // mipmapLevel, currently only 0 is supported by WebGL
      mipmapLevel = _ref4$mipmapLevel === undefined ? 0 : _ref4$mipmapLevel;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9mcmFtZWJ1ZmZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7O0FBRUEsU0FBUyxrQkFBVCxDQUE0QixNQUE1QixFQUFvQztBQUNsQyxVQUFRLE1BQVI7QUFDQSxTQUFLLGtCQUFNLEtBQVg7QUFBa0IsYUFBTyxDQUFQO0FBQ2xCLFNBQUssa0JBQU0sR0FBWDtBQUFnQixhQUFPLENBQVA7QUFDaEIsU0FBSyxrQkFBTSxJQUFYO0FBQWlCLGFBQU8sQ0FBUDtBQUhqQjtBQUtBLFFBQU0sSUFBSSxLQUFKLGtCQUFOO0FBQ0Q7O0lBRW9CLFc7Ozs2QkFFSCxFLEVBQWlCO0FBQUEsVUFBYixNQUFhLHlEQUFKLEVBQUk7O0FBQy9CLGFBQU8sa0JBQWtCLFdBQWxCLEdBQWdDLE1BQWhDOztBQUVMLFVBQUksV0FBSixDQUFnQixFQUFoQixFQUFvQixFQUFDLFFBQVEsT0FBTyxNQUFQLElBQWlCLE1BQTFCLEVBQXBCLENBRkY7QUFHRDs7O0FBRUQsdUJBQVksRUFBWixFQUFnQjtBQUFBOztBQUNkLGtEQUE0QixFQUE1Qjs7QUFFQSxTQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsU0FBSyxNQUFMLEdBQWMsR0FBRyxpQkFBSCxFQUFkO0FBQ0EsUUFBSSxDQUFDLEtBQUssTUFBVixFQUFrQjtBQUNoQixZQUFNLElBQUksS0FBSixDQUFVLG9DQUFWLENBQU47QUFDRDtBQUNGOzs7OzhCQUVRO0FBQUEsVUFDQSxFQURBLEdBQ00sSUFETixDQUNBLEVBREE7O0FBRVAsU0FBRyxpQkFBSCxDQUFxQixLQUFLLE1BQTFCO0FBQ0Q7Ozs7Ozs7OzJCQU11QztBQUFBLHVFQUFKLEVBQUk7O0FBQUEsNkJBQWxDLE1BQWtDO0FBQUEsVUFBbEMsTUFBa0MsK0JBQXpCLGtCQUFNLFdBQW1CO0FBQUEsVUFDL0IsRUFEK0IsR0FDekIsSUFEeUIsQ0FDL0IsRUFEK0I7O0FBRXRDLFNBQUcsZUFBSCxDQUFtQixvQkFBTSxFQUFOLEVBQVUsTUFBVixDQUFuQixFQUFzQyxLQUFLLE1BQTNDO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs2QkFFeUM7QUFBQSx3RUFBSixFQUFJOztBQUFBLCtCQUFsQyxNQUFrQztBQUFBLFVBQWxDLE1BQWtDLGdDQUF6QixrQkFBTSxXQUFtQjtBQUFBLFVBQ2pDLEVBRGlDLEdBQzNCLElBRDJCLENBQ2pDLEVBRGlDOztBQUV4QyxTQUFHLGVBQUgsQ0FBbUIsb0JBQU0sRUFBTixFQUFVLE1BQVYsQ0FBbkIsRUFBc0MsSUFBdEM7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7OztzQ0FlRTtBQUFBLDBCQVBELENBT0M7QUFBQSxVQVBELENBT0MsMkJBUEcsQ0FPSDtBQUFBLDBCQU5ELENBTUM7QUFBQSxVQU5ELENBTUMsMkJBTkcsQ0FNSDtBQUFBLFVBTEQsS0FLQyxTQUxELEtBS0M7QUFBQSxVQUpELE1BSUMsU0FKRCxNQUlDO0FBQUEsK0JBSEQsTUFHQztBQUFBLFVBSEQsTUFHQyxnQ0FIUSxrQkFBTSxJQUdkO0FBQUEsVUFGRCxJQUVDLFNBRkQsSUFFQztBQUFBLG1DQURELFVBQ0M7QUFBQSxVQURELFVBQ0Msb0NBRFksSUFDWjtBQUFBLFVBQ00sRUFETixHQUNZLElBRFosQ0FDTSxFQUROOzs7O0FBSUQsVUFBSSxDQUFDLFVBQUwsRUFBaUI7O0FBRWYsZUFBTyxRQUFRLGtCQUFNLGFBQXJCO0FBQ0EsWUFBTSxZQUFZLDhCQUFnQixJQUFoQixDQUFsQjtBQUNBLFlBQU0sYUFBYSxtQkFBbUIsTUFBbkIsQ0FBbkI7O0FBRUEscUJBQWEsY0FBYyxJQUFJLFNBQUosQ0FBYyxRQUFRLE1BQVIsR0FBaUIsVUFBL0IsQ0FBM0I7QUFDRDs7O0FBR0QsYUFBTyxRQUFRLDhCQUFnQixVQUFoQixDQUFmOztBQUVBLFdBQUssSUFBTDtBQUNBLFNBQUcsVUFBSCxDQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0IsS0FBcEIsRUFBMkIsTUFBM0IsRUFBbUMsTUFBbkMsRUFBMkMsSUFBM0MsRUFBaUQsVUFBakQ7QUFDQSxXQUFLLE1BQUw7O0FBRUEsYUFBTyxVQUFQO0FBQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQTJCTztBQUFBLHdFQUFKLEVBQUk7O0FBQUEsZ0NBTk4sT0FNTTtBQUFBLFVBTk4sT0FNTSxpQ0FOSSxJQU1KO0FBQUEsK0JBTE4sTUFLTTtBQUFBLFVBTE4sTUFLTSxnQ0FMRyxrQkFBTSxXQUtUO0FBQUEsbUNBSk4sVUFJTTtBQUFBLFVBSk4sVUFJTSxvQ0FKTyxrQkFBTSxpQkFJYjtBQUFBLHNDQUhOLGFBR007QUFBQSxVQUhOLGFBR00sdUNBSFUsa0JBQU0sVUFHaEI7QUFBQSxvQ0FETixXQUNNO0FBQUE7O0FBRE4saUJBQ00scUNBRFEsQ0FDUjtBQUFBLFVBQ0MsRUFERCxHQUNPLElBRFAsQ0FDQyxFQUREOzs7QUFHTixnQkFBVSxXQUFXLG1CQUFVLFFBQVYsQ0FBbUIsRUFBbkIsRUFBdUIsT0FBdkIsQ0FBckI7O0FBRUEsV0FBSyxJQUFMLENBQVUsRUFBQyxjQUFELEVBQVY7O0FBRUEsU0FBRyxvQkFBSCxDQUNFLG9CQUFNLEVBQU4sRUFBVSxNQUFWLENBREYsRUFFRSxvQkFBTSxFQUFOLEVBQVUsVUFBVixDQUZGLEVBR0Usb0JBQU0sRUFBTixFQUFVLGFBQVYsQ0FIRixFQUlFLFFBQVEsTUFKVixFQUtFLFdBTEY7O0FBUUEsV0FBSyxNQUFMO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7Ozs7Ozs7Ozs7Ozt5Q0FpQk87QUFBQSx3RUFBSixFQUFJOztBQUFBLHFDQUpOLFlBSU07QUFBQSxVQUpOLFlBSU0sc0NBSlMsSUFJVDtBQUFBLG1DQUhOLFVBR007QUFBQSxVQUhOLFVBR00sb0NBSE8sa0JBQU0saUJBR2I7QUFBQSwrQkFGTixNQUVNO0FBQUEsVUFGTixNQUVNLGdDQUZHLGtCQUFNLFdBRVQ7QUFBQSx3Q0FETixrQkFDTTtBQUFBLFVBRE4sa0JBQ00seUNBRGUsa0JBQU0sWUFDckI7QUFBQSxVQUNDLEVBREQsR0FDTyxJQURQLENBQ0MsRUFERDs7QUFFTixxQkFBZSxnQkFBZ0IsdUJBQWEsUUFBYixDQUFzQixFQUF0QixFQUEwQixZQUExQixDQUEvQjs7QUFFQSxXQUFLLElBQUwsQ0FBVSxFQUFDLGNBQUQsRUFBVjs7QUFFQSxTQUFHLHVCQUFILENBQ0Usb0JBQU0sRUFBTixFQUFVLE1BQVYsQ0FERixFQUVFLG9CQUFNLEVBQU4sRUFBVSxVQUFWLENBRkYsRUFHRSxvQkFBTSxFQUFOLEVBQVUsa0JBQVYsQ0FIRixFQUlFLGFBQWEsTUFKZjs7QUFPQSxXQUFLLE1BQUwsQ0FBWSxFQUFDLGNBQUQsRUFBWjs7QUFFQSxhQUFPLElBQVA7QUFDRDs7O2tDQUU4QztBQUFBLHdFQUFKLEVBQUk7O0FBQUEsK0JBQWxDLE1BQWtDO0FBQUEsVUFBbEMsTUFBa0MsZ0NBQXpCLGtCQUFNLFdBQW1CO0FBQUEsVUFDdEMsRUFEc0MsR0FDaEMsSUFEZ0MsQ0FDdEMsRUFEc0M7OztBQUc3QyxXQUFLLElBQUwsQ0FBVSxFQUFDLGNBQUQsRUFBVjs7QUFFQSxVQUFNLFNBQVMsR0FBRyxzQkFBSCxDQUEwQixvQkFBTSxFQUFOLEVBQVUsTUFBVixDQUExQixDQUFmOztBQUVBLFdBQUssTUFBTCxDQUFZLEVBQUMsY0FBRCxFQUFaOztBQUVBLFVBQUksV0FBVyxHQUFHLG9CQUFsQixFQUF3QztBQUN0QyxjQUFNLElBQUksS0FBSixDQUFVLEtBQUsscUJBQUwsQ0FBMkIsTUFBM0IsQ0FBVixDQUFOO0FBQ0Q7O0FBRUQsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztnQ0FTRTtBQUFBLFVBSkQsS0FJQyxTQUpELEtBSUM7QUFBQSxVQUpNLEtBSU4sU0FKTSxLQUlOO0FBQUEsVUFKYSxLQUliLFNBSmEsS0FJYjtBQUFBLFVBSm9CLEtBSXBCLFNBSm9CLEtBSXBCO0FBQUEsVUFIRCxLQUdDLFNBSEQsS0FHQztBQUFBLFVBSE0sS0FHTixTQUhNLEtBR047QUFBQSxVQUhhLEtBR2IsU0FIYSxLQUdiO0FBQUEsVUFIb0IsS0FHcEIsU0FIb0IsS0FHcEI7QUFBQSxVQUZELElBRUMsU0FGRCxJQUVDO0FBQUEsK0JBREQsTUFDQztBQUFBLFVBREQsTUFDQyxnQ0FEUSxrQkFBTSxPQUNkO0FBQUEsVUFDTSxFQUROLEdBQ1ksSUFEWixDQUNNLEVBRE47O0FBRUQsaUNBQWEsRUFBYjtBQUNBLFNBQUcsZUFBSCxDQUNFLEtBREYsRUFDUyxLQURULEVBQ2dCLEtBRGhCLEVBQ3VCLEtBRHZCLEVBRUUsS0FGRixFQUVTLEtBRlQsRUFFZ0IsS0FGaEIsRUFFdUIsS0FGdkIsRUFHRSxJQUhGLEVBSUUsTUFKRjtBQU1BLGFBQU8sSUFBUDtBQUNEOzs7bUNBUU87QUFBQSx3RUFBSixFQUFJOztBQUFBLCtCQUxOLE1BS007QUFBQSxVQUxOLE1BS00sZ0NBTEcsa0JBQU0sV0FLVDtBQUFBLFVBSk4sVUFJTSxTQUpOLFVBSU07QUFBQSxVQUhOLE9BR00sU0FITixPQUdNO0FBQUEsVUFGTixLQUVNLFNBRk4sS0FFTTtBQUFBLFVBRE4sS0FDTSxTQUROLEtBQ007QUFBQSxVQUNDLEVBREQsR0FDTyxJQURQLENBQ0MsRUFERDs7QUFFTixpQ0FBYSxFQUFiO0FBQ0EsU0FBRyx1QkFBSCxDQUEyQixNQUEzQixFQUFtQyxVQUFuQyxFQUErQyxPQUEvQyxFQUF3RCxLQUF4RCxFQUErRCxLQUEvRDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7c0NBS0U7QUFBQSwrQkFGRCxNQUVDO0FBQUEsVUFGRCxNQUVDLGdDQUZRLGtCQUFNLFdBRWQ7QUFBQSxvQ0FERCxXQUNDO0FBQUEsVUFERCxXQUNDLHFDQURhLEVBQ2I7QUFBQSxVQUNNLEVBRE4sR0FDWSxJQURaLENBQ00sRUFETjs7QUFFRCxpQ0FBYSxFQUFiO0FBQ0EsU0FBRyxxQkFBSCxDQUF5Qix5QkFBVyxNQUFYLENBQXpCLEVBQTZDLFdBQTdDO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OzswQ0FTRTtBQUFBLGlDQU5ELE1BTUM7QUFBQSxVQU5ELE1BTUMsaUNBTlEsa0JBQU0sV0FNZDtBQUFBLHNDQUxELFdBS0M7QUFBQSxVQUxELFdBS0Msc0NBTGEsRUFLYjtBQUFBLDRCQUpELENBSUM7QUFBQSxVQUpELENBSUMsNEJBSkcsQ0FJSDtBQUFBLDRCQUhELENBR0M7QUFBQSxVQUhELENBR0MsNEJBSEcsQ0FHSDtBQUFBLFVBRkQsS0FFQyxVQUZELEtBRUM7QUFBQSxVQURELE1BQ0MsVUFERCxNQUNDO0FBQUEsVUFDTSxFQUROLEdBQ1ksSUFEWixDQUNNLEVBRE47O0FBRUQsaUNBQWEsRUFBYjtBQUNBLFNBQUcscUJBQUgsQ0FDRSx5QkFBVyxNQUFYLENBREYsRUFDc0IsV0FEdEIsRUFDbUMsQ0FEbkMsRUFDc0MsQ0FEdEMsRUFDeUMsS0FEekMsRUFDZ0QsTUFEaEQ7QUFHQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7Ozs7dUNBUWlCO0FBQUEsVUFBTixHQUFNLFVBQU4sR0FBTTtBQUFBLFVBQ1QsRUFEUyxHQUNILElBREcsQ0FDVCxFQURTOztBQUVoQixpQ0FBYSxFQUFiO0FBQ0EsU0FBRyxVQUFILENBQWMsR0FBZDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7Ozs7Z0NBR1c7QUFDVixhQUFPLEtBQUssc0JBQUwsQ0FDTCxrQkFBTSxpQ0FERCxDQUFQO0FBRUQ7Ozs7OzsrQkFHVTtBQUNULGFBQU8sS0FBSyxzQkFBTCxDQUNMLGtCQUFNLGdDQURELENBQVA7QUFFRDs7Ozs7O29DQUdlO0FBQ2QsYUFBTyxLQUFLLHNCQUFMLENBQ0wsa0JBQU0scUNBREQsQ0FBUDtBQUVEOzs7Ozs7b0NBR2U7QUFDZCxhQUFPLEtBQUssc0JBQUwsQ0FDTCxrQkFBTSxxQ0FERCxDQUFQO0FBRUQ7Ozs7OztnQ0FHVztBQUNWLGFBQU8sS0FBSyxzQkFBTCxDQUNMLGtCQUFNLGlDQURELENBQVA7QUFFRDs7Ozs7O2dDQUdXO0FBQ1YsYUFBTyxLQUFLLHNCQUFMLENBQ0wsa0JBQU0saUNBREQsQ0FBUDtBQUVEOzs7Ozs7aUNBR1k7QUFDWCxhQUFPLEtBQUssc0JBQUwsQ0FDTCxrQkFBTSxrQ0FERCxDQUFQO0FBRUQ7Ozs7OztpQ0FHWTtBQUNYLGFBQU8sS0FBSyxzQkFBTCxDQUNMLGtCQUFNLGtDQURELENBQVA7QUFFRDs7Ozs7OzhCQUdTO0FBQ1IsYUFBTyxLQUFLLHNCQUFMLENBQ0wsa0JBQU0sK0JBREQsQ0FBUDtBQUVEOzs7Ozs7a0NBR2E7QUFDWixhQUFPLEtBQUssc0JBQUwsQ0FDTCxrQkFBTSxtQ0FERCxDQUFQO0FBRUQ7Ozs7OztrQ0FHYTtBQUNaLGFBQU8sS0FBSyxzQkFBTCxDQUNMLGtCQUFNLDRDQURELENBQVA7QUFFRDs7Ozs7OzRCQUdPO0FBQ04sYUFBTyxLQUFLLHNCQUFMLENBQ0wsa0JBQU0sb0NBREQsQ0FBUDtBQUVEOzs7Ozs7NEJBR087QUFDTixhQUFPLEtBQUssc0JBQUwsQ0FDTCxrQkFBTSxvQ0FERCxDQUFQO0FBRUQ7OztvQ0FFZTtBQUNkLGFBQU87QUFDTCxtQkFBVyxLQUFLLHNCQUFMLENBQ1Qsa0JBQU0saUNBREcsQ0FETjtBQUdMLGtCQUFVLEtBQUssc0JBQUwsQ0FDUixrQkFBTSxnQ0FERSxDQUhMO0FBS0wsdUJBQWUsS0FBSyxzQkFBTCxDQUNiLGtCQUFNLHFDQURPLENBTFY7QUFPTCx1QkFBZSxLQUFLLHNCQUFMLENBQ2Isa0JBQU0scUNBRE8sQ0FQVjtBQVNMLG1CQUFXLEtBQUssc0JBQUwsQ0FDVCxrQkFBTSxpQ0FERyxDQVROO0FBV0wsbUJBQVcsS0FBSyxzQkFBTCxDQUNULGtCQUFNLGlDQURHLENBWE47QUFhTCxvQkFBWSxLQUFLLHNCQUFMLENBQ1Ysa0JBQU0sa0NBREksQ0FiUDtBQWVMLG9CQUFZLEtBQUssc0JBQUwsQ0FDVixrQkFBTSxrQ0FESSxDQWZQO0FBaUJMLGlCQUFTLEtBQUssc0JBQUwsQ0FDUCxrQkFBTSwrQkFEQyxDQWpCSjtBQW1CTCxxQkFBYSxLQUFLLHNCQUFMLENBQ1gsa0JBQU0sbUNBREssQ0FuQlI7QUFxQkwscUJBQWEsS0FBSyxzQkFBTCxDQUNYLGtCQUFNLDRDQURLLENBckJSO0FBdUJMLGVBQU8sS0FBSyxzQkFBTCxDQUNMLGtCQUFNLG9DQURELENBdkJGO0FBeUJMLGVBQU8sS0FBSyxzQkFBTCxDQUNMLGtCQUFNLG9DQUREO0FBekJGLE9BQVA7QUE0QkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs2Q0F5Qk87QUFBQSx5RUFBSixFQUFJOztBQUFBLFVBSE4sS0FHTSxVQUhOLEtBR007QUFBQSxVQUZOLE1BRU0sVUFGTixNQUVNO0FBQUEsVUFETixVQUNNLFVBRE4sVUFDTTtBQUFBLFVBQ0MsRUFERCxHQUNPLElBRFAsQ0FDQyxFQUREOztBQUVOLGlDQUFhLEVBQWI7QUFDQSxVQUFNLFFBQVEsR0FBRyxpQ0FBSCxDQUNaLE1BRFksRUFDSixVQURJLEVBQ1EsS0FEUixDQUFkO0FBR0EsYUFBTyxLQUFQO0FBQ0Q7Ozs7OzswQ0FHcUIsTSxFQUFRO0FBQUEsVUFDckIsRUFEcUIsR0FDZixJQURlLENBQ3JCLEVBRHFCOztBQUU1QixVQUFJLGNBQUo7QUFDQSxjQUFRLE1BQVI7QUFDQSxhQUFLLEdBQUcsb0JBQVI7QUFDRSxrQkFBUSwwQ0FBUjtBQUNBO0FBQ0YsYUFBSyxHQUFHLGlDQUFSO0FBQ0U7QUFDQTtBQUNGLGFBQUssR0FBRyx5Q0FBUjtBQUNFO0FBQ0E7QUFDRixhQUFLLEdBQUcsaUNBQVI7QUFDRTtBQUNBO0FBQ0YsYUFBSyxHQUFHLHVCQUFSO0FBQ0U7QUFDQTs7QUFFRixhQUFLLEdBQUcsa0NBQVI7QUFDRTtBQUNBO0FBQ0Y7QUFDRSx5Q0FBNkIsTUFBN0I7QUFDQTtBQXRCRjtBQXdCQSxhQUFPLEtBQVA7QUFDRDs7Ozs7Ozs7a0JBelprQixXIiwiZmlsZSI6ImZyYW1lYnVmZmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtXZWJHTH0gZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQge2Fzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IHtnbEdldCwgZ2xDb25zdGFudCwgZ2xBcnJheUZyb21UeXBlLCBnbFR5cGVGcm9tQXJyYXksXG4gIGFzc2VydFdlYkdMMn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCB7VGV4dHVyZTJEfSBmcm9tICcuL3RleHR1cmUnO1xuaW1wb3J0IFJlbmRlcmJ1ZmZlciBmcm9tICcuL3JlbmRlcmJ1ZmZlcic7XG5pbXBvcnQge30gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5mdW5jdGlvbiBnbEZvcm1hdENvbXBvbmVudHMoZm9ybWF0KSB7XG4gIHN3aXRjaCAoZm9ybWF0KSB7XG4gIGNhc2UgV2ViR0wuQUxQSEE6IHJldHVybiAxO1xuICBjYXNlIFdlYkdMLlJHQjogcmV0dXJuIDM7XG4gIGNhc2UgV2ViR0wuUkdCQTogcmV0dXJuIDQ7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGZvcm1hdGApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGcmFtZWJ1ZmZlciB7XG5cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBGcmFtZWJ1ZmZlciA/IG9iamVjdCA6XG4gICAgICAvLyBVc2UgLmhhbmRsZSAoZS5nIGZyb20gc3RhY2suZ2wncyBnbC1idWZmZXIpLCBlbHNlIHVzZSBidWZmZXIgZGlyZWN0bHlcbiAgICAgIG5ldyBGcmFtZWJ1ZmZlcihnbCwge2hhbmRsZTogb2JqZWN0LmhhbmRsZSB8fCBvYmplY3R9KTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGdsKSB7XG4gICAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgaWYgKCF0aGlzLmhhbmRsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIFdlYkdMIEZyYW1lYnVmZmVyJyk7XG4gICAgfVxuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuaGFuZGxlKTtcbiAgfVxuXG4gIC8vIFNJTVBMSUZJRUQgSU5URVJGQUNFXG5cbiAgLy8gV0VCR0wgSU5URVJGQUNFXG5cbiAgYmluZCh7dGFyZ2V0ID0gV2ViR0wuRlJBTUVCVUZGRVJ9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2xHZXQoZ2wsIHRhcmdldCksIHRoaXMuaGFuZGxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuYmluZCh7dGFyZ2V0ID0gV2ViR0wuRlJBTUVCVUZGRVJ9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2xHZXQoZ2wsIHRhcmdldCksIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy9cbiAgLy8gTk9URTogU2xvdyByZXF1aXJlcyByb3VuZHRyaXAgdG8gR1BVXG4gIC8vIEFwcCBjYW4gcHJvdmlkZSBwaXhlbEFycmF5IG9yIGhhdmUgaXQgYXV0byBhbGxvY2F0ZWQgYnkgdGhpcyBtZXRob2RcbiAgLy8gQHJldHVybnMge1VpbnQ4QXJyYXl8VWludDE2QXJyYXl8RmxvYXRBcnJheX0gLSBwaXhlbCBhcnJheSxcbiAgLy8gIG5ld2x5IGFsbG9jYXRlZCBieSB0aGlzIG1ldGhvZCB1bmxlc3MgcHJvdmlkZWQgYnkgYXBwLlxuICByZWFkUGl4ZWxzKHtcbiAgICB4ID0gMCxcbiAgICB5ID0gMCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgZm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICB0eXBlLFxuICAgIHBpeGVsQXJyYXkgPSBudWxsXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcblxuICAgIC8vIERlZHVjZSB0eXBlIGFuZCBhbGxvY2F0ZWQgcGl4ZWxBcnJheSBpZiBuZWVkZWRcbiAgICBpZiAoIXBpeGVsQXJyYXkpIHtcbiAgICAgIC8vIEFsbG9jYXRlIHBpeGVsIGFycmF5IGlmIG5vdCBhbHJlYWR5IGF2YWlsYWJsZSwgdXNpbmcgc3VwcGxpZWQgdHlwZVxuICAgICAgdHlwZSA9IHR5cGUgfHwgV2ViR0wuVU5TSUdORURfQllURTtcbiAgICAgIGNvbnN0IEFycmF5VHlwZSA9IGdsQXJyYXlGcm9tVHlwZSh0eXBlKTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudHMgPSBnbEZvcm1hdENvbXBvbmVudHMoZm9ybWF0KTtcbiAgICAgIC8vIFRPRE8gLSBjaGVjayBmb3IgY29tcG9zaXRlIHR5cGUgKGNvbXBvbmVudHMgPSAxKS5cbiAgICAgIHBpeGVsQXJyYXkgPSBwaXhlbEFycmF5IHx8IG5ldyBBcnJheVR5cGUod2lkdGggKiBoZWlnaHQgKiBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBQaXhlbCBhcnJheSBhdmFpbGFibGUsIGlmIG5lY2Vzc2FyeSwgZGVkdWNlIHR5cGUgZnJvbSBpdC5cbiAgICB0eXBlID0gdHlwZSB8fCBnbFR5cGVGcm9tQXJyYXkocGl4ZWxBcnJheSk7XG5cbiAgICB0aGlzLmJpbmQoKTtcbiAgICBnbC5yZWFkUGl4ZWxzKHgsIHksIHdpZHRoLCBoZWlnaHQsIGZvcm1hdCwgdHlwZSwgcGl4ZWxBcnJheSk7XG4gICAgdGhpcy51bmJpbmQoKTtcblxuICAgIHJldHVybiBwaXhlbEFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gYXR0YWNoIHRleHR1cmVzIHRvIGEgZnJhbWVidWZmZXIsIHRoZSB0ZXh0dXJlcyB3aWxsIHN0b3JlXG4gICAqIHRoZSB2YXJpb3VzIGJ1ZmZlcnMuXG4gICAqXG4gICAqICBUaGUgc2V0IG9mIGF2YWlsYWJsZSBhdHRhY2htZW50cyBpcyBsYXJnZXIgaW4gV2ViR0wyLCBhbmQgYWxzbyB0aGVcbiAgICogIGV4dGVuc2lvbnMgV0VCR0xfZHJhd19idWZmZXJzIGFuZCBXRUJHTF9kZXB0aF90ZXh0dXJlIHByb3ZpZGUgYWRkaXRpb25hbFxuICAgKiAgYXR0YWNobWVudHMgdGhhdCBtYXRjaCBvciBleGNlZWQgdGhlIFdlYkdMMiBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7VGV4dHVyZTJEfFRleHR1cmVDdWJlfFdlYkdMVGV4dHVyZXxudWxsfSBvcHQudGV4dHVyZT1udWxsIC1cbiAgICogICAgZGVmYXVsdCBpcyBudWxsIHdoaWNoIHVuYmluZHMgdGhlIHRleHR1cmUgZm9yIHRoZSBhdHRhY2htZW50XG4gICAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gb3B0LmF0dGFjaG1lbnQ9IC0gd2hpY2ggYXR0YWNobWVudCB0byBiaW5kXG4gICAqICAgIGRlZmF1bHRzIHRvIGdsLkNPTE9SX0FUVEFDSE1FTlQwLlxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IG9wdC50YXJnZXQ9IC0gYmluZCBwb2ludCwgbm9ybWFsbHkgZ2wuRlJBTUVCVUZGRVJcbiAgICogICAgKFdlYkdMMiBzdXBwb3J0IHNlcGFyYXRpbmcgYmV0KVxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IG9wdC50ZXh0dXJlVGFyZ2V0PSAtIGNhbiBiZSB1c2VkIHRvIHNwZWNpZnlcbiAgICogICAgZmFjZXMgb2YgYSBjdWJlIG1hcC5cbiAgICogQHJldHVybnMge0ZyYW1lQnVmZmVyfSByZXR1cm5zIGl0c2VsZiB0byBlbmFibGUgY2hhaW5pbmdcbiAgICovXG4gIGF0dGFjaFRleHR1cmUoe1xuICAgIHRleHR1cmUgPSBudWxsLFxuICAgIHRhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSLFxuICAgIGF0dGFjaG1lbnQgPSBXZWJHTC5DT0xPUl9BVFRBQ0hNRU5UMCxcbiAgICB0ZXh0dXJlVGFyZ2V0ID0gV2ViR0wuVEVYVFVSRV8yRCxcbiAgICAvLyBtaXBtYXBMZXZlbCwgY3VycmVudGx5IG9ubHkgMCBpcyBzdXBwb3J0ZWQgYnkgV2ViR0xcbiAgICBtaXBtYXBMZXZlbCA9IDBcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICB0ZXh0dXJlID0gdGV4dHVyZSAmJiBUZXh0dXJlMkQubWFrZUZyb20oZ2wsIHRleHR1cmUpO1xuXG4gICAgdGhpcy5iaW5kKHt0YXJnZXR9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2xHZXQoZ2wsIHRhcmdldCksXG4gICAgICBnbEdldChnbCwgYXR0YWNobWVudCksXG4gICAgICBnbEdldChnbCwgdGV4dHVyZVRhcmdldCksXG4gICAgICB0ZXh0dXJlLmhhbmRsZSxcbiAgICAgIG1pcG1hcExldmVsXG4gICAgKTtcblxuICAgIHRoaXMudW5iaW5kKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBhdHRhY2ggYSBmcmFtZWJ1ZmZlciB0byBhIGZyYW1lYnVmZmVyLCB0aGUgdGV4dHVyZXMgd2lsbCBzdG9yZVxuICAgKiB0aGUgdmFyaW91cyBidWZmZXJzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cz0gLSBuYW1lZCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7UmVuZGVyQnVmZmVyfFdlYkdMUmVuZGVyQnVmZmVyfG51bGx9IG9wdHMucmVuZGVyYnVmZmVyPW51bGwgLVxuICAgKiAgICByZW5kZXJidWZmZXIgdG8gYmluZFxuICAgKiAgICBkZWZhdWx0IGlzIG51bGwgd2hpY2ggdW5iaW5kcyB0aGUgcmVuZGVyYnVmZmVyIGZvciB0aGUgYXR0YWNobWVudFxuICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IG9wdHMuYXR0YWNobWVudD0gLSB3aGljaCBidWZmZXIgdG8gYmluZFxuICAgKiBAcmV0dXJucyB7RnJhbWVCdWZmZXJ9IHJldHVybnMgaXRzZWxmIHRvIGVuYWJsZSBjaGFpbmluZ1xuICAgKi9cbiAgYXR0YWNoUmVuZGVyYnVmZmVyKHtcbiAgICByZW5kZXJidWZmZXIgPSBudWxsLFxuICAgIGF0dGFjaG1lbnQgPSBXZWJHTC5DT0xPUl9BVFRBQ0hNRU5UMCxcbiAgICB0YXJnZXQgPSBXZWJHTC5GUkFNRUJVRkZFUixcbiAgICByZW5kZXJidWZmZXJUYXJnZXQgPSBXZWJHTC5SRU5ERVJCVUZGRVJcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgcmVuZGVyYnVmZmVyID0gcmVuZGVyYnVmZmVyICYmIFJlbmRlcmJ1ZmZlci5tYWtlRnJvbShnbCwgcmVuZGVyYnVmZmVyKTtcblxuICAgIHRoaXMuYmluZCh7dGFyZ2V0fSk7XG5cbiAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihcbiAgICAgIGdsR2V0KGdsLCB0YXJnZXQpLFxuICAgICAgZ2xHZXQoZ2wsIGF0dGFjaG1lbnQpLFxuICAgICAgZ2xHZXQoZ2wsIHJlbmRlcmJ1ZmZlclRhcmdldCksXG4gICAgICByZW5kZXJidWZmZXIuaGFuZGxlXG4gICAgKTtcblxuICAgIHRoaXMudW5iaW5kKHt0YXJnZXR9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY2hlY2tTdGF0dXMoe3RhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICB0aGlzLmJpbmQoe3RhcmdldH0pO1xuXG4gICAgY29uc3Qgc3RhdHVzID0gZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbEdldChnbCwgdGFyZ2V0KSk7XG5cbiAgICB0aGlzLnVuYmluZCh7dGFyZ2V0fSk7XG5cbiAgICBpZiAoc3RhdHVzICE9PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuX2dldEZyYW1lQnVmZmVyU3RhdHVzKHN0YXR1cykpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gV0VCR0wyIElOVEVSRkFDRVxuXG4gIGJsaXQoe1xuICAgIHNyY1gwLCBzcmNZMCwgc3JjWDEsIHNyY1kxLFxuICAgIGRzdFgwLCBkc3RZMCwgZHN0WDEsIGRzdFkxLFxuICAgIG1hc2ssXG4gICAgZmlsdGVyID0gV2ViR0wuTkVBUkVTVFxuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0V2ViR0wyKGdsKTtcbiAgICBnbC5ibGl0RnJhbWVidWZmZXIoXG4gICAgICBzcmNYMCwgc3JjWTAsIHNyY1gxLCBzcmNZMSxcbiAgICAgIGRzdFgwLCBkc3RZMCwgZHN0WDEsIGRzdFkxLFxuICAgICAgbWFzayxcbiAgICAgIGZpbHRlclxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB0ZXh0dXJlTGF5ZXIoe1xuICAgIHRhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSLFxuICAgIGF0dGFjaG1lbnQsXG4gICAgdGV4dHVyZSxcbiAgICBsZXZlbCxcbiAgICBsYXllclxuICB9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnRXZWJHTDIoZ2wpO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZUxheWVyKHRhcmdldCwgYXR0YWNobWVudCwgdGV4dHVyZSwgbGV2ZWwsIGxheWVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGludmFsaWRhdGUoe1xuICAgIHRhcmdldCA9IFdlYkdMLkZSQU1FQlVGRkVSLFxuICAgIGF0dGFjaG1lbnRzID0gW11cbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wuaW52YWxpZGF0ZUZyYW1lYnVmZmVyKGdsQ29uc3RhbnQodGFyZ2V0KSwgYXR0YWNobWVudHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgaW52YWxpZGF0ZVN1Yih7XG4gICAgdGFyZ2V0ID0gV2ViR0wuRlJBTUVCVUZGRVIsXG4gICAgYXR0YWNobWVudHMgPSBbXSxcbiAgICB4ID0gMCxcbiAgICB5ID0gMCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHRcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wuaW52YWxpZGF0ZUZyYW1lYnVmZmVyKFxuICAgICAgZ2xDb25zdGFudCh0YXJnZXQpLCBhdHRhY2htZW50cywgeCwgeSwgd2lkdGgsIGhlaWdodFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBTZWxlY3RzIGEgY29sb3IgYnVmZmVyIGFzIHRoZSBzb3VyY2UgZm9yIHBpeGVscyBmb3Igc3Vic2VxdWVudCBjYWxscyB0b1xuICAvLyBjb3B5VGV4SW1hZ2UyRCwgY29weVRleFN1YkltYWdlMkQsIGNvcHlUZXhTdWJJbWFnZTNEIG9yIHJlYWRQaXhlbHMuXG4gIC8vIHNyY1xuICAvLyAgZ2wuQkFDSzogUmVhZHMgZnJvbSB0aGUgYmFjayBjb2xvciBidWZmZXIuXG4gIC8vICBnbC5OT05FOiBSZWFkcyBmcm9tIG5vIGNvbG9yIGJ1ZmZlci5cbiAgLy8gIGdsLkNPTE9SX0FUVEFDSE1FTlR7MC0xNX06IFJlYWRzIGZyb20gb25lIG9mIDE2IGNvbG9yIGF0dGFjaG1lbnQgYnVmZmVycy5cbiAgcmVhZEJ1ZmZlcih7c3JjfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgZ2wucmVhZEJ1ZmZlcihzcmMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBhbHBoYVNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQUxQSEFfU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9XG4gIGJsdWVTaXplKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0JMVUVfU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xlbnVtfVxuICBjb2xvckVuY29kaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0NPTE9SX0VOQ09ESU5HKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGVudW19XG4gIGNvbXBvbmVudFR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQ09NUE9ORU5UX1RZUEUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBkZXB0aFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfREVQVEhfU0laRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9XG4gIGdyZWVuU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9HUkVFTl9TSVpFKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtXZWJHTFJlbmRlcmJ1ZmZlcnxXZWJHTFRleHR1cmV9XG4gIG9iamVjdE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX05BTUUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMZW51bX1cbiAgb2JqZWN0VHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfVFlQRSk7XG4gIH1cblxuICAvLyBAcmV0dXJucyB7R0xpbnR9XG4gIHJlZFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfUkVEX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBzdGVuY2lsU2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9TVEVOQ0lMX1NJWkUpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBjdWJlTWFwRmFjZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0NVQkVfTUFQX0ZBQ0UpO1xuICB9XG5cbiAgLy8gQHJldHVybnMge0dMaW50fVxuICBsYXllcigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0xBWUVSKTtcbiAgfVxuXG4gIC8vIEByZXR1cm5zIHtHTGludH1cbiAgbGV2ZWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MRVZFTCk7XG4gIH1cblxuICBnZXRQYXJhbWV0ZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbHBoYVNpemU6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9BTFBIQV9TSVpFKSxcbiAgICAgIGJsdWVTaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQkxVRV9TSVpFKSxcbiAgICAgIGNvbG9yRW5jb2Rpbmc6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT0xPUl9FTkNPRElORyksXG4gICAgICBjb21wb25lbnRUeXBlOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQ09NUE9ORU5UX1RZUEUpLFxuICAgICAgZGVwdGhTaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfREVQVEhfU0laRSksXG4gICAgICBncmVlblNpemU6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9HUkVFTl9TSVpFKSxcbiAgICAgIG9iamVjdE5hbWU6IHRoaXMuZ2V0QXR0YWNobWVudFBhcmFtZXRlcihcbiAgICAgICAgV2ViR0wuRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfTkFNRSksXG4gICAgICBvYmplY3RUeXBlOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfT0JKRUNUX1RZUEUpLFxuICAgICAgcmVkU2l6ZTogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1JFRF9TSVpFKSxcbiAgICAgIHN0ZW5jaWxTaXplOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfU1RFTkNJTF9TSVpFKSxcbiAgICAgIGN1YmVNYXBGYWNlOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9DVUJFX01BUF9GQUNFKSxcbiAgICAgIGxheWVyOiB0aGlzLmdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICAgIFdlYkdMLkZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MQVlFUiksXG4gICAgICBsZXZlbDogdGhpcy5nZXRBdHRhY2htZW50UGFyYW1ldGVyKFxuICAgICAgICBXZWJHTC5GUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX1RFWFRVUkVfTEVWRUwpXG4gICAgfTtcbiAgfVxuXG4gIC8vIChPcGVuR0wgRVMgMy4wLjQgwqc2LjEuMTMsIHNpbWlsYXIgdG8gZ2xHZXRGcmFtZWJ1ZmZlckF0dGFjaG1lbnRQYXJhbWV0ZXJpdilcbiAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmb3IgdGhlIHBhc3NlZCBwbmFtZSBnaXZlbiB0aGUgdGFyZ2V0IGFuZCBhdHRhY2htZW50LlxuICAvLyBUaGUgdHlwZSByZXR1cm5lZCBpcyB0aGUgbmF0dXJhbCB0eXBlIGZvciB0aGUgcmVxdWVzdGVkIHBuYW1lOlxuICAvLyBwbmFtZSByZXR1cm5lZCB0eXBlXG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfQUxQSEFfU0laRSBHTGludFxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX0JMVUVfU0laRSAgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT0xPUl9FTkNPRElORyBHTGVudW1cbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9DT01QT05FTlRfVFlQRSBHTGVudW1cbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9ERVBUSF9TSVpFIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfR1JFRU5fU0laRSBHTGludFxuICAvLyBGUkFNRUJVRkZFUl9BVFRBQ0hNRU5UX09CSkVDVF9OQU1FICBXZWJHTFJlbmRlcmJ1ZmZlciBvciBXZWJHTFRleHR1cmVcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9PQkpFQ1RfVFlQRSAgR0xlbnVtXG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfUkVEX1NJWkUgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9TVEVOQ0lMX1NJWkUgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0NVQkVfTUFQX0ZBQ0UgIEdMaW50XG4gIC8vIEZSQU1FQlVGRkVSX0FUVEFDSE1FTlRfVEVYVFVSRV9MQVlFUiAgR0xpbnRcbiAgLy8gRlJBTUVCVUZGRVJfQVRUQUNITUVOVF9URVhUVVJFX0xFVkVMICBHTGludFxuICAvLyBJZiBwbmFtZSBpcyBub3QgaW4gdGhlIHRhYmxlIGFib3ZlLCBnZW5lcmF0ZXMgYW4gSU5WQUxJRF9FTlVNIGVycm9yLlxuICAvLyBJZiBhbiBPcGVuR0wgZXJyb3IgaXMgZ2VuZXJhdGVkLCByZXR1cm5zIG51bGwuXG4gIGdldEF0dGFjaG1lbnRQYXJhbWV0ZXIoe1xuICAgIHBuYW1lLFxuICAgIHRhcmdldCxcbiAgICBhdHRhY2htZW50XG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydFdlYkdMMihnbCk7XG4gICAgY29uc3QgdmFsdWUgPSBnbC5nZXRGcmFtZWJ1ZmZlckF0dGFjaG1lbnRQYXJhbWV0ZXIoXG4gICAgICB0YXJnZXQsIGF0dGFjaG1lbnQsIHBuYW1lXG4gICAgKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG4gIF9nZXRGcmFtZUJ1ZmZlclN0YXR1cyhzdGF0dXMpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBsZXQgZXJyb3I7XG4gICAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFOlxuICAgICAgZXJyb3IgPSAnU3VjY2Vzcy4gRnJhbWVidWZmZXIgaXMgY29ycmVjdGx5IHNldCB1cCc7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVDpcbiAgICAgIGVycm9yID0gYFRoZSBhdHRhY2htZW50IHR5cGVzIGFyZSBtaXNtYXRjaGVkIG9yIG5vdCBhbGwgZnJhbWVidWZmZXIgYXR0YWNobWVudCBwb2ludHMgYXJlIGZyYW1lYnVmZmVyIGF0dGFjaG1lbnQgY29tcGxldGUuYDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlQ6XG4gICAgICBlcnJvciA9IGBUaGVyZSBpcyBubyBhdHRhY2htZW50LmA7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfRElNRU5TSU9OUzpcbiAgICAgIGVycm9yID0gYEhlaWdodCBhbmQgd2lkdGggb2YgdGhlIGF0dGFjaG1lbnQgYXJlIG5vdCB0aGUgc2FtZS5gO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9VTlNVUFBPUlRFRDpcbiAgICAgIGVycm9yID0gYFRoZSBmb3JtYXQgb2YgdGhlIGF0dGFjaG1lbnQgaXMgbm90IHN1cHBvcnRlZCBvciBpZiBkZXB0aCBhbmQgc3RlbmNpbCBhdHRhY2htZW50cyBhcmUgbm90IHRoZSBzYW1lIHJlbmRlcmJ1ZmZlci5gO1xuICAgICAgYnJlYWs7XG4gICAgLy8gV2hlbiB1c2luZyBhIFdlYkdMIDIgY29udGV4dCwgdGhlIGZvbGxvd2luZyB2YWx1ZXMgY2FuIGJlIHJldHVybmVkXG4gICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01VTFRJU0FNUExFOlxuICAgICAgZXJyb3IgPSBgVGhlIHZhbHVlcyBvZiBnbC5SRU5ERVJCVUZGRVJfU0FNUExFUyBhcmUgZGlmZmVyZW50IGFtb25nIGF0dGFjaGVkIHJlbmRlcmJ1ZmZlcnMsIG9yIGFyZSBub24temVybyBpZiB0aGUgYXR0YWNoZWQgaW1hZ2VzIGFyZSBhIG1peCBvZiByZW5kZXJidWZmZXJzIGFuZCB0ZXh0dXJlcy5gO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGVycm9yID0gYEZyYW1lYnVmZmVyIGVycm9yICR7c3RhdHVzfWA7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGVycm9yO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xufVxuIl19