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

        // Assume pixels is a browser supported object (ImageData, Canvas, ...)
        (0, _assert2.default)(width === undefined && height === undefined, 'Texture2D.setImageData: Width and height must not be provided');
        type = type || _webglTypes.WebGL.UNSIGNED_BYTE;
        var imageSize = this._deduceImageSize(pixels);
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
      throw new Error('Failed to deduce image size');
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
      var
      // WEBGL2
      packRowLength = _ref3.packRowLength;
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
      var
      // WEBGL2
      wrapR = _ref4.wrapR;
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
    value: function bind(_ref13) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC90ZXh0dXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFFQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0lBRWEsTyxXQUFBLE87Ozs7QUFHWCxtQkFBWSxFQUFaLFFBVUc7QUFBQSx1QkFURCxFQVNDO0FBQUEsUUFURCxFQVNDLDJCQVRJLGdCQUFJLFNBQUosQ0FTSjtBQUFBLGdDQVJELFdBUUM7QUFBQSxRQVJELFdBUUMsb0NBUmEsSUFRYjtBQUFBLDhCQVBELFNBT0M7QUFBQSxRQVBELFNBT0Msa0NBUFcsa0JBQU0sT0FPakI7QUFBQSw4QkFORCxTQU1DO0FBQUEsUUFORCxTQU1DLGtDQU5XLGtCQUFNLE9BTWpCO0FBQUEsMEJBTEQsS0FLQztBQUFBLFFBTEQsS0FLQyw4QkFMTyxrQkFBTSxhQUtiO0FBQUEsMEJBSkQsS0FJQztBQUFBLFFBSkQsS0FJQyw4QkFKTyxrQkFBTSxhQUliO0FBQUEsMkJBSEQsTUFHQztBQUFBLFFBSEQsTUFHQywrQkFIUSxrQkFBTSxVQUdkO0FBQUEsUUFGRCxNQUVDLFFBRkQsTUFFQzs7QUFBQSxRQURFLElBQ0Y7O0FBQUE7O0FBQ0Qsa0RBQTRCLEVBQTVCOztBQUVBLFNBQUssTUFBTCxHQUFjLFVBQVUsR0FBRyxhQUFILEVBQXhCOzs7O0FBSUEsU0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFNBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxTQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsU0FBSyxlQUFMLEdBQXVCLEdBQUcsWUFBSCxDQUFnQixtQkFBaEIsQ0FBdkI7QUFDQSxTQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsU0FBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLFNBQUssV0FBTCxHQUFtQixTQUFuQjtBQUNBLFNBQUssUUFBTCxHQUFnQixFQUFoQjs7QUFFQSxTQUFLLG9CQUFMLGNBQThCLElBQTlCLElBQW9DLHdCQUFwQztB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Q0FEdEM7QUFFQSxXQUFHLFVBQUgsQ0FBYyxHQUFHLDJCQUFqQixFQUNFLENBREYsRUFDSyxNQURMLEVBQ2EsTUFEYixFQUNxQixJQURyQixFQUMyQixPQUFPLEdBQVAsQ0FBVyxDQUR0QztBQUVBLFdBQUcsVUFBSCxDQUFjLEdBQUcsMkJBQWpCLEVBQ0UsQ0FERixFQUNLLE1BREwsRUFDYSxNQURiLEVBQ3FCLElBRHJCLEVBQzJCLE9BQU8sR0FBUCxDQUFXLENBRHRDO0FBRUQ7O0FBRUQsV0FBSyxNQUFMOztBQUVBLFVBQUksY0FBSixFQUFvQjtBQUNsQixhQUFLLGNBQUw7QUFDRDtBQUNELGFBQU8sSUFBUDtBQUNEOzs7O0VBbEY4QixPIiwiZmlsZSI6InRleHR1cmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1dlYkdMLCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBXZWJHTEJ1ZmZlcn1cbiAgZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQge2Fzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgZ2xUeXBlRnJvbUFycmF5fSBmcm9tICcuL3dlYmdsLWNoZWNrcyc7XG5pbXBvcnQgQnVmZmVyIGZyb20gJy4vYnVmZmVyJztcbmltcG9ydCBGcmFtZWJ1ZmZlciBmcm9tICcuL2ZyYW1lYnVmZmVyJztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3RvcihnbCwge1xuICAgIGlkID0gdWlkKCd0ZXh0dXJlJyksXG4gICAgdW5wYWNrRmxpcFkgPSB0cnVlLFxuICAgIG1hZ0ZpbHRlciA9IFdlYkdMLk5FQVJFU1QsXG4gICAgbWluRmlsdGVyID0gV2ViR0wuTkVBUkVTVCxcbiAgICB3cmFwUyA9IFdlYkdMLkNMQU1QX1RPX0VER0UsXG4gICAgd3JhcFQgPSBXZWJHTC5DTEFNUF9UT19FREdFLFxuICAgIHRhcmdldCA9IFdlYkdMLlRFWFRVUkVfMkQsXG4gICAgaGFuZGxlLFxuICAgIC4uLm9wdHNcbiAgfSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG5cbiAgICB0aGlzLmhhbmRsZSA9IGhhbmRsZSB8fCBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgLy8gaWYgKCF0aGlzLmhhbmRsZSkge1xuICAgIC8vIH1cblxuICAgIHRoaXMuaWQgPSBpZDtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5oYXNGbG9hdFRleHR1cmUgPSBnbC5nZXRFeHRlbnNpb24oJ09FU190ZXh0dXJlX2Zsb2F0Jyk7XG4gICAgdGhpcy53aWR0aCA9IG51bGw7XG4gICAgdGhpcy5oZWlnaHQgPSBudWxsO1xuICAgIHRoaXMudGV4dHVyZVVuaXQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuXG4gICAgdGhpcy5zZXRQaXhlbFN0b3JhZ2VNb2Rlcyh7Li4ub3B0cywgdW5wYWNrRmxpcFl9KTtcbiAgICB0aGlzLnNldFBhcmFtZXRlcnMoey4uLm9wdHMsIG1hZ0ZpbHRlciwgbWluRmlsdGVyLCB3cmFwUywgd3JhcFR9KTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgZGVsZXRlKCkge1xuICAgIGlmICh0aGlzLmhhbmRsZSkge1xuICAgICAgdGhpcy5nbC5kZWxldGVUZXh0dXJlKHRoaXMuaGFuZGxlKTtcbiAgICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gYFRleHR1cmUoJHt0aGlzLmlkfSwke3RoaXMud2lkdGh9eCR7dGhpcy5oZWlnaHR9KWA7XG4gIH1cblxuICBnZW5lcmF0ZU1pcG1hcCgpIHtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5nbC5nZW5lcmF0ZU1pcG1hcCh0aGlzLnRhcmdldCk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAcGFyYW0geyp9IHBpeGVscyAtXG4gICAqICBudWxsIC0gY3JlYXRlIGVtcHR5IHRleHR1cmUgb2Ygc3BlY2lmaWVkIGZvcm1hdFxuICAgKiAgVHlwZWQgYXJyYXkgLSBpbml0IGZyb20gaW1hZ2UgZGF0YSBpbiB0eXBlZCBhcnJheVxuICAgKiAgQnVmZmVyfFdlYkdMQnVmZmVyIC0gKFdFQkdMMikgaW5pdCBmcm9tIGltYWdlIGRhdGEgaW4gV2ViR0xCdWZmZXJcbiAgICogIEhUTUxJbWFnZUVsZW1lbnR8SW1hZ2UgLSBJbml0cyB3aXRoIGNvbnRlbnQgb2YgaW1hZ2UuIEF1dG8gd2lkdGgvaGVpZ2h0XG4gICAqICBIVE1MQ2FudmFzRWxlbWVudCAtIEluaXRzIHdpdGggY29udGVudHMgb2YgY2FudmFzLiBBdXRvIHdpZHRoL2hlaWdodFxuICAgKiAgSFRNTFZpZGVvRWxlbWVudCAtIENyZWF0ZXMgdmlkZW8gdGV4dHVyZS4gQXV0byB3aWR0aC9oZWlnaHRcbiAgICpcbiAgICogQHBhcmFtIHtHTGludH0gd2lkdGggLVxuICAgKiBAcGFyYW0ge0dMaW50fSBoZWlnaHQgLVxuICAgKiBAcGFyYW0ge0dMaW50fSBtaXBNYXBMZXZlbCAtXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBmb3JtYXQgLSBmb3JtYXQgb2YgaW1hZ2UgZGF0YS5cbiAgICogQHBhcmFtIHtHTGVudW19IHR5cGVcbiAgICogIC0gZm9ybWF0IG9mIGFycmF5IChhdXRvZGV0ZWN0IGZyb20gdHlwZSkgb3JcbiAgICogIC0gKFdFQkdMMikgZm9ybWF0IG9mIGJ1ZmZlclxuICAgKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IC0gKFdFQkdMMikgb2Zmc2V0IGZyb20gc3RhcnQgb2YgYnVmZmVyXG4gICAqIEBwYXJhbSB7R0xpbnR9IGJvcmRlciAtIG11c3QgYmUgMC5cbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4sIG1heC1zdGF0ZW1lbnRzICovXG4gIHNldEltYWdlRGF0YSh7XG4gICAgdGFyZ2V0ID0gdGhpcy50YXJnZXQsXG4gICAgcGl4ZWxzID0gbnVsbCxcbiAgICBkYXRhID0gbnVsbCxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgbWlwbWFwTGV2ZWwgPSAwLFxuICAgIGZvcm1hdCA9IFdlYkdMLlJHQkEsXG4gICAgdHlwZSxcbiAgICBvZmZzZXQgPSAwLFxuICAgIGJvcmRlciA9IDAsXG4gICAgLi4ub3B0c1xuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICBwaXhlbHMgPSBwaXhlbHMgfHwgZGF0YTtcblxuICAgIC8vIFN1cHBvcnQgbmRhcnJheXNcbiAgICBpZiAocGl4ZWxzICYmIHBpeGVscy5kYXRhKSB7XG4gICAgICBjb25zdCBuZGFycmF5ID0gcGl4ZWxzO1xuICAgICAgcGl4ZWxzID0gbmRhcnJheS5kYXRhO1xuICAgICAgd2lkdGggPSBuZGFycmF5LnNoYXBlWzBdO1xuICAgICAgaGVpZ2h0ID0gbmRhcnJheS5zaGFwZVsxXTtcbiAgICB9XG5cbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgdGhpcy5oYW5kbGUpO1xuXG4gICAgaWYgKHBpeGVscyA9PT0gbnVsbCkge1xuXG4gICAgICAvLyBDcmVhdGUgYW4gbWluaW1hbCB0ZXh0dXJlXG4gICAgICB3aWR0aCA9IHdpZHRoIHx8IDE7XG4gICAgICBoZWlnaHQgPSBoZWlnaHQgfHwgMTtcbiAgICAgIHR5cGUgPSB0eXBlIHx8IFdlYkdMLlVOU0lHTkVEX0JZVEU7XG4gICAgICAvLyBwaXhlbHMgPSBuZXcgVWludDhBcnJheShbMjU1LCAwLCAwLCAxXSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKHRhcmdldCxcbiAgICAgICAgbWlwbWFwTGV2ZWwsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscyk7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHBpeGVscykpIHtcblxuICAgICAgLy8gQ3JlYXRlIGZyb20gYSB0eXBlZCBhcnJheVxuICAgICAgYXNzZXJ0KHdpZHRoID4gMCAmJiBoZWlnaHQgPiAwLCAnVGV4dHVyZTJEOiBXaWR0aCBhbmQgaGVpZ2h0IHJlcXVpcmVkJyk7XG4gICAgICB0eXBlID0gdHlwZSB8fCBnbFR5cGVGcm9tQXJyYXkocGl4ZWxzKTtcbiAgICAgIC8vIFRPRE8gLSBXZWJHTDIgY2hlY2s/XG4gICAgICBpZiAodHlwZSA9PT0gZ2wuRkxPQVQgJiYgIXRoaXMuaGFzRmxvYXRUZXh0dXJlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZmxvYXRpbmcgcG9pbnQgdGV4dHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICB9XG4gICAgICBnbC50ZXhJbWFnZTJEKHRhcmdldCxcbiAgICAgICAgbWlwbWFwTGV2ZWwsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscyk7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIH0gZWxzZSBpZiAocGl4ZWxzIGluc3RhbmNlb2YgV2ViR0xCdWZmZXIgfHwgcGl4ZWxzIGluc3RhbmNlb2YgQnVmZmVyKSB7XG5cbiAgICAgIC8vIFdlYkdMMiBhbGxvd3MgdXMgdG8gY3JlYXRlIHRleHR1cmUgZGlyZWN0bHkgZnJvbSBhIFdlYkdMIGJ1ZmZlclxuICAgICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgJ1JlcXVpcmVzIFdlYkdMMicpO1xuICAgICAgdHlwZSA9IHR5cGUgfHwgV2ViR0wuVU5TSUdORURfQllURTtcbiAgICAgIC8vIFRoaXMgdGV4SW1hZ2UyRCBzaWduYXR1cmUgdXNlcyBjdXJyZW50bHkgYm91bmQgR0xfUElYRUxfVU5QQUNLX0JVRkZFUlxuICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLm1ha2VGcm9tKHBpeGVscyk7XG4gICAgICBnbC5iaW5kQnVmZmVyKFdlYkdMLlBJWEVMX1VOUEFDS19CVUZGRVIsIGJ1ZmZlci5oYW5kbGUpO1xuICAgICAgZ2wudGV4SW1hZ2UyRCh0YXJnZXQsXG4gICAgICAgIG1pcG1hcExldmVsLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBvZmZzZXQpO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihXZWJHTC5HTF9QSVhFTF9VTlBBQ0tfQlVGRkVSLCBudWxsKTtcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gQXNzdW1lIHBpeGVscyBpcyBhIGJyb3dzZXIgc3VwcG9ydGVkIG9iamVjdCAoSW1hZ2VEYXRhLCBDYW52YXMsIC4uLilcbiAgICAgIGFzc2VydCh3aWR0aCA9PT0gdW5kZWZpbmVkICYmIGhlaWdodCA9PT0gdW5kZWZpbmVkLFxuICAgICAgICAnVGV4dHVyZTJELnNldEltYWdlRGF0YTogV2lkdGggYW5kIGhlaWdodCBtdXN0IG5vdCBiZSBwcm92aWRlZCcpO1xuICAgICAgdHlwZSA9IHR5cGUgfHwgV2ViR0wuVU5TSUdORURfQllURTtcbiAgICAgIGNvbnN0IGltYWdlU2l6ZSA9IHRoaXMuX2RlZHVjZUltYWdlU2l6ZShwaXhlbHMpO1xuICAgICAgZ2wudGV4SW1hZ2UyRCh0YXJnZXQsIG1pcG1hcExldmVsLCBmb3JtYXQsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzKTtcbiAgICAgIHRoaXMud2lkdGggPSBpbWFnZVNpemUud2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGltYWdlU2l6ZS5oZWlnaHQ7XG4gICAgfVxuXG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIG51bGwpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiBnbG9iYWwgSW1hZ2VEYXRhLCBIVE1MSW1hZ2VFbGVtZW50LCBIVE1MQ2FudmFzRWxlbWVudCwgSFRNTFZpZGVvRWxlbWVudCAqL1xuICBfZGVkdWNlSW1hZ2VTaXplKGltYWdlKSB7XG4gICAgaWYgKHR5cGVvZiBJbWFnZURhdGEgIT09ICd1bmRlZmluZWQnICYmIGltYWdlIGluc3RhbmNlb2YgSW1hZ2VEYXRhKSB7XG4gICAgICByZXR1cm4ge3dpZHRoOiBpbWFnZS53aWR0aCwgaGVpZ2h0OiBpbWFnZS5oZWlnaHR9O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIEhUTUxJbWFnZUVsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICBpbWFnZSBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHtcbiAgICAgIHJldHVybiB7d2lkdGg6IGltYWdlLm5hdHVyYWxXaWR0aCwgaGVpZ2h0OiBpbWFnZS5uYXR1cmFsSGVpZ2h0fTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBIVE1MQ2FudmFzRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIGltYWdlIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgIHJldHVybiB7d2lkdGg6IGltYWdlLndpZHRoLCBoZWlnaHQ6IGltYWdlLmhlaWdodH07XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgSFRNTFZpZGVvRWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIGltYWdlIGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkge1xuICAgICAgcmV0dXJuIHt3aWR0aDogaW1hZ2UudmlkZW9XaWR0aCwgaGVpZ2h0OiBpbWFnZS52aWRlb0hlaWdodH07XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGRlZHVjZSBpbWFnZSBzaXplJyk7XG4gIH1cblxuICAvKipcbiAgICogQmF0Y2ggdXBkYXRlIHBpeGVsIHN0b3JhZ2UgbW9kZXNcbiAgICogQHBhcmFtIHtHTGludH0gcGFja0FsaWdubWVudCAtIFBhY2tpbmcgb2YgcGl4ZWwgZGF0YSBpbiBtZW1vcnkgKDEsMiw0LDgpXG4gICAqIEBwYXJhbSB7R0xpbnR9IHVucGFja0FsaWdubWVudCAtIFVucGFja2luZyBwaXhlbCBkYXRhIGZyb20gbWVtb3J5KDEsMiw0LDgpXG4gICAqIEBwYXJhbSB7R0xib29sZWFufSB1bnBhY2tGbGlwWSAtICBGbGlwIHNvdXJjZSBkYXRhIGFsb25nIGl0cyB2ZXJ0aWNhbCBheGlzXG4gICAqIEBwYXJhbSB7R0xib29sZWFufSB1bnBhY2tQcmVtdWx0aXBseUFscGhhIC1cbiAgICogICBNdWx0aXBsaWVzIHRoZSBhbHBoYSBjaGFubmVsIGludG8gdGhlIG90aGVyIGNvbG9yIGNoYW5uZWxzXG4gICAqIEBwYXJhbSB7R0xlbnVtfSB1bnBhY2tDb2xvcnNwYWNlQ29udmVyc2lvbiAtXG4gICAqICAgRGVmYXVsdCBjb2xvciBzcGFjZSBjb252ZXJzaW9uIG9yIG5vIGNvbG9yIHNwYWNlIGNvbnZlcnNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7R0xpbnR9IHBhY2tSb3dMZW5ndGggLVxuICAgKiAgTnVtYmVyIG9mIHBpeGVscyBpbiBhIHJvdy5cbiAgICogQHBhcmFtIHt9IHBhY2tTa2lwUGl4ZWxzIC1cbiAgICogICBOdW1iZXIgb2YgcGl4ZWxzIHNraXBwZWQgYmVmb3JlIHRoZSBmaXJzdCBwaXhlbCBpcyB3cml0dGVuIGludG8gbWVtb3J5LlxuICAgKiBAcGFyYW0ge30gcGFja1NraXBSb3dzIC1cbiAgICogICBOdW1iZXIgb2Ygcm93cyBvZiBwaXhlbHMgc2tpcHBlZCBiZWZvcmUgZmlyc3QgcGl4ZWwgaXMgd3JpdHRlbiB0byBtZW1vcnkuXG4gICAqIEBwYXJhbSB7fSB1bnBhY2tSb3dMZW5ndGggLVxuICAgKiAgIE51bWJlciBvZiBwaXhlbHMgaW4gYSByb3cuXG4gICAqIEBwYXJhbSB7fSB1bnBhY2tJbWFnZUhlaWdodCAtXG4gICAqICAgSW1hZ2UgaGVpZ2h0IHVzZWQgZm9yIHJlYWRpbmcgcGl4ZWwgZGF0YSBmcm9tIG1lbW9yeVxuICAgKiBAcGFyYW0ge30gdW5wYWNrU2tpcFBpeGVscyAtXG4gICAqICAgTnVtYmVyIG9mIHBpeGVsIGltYWdlcyBza2lwcGVkIGJlZm9yZSBmaXJzdCBwaXhlbCBpcyByZWFkIGZyb20gbWVtb3J5XG4gICAqIEBwYXJhbSB7fSB1bnBhY2tTa2lwUm93cyAtXG4gICAqICAgTnVtYmVyIG9mIHJvd3Mgb2YgcGl4ZWxzIHNraXBwZWQgYmVmb3JlIGZpcnN0IHBpeGVsIGlzIHJlYWQgZnJvbSBtZW1vcnlcbiAgICogQHBhcmFtIHt9IHVucGFja1NraXBJbWFnZXMgLVxuICAgKiAgIE51bWJlciBvZiBwaXhlbCBpbWFnZXMgc2tpcHBlZCBiZWZvcmUgZmlyc3QgcGl4ZWwgaXMgcmVhZCBmcm9tIG1lbW9yeVxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSwgbWF4LXN0YXRlbWVudHMgKi9cbiAgc2V0UGl4ZWxTdG9yYWdlTW9kZXMoe1xuICAgIHBhY2tBbGlnbm1lbnQsXG4gICAgdW5wYWNrQWxpZ25tZW50LFxuICAgIHVucGFja0ZsaXBZLFxuICAgIHVucGFja1ByZW11bHRpcGx5QWxwaGEsXG4gICAgdW5wYWNrQ29sb3JzcGFjZUNvbnZlcnNpb24sXG4gICAgLy8gV0VCR0wyXG4gICAgcGFja1Jvd0xlbmd0aCxcbiAgICBwYWNrU2tpcFBpeGVscyxcbiAgICBwYWNrU2tpcFJvd3MsXG4gICAgdW5wYWNrUm93TGVuZ3RoLFxuICAgIHVucGFja0ltYWdlSGVpZ2h0LFxuICAgIHVucGFja1NraXBQaXhlbHMsXG4gICAgdW5wYWNrU2tpcFJvd3MsXG4gICAgdW5wYWNrU2tpcEltYWdlc1xuICB9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcblxuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG5cbiAgICBpZiAocGFja0FsaWdubWVudCkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuUEFDS19BTElHTk1FTlQsIHBhY2tBbGlnbm1lbnQpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrQWxpZ25tZW50KSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfQUxJR05NRU5ULCB1bnBhY2tBbGlnbm1lbnQpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrRmxpcFkpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHVucGFja0ZsaXBZKTtcbiAgICB9XG4gICAgaWYgKHVucGFja1ByZW11bHRpcGx5QWxwaGEpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgdW5wYWNrUHJlbXVsdGlwbHlBbHBoYSk7XG4gICAgfVxuICAgIGlmICh1bnBhY2tDb2xvcnNwYWNlQ29udmVyc2lvbikge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0NPTE9SU1BBQ0VfQ09OVkVSU0lPTl9XRUJHTCxcbiAgICAgICAgdW5wYWNrQ29sb3JzcGFjZUNvbnZlcnNpb24pO1xuICAgIH1cblxuICAgIC8vIFdFQkdMMlxuICAgIGlmIChwYWNrUm93TGVuZ3RoKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5QQUNLX1JPV19MRU5HVEgsIHBhY2tSb3dMZW5ndGgpO1xuICAgIH1cbiAgICBpZiAocGFja1NraXBQaXhlbHMpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlBBQ0tfU0tJUF9QSVhFTFMsIHBhY2tTa2lwUGl4ZWxzKTtcbiAgICB9XG4gICAgaWYgKHBhY2tTa2lwUm93cykge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuUEFDS19TS0lQX1JPV1MsIHBhY2tTa2lwUm93cyk7XG4gICAgfVxuICAgIGlmICh1bnBhY2tSb3dMZW5ndGgpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19ST1dfTEVOR1RILCB1bnBhY2tSb3dMZW5ndGgpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrSW1hZ2VIZWlnaHQpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19JTUFHRV9IRUlHSFQsIHVucGFja0ltYWdlSGVpZ2h0KTtcbiAgICB9XG4gICAgaWYgKHVucGFja1NraXBQaXhlbHMpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19TS0lQX1BJWEVMUywgdW5wYWNrU2tpcFBpeGVscyk7XG4gICAgfVxuICAgIGlmICh1bnBhY2tTa2lwUm93cykge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1NLSVBfUk9XUywgdW5wYWNrU2tpcFJvd3MpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrU2tpcEltYWdlcykge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1NLSVBfSU1BR0VTLCB1bnBhY2tTa2lwSW1hZ2VzKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIC8qKlxuICAgKiBCYXRjaCB1cGRhdGUgc2FtcGxlciBzZXR0aW5nc1xuICAgKlxuICAgKiBAcGFyYW0ge0dMZW51bX0gbWFnRmlsdGVyIC0gdGV4dHVyZSBtYWduaWZpY2F0aW9uIGZpbHRlci5cbiAgICogQHBhcmFtIHtHTGVudW19IG1pbkZpbHRlciAtIHRleHR1cmUgbWluaWZpY2F0aW9uIGZpbHRlclxuICAgKiBAcGFyYW0ge0dMZW51bX0gd3JhcFMgLSB0ZXh0dXJlIHdyYXBwaW5nIGZ1bmN0aW9uIGZvciB0ZXh0dXJlIGNvb3JkaW5hdGUgcy5cbiAgICogQHBhcmFtIHtHTGVudW19IHdyYXBUIC0gdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHQuXG4gICAqIFdFQkdMMiBvbmx5OlxuICAgKiBAcGFyYW0ge0dMZW51bX0gd3JhcFIgLSB0ZXh0dXJlIHdyYXBwaW5nIGZ1bmN0aW9uIGZvciB0ZXh0dXJlIGNvb3JkaW5hdGUgci5cbiAgICogQHBhcmFtIHtHTGVudW19IGNvbXBhcmVGdW5jIC0gdGV4dHVyZSBjb21wYXJpc29uIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gY29tcGFyZU1vZGUgLSB0ZXh0dXJlIGNvbXBhcmlzb24gbW9kZS5cbiAgICogQHBhcmFtIHtHTGZsb2F0fSBtaW5MT0QgLSBtaW5pbXVtIGxldmVsLW9mLWRldGFpbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtHTGZsb2F0fSBtYXhMT0QgLSBtYXhpbXVtIGxldmVsLW9mLWRldGFpbCB2YWx1ZS5cbiAgICogQHBhcmFtIHtHTGZsb2F0fSBiYXNlTGV2ZWwgLSBUZXh0dXJlIG1pcG1hcCBsZXZlbFxuICAgKiBAcGFyYW0ge0dMZmxvYXR9IG1heExldmVsIC0gTWF4aW11bSB0ZXh0dXJlIG1pcG1hcCBhcnJheSBsZXZlbFxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSwgbWF4LXN0YXRlbWVudHMgKi9cbiAgc2V0UGFyYW1ldGVycyh7XG4gICAgbWFnRmlsdGVyLFxuICAgIG1pbkZpbHRlcixcbiAgICB3cmFwUyxcbiAgICB3cmFwVCxcbiAgICAvLyBXRUJHTDJcbiAgICB3cmFwUixcbiAgICBiYXNlTGV2ZWwsXG4gICAgbWF4TGV2ZWwsXG4gICAgbWluTE9ELFxuICAgIG1heExPRCxcbiAgICBjb21wYXJlRnVuYyxcbiAgICBjb21wYXJlTW9kZVxuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcblxuICAgIGlmIChtYWdGaWx0ZXIpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgbWFnRmlsdGVyKTtcbiAgICB9XG4gICAgaWYgKG1pbkZpbHRlcikge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBtaW5GaWx0ZXIpO1xuICAgIH1cbiAgICBpZiAod3JhcFMpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfV1JBUF9TLCB3cmFwUyk7XG4gICAgfVxuICAgIGlmICh3cmFwVCkge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9XUkFQX1QsIHdyYXBUKTtcbiAgICB9XG4gICAgLy8gV0VCR0wyXG4gICAgaWYgKHdyYXBSKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfUiwgd3JhcFIpO1xuICAgIH1cbiAgICBpZiAoYmFzZUxldmVsKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX0JBU0VfTEVWRUwsIGJhc2VMZXZlbCk7XG4gICAgfVxuICAgIGlmIChtYXhMZXZlbCkge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9NQVhfTEVWRUwsIG1heExldmVsKTtcbiAgICB9XG4gICAgaWYgKGNvbXBhcmVGdW5jKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX0NPTVBBUkVfRlVOQywgY29tcGFyZUZ1bmMpO1xuICAgIH1cbiAgICBpZiAoY29tcGFyZU1vZGUpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfQ09NUEFSRV9NT0RFLCBjb21wYXJlTW9kZSk7XG4gICAgfVxuICAgIGlmIChtaW5MT0QpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmYodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUlOX0xPRCwgbWluTE9EKTtcbiAgICB9XG4gICAgaWYgKG1heExPRCkge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyZih0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9NQVhfTE9ELCBtYXhMT0QpO1xuICAgIH1cblxuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgZ2V0UGFyYW1ldGVycygpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgdGhpcy5oYW5kbGUpO1xuICAgIGNvbnN0IHdlYmdsUGFyYW1zID0ge1xuICAgICAgbWFnRmlsdGVyOiBnbC5nZXRUZXhQYXJhbWV0ZXIodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiksXG4gICAgICBtaW5GaWx0ZXI6IGdsLmdldFRleFBhcmFtZXRlcih0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSKSxcbiAgICAgIHdyYXBTOiBnbC5nZXRUZXhQYXJhbWV0ZXIodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfV1JBUF9TKSxcbiAgICAgIHdyYXBUOiBnbC5nZXRUZXhQYXJhbWV0ZXIodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfV1JBUF9UKVxuICAgIH07XG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIG51bGwpO1xuICAgIHJldHVybiB3ZWJnbFBhcmFtcztcbiAgfVxuXG4gIC8vIERlcHJlY2F0ZWQgbWV0aG9kc1xuXG4gIGltYWdlMkQoe1xuICAgIHBpeGVscyxcbiAgICBmb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIHR5cGUgPSBXZWJHTC5VTlNJR05FRF9CWVRFXG4gIH0pIHtcbiAgICAvLyBUT0RPIC0gV2ViR0wyIGNoZWNrP1xuICAgIGlmICh0eXBlID09PSBXZWJHTC5GTE9BVCAmJiAhdGhpcy5oYXNGbG9hdFRleHR1cmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZmxvYXRpbmcgcG9pbnQgdGV4dHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgdGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuZ2wudGV4SW1hZ2UyRChXZWJHTC5URVhUVVJFXzJELCAwLCBmb3JtYXQsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzKTtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVwZGF0ZShvcHRzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUZXh0dXJlLnVwZGF0ZSgpIGlzIGRlcHJlY2F0ZWQoKScpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlMkQgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBzdGF0aWMgbWFrZUZyb20oZ2wsIG9iamVjdCA9IHt9KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFRleHR1cmUyRCA/IG9iamVjdCA6XG4gICAgICAvLyBVc2UgLmhhbmRsZSAoZS5nIGZyb20gc3RhY2suZ2wncyBnbC1idWZmZXIpLCBlbHNlIHVzZSBidWZmZXIgZGlyZWN0bHlcbiAgICAgIG5ldyBUZXh0dXJlMkQoZ2wsIHtoYW5kbGU6IG9iamVjdC5oYW5kbGUgfHwgb2JqZWN0fSk7XG4gIH1cblxuICBzdGF0aWMgbWFrZUZyb21Tb2xpZENvbG9yKGdsLCBbciA9IDAsIGcgPSAwLCBiID0gMCwgYSA9IDFdKSB7XG4gICAgcmV0dXJuIG5ldyBUZXh0dXJlMkQoZ2wsIHtcbiAgICAgIHBpeGVsczogbmV3IFVpbnQ4QXJyYXkoW3IsIGcsIGIsIGFdKSxcbiAgICAgIHdpZHRoOiAxLFxuICAgICAgZm9ybWF0OiBnbC5SR0JBLFxuICAgICAgbWFnRmlsdGVyOiBnbC5ORUFSRVNULFxuICAgICAgbWluRmlsdGVyOiBnbC5ORUFSRVNUXG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbWFrZUZyb21QaXhlbEFycmF5KGdsLCB7ZGF0YUFycmF5LCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIC4uLm9wdHN9KSB7XG4gICAgLy8gRG9uJ3QgbmVlZCB0byBkbyB0aGlzIGlmIHRoZSBkYXRhIGlzIGFscmVhZHkgaW4gYSB0eXBlZCBhcnJheVxuICAgIGNvbnN0IGRhdGFUeXBlZEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZGF0YUFycmF5KTtcbiAgICByZXR1cm4gbmV3IFRleHR1cmUyRChnbCwge1xuICAgICAgcGl4ZWxzOiBkYXRhVHlwZWRBcnJheSxcbiAgICAgIHdpZHRoOiAxLFxuICAgICAgZm9ybWF0OiBnbC5SR0JBLFxuICAgICAgLi4ub3B0c1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogMkQgV2ViR0wgVGV4dHVyZVxuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQ29uc3RydWN0b3Igd2lsbCBpbml0aWFsaXplIHlvdXIgdGV4dHVyZS5cbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gZ2wgY29udGV4dFxuICAgKiBAcGFyYW0ge0ltYWdlfHxBcnJheUJ1ZmZlcnx8bnVsbH0gb3B0cy5kYXRhPVxuICAgKiBAcGFyYW0ge0dMaW50fSB3aWR0aCAtIHdpZHRoIG9mIHRleHR1cmVcbiAgICogQHBhcmFtIHtHTGludH0gaGVpZ2h0IC0gaGVpZ2h0IG9mIHRleHR1cmVcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzID0ge30pIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gICAgc3VwZXIoZ2wsIHsuLi5vcHRzLCB0YXJnZXQ6IGdsLlRFWFRVUkVfMkR9KTtcblxuICAgIHRoaXMud2lkdGggPSBudWxsO1xuICAgIHRoaXMuaGVpZ2h0ID0gbnVsbDtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMuc2V0SW1hZ2VEYXRhKG9wdHMpO1xuICAgIGlmIChvcHRzLmdlbmVyYXRlTWlwbWFwKSB7XG4gICAgICB0aGlzLmdlbmVyYXRlTWlwbWFwKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGFyZ2V0IGNhbm5vdCBiZSBtb2RpZmllZCBieSBiaW5kOlxuICAvLyB0ZXh0dXJlcyBhcmUgc3BlY2lhbCBiZWNhdXNlIHdoZW4geW91IGZpcnN0IGJpbmQgdGhlbSB0byBhIHRhcmdldCxcbiAgLy8gdGhleSBnZXQgc3BlY2lhbCBpbmZvcm1hdGlvbi4gV2hlbiB5b3UgZmlyc3QgYmluZCBhIHRleHR1cmUgYXMgYVxuICAvLyBHTF9URVhUVVJFXzJELCB5b3UgYXJlIGFjdHVhbGx5IHNldHRpbmcgc3BlY2lhbCBzdGF0ZSBpbiB0aGUgdGV4dHVyZS5cbiAgLy8gWW91IGFyZSBzYXlpbmcgdGhhdCB0aGlzIHRleHR1cmUgaXMgYSAyRCB0ZXh0dXJlLlxuICAvLyBBbmQgaXQgd2lsbCBhbHdheXMgYmUgYSAyRCB0ZXh0dXJlOyB0aGlzIHN0YXRlIGNhbm5vdCBiZSBjaGFuZ2VkIGV2ZXIuXG4gIC8vIElmIHlvdSBoYXZlIGEgdGV4dHVyZSB0aGF0IHdhcyBmaXJzdCBib3VuZCBhcyBhIEdMX1RFWFRVUkVfMkQsXG4gIC8vIHlvdSBtdXN0IGFsd2F5cyBiaW5kIGl0IGFzIGEgR0xfVEVYVFVSRV8yRDtcbiAgLy8gYXR0ZW1wdGluZyB0byBiaW5kIGl0IGFzIEdMX1RFWFRVUkVfMUQgd2lsbCBnaXZlIHJpc2UgdG8gYW4gZXJyb3JcbiAgLy8gKHdoaWxlIHJ1bi10aW1lKS5cblxuICBiaW5kKHRleHR1cmVVbml0ID0gdGhpcy50ZXh0dXJlVW5pdCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0ZXh0dXJlVW5pdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RleHR1cmUuYmluZDogbXVzdCBzcGVjaWZ5IHRleHR1cmUgdW5pdCcpO1xuICAgIH1cbiAgICB0aGlzLnRleHR1cmVVbml0ID0gdGV4dHVyZVVuaXQ7XG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIHRleHR1cmVVbml0KTtcbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0ZXh0dXJlVW5pdDtcbiAgfVxuXG4gIHVuYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAodGhpcy50ZXh0dXJlVW5pdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RleHR1cmUudW5iaW5kOiB0ZXh0dXJlIHVuaXQgbm90IHNwZWNpZmllZCcpO1xuICAgIH1cbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgdGhpcy50ZXh0dXJlVW5pdCk7XG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIG51bGwpO1xuICAgIHJldHVybiB0aGlzLnRleHR1cmVVbml0O1xuICB9XG5cbiAgZ2V0QWN0aXZlVW5pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRQYXJhbWV0ZXIoV2ViR0wuQUNUSVZFX1RFWFRVUkUpIC0gV2ViR0wuVEVYVFVSRTA7XG4gIH1cblxuICAvLyBXZWJHTDJcbiAgc2V0UGl4ZWxzKHtcbiAgICBidWZmZXIsXG4gICAgb2Zmc2V0ID0gMCxcbiAgICB3aWR0aCA9IG51bGwsXG4gICAgaGVpZ2h0ID0gbnVsbCxcbiAgICBtaXBtYXBMZXZlbCA9IDAsXG4gICAgaW50ZXJuYWxGb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIGZvcm1hdCA9IFdlYkdMLlJHQkEsXG4gICAgdHlwZSA9IFdlYkdMLlVOU0lHTkVEX0JZVEUsXG4gICAgYm9yZGVyID0gMCxcbiAgICAuLi5vcHRzXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcblxuICAgIC8vIFRoaXMgc2lnbmF0dXJlIG9mIHRleEltYWdlMkQgdXNlcyBjdXJyZW50bHkgYm91bmQgR0xfUElYRUxfVU5QQUNLX0JVRkZFUlxuICAgIGJ1ZmZlciA9IEJ1ZmZlci5tYWtlRnJvbShidWZmZXIpO1xuICAgIGdsLmJpbmRCdWZmZXIoV2ViR0wuUElYRUxfVU5QQUNLX0JVRkZFUiwgYnVmZmVyLnRhcmdldCk7XG4gICAgLy8gQW5kIGFzIGFsd2F5cywgd2UgbXVzdCBhbHNvIGJpbmQgdGhlIHRleHR1cmUgaXRzZWxmXG4gICAgdGhpcy5iaW5kKCk7XG5cbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsXG4gICAgICBtaXBtYXBMZXZlbCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgYnVmZmVyLnRhcmdldCk7XG5cbiAgICB0aGlzLnVuYmluZCgpO1xuICAgIGdsLmJpbmRCdWZmZXIoV2ViR0wuR0xfUElYRUxfVU5QQUNLX0JVRkZFUiwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJbWFnZURhdGFGcm9tQ29tcHJlc3NlZEJ1ZmZlcih7XG4gICAgYnVmZmVyLFxuICAgIG9mZnNldCA9IDAsXG4gICAgd2lkdGggPSBudWxsLFxuICAgIGhlaWdodCA9IG51bGwsXG4gICAgbWlwbWFwTGV2ZWwgPSAwLFxuICAgIGludGVybmFsRm9ybWF0ID0gV2ViR0wuUkdCQSxcbiAgICBmb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIHR5cGUgPSBXZWJHTC5VTlNJR05FRF9CWVRFLFxuICAgIGJvcmRlciA9IDAsXG4gICAgLi4ub3B0c1xuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuY29tcHJlc3NlZFRleEltYWdlMkQodGhpcy50YXJnZXQsXG4gICAgICBtaXBtYXBMZXZlbCwgaW50ZXJuYWxGb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgYnVmZmVyKTtcbiAgICAvLyBnbC5jb21wcmVzc2VkVGV4U3ViSW1hZ2UyRCh0YXJnZXQsXG4gICAgLy8gICBsZXZlbCwgeG9mZnNldCwgeW9mZnNldCwgd2lkdGgsIGhlaWdodCwgZm9ybWF0LCBBcnJheUJ1ZmZlclZpZXc/IHBpeGVscyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogRGVmaW5lcyBhIHR3by1kaW1lbnNpb25hbCB0ZXh0dXJlIGltYWdlIG9yIGN1YmUtbWFwIHRleHR1cmUgaW1hZ2Ugd2l0aFxuICAgKiBwaXhlbHMgZnJvbSB0aGUgY3VycmVudCBmcmFtZWJ1ZmZlciAocmF0aGVyIHRoYW4gZnJvbSBjbGllbnQgbWVtb3J5KS5cbiAgICogKGdsLmNvcHlUZXhJbWFnZTJEIHdyYXBwZXIpXG4gICAqL1xuICBjb3B5SW1hZ2VGcm9tRnJhbWVidWZmZXIoe1xuICAgIGZyYW1lYnVmZmVyLFxuICAgIG9mZnNldCA9IDAsXG4gICAgeCxcbiAgICB5LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBtaXBtYXBMZXZlbCA9IDAsXG4gICAgaW50ZXJuYWxGb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIHR5cGUgPSBXZWJHTC5VTlNJR05FRF9CWVRFLFxuICAgIGJvcmRlciA9IDAsXG4gICAgLi4ub3B0c1xuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZnJhbWVidWZmZXIgPSBGcmFtZWJ1ZmZlci5tYWtlRnJvbShmcmFtZWJ1ZmZlcik7XG4gICAgZnJhbWVidWZmZXIuYmluZCgpO1xuXG4gICAgLy8gdGFyZ2V0XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgZ2wuY29weVRleEltYWdlMkQoXG4gICAgICB0aGlzLnRhcmdldCwgbWlwbWFwTGV2ZWwsIGludGVybmFsRm9ybWF0LCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIpO1xuICAgIHRoaXMudW5iaW5kKCk7XG5cbiAgICBmcmFtZWJ1ZmZlci51bmJpbmQoKTtcbiAgfVxuXG4gIGNvcHlTdWJJbWFnZSh7XG4gICAgcGl4ZWxzLFxuICAgIG9mZnNldCA9IDAsXG4gICAgeCxcbiAgICB5LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBtaXBtYXBMZXZlbCA9IDAsXG4gICAgaW50ZXJuYWxGb3JtYXQgPSBXZWJHTC5SR0JBLFxuICAgIHR5cGUgPSBXZWJHTC5VTlNJR05FRF9CWVRFLFxuICAgIGJvcmRlciA9IDBcbiAgfSkge1xuICAgIC8vIGlmIChwaXhlbHMgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlclZpZXcpIHtcbiAgICAvLyAgIGdsLnRleFN1YkltYWdlMkQodGFyZ2V0LCBsZXZlbCwgeCwgeSwgd2lkdGgsIGhlaWdodCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMpO1xuICAgIC8vIH1cbiAgICAvLyBnbC50ZXhTdWJJbWFnZTJEKHRhcmdldCwgbGV2ZWwsIHgsIHksIGZvcm1hdCwgdHlwZSwgPyBwaXhlbHMpO1xuICAgIC8vIGdsLnRleFN1YkltYWdlMkQodGFyZ2V0LCBsZXZlbCwgeCwgeSwgZm9ybWF0LCB0eXBlLCBIVE1MSW1hZ2VFbGVtZW50IHBpeGVscyk7XG4gICAgLy8gZ2wudGV4U3ViSW1hZ2UyRCh0YXJnZXQsIGxldmVsLCB4LCB5LCBmb3JtYXQsIHR5cGUsIEhUTUxDYW52YXNFbGVtZW50IHBpeGVscyk7XG4gICAgLy8gZ2wudGV4U3ViSW1hZ2UyRCh0YXJnZXQsIGxldmVsLCB4LCB5LCBmb3JtYXQsIHR5cGUsIEhUTUxWaWRlb0VsZW1lbnQgcGl4ZWxzKTtcbiAgICAvLyAvLyBBZGRpdGlvbmFsIHNpZ25hdHVyZSBpbiBhIFdlYkdMIDIgY29udGV4dDpcbiAgICAvLyBnbC50ZXhTdWJJbWFnZTJEKHRhcmdldCwgbGV2ZWwsIHgsIHksIGZvcm1hdCwgdHlwZSwgR0xpbnRwdHIgb2Zmc2V0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZUN1YmUgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBzdGF0aWMgbWFrZUZyb20oZ2wsIG9iamVjdCA9IHt9KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFRleHR1cmVDdWJlID8gb2JqZWN0IDpcbiAgICAgIC8vIFVzZSAuaGFuZGxlIChlLmcgZnJvbSBzdGFjay5nbCdzIGdsLWJ1ZmZlciksIGVsc2UgdXNlIGJ1ZmZlciBkaXJlY3RseVxuICAgICAgbmV3IFRleHR1cmVDdWJlKGdsLCB7aGFuZGxlOiBvYmplY3QuaGFuZGxlIHx8IG9iamVjdH0pO1xuICB9XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG5cbiAgICBzdXBlcihnbCwgey4uLm9wdHMsIHRhcmdldDogZ2wuVEVYVFVSRV9DVUJFX01BUH0pO1xuICAgIHRoaXMuc2V0Q3ViZU1hcEltYWdlRGF0YShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoe2luZGV4fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLmhhbmRsZSk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIHVuYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBtYXgtbGVuICovXG4gIHNldEN1YmVNYXBJbWFnZURhdGEoe1xuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBwaXhlbHMsXG4gICAgZGF0YSxcbiAgICBib3JkZXIgPSAwLFxuICAgIGZvcm1hdCA9IFdlYkdMLlJHQkEsXG4gICAgdHlwZSA9IFdlYkdMLlVOU0lHTkVEX0JZVEUsXG4gICAgZ2VuZXJhdGVNaXBtYXAgPSBmYWxzZSxcbiAgICAuLi5vcHRzXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBwaXhlbHMgPSBwaXhlbHMgfHwgZGF0YTtcbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsXG4gICAgICAgIDAsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3MueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzLnBvcy55KTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLFxuICAgICAgICAwLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMucG9zLnopO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsXG4gICAgICAgIDAsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzLm5lZy55KTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLFxuICAgICAgICAwLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMubmVnLnopO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3MueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3MueSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWixcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3Mueik7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSxcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWixcbiAgICAgICAgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueik7XG4gICAgfVxuXG4gICAgdGhpcy51bmJpbmQoKTtcblxuICAgIGlmIChnZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgdGhpcy5nZW5lcmF0ZU1pcG1hcCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIl19