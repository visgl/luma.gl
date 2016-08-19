'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextureCube = exports.Texture2D = exports.Texture = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webglTypes = require('./webgl-types');

var _webglChecks = require('./webgl-checks');

var _buffer = require('./buffer');

var _buffer2 = _interopRequireDefault(_buffer);

var _framebuffer = require('./framebuffer');

var _framebuffer2 = _interopRequireDefault(_framebuffer);

var _utils = require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Texture = exports.Texture = function () {

  /* eslint-disable max-statements */
  function Texture(gl, _ref) {
    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)('texture') : _ref$id;
    var _ref$unpackFlipY = _ref.unpackFlipY;
    var unpackFlipY = _ref$unpackFlipY === undefined ? true : _ref$unpackFlipY;
    var _ref$magFilter = _ref.magFilter;
    var magFilter = _ref$magFilter === undefined ? _webglTypes.WebGL.NEAREST : _ref$magFilter;
    var _ref$minFilter = _ref.minFilter;
    var minFilter = _ref$minFilter === undefined ? _webglTypes.WebGL.NEAREST : _ref$minFilter;
    var _ref$wrapS = _ref.wrapS;
    var wrapS = _ref$wrapS === undefined ? _webglTypes.WebGL.CLAMP_TO_EDGE : _ref$wrapS;
    var _ref$wrapT = _ref.wrapT;
    var wrapT = _ref$wrapT === undefined ? _webglTypes.WebGL.CLAMP_TO_EDGE : _ref$wrapT;
    var _ref$target = _ref.target;
    var target = _ref$target === undefined ? _webglTypes.WebGL.TEXTURE_2D : _ref$target;
    var handle = _ref.handle;

    var opts = _objectWithoutProperties(_ref, ['id', 'unpackFlipY', 'magFilter', 'minFilter', 'wrapS', 'wrapT', 'target', 'handle']);

    _classCallCheck(this, Texture);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    this.handle = handle || gl.createTexture();
    // if (!this.handle) {
    // }

    this.id = id;
    this.gl = gl;
    this.target = target;
    this.hasFloatTexture = gl.getExtension('OES_texture_float');
    this.width = null;
    this.height = null;
    this.textureUnit = undefined;
    this.userData = {};

    this.setPixelStorageModes(_extends({}, opts, { unpackFlipY: unpackFlipY }));
    this.setParameters(_extends({}, opts, { magFilter: magFilter, minFilter: minFilter, wrapS: wrapS, wrapT: wrapT }));
  }
  /* eslint-enable max-statements */

  _createClass(Texture, [{
    key: 'delete',
    value: function _delete() {
      if (this.handle) {
        this.gl.deleteTexture(this.handle);
        this.handle = null;
      }
      return this;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'Texture(' + this.id + ',' + this.width + 'x' + this.height + ')';
    }
  }, {
    key: 'generateMipmap',
    value: function generateMipmap() {
      this.gl.bindTexture(this.target, this.handle);
      this.gl.generateMipmap(this.target);
      this.gl.bindTexture(this.target, null);
      return this;
    }

    /*
     * @param {*} pixels -
     *  null - create empty texture of specified format
     *  Typed array - init from image data in typed array
     *  Buffer|WebGLBuffer - (WEBGL2) init from image data in WebGLBuffer
     *  HTMLImageElement|Image - Inits with content of image. Auto width/height
     *  HTMLCanvasElement - Inits with contents of canvas. Auto width/height
     *  HTMLVideoElement - Creates video texture. Auto width/height
     *
     * @param {GLint} width -
     * @param {GLint} height -
     * @param {GLint} mipMapLevel -
     * @param {GLenum} format - format of image data.
     * @param {GLenum} type
     *  - format of array (autodetect from type) or
     *  - (WEBGL2) format of buffer
     * @param {Number} offset - (WEBGL2) offset from start of buffer
     * @param {GLint} border - must be 0.
     */
    /* eslint-disable max-len, max-statements */

  }, {
    key: 'setImageData',
    value: function setImageData(_ref2) {
      var _ref2$target = _ref2.target;
      var target = _ref2$target === undefined ? this.target : _ref2$target;
      var _ref2$pixels = _ref2.pixels;
      var pixels = _ref2$pixels === undefined ? null : _ref2$pixels;
      var _ref2$data = _ref2.data;
      var data = _ref2$data === undefined ? null : _ref2$data;
      var width = _ref2.width;
      var height = _ref2.height;
      var _ref2$mipmapLevel = _ref2.mipmapLevel;
      var mipmapLevel = _ref2$mipmapLevel === undefined ? 0 : _ref2$mipmapLevel;
      var _ref2$format = _ref2.format;
      var format = _ref2$format === undefined ? _webglTypes.WebGL.RGBA : _ref2$format;
      var type = _ref2.type;
      var _ref2$offset = _ref2.offset;
      var offset = _ref2$offset === undefined ? 0 : _ref2$offset;
      var _ref2$border = _ref2.border;
      var border = _ref2$border === undefined ? 0 : _ref2$border;

      var opts = _objectWithoutProperties(_ref2, ['target', 'pixels', 'data', 'width', 'height', 'mipmapLevel', 'format', 'type', 'offset', 'border']);

      var gl = this.gl;


      pixels = pixels || data;

      // Support ndarrays
      if (pixels && pixels.data) {
        var ndarray = pixels;
        pixels = ndarray.data;
        width = ndarray.shape[0];
        height = ndarray.shape[1];
      }

      gl.bindTexture(this.target, this.handle);

      if (pixels === null) {

        // Create an minimal texture
        width = width || 1;
        height = height || 1;
        type = type || _webglTypes.WebGL.UNSIGNED_BYTE;
        // pixels = new Uint8Array([255, 0, 0, 1]);
        gl.texImage2D(target, mipmapLevel, format, width, height, border, format, type, pixels);
        this.width = width;
        this.height = height;
      } else if (ArrayBuffer.isView(pixels)) {

        // Create from a typed array
        (0, _assert2.default)(width > 0 && height > 0, 'Texture2D: Width and height required');
        type = type || (0, _webglChecks.glTypeFromArray)(pixels);
        // TODO - WebGL2 check?
        if (type === gl.FLOAT && !this.hasFloatTexture) {
          throw new Error('floating point textures are not supported.');
        }
        gl.texImage2D(target, mipmapLevel, format, width, height, border, format, type, pixels);
        this.width = width;
        this.height = height;
      } else if (pixels instanceof _webglTypes.WebGLBuffer || pixels instanceof _buffer2.default) {

        // WebGL2 allows us to create texture directly from a WebGL buffer
        (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext, 'Requires WebGL2');
        type = type || _webglTypes.WebGL.UNSIGNED_BYTE;
        // This texImage2D signature uses currently bound GL_PIXEL_UNPACK_BUFFER
        var buffer = _buffer2.default.makeFrom(pixels);
        gl.bindBuffer(_webglTypes.WebGL.PIXEL_UNPACK_BUFFER, buffer.handle);
        gl.texImage2D(target, mipmapLevel, format, width, height, border, format, type, offset);
        gl.bindBuffer(_webglTypes.WebGL.GL_PIXEL_UNPACK_BUFFER, null);
        this.width = width;
        this.height = height;
      } else {

        var imageSize = this._deduceImageSize(pixels);
        // Assume pixels is a browser supported object (ImageData, Canvas, ...)
        (0, _assert2.default)(width === undefined && height === undefined, 'Texture2D.setImageData: Width and height must not be provided');
        type = type || _webglTypes.WebGL.UNSIGNED_BYTE;
        gl.texImage2D(target, mipmapLevel, format, format, type, pixels);
        this.width = imageSize.width;
        this.height = imageSize.height;
      }

      gl.bindTexture(this.target, null);

      return this;
    }

    /* global ImageData, HTMLImageElement, HTMLCanvasElement, HTMLVideoElement */

  }, {
    key: '_deduceImageSize',
    value: function _deduceImageSize(image) {
      if (typeof ImageData !== 'undefined' && image instanceof ImageData) {
        return { width: image.width, height: image.height };
      } else if (typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement) {
        return { width: image.naturalWidth, height: image.naturalHeight };
      } else if (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) {
        return { width: image.width, height: image.height };
      } else if (typeof HTMLVideoElement !== 'undefined' && image instanceof HTMLVideoElement) {
        return { width: image.videoWidth, height: image.videoHeight };
      }
      throw new Error('Unknown image data format. Failed to deduce image size');
    }

    /**
     * Batch update pixel storage modes
     * @param {GLint} packAlignment - Packing of pixel data in memory (1,2,4,8)
     * @param {GLint} unpackAlignment - Unpacking pixel data from memory(1,2,4,8)
     * @param {GLboolean} unpackFlipY -  Flip source data along its vertical axis
     * @param {GLboolean} unpackPremultiplyAlpha -
     *   Multiplies the alpha channel into the other color channels
     * @param {GLenum} unpackColorspaceConversion -
     *   Default color space conversion or no color space conversion.
     *
     * @param {GLint} packRowLength -
     *  Number of pixels in a row.
     * @param {} packSkipPixels -
     *   Number of pixels skipped before the first pixel is written into memory.
     * @param {} packSkipRows -
     *   Number of rows of pixels skipped before first pixel is written to memory.
     * @param {} unpackRowLength -
     *   Number of pixels in a row.
     * @param {} unpackImageHeight -
     *   Image height used for reading pixel data from memory
     * @param {} unpackSkipPixels -
     *   Number of pixel images skipped before first pixel is read from memory
     * @param {} unpackSkipRows -
     *   Number of rows of pixels skipped before first pixel is read from memory
     * @param {} unpackSkipImages -
     *   Number of pixel images skipped before first pixel is read from memory
     */
    /* eslint-disable complexity, max-statements */

  }, {
    key: 'setPixelStorageModes',
    value: function setPixelStorageModes() {
      var _ref3 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var packAlignment = _ref3.packAlignment;
      var unpackAlignment = _ref3.unpackAlignment;
      var unpackFlipY = _ref3.unpackFlipY;
      var unpackPremultiplyAlpha = _ref3.unpackPremultiplyAlpha;
      var unpackColorspaceConversion = _ref3.unpackColorspaceConversion;
      var packRowLength = _ref3.packRowLength;
      var packSkipPixels = _ref3.packSkipPixels;
      var packSkipRows = _ref3.packSkipRows;
      var unpackRowLength = _ref3.unpackRowLength;
      var unpackImageHeight = _ref3.unpackImageHeight;
      var unpackSkipPixels = _ref3.unpackSkipPixels;
      var unpackSkipRows = _ref3.unpackSkipRows;
      var unpackSkipImages = _ref3.unpackSkipImages;
      var gl = this.gl;


      gl.bindTexture(this.target, this.handle);

      if (packAlignment) {
        gl.pixelStorei(gl.PACK_ALIGNMENT, packAlignment);
      }
      if (unpackAlignment) {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
      }
      if (unpackFlipY) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, unpackFlipY);
      }
      if (unpackPremultiplyAlpha) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, unpackPremultiplyAlpha);
      }
      if (unpackColorspaceConversion) {
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, unpackColorspaceConversion);
      }

      // WEBGL2
      if (packRowLength) {
        gl.pixelStorei(gl.PACK_ROW_LENGTH, packRowLength);
      }
      if (packSkipPixels) {
        gl.pixelStorei(gl.PACK_SKIP_PIXELS, packSkipPixels);
      }
      if (packSkipRows) {
        gl.pixelStorei(gl.PACK_SKIP_ROWS, packSkipRows);
      }
      if (unpackRowLength) {
        gl.pixelStorei(gl.UNPACK_ROW_LENGTH, unpackRowLength);
      }
      if (unpackImageHeight) {
        gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, unpackImageHeight);
      }
      if (unpackSkipPixels) {
        gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, unpackSkipPixels);
      }
      if (unpackSkipRows) {
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, unpackSkipRows);
      }
      if (unpackSkipImages) {
        gl.pixelStorei(gl.UNPACK_SKIP_IMAGES, unpackSkipImages);
      }

      gl.bindTexture(this.target, null);
      return this;
    }
    /* eslint-enable complexity, max-statements */

    /**
     * Batch update sampler settings
     *
     * @param {GLenum} magFilter - texture magnification filter.
     * @param {GLenum} minFilter - texture minification filter
     * @param {GLenum} wrapS - texture wrapping function for texture coordinate s.
     * @param {GLenum} wrapT - texture wrapping function for texture coordinate t.
     * WEBGL2 only:
     * @param {GLenum} wrapR - texture wrapping function for texture coordinate r.
     * @param {GLenum} compareFunc - texture comparison function.
     * @param {GLenum} compareMode - texture comparison mode.
     * @param {GLfloat} minLOD - minimum level-of-detail value.
     * @param {GLfloat} maxLOD - maximum level-of-detail value.
     * @param {GLfloat} baseLevel - Texture mipmap level
     * @param {GLfloat} maxLevel - Maximum texture mipmap array level
     */
    /* eslint-disable complexity, max-statements */

  }, {
    key: 'setParameters',
    value: function setParameters(_ref4) {
      var magFilter = _ref4.magFilter;
      var minFilter = _ref4.minFilter;
      var wrapS = _ref4.wrapS;
      var wrapT = _ref4.wrapT;
      var wrapR = _ref4.wrapR;
      var baseLevel = _ref4.baseLevel;
      var maxLevel = _ref4.maxLevel;
      var minLOD = _ref4.minLOD;
      var maxLOD = _ref4.maxLOD;
      var compareFunc = _ref4.compareFunc;
      var compareMode = _ref4.compareMode;
      var gl = this.gl;

      gl.bindTexture(this.target, this.handle);

      if (magFilter) {
        gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, magFilter);
      }
      if (minFilter) {
        gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
      }
      if (wrapS) {
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrapS);
      }
      if (wrapT) {
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrapT);
      }
      // WEBGL2
      if (wrapR) {
        gl.texParameteri(this.target, gl.TEXTURE_WRAP_R, wrapR);
      }
      if (baseLevel) {
        gl.texParameteri(this.target, gl.TEXTURE_BASE_LEVEL, baseLevel);
      }
      if (maxLevel) {
        gl.texParameteri(this.target, gl.TEXTURE_MAX_LEVEL, maxLevel);
      }
      if (compareFunc) {
        gl.texParameteri(this.target, gl.TEXTURE_COMPARE_FUNC, compareFunc);
      }
      if (compareMode) {
        gl.texParameteri(this.target, gl.TEXTURE_COMPARE_MODE, compareMode);
      }
      if (minLOD) {
        gl.texParameterf(this.target, gl.TEXTURE_MIN_LOD, minLOD);
      }
      if (maxLOD) {
        gl.texParameterf(this.target, gl.TEXTURE_MAX_LOD, maxLOD);
      }

      gl.bindTexture(this.target, null);
      return this;
    }
    /* eslint-enable complexity, max-statements */

  }, {
    key: 'getParameters',
    value: function getParameters() {
      var gl = this.gl;

      gl.bindTexture(this.target, this.handle);
      var webglParams = {
        magFilter: gl.getTexParameter(this.target, gl.TEXTURE_MAG_FILTER),
        minFilter: gl.getTexParameter(this.target, gl.TEXTURE_MIN_FILTER),
        wrapS: gl.getTexParameter(this.target, gl.TEXTURE_WRAP_S),
        wrapT: gl.getTexParameter(this.target, gl.TEXTURE_WRAP_T)
      };
      gl.bindTexture(this.target, null);
      return webglParams;
    }

    // Deprecated methods

  }, {
    key: 'image2D',
    value: function image2D(_ref5) {
      var pixels = _ref5.pixels;
      var _ref5$format = _ref5.format;
      var format = _ref5$format === undefined ? _webglTypes.WebGL.RGBA : _ref5$format;
      var _ref5$type = _ref5.type;
      var type = _ref5$type === undefined ? _webglTypes.WebGL.UNSIGNED_BYTE : _ref5$type;

      // TODO - WebGL2 check?
      if (type === _webglTypes.WebGL.FLOAT && !this.hasFloatTexture) {
        throw new Error('floating point textures are not supported.');
      }

      this.gl.bindTexture(this.target, this.handle);
      this.gl.texImage2D(_webglTypes.WebGL.TEXTURE_2D, 0, format, format, type, pixels);
      this.gl.bindTexture(this.target, null);
      return this;
    }
  }, {
    key: 'update',
    value: function update(opts) {
      throw new Error('Texture.update() is deprecated()');
    }
  }]);

  return Texture;
}();

var Texture2D = exports.Texture2D = function (_Texture) {
  _inherits(Texture2D, _Texture);

  _createClass(Texture2D, null, [{
    key: 'makeFrom',
    value: function makeFrom(gl) {
      var object = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return object instanceof Texture2D ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Texture2D(gl, { handle: object.handle || object });
    }
  }, {
    key: 'makeFromSolidColor',
    value: function makeFromSolidColor(gl, _ref6) {
      var _ref7 = _slicedToArray(_ref6, 4);

      var _ref7$ = _ref7[0];
      var r = _ref7$ === undefined ? 0 : _ref7$;
      var _ref7$2 = _ref7[1];
      var g = _ref7$2 === undefined ? 0 : _ref7$2;
      var _ref7$3 = _ref7[2];
      var b = _ref7$3 === undefined ? 0 : _ref7$3;
      var _ref7$4 = _ref7[3];
      var a = _ref7$4 === undefined ? 1 : _ref7$4;

      return new Texture2D(gl, {
        pixels: new Uint8Array([r, g, b, a]),
        width: 1,
        format: gl.RGBA,
        magFilter: gl.NEAREST,
        minFilter: gl.NEAREST
      });
    }
  }, {
    key: 'makeFromPixelArray',
    value: function makeFromPixelArray(gl, _ref8) {
      var dataArray = _ref8.dataArray;
      var format = _ref8.format;
      var width = _ref8.width;
      var height = _ref8.height;

      var opts = _objectWithoutProperties(_ref8, ['dataArray', 'format', 'width', 'height']);

      // Don't need to do this if the data is already in a typed array
      var dataTypedArray = new Uint8Array(dataArray);
      return new Texture2D(gl, _extends({
        pixels: dataTypedArray,
        width: 1,
        format: gl.RGBA
      }, opts));
    }

    /**
     * @classdesc
     * 2D WebGL Texture
     *
     * @class
     * Constructor will initialize your texture.
     * @param {WebGLRenderingContext} gl - gl context
     * @param {Image||ArrayBuffer||null} opts.data=
     * @param {GLint} width - width of texture
     * @param {GLint} height - height of texture
     */

  }]);

  function Texture2D(gl) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Texture2D);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Texture2D).call(this, gl, _extends({}, opts, { target: gl.TEXTURE_2D })));

    _this.width = null;
    _this.height = null;
    Object.seal(_this);

    _this.setImageData(opts);
    if (opts.generateMipmap) {
      _this.generateMipmap();
    }
    return _this;
  }

  // target cannot be modified by bind:
  // textures are special because when you first bind them to a target,
  // they get special information. When you first bind a texture as a
  // GL_TEXTURE_2D, you are actually setting special state in the texture.
  // You are saying that this texture is a 2D texture.
  // And it will always be a 2D texture; this state cannot be changed ever.
  // If you have a texture that was first bound as a GL_TEXTURE_2D,
  // you must always bind it as a GL_TEXTURE_2D;
  // attempting to bind it as GL_TEXTURE_1D will give rise to an error
  // (while run-time).

  _createClass(Texture2D, [{
    key: 'bind',
    value: function bind() {
      var textureUnit = arguments.length <= 0 || arguments[0] === undefined ? this.textureUnit : arguments[0];
      var gl = this.gl;

      if (textureUnit === undefined) {
        throw new Error('Texture.bind: must specify texture unit');
      }
      this.textureUnit = textureUnit;
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(this.target, this.handle);
      return textureUnit;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var gl = this.gl;

      if (this.textureUnit === undefined) {
        throw new Error('Texture.unbind: texture unit not specified');
      }
      gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
      gl.bindTexture(this.target, null);
      return this.textureUnit;
    }
  }, {
    key: 'getActiveUnit',
    value: function getActiveUnit() {
      return this.gl.getParameter(_webglTypes.WebGL.ACTIVE_TEXTURE) - _webglTypes.WebGL.TEXTURE0;
    }

    // WebGL2

  }, {
    key: 'setPixels',
    value: function setPixels(_ref9) {
      var buffer = _ref9.buffer;
      var _ref9$offset = _ref9.offset;
      var offset = _ref9$offset === undefined ? 0 : _ref9$offset;
      var _ref9$width = _ref9.width;
      var width = _ref9$width === undefined ? null : _ref9$width;
      var _ref9$height = _ref9.height;
      var height = _ref9$height === undefined ? null : _ref9$height;
      var _ref9$mipmapLevel = _ref9.mipmapLevel;
      var mipmapLevel = _ref9$mipmapLevel === undefined ? 0 : _ref9$mipmapLevel;
      var _ref9$internalFormat = _ref9.internalFormat;
      var internalFormat = _ref9$internalFormat === undefined ? _webglTypes.WebGL.RGBA : _ref9$internalFormat;
      var _ref9$format = _ref9.format;
      var format = _ref9$format === undefined ? _webglTypes.WebGL.RGBA : _ref9$format;
      var _ref9$type = _ref9.type;
      var type = _ref9$type === undefined ? _webglTypes.WebGL.UNSIGNED_BYTE : _ref9$type;
      var _ref9$border = _ref9.border;
      var border = _ref9$border === undefined ? 0 : _ref9$border;

      var opts = _objectWithoutProperties(_ref9, ['buffer', 'offset', 'width', 'height', 'mipmapLevel', 'internalFormat', 'format', 'type', 'border']);

      var gl = this.gl;

      // This signature of texImage2D uses currently bound GL_PIXEL_UNPACK_BUFFER

      buffer = _buffer2.default.makeFrom(buffer);
      gl.bindBuffer(_webglTypes.WebGL.PIXEL_UNPACK_BUFFER, buffer.target);
      // And as always, we must also bind the texture itself
      this.bind();

      gl.texImage2D(gl.TEXTURE_2D, mipmapLevel, format, width, height, border, format, type, buffer.target);

      this.unbind();
      gl.bindBuffer(_webglTypes.WebGL.GL_PIXEL_UNPACK_BUFFER, null);
      return this;
    }
  }, {
    key: 'setImageDataFromCompressedBuffer',
    value: function setImageDataFromCompressedBuffer(_ref10) {
      var buffer = _ref10.buffer;
      var _ref10$offset = _ref10.offset;
      var offset = _ref10$offset === undefined ? 0 : _ref10$offset;
      var _ref10$width = _ref10.width;
      var width = _ref10$width === undefined ? null : _ref10$width;
      var _ref10$height = _ref10.height;
      var height = _ref10$height === undefined ? null : _ref10$height;
      var _ref10$mipmapLevel = _ref10.mipmapLevel;
      var mipmapLevel = _ref10$mipmapLevel === undefined ? 0 : _ref10$mipmapLevel;
      var _ref10$internalFormat = _ref10.internalFormat;
      var internalFormat = _ref10$internalFormat === undefined ? _webglTypes.WebGL.RGBA : _ref10$internalFormat;
      var _ref10$format = _ref10.format;
      var format = _ref10$format === undefined ? _webglTypes.WebGL.RGBA : _ref10$format;
      var _ref10$type = _ref10.type;
      var type = _ref10$type === undefined ? _webglTypes.WebGL.UNSIGNED_BYTE : _ref10$type;
      var _ref10$border = _ref10.border;
      var border = _ref10$border === undefined ? 0 : _ref10$border;

      var opts = _objectWithoutProperties(_ref10, ['buffer', 'offset', 'width', 'height', 'mipmapLevel', 'internalFormat', 'format', 'type', 'border']);

      var gl = this.gl;

      gl.compressedTexImage2D(this.target, mipmapLevel, internalFormat, width, height, border, buffer);
      // gl.compressedTexSubImage2D(target,
      //   level, xoffset, yoffset, width, height, format, ArrayBufferView? pixels);
      return this;
    }

    /**
     * Defines a two-dimensional texture image or cube-map texture image with
     * pixels from the current framebuffer (rather than from client memory).
     * (gl.copyTexImage2D wrapper)
     */

  }, {
    key: 'copyImageFromFramebuffer',
    value: function copyImageFromFramebuffer(_ref11) {
      var framebuffer = _ref11.framebuffer;
      var _ref11$offset = _ref11.offset;
      var offset = _ref11$offset === undefined ? 0 : _ref11$offset;
      var x = _ref11.x;
      var y = _ref11.y;
      var width = _ref11.width;
      var height = _ref11.height;
      var _ref11$mipmapLevel = _ref11.mipmapLevel;
      var mipmapLevel = _ref11$mipmapLevel === undefined ? 0 : _ref11$mipmapLevel;
      var _ref11$internalFormat = _ref11.internalFormat;
      var internalFormat = _ref11$internalFormat === undefined ? _webglTypes.WebGL.RGBA : _ref11$internalFormat;
      var _ref11$type = _ref11.type;
      var type = _ref11$type === undefined ? _webglTypes.WebGL.UNSIGNED_BYTE : _ref11$type;
      var _ref11$border = _ref11.border;
      var border = _ref11$border === undefined ? 0 : _ref11$border;

      var opts = _objectWithoutProperties(_ref11, ['framebuffer', 'offset', 'x', 'y', 'width', 'height', 'mipmapLevel', 'internalFormat', 'type', 'border']);

      var gl = this.gl;

      framebuffer = _framebuffer2.default.makeFrom(framebuffer);
      framebuffer.bind();

      // target
      this.bind();
      gl.copyTexImage2D(this.target, mipmapLevel, internalFormat, x, y, width, height, border);
      this.unbind();

      framebuffer.unbind();
    }
  }, {
    key: 'copySubImage',
    value: function copySubImage(_ref12) {
      // if (pixels instanceof ArrayBufferView) {
      //   gl.texSubImage2D(target, level, x, y, width, height, format, type, pixels);
      // }
      // gl.texSubImage2D(target, level, x, y, format, type, ? pixels);
      // gl.texSubImage2D(target, level, x, y, format, type, HTMLImageElement pixels);
      // gl.texSubImage2D(target, level, x, y, format, type, HTMLCanvasElement pixels);
      // gl.texSubImage2D(target, level, x, y, format, type, HTMLVideoElement pixels);
      // // Additional signature in a WebGL 2 context:
      // gl.texSubImage2D(target, level, x, y, format, type, GLintptr offset);

      var pixels = _ref12.pixels;
      var _ref12$offset = _ref12.offset;
      var offset = _ref12$offset === undefined ? 0 : _ref12$offset;
      var x = _ref12.x;
      var y = _ref12.y;
      var width = _ref12.width;
      var height = _ref12.height;
      var _ref12$mipmapLevel = _ref12.mipmapLevel;
      var mipmapLevel = _ref12$mipmapLevel === undefined ? 0 : _ref12$mipmapLevel;
      var _ref12$internalFormat = _ref12.internalFormat;
      var internalFormat = _ref12$internalFormat === undefined ? _webglTypes.WebGL.RGBA : _ref12$internalFormat;
      var _ref12$type = _ref12.type;
      var type = _ref12$type === undefined ? _webglTypes.WebGL.UNSIGNED_BYTE : _ref12$type;
      var _ref12$border = _ref12.border;
      var border = _ref12$border === undefined ? 0 : _ref12$border;
    }
  }]);

  return Texture2D;
}(Texture);

var TextureCube = exports.TextureCube = function (_Texture2) {
  _inherits(TextureCube, _Texture2);

  _createClass(TextureCube, null, [{
    key: 'makeFrom',
    value: function makeFrom(gl) {
      var object = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return object instanceof TextureCube ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new TextureCube(gl, { handle: object.handle || object });
    }
  }]);

  function TextureCube(gl) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, TextureCube);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(TextureCube).call(this, gl, _extends({}, opts, { target: gl.TEXTURE_CUBE_MAP })));

    _this2.setCubeMapImageData(opts);
    return _this2;
  }

  _createClass(TextureCube, [{
    key: 'bind',
    value: function bind() {
      var _ref13 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var index = _ref13.index;
      var gl = this.gl;

      if (index !== undefined) {
        gl.activeTexture(gl.TEXTURE0 + index);
      }
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.handle);
      if (index === undefined) {
        var result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
        return result;
      }
      return index;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var gl = this.gl;

      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }

    /* eslint-disable max-statements, max-len */

  }, {
    key: 'setCubeMapImageData',
    value: function setCubeMapImageData(_ref14) {
      var width = _ref14.width;
      var height = _ref14.height;
      var pixels = _ref14.pixels;
      var data = _ref14.data;
      var _ref14$border = _ref14.border;
      var border = _ref14$border === undefined ? 0 : _ref14$border;
      var _ref14$format = _ref14.format;
      var format = _ref14$format === undefined ? _webglTypes.WebGL.RGBA : _ref14$format;
      var _ref14$type = _ref14.type;
      var type = _ref14$type === undefined ? _webglTypes.WebGL.UNSIGNED_BYTE : _ref14$type;
      var _ref14$generateMipmap = _ref14.generateMipmap;
      var generateMipmap = _ref14$generateMipmap === undefined ? false : _ref14$generateMipmap;

      var opts = _objectWithoutProperties(_ref14, ['width', 'height', 'pixels', 'data', 'border', 'format', 'type', 'generateMipmap']);

      var gl = this.gl;

      pixels = pixels || data;
      this.bind();
      if (this.width || this.height) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, format, width, height, border, format, type, pixels.pos.x);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, format, width, height, border, format, type, pixels.pos.y);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, format, width, height, border, format, type, pixels.pos.z);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, format, width, height, border, format, type, pixels.neg.x);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, format, width, height, border, format, type, pixels.neg.y);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, format, width, height, border, format, type, pixels.neg.z);
      } else {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, format, format, type, pixels.pos.x);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, format, format, type, pixels.pos.y);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, format, format, type, pixels.pos.z);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, format, format, type, pixels.neg.x);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, format, format, type, pixels.neg.y);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, format, format, type, pixels.neg.z);
      }

      this.unbind();

      if (generateMipmap) {
        this.generateMipmap();
      }
      return this;
    }
  }]);

  return TextureCube;
}(Texture);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC90ZXh0dXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFFQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0lBRWEsTyxXQUFBLE87O0FBRVg7QUFDQSxtQkFBWSxFQUFaLFFBVUc7QUFBQSx1QkFURCxFQVNDO0FBQUEsUUFURCxFQVNDLDJCQVRJLGdCQUFJLFNBQUosQ0FTSjtBQUFBLGdDQVJELFdBUUM7QUFBQSxRQVJELFdBUUMsb0NBUmEsSUFRYjtBQUFBLDhCQVBELFNBT0M7QUFBQSxRQVBELFNBT0Msa0NBUFcsa0JBQU0sT0FPakI7QUFBQSw4QkFORCxTQU1DO0FBQUEsUUFORCxTQU1DLGtDQU5XLGtCQUFNLE9BTWpCO0FBQUEsMEJBTEQsS0FLQztBQUFBLFFBTEQsS0FLQyw4QkFMTyxrQkFBTSxhQUtiO0FBQUEsMEJBSkQsS0FJQztBQUFBLFFBSkQsS0FJQyw4QkFKTyxrQkFBTSxhQUliO0FBQUEsMkJBSEQsTUFHQztBQUFBLFFBSEQsTUFHQywrQkFIUSxrQkFBTSxVQUdkO0FBQUEsUUFGRCxNQUVDLFFBRkQsTUFFQzs7QUFBQSxRQURFLElBQ0Y7O0FBQUE7O0FBQ0Qsa0RBQTRCLEVBQTVCOztBQUVBLFNBQUssTUFBTCxHQUFjLFVBQVUsR0FBRyxhQUFILEVBQXhCO0FBQ0E7QUFDQTs7QUFFQSxTQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsU0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxTQUFLLGVBQUwsR0FBdUIsR0FBRyxZQUFILENBQWdCLG1CQUFoQixDQUF2QjtBQUNBLFNBQUssS0FBTCxHQUFhLElBQWI7QUFDQSxTQUFLLE1BQUwsR0FBYyxJQUFkO0FBQ0EsU0FBSyxXQUFMLEdBQW1CLFNBQW5CO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLEVBQWhCOztBQUVBLFNBQUssb0JBQUwsY0FBOEIsSUFBOUIsSUFB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LE1BRGIsRUFDcUIsSUFEckIsRUFDMkIsT0FBTyxHQUFQLENBQVcsQ0FEdEM7QUFFQSxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFqQixFQUNFLENBREYsRUFDSyxNQURMLEVBQ2EsTUFEYixFQUNxQixJQURyQixFQUMyQixPQUFPLEdBQVAsQ0FBVyxDQUR0QztBQUVBLFdBQUcsVUFBSCxDQUFjLEdBQUcsMkJBQWpCLEVBQ0UsQ0FERixFQUNLLE1BREwsRUFDYSxNQURiLEVBQ3FCLElBRHJCLEVBQzJCLE9BQU8sR0FBUCxDQUFXLENBRHRDO0FBRUEsV0FBRyxVQUFILENBQWMsR0FBRywyQkFBakIsRUFDRSxDQURGLEVBQ0ssTUFETCxFQUNhLE1BRGIsRUFDcUIsSUFEckIsRUFDMkIsT0FBTyxHQUFQLENBQVcsQ0FEdEM7QUFFQSxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFqQixFQUNFLENBREYsRUFDSyxNQURMLEVBQ2EsTUFEYixFQUNxQixJQURyQixFQUMyQixPQUFPLEdBQVAsQ0FBVyxDQUR0QztBQUVEOztBQUVELFdBQUssTUFBTDs7QUFFQSxVQUFJLGNBQUosRUFBb0I7QUFDbEIsYUFBSyxjQUFMO0FBQ0Q7QUFDRCxhQUFPLElBQVA7QUFDRDs7OztFQWxGOEIsTyIsImZpbGUiOiJ0ZXh0dXJlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtXZWJHTCwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgV2ViR0xCdWZmZXJ9XG4gIGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQsIGdsVHlwZUZyb21BcnJheX0gZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IEJ1ZmZlciBmcm9tICcuL2J1ZmZlcic7XG5pbXBvcnQgRnJhbWVidWZmZXIgZnJvbSAnLi9mcmFtZWJ1ZmZlcic7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgY2xhc3MgVGV4dHVyZSB7XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgY29uc3RydWN0b3IoZ2wsIHtcbiAgICBpZCA9IHVpZCgndGV4dHVyZScpLFxuICAgIHVucGFja0ZsaXBZID0gdHJ1ZSxcbiAgICBtYWdGaWx0ZXIgPSBXZWJHTC5ORUFSRVNULFxuICAgIG1pbkZpbHRlciA9IFdlYkdMLk5FQVJFU1QsXG4gICAgd3JhcFMgPSBXZWJHTC5DTEFNUF9UT19FREdFLFxuICAgIHdyYXBUID0gV2ViR0wuQ0xBTVBfVE9fRURHRSxcbiAgICB0YXJnZXQgPSBXZWJHTC5URVhUVVJFXzJELFxuICAgIGhhbmRsZSxcbiAgICAuLi5vcHRzXG4gIH0pIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gICAgdGhpcy5oYW5kbGUgPSBoYW5kbGUgfHwgZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIC8vIGlmICghdGhpcy5oYW5kbGUpIHtcbiAgICAvLyB9XG5cbiAgICB0aGlzLmlkID0gaWQ7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgIHRoaXMuaGFzRmxvYXRUZXh0dXJlID0gZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9mbG9hdCcpO1xuICAgIHRoaXMud2lkdGggPSBudWxsO1xuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLnRleHR1cmVVbml0ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcblxuICAgIHRoaXMuc2V0UGl4ZWxTdG9yYWdlTW9kZXMoey4uLm9wdHMsIHVucGFja0ZsaXBZfSk7XG4gICAgdGhpcy5zZXRQYXJhbWV0ZXJzKHsuLi5vcHRzLCBtYWdGaWx0ZXIsIG1pbkZpbHRlciwgd3JhcFMsIHdyYXBUfSk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIGRlbGV0ZSgpIHtcbiAgICBpZiAodGhpcy5oYW5kbGUpIHtcbiAgICAgIHRoaXMuZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLmhhbmRsZSk7XG4gICAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIGBUZXh0dXJlKCR7dGhpcy5pZH0sJHt0aGlzLndpZHRofXgke3RoaXMuaGVpZ2h0fSlgO1xuICB9XG5cbiAgZ2VuZXJhdGVNaXBtYXAoKSB7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgdGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuZ2wuZ2VuZXJhdGVNaXBtYXAodGhpcy50YXJnZXQpO1xuICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQHBhcmFtIHsqfSBwaXhlbHMgLVxuICAgKiAgbnVsbCAtIGNyZWF0ZSBlbXB0eSB0ZXh0dXJlIG9mIHNwZWNpZmllZCBmb3JtYXRcbiAgICogIFR5cGVkIGFycmF5IC0gaW5pdCBmcm9tIGltYWdlIGRhdGEgaW4gdHlwZWQgYXJyYXlcbiAgICogIEJ1ZmZlcnxXZWJHTEJ1ZmZlciAtIChXRUJHTDIpIGluaXQgZnJvbSBpbWFnZSBkYXRhIGluIFdlYkdMQnVmZmVyXG4gICAqICBIVE1MSW1hZ2VFbGVtZW50fEltYWdlIC0gSW5pdHMgd2l0aCBjb250ZW50IG9mIGltYWdlLiBBdXRvIHdpZHRoL2hlaWdodFxuICAgKiAgSFRNTENhbnZhc0VsZW1lbnQgLSBJbml0cyB3aXRoIGNvbnRlbnRzIG9mIGNhbnZhcy4gQXV0byB3aWR0aC9oZWlnaHRcbiAgICogIEhUTUxWaWRlb0VsZW1lbnQgLSBDcmVhdGVzIHZpZGVvIHRleHR1cmUuIEF1dG8gd2lkdGgvaGVpZ2h0XG4gICAqXG4gICAqIEBwYXJhbSB7R0xpbnR9IHdpZHRoIC1cbiAgICogQHBhcmFtIHtHTGludH0gaGVpZ2h0IC1cbiAgICogQHBhcmFtIHtHTGludH0gbWlwTWFwTGV2ZWwgLVxuICAgKiBAcGFyYW0ge0dMZW51bX0gZm9ybWF0IC0gZm9ybWF0IG9mIGltYWdlIGRhdGEuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSB0eXBlXG4gICAqICAtIGZvcm1hdCBvZiBhcnJheSAoYXV0b2RldGVjdCBmcm9tIHR5cGUpIG9yXG4gICAqICAtIChXRUJHTDIpIGZvcm1hdCBvZiBidWZmZXJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9mZnNldCAtIChXRUJHTDIpIG9mZnNldCBmcm9tIHN0YXJ0IG9mIGJ1ZmZlclxuICAgKiBAcGFyYW0ge0dMaW50fSBib3JkZXIgLSBtdXN0IGJlIDAuXG4gICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuLCBtYXgtc3RhdGVtZW50cyAqL1xuICBzZXRJbWFnZURhdGEoe1xuICAgIHRhcmdldCA9IHRoaXMudGFyZ2V0LFxuICAgIHBpeGVscyA9IG51bGwsXG4gICAgZGF0YSA9IG51bGwsXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIG1pcG1hcExldmVsID0gMCxcbiAgICBmb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIHR5cGUsXG4gICAgb2Zmc2V0ID0gMCxcbiAgICBib3JkZXIgPSAwLFxuICAgIC4uLm9wdHNcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuXG4gICAgcGl4ZWxzID0gcGl4ZWxzIHx8IGRhdGE7XG5cbiAgICAvLyBTdXBwb3J0IG5kYXJyYXlzXG4gICAgaWYgKHBpeGVscyAmJiBwaXhlbHMuZGF0YSkge1xuICAgICAgY29uc3QgbmRhcnJheSA9IHBpeGVscztcbiAgICAgIHBpeGVscyA9IG5kYXJyYXkuZGF0YTtcbiAgICAgIHdpZHRoID0gbmRhcnJheS5zaGFwZVswXTtcbiAgICAgIGhlaWdodCA9IG5kYXJyYXkuc2hhcGVbMV07XG4gICAgfVxuXG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcblxuICAgIGlmIChwaXhlbHMgPT09IG51bGwpIHtcblxuICAgICAgLy8gQ3JlYXRlIGFuIG1pbmltYWwgdGV4dHVyZVxuICAgICAgd2lkdGggPSB3aWR0aCB8fCAxO1xuICAgICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IDE7XG4gICAgICB0eXBlID0gdHlwZSB8fCBXZWJHTC5VTlNJR05FRF9CWVRFO1xuICAgICAgLy8gcGl4ZWxzID0gbmV3IFVpbnQ4QXJyYXkoWzI1NSwgMCwgMCwgMV0pO1xuICAgICAgZ2wudGV4SW1hZ2UyRCh0YXJnZXQsXG4gICAgICAgIG1pcG1hcExldmVsLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMpO1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICB9IGVsc2UgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhwaXhlbHMpKSB7XG5cbiAgICAgIC8vIENyZWF0ZSBmcm9tIGEgdHlwZWQgYXJyYXlcbiAgICAgIGFzc2VydCh3aWR0aCA+IDAgJiYgaGVpZ2h0ID4gMCwgJ1RleHR1cmUyRDogV2lkdGggYW5kIGhlaWdodCByZXF1aXJlZCcpO1xuICAgICAgdHlwZSA9IHR5cGUgfHwgZ2xUeXBlRnJvbUFycmF5KHBpeGVscyk7XG4gICAgICAvLyBUT0RPIC0gV2ViR0wyIGNoZWNrP1xuICAgICAgaWYgKHR5cGUgPT09IGdsLkZMT0FUICYmICF0aGlzLmhhc0Zsb2F0VGV4dHVyZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Zsb2F0aW5nIHBvaW50IHRleHR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkLicpO1xuICAgICAgfVxuICAgICAgZ2wudGV4SW1hZ2UyRCh0YXJnZXQsXG4gICAgICAgIG1pcG1hcExldmVsLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMpO1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICB9IGVsc2UgaWYgKHBpeGVscyBpbnN0YW5jZW9mIFdlYkdMQnVmZmVyIHx8IHBpeGVscyBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuXG4gICAgICAvLyBXZWJHTDIgYWxsb3dzIHVzIHRvIGNyZWF0ZSB0ZXh0dXJlIGRpcmVjdGx5IGZyb20gYSBXZWJHTCBidWZmZXJcbiAgICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsICdSZXF1aXJlcyBXZWJHTDInKTtcbiAgICAgIHR5cGUgPSB0eXBlIHx8IFdlYkdMLlVOU0lHTkVEX0JZVEU7XG4gICAgICAvLyBUaGlzIHRleEltYWdlMkQgc2lnbmF0dXJlIHVzZXMgY3VycmVudGx5IGJvdW5kIEdMX1BJWEVMX1VOUEFDS19CVUZGRVJcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5tYWtlRnJvbShwaXhlbHMpO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihXZWJHTC5QSVhFTF9VTlBBQ0tfQlVGRkVSLCBidWZmZXIuaGFuZGxlKTtcbiAgICAgIGdsLnRleEltYWdlMkQodGFyZ2V0LFxuICAgICAgICBtaXBtYXBMZXZlbCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgb2Zmc2V0KTtcbiAgICAgIGdsLmJpbmRCdWZmZXIoV2ViR0wuR0xfUElYRUxfVU5QQUNLX0JVRkZFUiwgbnVsbCk7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGNvbnN0IGltYWdlU2l6ZSA9IHRoaXMuX2RlZHVjZUltYWdlU2l6ZShwaXhlbHMpO1xuICAgICAgLy8gQXNzdW1lIHBpeGVscyBpcyBhIGJyb3dzZXIgc3VwcG9ydGVkIG9iamVjdCAoSW1hZ2VEYXRhLCBDYW52YXMsIC4uLilcbiAgICAgIGFzc2VydCh3aWR0aCA9PT0gdW5kZWZpbmVkICYmIGhlaWdodCA9PT0gdW5kZWZpbmVkLFxuICAgICAgICAnVGV4dHVyZTJELnNldEltYWdlRGF0YTogV2lkdGggYW5kIGhlaWdodCBtdXN0IG5vdCBiZSBwcm92aWRlZCcpO1xuICAgICAgdHlwZSA9IHR5cGUgfHwgV2ViR0wuVU5TSUdORURfQllURTtcbiAgICAgIGdsLnRleEltYWdlMkQodGFyZ2V0LCBtaXBtYXBMZXZlbCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscyk7XG4gICAgICB0aGlzLndpZHRoID0gaW1hZ2VTaXplLndpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBpbWFnZVNpemUuaGVpZ2h0O1xuICAgIH1cblxuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCBudWxsKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyogZ2xvYmFsIEltYWdlRGF0YSwgSFRNTEltYWdlRWxlbWVudCwgSFRNTENhbnZhc0VsZW1lbnQsIEhUTUxWaWRlb0VsZW1lbnQgKi9cbiAgX2RlZHVjZUltYWdlU2l6ZShpbWFnZSkge1xuICAgIGlmICh0eXBlb2YgSW1hZ2VEYXRhICE9PSAndW5kZWZpbmVkJyAmJiBpbWFnZSBpbnN0YW5jZW9mIEltYWdlRGF0YSkge1xuICAgICAgcmV0dXJuIHt3aWR0aDogaW1hZ2Uud2lkdGgsIGhlaWdodDogaW1hZ2UuaGVpZ2h0fTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBIVE1MSW1hZ2VFbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgaW1hZ2UgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB7XG4gICAgICByZXR1cm4ge3dpZHRoOiBpbWFnZS5uYXR1cmFsV2lkdGgsIGhlaWdodDogaW1hZ2UubmF0dXJhbEhlaWdodH07XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgSFRNTENhbnZhc0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICBpbWFnZSBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSB7XG4gICAgICByZXR1cm4ge3dpZHRoOiBpbWFnZS53aWR0aCwgaGVpZ2h0OiBpbWFnZS5oZWlnaHR9O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIEhUTUxWaWRlb0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICBpbWFnZSBpbnN0YW5jZW9mIEhUTUxWaWRlb0VsZW1lbnQpIHtcbiAgICAgIHJldHVybiB7d2lkdGg6IGltYWdlLnZpZGVvV2lkdGgsIGhlaWdodDogaW1hZ2UudmlkZW9IZWlnaHR9O1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gaW1hZ2UgZGF0YSBmb3JtYXQuIEZhaWxlZCB0byBkZWR1Y2UgaW1hZ2Ugc2l6ZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhdGNoIHVwZGF0ZSBwaXhlbCBzdG9yYWdlIG1vZGVzXG4gICAqIEBwYXJhbSB7R0xpbnR9IHBhY2tBbGlnbm1lbnQgLSBQYWNraW5nIG9mIHBpeGVsIGRhdGEgaW4gbWVtb3J5ICgxLDIsNCw4KVxuICAgKiBAcGFyYW0ge0dMaW50fSB1bnBhY2tBbGlnbm1lbnQgLSBVbnBhY2tpbmcgcGl4ZWwgZGF0YSBmcm9tIG1lbW9yeSgxLDIsNCw4KVxuICAgKiBAcGFyYW0ge0dMYm9vbGVhbn0gdW5wYWNrRmxpcFkgLSAgRmxpcCBzb3VyY2UgZGF0YSBhbG9uZyBpdHMgdmVydGljYWwgYXhpc1xuICAgKiBAcGFyYW0ge0dMYm9vbGVhbn0gdW5wYWNrUHJlbXVsdGlwbHlBbHBoYSAtXG4gICAqICAgTXVsdGlwbGllcyB0aGUgYWxwaGEgY2hhbm5lbCBpbnRvIHRoZSBvdGhlciBjb2xvciBjaGFubmVsc1xuICAgKiBAcGFyYW0ge0dMZW51bX0gdW5wYWNrQ29sb3JzcGFjZUNvbnZlcnNpb24gLVxuICAgKiAgIERlZmF1bHQgY29sb3Igc3BhY2UgY29udmVyc2lvbiBvciBubyBjb2xvciBzcGFjZSBjb252ZXJzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0dMaW50fSBwYWNrUm93TGVuZ3RoIC1cbiAgICogIE51bWJlciBvZiBwaXhlbHMgaW4gYSByb3cuXG4gICAqIEBwYXJhbSB7fSBwYWNrU2tpcFBpeGVscyAtXG4gICAqICAgTnVtYmVyIG9mIHBpeGVscyBza2lwcGVkIGJlZm9yZSB0aGUgZmlyc3QgcGl4ZWwgaXMgd3JpdHRlbiBpbnRvIG1lbW9yeS5cbiAgICogQHBhcmFtIHt9IHBhY2tTa2lwUm93cyAtXG4gICAqICAgTnVtYmVyIG9mIHJvd3Mgb2YgcGl4ZWxzIHNraXBwZWQgYmVmb3JlIGZpcnN0IHBpeGVsIGlzIHdyaXR0ZW4gdG8gbWVtb3J5LlxuICAgKiBAcGFyYW0ge30gdW5wYWNrUm93TGVuZ3RoIC1cbiAgICogICBOdW1iZXIgb2YgcGl4ZWxzIGluIGEgcm93LlxuICAgKiBAcGFyYW0ge30gdW5wYWNrSW1hZ2VIZWlnaHQgLVxuICAgKiAgIEltYWdlIGhlaWdodCB1c2VkIGZvciByZWFkaW5nIHBpeGVsIGRhdGEgZnJvbSBtZW1vcnlcbiAgICogQHBhcmFtIHt9IHVucGFja1NraXBQaXhlbHMgLVxuICAgKiAgIE51bWJlciBvZiBwaXhlbCBpbWFnZXMgc2tpcHBlZCBiZWZvcmUgZmlyc3QgcGl4ZWwgaXMgcmVhZCBmcm9tIG1lbW9yeVxuICAgKiBAcGFyYW0ge30gdW5wYWNrU2tpcFJvd3MgLVxuICAgKiAgIE51bWJlciBvZiByb3dzIG9mIHBpeGVscyBza2lwcGVkIGJlZm9yZSBmaXJzdCBwaXhlbCBpcyByZWFkIGZyb20gbWVtb3J5XG4gICAqIEBwYXJhbSB7fSB1bnBhY2tTa2lwSW1hZ2VzIC1cbiAgICogICBOdW1iZXIgb2YgcGl4ZWwgaW1hZ2VzIHNraXBwZWQgYmVmb3JlIGZpcnN0IHBpeGVsIGlzIHJlYWQgZnJvbSBtZW1vcnlcbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG4gIHNldFBpeGVsU3RvcmFnZU1vZGVzKHtcbiAgICBwYWNrQWxpZ25tZW50LFxuICAgIHVucGFja0FsaWdubWVudCxcbiAgICB1bnBhY2tGbGlwWSxcbiAgICB1bnBhY2tQcmVtdWx0aXBseUFscGhhLFxuICAgIHVucGFja0NvbG9yc3BhY2VDb252ZXJzaW9uLFxuICAgIC8vIFdFQkdMMlxuICAgIHBhY2tSb3dMZW5ndGgsXG4gICAgcGFja1NraXBQaXhlbHMsXG4gICAgcGFja1NraXBSb3dzLFxuICAgIHVucGFja1Jvd0xlbmd0aCxcbiAgICB1bnBhY2tJbWFnZUhlaWdodCxcbiAgICB1bnBhY2tTa2lwUGl4ZWxzLFxuICAgIHVucGFja1NraXBSb3dzLFxuICAgIHVucGFja1NraXBJbWFnZXNcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgdGhpcy5oYW5kbGUpO1xuXG4gICAgaWYgKHBhY2tBbGlnbm1lbnQpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlBBQ0tfQUxJR05NRU5ULCBwYWNrQWxpZ25tZW50KTtcbiAgICB9XG4gICAgaWYgKHVucGFja0FsaWdubWVudCkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0FMSUdOTUVOVCwgdW5wYWNrQWxpZ25tZW50KTtcbiAgICB9XG4gICAgaWYgKHVucGFja0ZsaXBZKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB1bnBhY2tGbGlwWSk7XG4gICAgfVxuICAgIGlmICh1bnBhY2tQcmVtdWx0aXBseUFscGhhKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIHVucGFja1ByZW11bHRpcGx5QWxwaGEpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrQ29sb3JzcGFjZUNvbnZlcnNpb24pIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19DT0xPUlNQQUNFX0NPTlZFUlNJT05fV0VCR0wsXG4gICAgICAgIHVucGFja0NvbG9yc3BhY2VDb252ZXJzaW9uKTtcbiAgICB9XG5cbiAgICAvLyBXRUJHTDJcbiAgICBpZiAocGFja1Jvd0xlbmd0aCkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuUEFDS19ST1dfTEVOR1RILCBwYWNrUm93TGVuZ3RoKTtcbiAgICB9XG4gICAgaWYgKHBhY2tTa2lwUGl4ZWxzKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5QQUNLX1NLSVBfUElYRUxTLCBwYWNrU2tpcFBpeGVscyk7XG4gICAgfVxuICAgIGlmIChwYWNrU2tpcFJvd3MpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlBBQ0tfU0tJUF9ST1dTLCBwYWNrU2tpcFJvd3MpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrUm93TGVuZ3RoKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUk9XX0xFTkdUSCwgdW5wYWNrUm93TGVuZ3RoKTtcbiAgICB9XG4gICAgaWYgKHVucGFja0ltYWdlSGVpZ2h0KSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfSU1BR0VfSEVJR0hULCB1bnBhY2tJbWFnZUhlaWdodCk7XG4gICAgfVxuICAgIGlmICh1bnBhY2tTa2lwUGl4ZWxzKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfU0tJUF9QSVhFTFMsIHVucGFja1NraXBQaXhlbHMpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrU2tpcFJvd3MpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19TS0lQX1JPV1MsIHVucGFja1NraXBSb3dzKTtcbiAgICB9XG4gICAgaWYgKHVucGFja1NraXBJbWFnZXMpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19TS0lQX0lNQUdFUywgdW5wYWNrU2tpcEltYWdlcyk7XG4gICAgfVxuXG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSwgbWF4LXN0YXRlbWVudHMgKi9cblxuICAvKipcbiAgICogQmF0Y2ggdXBkYXRlIHNhbXBsZXIgc2V0dGluZ3NcbiAgICpcbiAgICogQHBhcmFtIHtHTGVudW19IG1hZ0ZpbHRlciAtIHRleHR1cmUgbWFnbmlmaWNhdGlvbiBmaWx0ZXIuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBtaW5GaWx0ZXIgLSB0ZXh0dXJlIG1pbmlmaWNhdGlvbiBmaWx0ZXJcbiAgICogQHBhcmFtIHtHTGVudW19IHdyYXBTIC0gdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHMuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSB3cmFwVCAtIHRleHR1cmUgd3JhcHBpbmcgZnVuY3Rpb24gZm9yIHRleHR1cmUgY29vcmRpbmF0ZSB0LlxuICAgKiBXRUJHTDIgb25seTpcbiAgICogQHBhcmFtIHtHTGVudW19IHdyYXBSIC0gdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHIuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBjb21wYXJlRnVuYyAtIHRleHR1cmUgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHtHTGVudW19IGNvbXBhcmVNb2RlIC0gdGV4dHVyZSBjb21wYXJpc29uIG1vZGUuXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gbWluTE9EIC0gbWluaW11bSBsZXZlbC1vZi1kZXRhaWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gbWF4TE9EIC0gbWF4aW11bSBsZXZlbC1vZi1kZXRhaWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gYmFzZUxldmVsIC0gVGV4dHVyZSBtaXBtYXAgbGV2ZWxcbiAgICogQHBhcmFtIHtHTGZsb2F0fSBtYXhMZXZlbCAtIE1heGltdW0gdGV4dHVyZSBtaXBtYXAgYXJyYXkgbGV2ZWxcbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG4gIHNldFBhcmFtZXRlcnMoe1xuICAgIG1hZ0ZpbHRlcixcbiAgICBtaW5GaWx0ZXIsXG4gICAgd3JhcFMsXG4gICAgd3JhcFQsXG4gICAgLy8gV0VCR0wyXG4gICAgd3JhcFIsXG4gICAgYmFzZUxldmVsLFxuICAgIG1heExldmVsLFxuICAgIG1pbkxPRCxcbiAgICBtYXhMT0QsXG4gICAgY29tcGFyZUZ1bmMsXG4gICAgY29tcGFyZU1vZGVcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG5cbiAgICBpZiAobWFnRmlsdGVyKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX01BR19GSUxURVIsIG1hZ0ZpbHRlcik7XG4gICAgfVxuICAgIGlmIChtaW5GaWx0ZXIpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgbWluRmlsdGVyKTtcbiAgICB9XG4gICAgaWYgKHdyYXBTKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfUywgd3JhcFMpO1xuICAgIH1cbiAgICBpZiAod3JhcFQpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfV1JBUF9ULCB3cmFwVCk7XG4gICAgfVxuICAgIC8vIFdFQkdMMlxuICAgIGlmICh3cmFwUikge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9XUkFQX1IsIHdyYXBSKTtcbiAgICB9XG4gICAgaWYgKGJhc2VMZXZlbCkge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9CQVNFX0xFVkVMLCBiYXNlTGV2ZWwpO1xuICAgIH1cbiAgICBpZiAobWF4TGV2ZWwpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUFYX0xFVkVMLCBtYXhMZXZlbCk7XG4gICAgfVxuICAgIGlmIChjb21wYXJlRnVuYykge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9DT01QQVJFX0ZVTkMsIGNvbXBhcmVGdW5jKTtcbiAgICB9XG4gICAgaWYgKGNvbXBhcmVNb2RlKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX0NPTVBBUkVfTU9ERSwgY29tcGFyZU1vZGUpO1xuICAgIH1cbiAgICBpZiAobWluTE9EKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJmKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX01JTl9MT0QsIG1pbkxPRCk7XG4gICAgfVxuICAgIGlmIChtYXhMT0QpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmYodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUFYX0xPRCwgbWF4TE9EKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIGdldFBhcmFtZXRlcnMoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICBjb25zdCB3ZWJnbFBhcmFtcyA9IHtcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuZ2V0VGV4UGFyYW1ldGVyKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX01BR19GSUxURVIpLFxuICAgICAgbWluRmlsdGVyOiBnbC5nZXRUZXhQYXJhbWV0ZXIodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiksXG4gICAgICB3cmFwUzogZ2wuZ2V0VGV4UGFyYW1ldGVyKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfUyksXG4gICAgICB3cmFwVDogZ2wuZ2V0VGV4UGFyYW1ldGVyKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfVClcbiAgICB9O1xuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCBudWxsKTtcbiAgICByZXR1cm4gd2ViZ2xQYXJhbXM7XG4gIH1cblxuICAvLyBEZXByZWNhdGVkIG1ldGhvZHNcblxuICBpbWFnZTJEKHtcbiAgICBwaXhlbHMsXG4gICAgZm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICB0eXBlID0gV2ViR0wuVU5TSUdORURfQllURVxuICB9KSB7XG4gICAgLy8gVE9ETyAtIFdlYkdMMiBjaGVjaz9cbiAgICBpZiAodHlwZSA9PT0gV2ViR0wuRkxPQVQgJiYgIXRoaXMuaGFzRmxvYXRUZXh0dXJlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Zsb2F0aW5nIHBvaW50IHRleHR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cblxuICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmdsLnRleEltYWdlMkQoV2ViR0wuVEVYVFVSRV8yRCwgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscyk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1cGRhdGUob3B0cykge1xuICAgIHRocm93IG5ldyBFcnJvcignVGV4dHVyZS51cGRhdGUoKSBpcyBkZXByZWNhdGVkKCknKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZTJEIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBUZXh0dXJlMkQgPyBvYmplY3QgOlxuICAgICAgLy8gVXNlIC5oYW5kbGUgKGUuZyBmcm9tIHN0YWNrLmdsJ3MgZ2wtYnVmZmVyKSwgZWxzZSB1c2UgYnVmZmVyIGRpcmVjdGx5XG4gICAgICBuZXcgVGV4dHVyZTJEKGdsLCB7aGFuZGxlOiBvYmplY3QuaGFuZGxlIHx8IG9iamVjdH0pO1xuICB9XG5cbiAgc3RhdGljIG1ha2VGcm9tU29saWRDb2xvcihnbCwgW3IgPSAwLCBnID0gMCwgYiA9IDAsIGEgPSAxXSkge1xuICAgIHJldHVybiBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICBwaXhlbHM6IG5ldyBVaW50OEFycmF5KFtyLCBnLCBiLCBhXSksXG4gICAgICB3aWR0aDogMSxcbiAgICAgIGZvcm1hdDogZ2wuUkdCQSxcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIG1pbkZpbHRlcjogZ2wuTkVBUkVTVFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG1ha2VGcm9tUGl4ZWxBcnJheShnbCwge2RhdGFBcnJheSwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCAuLi5vcHRzfSkge1xuICAgIC8vIERvbid0IG5lZWQgdG8gZG8gdGhpcyBpZiB0aGUgZGF0YSBpcyBhbHJlYWR5IGluIGEgdHlwZWQgYXJyYXlcbiAgICBjb25zdCBkYXRhVHlwZWRBcnJheSA9IG5ldyBVaW50OEFycmF5KGRhdGFBcnJheSk7XG4gICAgcmV0dXJuIG5ldyBUZXh0dXJlMkQoZ2wsIHtcbiAgICAgIHBpeGVsczogZGF0YVR5cGVkQXJyYXksXG4gICAgICB3aWR0aDogMSxcbiAgICAgIGZvcm1hdDogZ2wuUkdCQSxcbiAgICAgIC4uLm9wdHNcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIDJEIFdlYkdMIFRleHR1cmVcbiAgICpcbiAgICogQGNsYXNzXG4gICAqIENvbnN0cnVjdG9yIHdpbGwgaW5pdGlhbGl6ZSB5b3VyIHRleHR1cmUuXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGdsIGNvbnRleHRcbiAgICogQHBhcmFtIHtJbWFnZXx8QXJyYXlCdWZmZXJ8fG51bGx9IG9wdHMuZGF0YT1cbiAgICogQHBhcmFtIHtHTGludH0gd2lkdGggLSB3aWR0aCBvZiB0ZXh0dXJlXG4gICAqIEBwYXJhbSB7R0xpbnR9IGhlaWdodCAtIGhlaWdodCBvZiB0ZXh0dXJlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICAgIHN1cGVyKGdsLCB7Li4ub3B0cywgdGFyZ2V0OiBnbC5URVhUVVJFXzJEfSk7XG5cbiAgICB0aGlzLndpZHRoID0gbnVsbDtcbiAgICB0aGlzLmhlaWdodCA9IG51bGw7XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG5cbiAgICB0aGlzLnNldEltYWdlRGF0YShvcHRzKTtcbiAgICBpZiAob3B0cy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgdGhpcy5nZW5lcmF0ZU1pcG1hcCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHRhcmdldCBjYW5ub3QgYmUgbW9kaWZpZWQgYnkgYmluZDpcbiAgLy8gdGV4dHVyZXMgYXJlIHNwZWNpYWwgYmVjYXVzZSB3aGVuIHlvdSBmaXJzdCBiaW5kIHRoZW0gdG8gYSB0YXJnZXQsXG4gIC8vIHRoZXkgZ2V0IHNwZWNpYWwgaW5mb3JtYXRpb24uIFdoZW4geW91IGZpcnN0IGJpbmQgYSB0ZXh0dXJlIGFzIGFcbiAgLy8gR0xfVEVYVFVSRV8yRCwgeW91IGFyZSBhY3R1YWxseSBzZXR0aW5nIHNwZWNpYWwgc3RhdGUgaW4gdGhlIHRleHR1cmUuXG4gIC8vIFlvdSBhcmUgc2F5aW5nIHRoYXQgdGhpcyB0ZXh0dXJlIGlzIGEgMkQgdGV4dHVyZS5cbiAgLy8gQW5kIGl0IHdpbGwgYWx3YXlzIGJlIGEgMkQgdGV4dHVyZTsgdGhpcyBzdGF0ZSBjYW5ub3QgYmUgY2hhbmdlZCBldmVyLlxuICAvLyBJZiB5b3UgaGF2ZSBhIHRleHR1cmUgdGhhdCB3YXMgZmlyc3QgYm91bmQgYXMgYSBHTF9URVhUVVJFXzJELFxuICAvLyB5b3UgbXVzdCBhbHdheXMgYmluZCBpdCBhcyBhIEdMX1RFWFRVUkVfMkQ7XG4gIC8vIGF0dGVtcHRpbmcgdG8gYmluZCBpdCBhcyBHTF9URVhUVVJFXzFEIHdpbGwgZ2l2ZSByaXNlIHRvIGFuIGVycm9yXG4gIC8vICh3aGlsZSBydW4tdGltZSkuXG5cbiAgYmluZCh0ZXh0dXJlVW5pdCA9IHRoaXMudGV4dHVyZVVuaXQpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAodGV4dHVyZVVuaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXh0dXJlLmJpbmQ6IG11c3Qgc3BlY2lmeSB0ZXh0dXJlIHVuaXQnKTtcbiAgICB9XG4gICAgdGhpcy50ZXh0dXJlVW5pdCA9IHRleHR1cmVVbml0O1xuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyB0ZXh0dXJlVW5pdCk7XG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICByZXR1cm4gdGV4dHVyZVVuaXQ7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMudGV4dHVyZVVuaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXh0dXJlLnVuYmluZDogdGV4dHVyZSB1bml0IG5vdCBzcGVjaWZpZWQnKTtcbiAgICB9XG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIHRoaXMudGV4dHVyZVVuaXQpO1xuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCBudWxsKTtcbiAgICByZXR1cm4gdGhpcy50ZXh0dXJlVW5pdDtcbiAgfVxuXG4gIGdldEFjdGl2ZVVuaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2wuZ2V0UGFyYW1ldGVyKFdlYkdMLkFDVElWRV9URVhUVVJFKSAtIFdlYkdMLlRFWFRVUkUwO1xuICB9XG5cbiAgLy8gV2ViR0wyXG4gIHNldFBpeGVscyh7XG4gICAgYnVmZmVyLFxuICAgIG9mZnNldCA9IDAsXG4gICAgd2lkdGggPSBudWxsLFxuICAgIGhlaWdodCA9IG51bGwsXG4gICAgbWlwbWFwTGV2ZWwgPSAwLFxuICAgIGludGVybmFsRm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICBmb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIHR5cGUgPSBXZWJHTC5VTlNJR05FRF9CWVRFLFxuICAgIGJvcmRlciA9IDAsXG4gICAgLi4ub3B0c1xuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICAvLyBUaGlzIHNpZ25hdHVyZSBvZiB0ZXhJbWFnZTJEIHVzZXMgY3VycmVudGx5IGJvdW5kIEdMX1BJWEVMX1VOUEFDS19CVUZGRVJcbiAgICBidWZmZXIgPSBCdWZmZXIubWFrZUZyb20oYnVmZmVyKTtcbiAgICBnbC5iaW5kQnVmZmVyKFdlYkdMLlBJWEVMX1VOUEFDS19CVUZGRVIsIGJ1ZmZlci50YXJnZXQpO1xuICAgIC8vIEFuZCBhcyBhbHdheXMsIHdlIG11c3QgYWxzbyBiaW5kIHRoZSB0ZXh0dXJlIGl0c2VsZlxuICAgIHRoaXMuYmluZCgpO1xuXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELFxuICAgICAgbWlwbWFwTGV2ZWwsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIGJ1ZmZlci50YXJnZXQpO1xuXG4gICAgdGhpcy51bmJpbmQoKTtcbiAgICBnbC5iaW5kQnVmZmVyKFdlYkdMLkdMX1BJWEVMX1VOUEFDS19CVUZGRVIsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SW1hZ2VEYXRhRnJvbUNvbXByZXNzZWRCdWZmZXIoe1xuICAgIGJ1ZmZlcixcbiAgICBvZmZzZXQgPSAwLFxuICAgIHdpZHRoID0gbnVsbCxcbiAgICBoZWlnaHQgPSBudWxsLFxuICAgIG1pcG1hcExldmVsID0gMCxcbiAgICBpbnRlcm5hbEZvcm1hdCA9IFdlYkdMLlJHQkEsXG4gICAgZm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICB0eXBlID0gV2ViR0wuVU5TSUdORURfQllURSxcbiAgICBib3JkZXIgPSAwLFxuICAgIC4uLm9wdHNcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmNvbXByZXNzZWRUZXhJbWFnZTJEKHRoaXMudGFyZ2V0LFxuICAgICAgbWlwbWFwTGV2ZWwsIGludGVybmFsRm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGJ1ZmZlcik7XG4gICAgLy8gZ2wuY29tcHJlc3NlZFRleFN1YkltYWdlMkQodGFyZ2V0LFxuICAgIC8vICAgbGV2ZWwsIHhvZmZzZXQsIHlvZmZzZXQsIHdpZHRoLCBoZWlnaHQsIGZvcm1hdCwgQXJyYXlCdWZmZXJWaWV3PyBwaXhlbHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmluZXMgYSB0d28tZGltZW5zaW9uYWwgdGV4dHVyZSBpbWFnZSBvciBjdWJlLW1hcCB0ZXh0dXJlIGltYWdlIHdpdGhcbiAgICogcGl4ZWxzIGZyb20gdGhlIGN1cnJlbnQgZnJhbWVidWZmZXIgKHJhdGhlciB0aGFuIGZyb20gY2xpZW50IG1lbW9yeSkuXG4gICAqIChnbC5jb3B5VGV4SW1hZ2UyRCB3cmFwcGVyKVxuICAgKi9cbiAgY29weUltYWdlRnJvbUZyYW1lYnVmZmVyKHtcbiAgICBmcmFtZWJ1ZmZlcixcbiAgICBvZmZzZXQgPSAwLFxuICAgIHgsXG4gICAgeSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgbWlwbWFwTGV2ZWwgPSAwLFxuICAgIGludGVybmFsRm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICB0eXBlID0gV2ViR0wuVU5TSUdORURfQllURSxcbiAgICBib3JkZXIgPSAwLFxuICAgIC4uLm9wdHNcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGZyYW1lYnVmZmVyID0gRnJhbWVidWZmZXIubWFrZUZyb20oZnJhbWVidWZmZXIpO1xuICAgIGZyYW1lYnVmZmVyLmJpbmQoKTtcblxuICAgIC8vIHRhcmdldFxuICAgIHRoaXMuYmluZCgpO1xuICAgIGdsLmNvcHlUZXhJbWFnZTJEKFxuICAgICAgdGhpcy50YXJnZXQsIG1pcG1hcExldmVsLCBpbnRlcm5hbEZvcm1hdCwgeCwgeSwgd2lkdGgsIGhlaWdodCwgYm9yZGVyKTtcbiAgICB0aGlzLnVuYmluZCgpO1xuXG4gICAgZnJhbWVidWZmZXIudW5iaW5kKCk7XG4gIH1cblxuICBjb3B5U3ViSW1hZ2Uoe1xuICAgIHBpeGVscyxcbiAgICBvZmZzZXQgPSAwLFxuICAgIHgsXG4gICAgeSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgbWlwbWFwTGV2ZWwgPSAwLFxuICAgIGludGVybmFsRm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICB0eXBlID0gV2ViR0wuVU5TSUdORURfQllURSxcbiAgICBib3JkZXIgPSAwXG4gIH0pIHtcbiAgICAvLyBpZiAocGl4ZWxzIGluc3RhbmNlb2YgQXJyYXlCdWZmZXJWaWV3KSB7XG4gICAgLy8gICBnbC50ZXhTdWJJbWFnZTJEKHRhcmdldCwgbGV2ZWwsIHgsIHksIHdpZHRoLCBoZWlnaHQsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzKTtcbiAgICAvLyB9XG4gICAgLy8gZ2wudGV4U3ViSW1hZ2UyRCh0YXJnZXQsIGxldmVsLCB4LCB5LCBmb3JtYXQsIHR5cGUsID8gcGl4ZWxzKTtcbiAgICAvLyBnbC50ZXhTdWJJbWFnZTJEKHRhcmdldCwgbGV2ZWwsIHgsIHksIGZvcm1hdCwgdHlwZSwgSFRNTEltYWdlRWxlbWVudCBwaXhlbHMpO1xuICAgIC8vIGdsLnRleFN1YkltYWdlMkQodGFyZ2V0LCBsZXZlbCwgeCwgeSwgZm9ybWF0LCB0eXBlLCBIVE1MQ2FudmFzRWxlbWVudCBwaXhlbHMpO1xuICAgIC8vIGdsLnRleFN1YkltYWdlMkQodGFyZ2V0LCBsZXZlbCwgeCwgeSwgZm9ybWF0LCB0eXBlLCBIVE1MVmlkZW9FbGVtZW50IHBpeGVscyk7XG4gICAgLy8gLy8gQWRkaXRpb25hbCBzaWduYXR1cmUgaW4gYSBXZWJHTCAyIGNvbnRleHQ6XG4gICAgLy8gZ2wudGV4U3ViSW1hZ2UyRCh0YXJnZXQsIGxldmVsLCB4LCB5LCBmb3JtYXQsIHR5cGUsIEdMaW50cHRyIG9mZnNldCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRleHR1cmVDdWJlIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBUZXh0dXJlQ3ViZSA/IG9iamVjdCA6XG4gICAgICAvLyBVc2UgLmhhbmRsZSAoZS5nIGZyb20gc3RhY2suZ2wncyBnbC1idWZmZXIpLCBlbHNlIHVzZSBidWZmZXIgZGlyZWN0bHlcbiAgICAgIG5ldyBUZXh0dXJlQ3ViZShnbCwge2hhbmRsZTogb2JqZWN0LmhhbmRsZSB8fCBvYmplY3R9KTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzID0ge30pIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gICAgc3VwZXIoZ2wsIHsuLi5vcHRzLCB0YXJnZXQ6IGdsLlRFWFRVUkVfQ1VCRV9NQVB9KTtcbiAgICB0aGlzLnNldEN1YmVNYXBJbWFnZURhdGEob3B0cyk7XG4gIH1cblxuICBiaW5kKHtpbmRleH0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLmhhbmRsZSk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIHVuYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBtYXgtbGVuICovXG4gIHNldEN1YmVNYXBJbWFnZURhdGEoe1xuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBwaXhlbHMsXG4gICAgZGF0YSxcbiAgICBib3JkZXIgPSAwLFxuICAgIGZvcm1hdCA9IFdlYkdMLlJHQkEsXG4gICAgdHlwZSA9IFdlYkdMLlVOU0lHTkVEX0JZVEUsXG4gICAgZ2VuZXJhdGVNaXBtYXAgPSBmYWxzZSxcbiAgICAuLi5vcHRzXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBwaXhlbHMgPSBwaXhlbHMgfHwgZGF0YTtcbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsXG4gICAgICAgIDAsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3MueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzLnBvcy55KTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLFxuICAgICAgICAwLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMucG9zLnopO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsXG4gICAgICAgIDAsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzLm5lZy55KTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLFxuICAgICAgICAwLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMubmVnLnopO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3MueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3MueSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWixcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3Mueik7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWixcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueik7XG4gICAgfVxuXG4gICAgdGhpcy51bmJpbmQoKTtcblxuICAgIGlmIChnZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgdGhpcy5nZW5lcmF0ZU1pcG1hcCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIl19