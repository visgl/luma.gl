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
    var magFilter = _ref$magFilter === undefined ? _webglTypes.GL.NEAREST : _ref$magFilter;
    var _ref$minFilter = _ref.minFilter;
    var minFilter = _ref$minFilter === undefined ? _webglTypes.GL.NEAREST : _ref$minFilter;
    var _ref$wrapS = _ref.wrapS;
    var wrapS = _ref$wrapS === undefined ? _webglTypes.GL.CLAMP_TO_EDGE : _ref$wrapS;
    var _ref$wrapT = _ref.wrapT;
    var wrapT = _ref$wrapT === undefined ? _webglTypes.GL.CLAMP_TO_EDGE : _ref$wrapT;
    var _ref$target = _ref.target;
    var target = _ref$target === undefined ? _webglTypes.GL.TEXTURE_2D : _ref$target;
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
    /* eslint-disable max-len, max-statements, complexity */

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
      var format = _ref2$format === undefined ? _webglTypes.GL.RGBA : _ref2$format;
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
        type = type || _webglTypes.GL.UNSIGNED_BYTE;
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
        type = type || _webglTypes.GL.UNSIGNED_BYTE;
        // This texImage2D signature uses currently bound GL_PIXEL_UNPACK_BUFFER
        var buffer = _buffer2.default.makeFrom(pixels);
        gl.bindBuffer(_webglTypes.GL.PIXEL_UNPACK_BUFFER, buffer.handle);
        gl.texImage2D(target, mipmapLevel, format, width, height, border, format, type, offset);
        gl.bindBuffer(_webglTypes.GL.GL_PIXEL_UNPACK_BUFFER, null);
        this.width = width;
        this.height = height;
      } else {

        var imageSize = this._deduceImageSize(pixels);
        // Assume pixels is a browser supported object (ImageData, Canvas, ...)
        (0, _assert2.default)(width === undefined && height === undefined, 'Texture2D.setImageData: Width and height must not be provided');
        type = type || _webglTypes.GL.UNSIGNED_BYTE;
        gl.texImage2D(target, mipmapLevel, format, format, type, pixels);
        this.width = imageSize.width;
        this.height = imageSize.height;
      }

      gl.bindTexture(this.target, null);

      return this;
    }
    /* eslint-enable max-len, max-statements, complexity */

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
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
      var format = _ref5$format === undefined ? _webglTypes.GL.RGBA : _ref5$format;
      var _ref5$type = _ref5.type;
      var type = _ref5$type === undefined ? _webglTypes.GL.UNSIGNED_BYTE : _ref5$type;

      // TODO - WebGL2 check?
      if (type === _webglTypes.GL.FLOAT && !this.hasFloatTexture) {
        throw new Error('floating point textures are not supported.');
      }

      this.gl.bindTexture(this.target, this.handle);
      this.gl.texImage2D(_webglTypes.GL.TEXTURE_2D, 0, format, format, type, pixels);
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
      var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

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
     * Note: Constructor will initialize your texture.
     *
     * @class
     * @param {WebGLRenderingContext} gl - gl context
     * @param {Image|ArrayBuffer|null} opts= - named options
     * @param {Image|ArrayBuffer|null} opts.data= - buffer
     * @param {GLint} width - width of texture
     * @param {GLint} height - height of texture
     */

  }]);

  function Texture2D(gl) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Texture2D);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    var _this = _possibleConstructorReturn(this, (Texture2D.__proto__ || Object.getPrototypeOf(Texture2D)).call(this, gl, _extends({}, opts, { target: gl.TEXTURE_2D })));

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
      var textureUnit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.textureUnit;
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
      return this.gl.getParameter(_webglTypes.GL.ACTIVE_TEXTURE) - _webglTypes.GL.TEXTURE0;
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
      var internalFormat = _ref9$internalFormat === undefined ? _webglTypes.GL.RGBA : _ref9$internalFormat;
      var _ref9$format = _ref9.format;
      var format = _ref9$format === undefined ? _webglTypes.GL.RGBA : _ref9$format;
      var _ref9$type = _ref9.type;
      var type = _ref9$type === undefined ? _webglTypes.GL.UNSIGNED_BYTE : _ref9$type;
      var _ref9$border = _ref9.border;
      var border = _ref9$border === undefined ? 0 : _ref9$border;

      var opts = _objectWithoutProperties(_ref9, ['buffer', 'offset', 'width', 'height', 'mipmapLevel', 'internalFormat', 'format', 'type', 'border']);

      var gl = this.gl;

      // This signature of texImage2D uses currently bound GL_PIXEL_UNPACK_BUFFER

      buffer = _buffer2.default.makeFrom(buffer);
      gl.bindBuffer(_webglTypes.GL.PIXEL_UNPACK_BUFFER, buffer.target);
      // And as always, we must also bind the texture itself
      this.bind();

      gl.texImage2D(gl.TEXTURE_2D, mipmapLevel, format, width, height, border, format, type, buffer.target);

      this.unbind();
      gl.bindBuffer(_webglTypes.GL.GL_PIXEL_UNPACK_BUFFER, null);
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
      var internalFormat = _ref10$internalFormat === undefined ? _webglTypes.GL.RGBA : _ref10$internalFormat;
      var _ref10$format = _ref10.format;
      var format = _ref10$format === undefined ? _webglTypes.GL.RGBA : _ref10$format;
      var _ref10$type = _ref10.type;
      var type = _ref10$type === undefined ? _webglTypes.GL.UNSIGNED_BYTE : _ref10$type;
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
      var internalFormat = _ref11$internalFormat === undefined ? _webglTypes.GL.RGBA : _ref11$internalFormat;
      var _ref11$type = _ref11.type;
      var type = _ref11$type === undefined ? _webglTypes.GL.UNSIGNED_BYTE : _ref11$type;
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
      var internalFormat = _ref12$internalFormat === undefined ? _webglTypes.GL.RGBA : _ref12$internalFormat;
      var _ref12$type = _ref12.type;
      var type = _ref12$type === undefined ? _webglTypes.GL.UNSIGNED_BYTE : _ref12$type;
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
      var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return object instanceof TextureCube ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new TextureCube(gl, { handle: object.handle || object });
    }
  }]);

  function TextureCube(gl) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, TextureCube);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    var _this2 = _possibleConstructorReturn(this, (TextureCube.__proto__ || Object.getPrototypeOf(TextureCube)).call(this, gl, _extends({}, opts, { target: gl.TEXTURE_CUBE_MAP })));

    _this2.setCubeMapImageData(opts);
    return _this2;
  }

  _createClass(TextureCube, [{
    key: 'bind',
    value: function bind() {
      var _ref13 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
      var format = _ref14$format === undefined ? _webglTypes.GL.RGBA : _ref14$format;
      var _ref14$type = _ref14.type;
      var type = _ref14$type === undefined ? _webglTypes.GL.UNSIGNED_BYTE : _ref14$type;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC90ZXh0dXJlLmpzIl0sIm5hbWVzIjpbIlRleHR1cmUiLCJnbCIsImlkIiwidW5wYWNrRmxpcFkiLCJtYWdGaWx0ZXIiLCJORUFSRVNUIiwibWluRmlsdGVyIiwid3JhcFMiLCJDTEFNUF9UT19FREdFIiwid3JhcFQiLCJ0YXJnZXQiLCJURVhUVVJFXzJEIiwiaGFuZGxlIiwib3B0cyIsImNyZWF0ZVRleHR1cmUiLCJoYXNGbG9hdFRleHR1cmUiLCJnZXRFeHRlbnNpb24iLCJ3aWR0aCIsImhlaWdodCIsInRleHR1cmVVbml0IiwidW5kZWZpbmVkIiwidXNlckRhdGEiLCJzZXRQaXhlbFN0b3JhZ2VNb2RlcyIsInNldFBhcmFtZXRlcnMiLCJkZWxldGVUZXh0dXJlIiwiYmluZFRleHR1cmUiLCJnZW5lcmF0ZU1pcG1hcCIsInBpeGVscyIsImRhdGEiLCJtaXBtYXBMZXZlbCIsImZvcm1hdCIsIlJHQkEiLCJ0eXBlIiwib2Zmc2V0IiwiYm9yZGVyIiwibmRhcnJheSIsInNoYXBlIiwiVU5TSUdORURfQllURSIsInRleEltYWdlMkQiLCJBcnJheUJ1ZmZlciIsImlzVmlldyIsIkZMT0FUIiwiRXJyb3IiLCJidWZmZXIiLCJtYWtlRnJvbSIsImJpbmRCdWZmZXIiLCJQSVhFTF9VTlBBQ0tfQlVGRkVSIiwiR0xfUElYRUxfVU5QQUNLX0JVRkZFUiIsImltYWdlU2l6ZSIsIl9kZWR1Y2VJbWFnZVNpemUiLCJpbWFnZSIsIkltYWdlRGF0YSIsIkhUTUxJbWFnZUVsZW1lbnQiLCJuYXR1cmFsV2lkdGgiLCJuYXR1cmFsSGVpZ2h0IiwiSFRNTENhbnZhc0VsZW1lbnQiLCJIVE1MVmlkZW9FbGVtZW50IiwidmlkZW9XaWR0aCIsInZpZGVvSGVpZ2h0IiwicGFja0FsaWdubWVudCIsInVucGFja0FsaWdubWVudCIsInVucGFja1ByZW11bHRpcGx5QWxwaGEiLCJ1bnBhY2tDb2xvcnNwYWNlQ29udmVyc2lvbiIsInBhY2tSb3dMZW5ndGgiLCJwYWNrU2tpcFBpeGVscyIsInBhY2tTa2lwUm93cyIsInVucGFja1Jvd0xlbmd0aCIsInVucGFja0ltYWdlSGVpZ2h0IiwidW5wYWNrU2tpcFBpeGVscyIsInVucGFja1NraXBSb3dzIiwidW5wYWNrU2tpcEltYWdlcyIsInBpeGVsU3RvcmVpIiwiUEFDS19BTElHTk1FTlQiLCJVTlBBQ0tfQUxJR05NRU5UIiwiVU5QQUNLX0ZMSVBfWV9XRUJHTCIsIlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCIsIlVOUEFDS19DT0xPUlNQQUNFX0NPTlZFUlNJT05fV0VCR0wiLCJQQUNLX1JPV19MRU5HVEgiLCJQQUNLX1NLSVBfUElYRUxTIiwiUEFDS19TS0lQX1JPV1MiLCJVTlBBQ0tfUk9XX0xFTkdUSCIsIlVOUEFDS19JTUFHRV9IRUlHSFQiLCJVTlBBQ0tfU0tJUF9QSVhFTFMiLCJVTlBBQ0tfU0tJUF9ST1dTIiwiVU5QQUNLX1NLSVBfSU1BR0VTIiwid3JhcFIiLCJiYXNlTGV2ZWwiLCJtYXhMZXZlbCIsIm1pbkxPRCIsIm1heExPRCIsImNvbXBhcmVGdW5jIiwiY29tcGFyZU1vZGUiLCJ0ZXhQYXJhbWV0ZXJpIiwiVEVYVFVSRV9NQUdfRklMVEVSIiwiVEVYVFVSRV9NSU5fRklMVEVSIiwiVEVYVFVSRV9XUkFQX1MiLCJURVhUVVJFX1dSQVBfVCIsIlRFWFRVUkVfV1JBUF9SIiwiVEVYVFVSRV9CQVNFX0xFVkVMIiwiVEVYVFVSRV9NQVhfTEVWRUwiLCJURVhUVVJFX0NPTVBBUkVfRlVOQyIsIlRFWFRVUkVfQ09NUEFSRV9NT0RFIiwidGV4UGFyYW1ldGVyZiIsIlRFWFRVUkVfTUlOX0xPRCIsIlRFWFRVUkVfTUFYX0xPRCIsIndlYmdsUGFyYW1zIiwiZ2V0VGV4UGFyYW1ldGVyIiwiVGV4dHVyZTJEIiwib2JqZWN0IiwiciIsImciLCJiIiwiYSIsIlVpbnQ4QXJyYXkiLCJkYXRhQXJyYXkiLCJkYXRhVHlwZWRBcnJheSIsIk9iamVjdCIsInNlYWwiLCJzZXRJbWFnZURhdGEiLCJhY3RpdmVUZXh0dXJlIiwiVEVYVFVSRTAiLCJnZXRQYXJhbWV0ZXIiLCJBQ1RJVkVfVEVYVFVSRSIsImludGVybmFsRm9ybWF0IiwiYmluZCIsInVuYmluZCIsImNvbXByZXNzZWRUZXhJbWFnZTJEIiwiZnJhbWVidWZmZXIiLCJ4IiwieSIsImNvcHlUZXhJbWFnZTJEIiwiVGV4dHVyZUN1YmUiLCJURVhUVVJFX0NVQkVfTUFQIiwic2V0Q3ViZU1hcEltYWdlRGF0YSIsImluZGV4IiwicmVzdWx0IiwiVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YIiwicG9zIiwiVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZIiwiVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aIiwieiIsIlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCIsIm5lZyIsIlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSIsIlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBOztBQUVBOztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7SUFFYUEsTyxXQUFBQSxPOztBQUVYO0FBQ0EsbUJBQVlDLEVBQVosUUFVRztBQUFBLHVCQVREQyxFQVNDO0FBQUEsUUFUREEsRUFTQywyQkFUSSxnQkFBSSxTQUFKLENBU0o7QUFBQSxnQ0FSREMsV0FRQztBQUFBLFFBUkRBLFdBUUMsb0NBUmEsSUFRYjtBQUFBLDhCQVBEQyxTQU9DO0FBQUEsUUFQREEsU0FPQyxrQ0FQVyxlQUFHQyxPQU9kO0FBQUEsOEJBTkRDLFNBTUM7QUFBQSxRQU5EQSxTQU1DLGtDQU5XLGVBQUdELE9BTWQ7QUFBQSwwQkFMREUsS0FLQztBQUFBLFFBTERBLEtBS0MsOEJBTE8sZUFBR0MsYUFLVjtBQUFBLDBCQUpEQyxLQUlDO0FBQUEsUUFKREEsS0FJQyw4QkFKTyxlQUFHRCxhQUlWO0FBQUEsMkJBSERFLE1BR0M7QUFBQSxRQUhEQSxNQUdDLCtCQUhRLGVBQUdDLFVBR1g7QUFBQSxRQUZEQyxNQUVDLFFB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QWNyQyxHQUFHMEksMkJBQWpCLEVBQ0UsQ0FERixFQUNLN0csTUFETCxFQUNhQSxNQURiLEVBQ3FCRSxJQURyQixFQUMyQkwsT0FBTzhHLEdBQVAsQ0FBV0csQ0FEdEM7QUFFQTNJLFdBQUdxQyxVQUFILENBQWNyQyxHQUFHNEksMkJBQWpCLEVBQ0UsQ0FERixFQUNLL0csTUFETCxFQUNhQSxNQURiLEVBQ3FCRSxJQURyQixFQUMyQkwsT0FBT21ILEdBQVAsQ0FBV2QsQ0FEdEM7QUFFQS9ILFdBQUdxQyxVQUFILENBQWNyQyxHQUFHOEksMkJBQWpCLEVBQ0UsQ0FERixFQUNLakgsTUFETCxFQUNhQSxNQURiLEVBQ3FCRSxJQURyQixFQUMyQkwsT0FBT21ILEdBQVAsQ0FBV2IsQ0FEdEM7QUFFQWhJLFdBQUdxQyxVQUFILENBQWNyQyxHQUFHK0ksMkJBQWpCLEVBQ0UsQ0FERixFQUNLbEgsTUFETCxFQUNhQSxNQURiLEVBQ3FCRSxJQURyQixFQUMyQkwsT0FBT21ILEdBQVAsQ0FBV0YsQ0FEdEM7QUFFRDs7QUFFRCxXQUFLZixNQUFMOztBQUVBLFVBQUluRyxjQUFKLEVBQW9CO0FBQ2xCLGFBQUtBLGNBQUw7QUFDRDtBQUNELGFBQU8sSUFBUDtBQUNEOzs7O0VBbEY4QjFCLE8iLCJmaWxlIjoidGV4dHVyZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7R0wsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIFdlYkdMQnVmZmVyfVxuICBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7YXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0LCBnbFR5cGVGcm9tQXJyYXl9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCBCdWZmZXIgZnJvbSAnLi9idWZmZXInO1xuaW1wb3J0IEZyYW1lYnVmZmVyIGZyb20gJy4vZnJhbWVidWZmZXInO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGNsYXNzIFRleHR1cmUge1xuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIGNvbnN0cnVjdG9yKGdsLCB7XG4gICAgaWQgPSB1aWQoJ3RleHR1cmUnKSxcbiAgICB1bnBhY2tGbGlwWSA9IHRydWUsXG4gICAgbWFnRmlsdGVyID0gR0wuTkVBUkVTVCxcbiAgICBtaW5GaWx0ZXIgPSBHTC5ORUFSRVNULFxuICAgIHdyYXBTID0gR0wuQ0xBTVBfVE9fRURHRSxcbiAgICB3cmFwVCA9IEdMLkNMQU1QX1RPX0VER0UsXG4gICAgdGFyZ2V0ID0gR0wuVEVYVFVSRV8yRCxcbiAgICBoYW5kbGUsXG4gICAgLi4ub3B0c1xuICB9KSB7XG4gICAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICAgIHRoaXMuaGFuZGxlID0gaGFuZGxlIHx8IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAvLyBpZiAoIXRoaXMuaGFuZGxlKSB7XG4gICAgLy8gfVxuXG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLmhhc0Zsb2F0VGV4dHVyZSA9IGdsLmdldEV4dGVuc2lvbignT0VTX3RleHR1cmVfZmxvYXQnKTtcbiAgICB0aGlzLndpZHRoID0gbnVsbDtcbiAgICB0aGlzLmhlaWdodCA9IG51bGw7XG4gICAgdGhpcy50ZXh0dXJlVW5pdCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG5cbiAgICB0aGlzLnNldFBpeGVsU3RvcmFnZU1vZGVzKHsuLi5vcHRzLCB1bnBhY2tGbGlwWX0pO1xuICAgIHRoaXMuc2V0UGFyYW1ldGVycyh7Li4ub3B0cywgbWFnRmlsdGVyLCBtaW5GaWx0ZXIsIHdyYXBTLCB3cmFwVH0pO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cblxuICBkZWxldGUoKSB7XG4gICAgaWYgKHRoaXMuaGFuZGxlKSB7XG4gICAgICB0aGlzLmdsLmRlbGV0ZVRleHR1cmUodGhpcy5oYW5kbGUpO1xuICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgVGV4dHVyZSgke3RoaXMuaWR9LCR7dGhpcy53aWR0aH14JHt0aGlzLmhlaWdodH0pYDtcbiAgfVxuXG4gIGdlbmVyYXRlTWlwbWFwKCkge1xuICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmdsLmdlbmVyYXRlTWlwbWFwKHRoaXMudGFyZ2V0KTtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEBwYXJhbSB7Kn0gcGl4ZWxzIC1cbiAgICogIG51bGwgLSBjcmVhdGUgZW1wdHkgdGV4dHVyZSBvZiBzcGVjaWZpZWQgZm9ybWF0XG4gICAqICBUeXBlZCBhcnJheSAtIGluaXQgZnJvbSBpbWFnZSBkYXRhIGluIHR5cGVkIGFycmF5XG4gICAqICBCdWZmZXJ8V2ViR0xCdWZmZXIgLSAoV0VCR0wyKSBpbml0IGZyb20gaW1hZ2UgZGF0YSBpbiBXZWJHTEJ1ZmZlclxuICAgKiAgSFRNTEltYWdlRWxlbWVudHxJbWFnZSAtIEluaXRzIHdpdGggY29udGVudCBvZiBpbWFnZS4gQXV0byB3aWR0aC9oZWlnaHRcbiAgICogIEhUTUxDYW52YXNFbGVtZW50IC0gSW5pdHMgd2l0aCBjb250ZW50cyBvZiBjYW52YXMuIEF1dG8gd2lkdGgvaGVpZ2h0XG4gICAqICBIVE1MVmlkZW9FbGVtZW50IC0gQ3JlYXRlcyB2aWRlbyB0ZXh0dXJlLiBBdXRvIHdpZHRoL2hlaWdodFxuICAgKlxuICAgKiBAcGFyYW0ge0dMaW50fSB3aWR0aCAtXG4gICAqIEBwYXJhbSB7R0xpbnR9IGhlaWdodCAtXG4gICAqIEBwYXJhbSB7R0xpbnR9IG1pcE1hcExldmVsIC1cbiAgICogQHBhcmFtIHtHTGVudW19IGZvcm1hdCAtIGZvcm1hdCBvZiBpbWFnZSBkYXRhLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gdHlwZVxuICAgKiAgLSBmb3JtYXQgb2YgYXJyYXkgKGF1dG9kZXRlY3QgZnJvbSB0eXBlKSBvclxuICAgKiAgLSAoV0VCR0wyKSBmb3JtYXQgb2YgYnVmZmVyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvZmZzZXQgLSAoV0VCR0wyKSBvZmZzZXQgZnJvbSBzdGFydCBvZiBidWZmZXJcbiAgICogQHBhcmFtIHtHTGludH0gYm9yZGVyIC0gbXVzdCBiZSAwLlxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiwgbWF4LXN0YXRlbWVudHMsIGNvbXBsZXhpdHkgKi9cbiAgc2V0SW1hZ2VEYXRhKHtcbiAgICB0YXJnZXQgPSB0aGlzLnRhcmdldCxcbiAgICBwaXhlbHMgPSBudWxsLFxuICAgIGRhdGEgPSBudWxsLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBtaXBtYXBMZXZlbCA9IDAsXG4gICAgZm9ybWF0ID0gR0wuUkdCQSxcbiAgICB0eXBlLFxuICAgIG9mZnNldCA9IDAsXG4gICAgYm9yZGVyID0gMCxcbiAgICAuLi5vcHRzXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcblxuICAgIHBpeGVscyA9IHBpeGVscyB8fCBkYXRhO1xuXG4gICAgLy8gU3VwcG9ydCBuZGFycmF5c1xuICAgIGlmIChwaXhlbHMgJiYgcGl4ZWxzLmRhdGEpIHtcbiAgICAgIGNvbnN0IG5kYXJyYXkgPSBwaXhlbHM7XG4gICAgICBwaXhlbHMgPSBuZGFycmF5LmRhdGE7XG4gICAgICB3aWR0aCA9IG5kYXJyYXkuc2hhcGVbMF07XG4gICAgICBoZWlnaHQgPSBuZGFycmF5LnNoYXBlWzFdO1xuICAgIH1cblxuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG5cbiAgICBpZiAocGl4ZWxzID09PSBudWxsKSB7XG5cbiAgICAgIC8vIENyZWF0ZSBhbiBtaW5pbWFsIHRleHR1cmVcbiAgICAgIHdpZHRoID0gd2lkdGggfHwgMTtcbiAgICAgIGhlaWdodCA9IGhlaWdodCB8fCAxO1xuICAgICAgdHlwZSA9IHR5cGUgfHwgR0wuVU5TSUdORURfQllURTtcbiAgICAgIC8vIHBpeGVscyA9IG5ldyBVaW50OEFycmF5KFsyNTUsIDAsIDAsIDFdKTtcbiAgICAgIGdsLnRleEltYWdlMkQodGFyZ2V0LFxuICAgICAgICBtaXBtYXBMZXZlbCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzKTtcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgfSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcocGl4ZWxzKSkge1xuXG4gICAgICAvLyBDcmVhdGUgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgICBhc3NlcnQod2lkdGggPiAwICYmIGhlaWdodCA+IDAsICdUZXh0dXJlMkQ6IFdpZHRoIGFuZCBoZWlnaHQgcmVxdWlyZWQnKTtcbiAgICAgIHR5cGUgPSB0eXBlIHx8IGdsVHlwZUZyb21BcnJheShwaXhlbHMpO1xuICAgICAgLy8gVE9ETyAtIFdlYkdMMiBjaGVjaz9cbiAgICAgIGlmICh0eXBlID09PSBnbC5GTE9BVCAmJiAhdGhpcy5oYXNGbG9hdFRleHR1cmUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdmbG9hdGluZyBwb2ludCB0ZXh0dXJlcyBhcmUgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgIH1cbiAgICAgIGdsLnRleEltYWdlMkQodGFyZ2V0LFxuICAgICAgICBtaXBtYXBMZXZlbCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzKTtcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgfSBlbHNlIGlmIChwaXhlbHMgaW5zdGFuY2VvZiBXZWJHTEJ1ZmZlciB8fCBwaXhlbHMgaW5zdGFuY2VvZiBCdWZmZXIpIHtcblxuICAgICAgLy8gV2ViR0wyIGFsbG93cyB1cyB0byBjcmVhdGUgdGV4dHVyZSBkaXJlY3RseSBmcm9tIGEgV2ViR0wgYnVmZmVyXG4gICAgICBhc3NlcnQoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCAnUmVxdWlyZXMgV2ViR0wyJyk7XG4gICAgICB0eXBlID0gdHlwZSB8fCBHTC5VTlNJR05FRF9CWVRFO1xuICAgICAgLy8gVGhpcyB0ZXhJbWFnZTJEIHNpZ25hdHVyZSB1c2VzIGN1cnJlbnRseSBib3VuZCBHTF9QSVhFTF9VTlBBQ0tfQlVGRkVSXG4gICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIubWFrZUZyb20ocGl4ZWxzKTtcbiAgICAgIGdsLmJpbmRCdWZmZXIoR0wuUElYRUxfVU5QQUNLX0JVRkZFUiwgYnVmZmVyLmhhbmRsZSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKHRhcmdldCxcbiAgICAgICAgbWlwbWFwTGV2ZWwsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIG9mZnNldCk7XG4gICAgICBnbC5iaW5kQnVmZmVyKEdMLkdMX1BJWEVMX1VOUEFDS19CVUZGRVIsIG51bGwpO1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICBjb25zdCBpbWFnZVNpemUgPSB0aGlzLl9kZWR1Y2VJbWFnZVNpemUocGl4ZWxzKTtcbiAgICAgIC8vIEFzc3VtZSBwaXhlbHMgaXMgYSBicm93c2VyIHN1cHBvcnRlZCBvYmplY3QgKEltYWdlRGF0YSwgQ2FudmFzLCAuLi4pXG4gICAgICBhc3NlcnQod2lkdGggPT09IHVuZGVmaW5lZCAmJiBoZWlnaHQgPT09IHVuZGVmaW5lZCxcbiAgICAgICAgJ1RleHR1cmUyRC5zZXRJbWFnZURhdGE6IFdpZHRoIGFuZCBoZWlnaHQgbXVzdCBub3QgYmUgcHJvdmlkZWQnKTtcbiAgICAgIHR5cGUgPSB0eXBlIHx8IEdMLlVOU0lHTkVEX0JZVEU7XG4gICAgICBnbC50ZXhJbWFnZTJEKHRhcmdldCwgbWlwbWFwTGV2ZWwsIGZvcm1hdCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMpO1xuICAgICAgdGhpcy53aWR0aCA9IGltYWdlU2l6ZS53aWR0aDtcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaW1hZ2VTaXplLmhlaWdodDtcbiAgICB9XG5cbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4sIG1heC1zdGF0ZW1lbnRzLCBjb21wbGV4aXR5ICovXG5cbiAgLyogZ2xvYmFsIEltYWdlRGF0YSwgSFRNTEltYWdlRWxlbWVudCwgSFRNTENhbnZhc0VsZW1lbnQsIEhUTUxWaWRlb0VsZW1lbnQgKi9cbiAgX2RlZHVjZUltYWdlU2l6ZShpbWFnZSkge1xuICAgIGlmICh0eXBlb2YgSW1hZ2VEYXRhICE9PSAndW5kZWZpbmVkJyAmJiBpbWFnZSBpbnN0YW5jZW9mIEltYWdlRGF0YSkge1xuICAgICAgcmV0dXJuIHt3aWR0aDogaW1hZ2Uud2lkdGgsIGhlaWdodDogaW1hZ2UuaGVpZ2h0fTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBIVE1MSW1hZ2VFbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgaW1hZ2UgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB7XG4gICAgICByZXR1cm4ge3dpZHRoOiBpbWFnZS5uYXR1cmFsV2lkdGgsIGhlaWdodDogaW1hZ2UubmF0dXJhbEhlaWdodH07XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgSFRNTENhbnZhc0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICBpbWFnZSBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSB7XG4gICAgICByZXR1cm4ge3dpZHRoOiBpbWFnZS53aWR0aCwgaGVpZ2h0OiBpbWFnZS5oZWlnaHR9O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIEhUTUxWaWRlb0VsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICBpbWFnZSBpbnN0YW5jZW9mIEhUTUxWaWRlb0VsZW1lbnQpIHtcbiAgICAgIHJldHVybiB7d2lkdGg6IGltYWdlLnZpZGVvV2lkdGgsIGhlaWdodDogaW1hZ2UudmlkZW9IZWlnaHR9O1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gaW1hZ2UgZGF0YSBmb3JtYXQuIEZhaWxlZCB0byBkZWR1Y2UgaW1hZ2Ugc2l6ZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhdGNoIHVwZGF0ZSBwaXhlbCBzdG9yYWdlIG1vZGVzXG4gICAqIEBwYXJhbSB7R0xpbnR9IHBhY2tBbGlnbm1lbnQgLSBQYWNraW5nIG9mIHBpeGVsIGRhdGEgaW4gbWVtb3J5ICgxLDIsNCw4KVxuICAgKiBAcGFyYW0ge0dMaW50fSB1bnBhY2tBbGlnbm1lbnQgLSBVbnBhY2tpbmcgcGl4ZWwgZGF0YSBmcm9tIG1lbW9yeSgxLDIsNCw4KVxuICAgKiBAcGFyYW0ge0dMYm9vbGVhbn0gdW5wYWNrRmxpcFkgLSAgRmxpcCBzb3VyY2UgZGF0YSBhbG9uZyBpdHMgdmVydGljYWwgYXhpc1xuICAgKiBAcGFyYW0ge0dMYm9vbGVhbn0gdW5wYWNrUHJlbXVsdGlwbHlBbHBoYSAtXG4gICAqICAgTXVsdGlwbGllcyB0aGUgYWxwaGEgY2hhbm5lbCBpbnRvIHRoZSBvdGhlciBjb2xvciBjaGFubmVsc1xuICAgKiBAcGFyYW0ge0dMZW51bX0gdW5wYWNrQ29sb3JzcGFjZUNvbnZlcnNpb24gLVxuICAgKiAgIERlZmF1bHQgY29sb3Igc3BhY2UgY29udmVyc2lvbiBvciBubyBjb2xvciBzcGFjZSBjb252ZXJzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0dMaW50fSBwYWNrUm93TGVuZ3RoIC1cbiAgICogIE51bWJlciBvZiBwaXhlbHMgaW4gYSByb3cuXG4gICAqIEBwYXJhbSB7fSBwYWNrU2tpcFBpeGVscyAtXG4gICAqICAgTnVtYmVyIG9mIHBpeGVscyBza2lwcGVkIGJlZm9yZSB0aGUgZmlyc3QgcGl4ZWwgaXMgd3JpdHRlbiBpbnRvIG1lbW9yeS5cbiAgICogQHBhcmFtIHt9IHBhY2tTa2lwUm93cyAtXG4gICAqICAgTnVtYmVyIG9mIHJvd3Mgb2YgcGl4ZWxzIHNraXBwZWQgYmVmb3JlIGZpcnN0IHBpeGVsIGlzIHdyaXR0ZW4gdG8gbWVtb3J5LlxuICAgKiBAcGFyYW0ge30gdW5wYWNrUm93TGVuZ3RoIC1cbiAgICogICBOdW1iZXIgb2YgcGl4ZWxzIGluIGEgcm93LlxuICAgKiBAcGFyYW0ge30gdW5wYWNrSW1hZ2VIZWlnaHQgLVxuICAgKiAgIEltYWdlIGhlaWdodCB1c2VkIGZvciByZWFkaW5nIHBpeGVsIGRhdGEgZnJvbSBtZW1vcnlcbiAgICogQHBhcmFtIHt9IHVucGFja1NraXBQaXhlbHMgLVxuICAgKiAgIE51bWJlciBvZiBwaXhlbCBpbWFnZXMgc2tpcHBlZCBiZWZvcmUgZmlyc3QgcGl4ZWwgaXMgcmVhZCBmcm9tIG1lbW9yeVxuICAgKiBAcGFyYW0ge30gdW5wYWNrU2tpcFJvd3MgLVxuICAgKiAgIE51bWJlciBvZiByb3dzIG9mIHBpeGVscyBza2lwcGVkIGJlZm9yZSBmaXJzdCBwaXhlbCBpcyByZWFkIGZyb20gbWVtb3J5XG4gICAqIEBwYXJhbSB7fSB1bnBhY2tTa2lwSW1hZ2VzIC1cbiAgICogICBOdW1iZXIgb2YgcGl4ZWwgaW1hZ2VzIHNraXBwZWQgYmVmb3JlIGZpcnN0IHBpeGVsIGlzIHJlYWQgZnJvbSBtZW1vcnlcbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG4gIHNldFBpeGVsU3RvcmFnZU1vZGVzKHtcbiAgICBwYWNrQWxpZ25tZW50LFxuICAgIHVucGFja0FsaWdubWVudCxcbiAgICB1bnBhY2tGbGlwWSxcbiAgICB1bnBhY2tQcmVtdWx0aXBseUFscGhhLFxuICAgIHVucGFja0NvbG9yc3BhY2VDb252ZXJzaW9uLFxuICAgIC8vIFdFQkdMMlxuICAgIHBhY2tSb3dMZW5ndGgsXG4gICAgcGFja1NraXBQaXhlbHMsXG4gICAgcGFja1NraXBSb3dzLFxuICAgIHVucGFja1Jvd0xlbmd0aCxcbiAgICB1bnBhY2tJbWFnZUhlaWdodCxcbiAgICB1bnBhY2tTa2lwUGl4ZWxzLFxuICAgIHVucGFja1NraXBSb3dzLFxuICAgIHVucGFja1NraXBJbWFnZXNcbiAgfSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG5cbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgdGhpcy5oYW5kbGUpO1xuXG4gICAgaWYgKHBhY2tBbGlnbm1lbnQpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlBBQ0tfQUxJR05NRU5ULCBwYWNrQWxpZ25tZW50KTtcbiAgICB9XG4gICAgaWYgKHVucGFja0FsaWdubWVudCkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0FMSUdOTUVOVCwgdW5wYWNrQWxpZ25tZW50KTtcbiAgICB9XG4gICAgaWYgKHVucGFja0ZsaXBZKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB1bnBhY2tGbGlwWSk7XG4gICAgfVxuICAgIGlmICh1bnBhY2tQcmVtdWx0aXBseUFscGhhKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIHVucGFja1ByZW11bHRpcGx5QWxwaGEpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrQ29sb3JzcGFjZUNvbnZlcnNpb24pIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19DT0xPUlNQQUNFX0NPTlZFUlNJT05fV0VCR0wsXG4gICAgICAgIHVucGFja0NvbG9yc3BhY2VDb252ZXJzaW9uKTtcbiAgICB9XG5cbiAgICAvLyBXRUJHTDJcbiAgICBpZiAocGFja1Jvd0xlbmd0aCkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuUEFDS19ST1dfTEVOR1RILCBwYWNrUm93TGVuZ3RoKTtcbiAgICB9XG4gICAgaWYgKHBhY2tTa2lwUGl4ZWxzKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5QQUNLX1NLSVBfUElYRUxTLCBwYWNrU2tpcFBpeGVscyk7XG4gICAgfVxuICAgIGlmIChwYWNrU2tpcFJvd3MpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlBBQ0tfU0tJUF9ST1dTLCBwYWNrU2tpcFJvd3MpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrUm93TGVuZ3RoKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUk9XX0xFTkdUSCwgdW5wYWNrUm93TGVuZ3RoKTtcbiAgICB9XG4gICAgaWYgKHVucGFja0ltYWdlSGVpZ2h0KSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfSU1BR0VfSEVJR0hULCB1bnBhY2tJbWFnZUhlaWdodCk7XG4gICAgfVxuICAgIGlmICh1bnBhY2tTa2lwUGl4ZWxzKSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfU0tJUF9QSVhFTFMsIHVucGFja1NraXBQaXhlbHMpO1xuICAgIH1cbiAgICBpZiAodW5wYWNrU2tpcFJvd3MpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19TS0lQX1JPV1MsIHVucGFja1NraXBSb3dzKTtcbiAgICB9XG4gICAgaWYgKHVucGFja1NraXBJbWFnZXMpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19TS0lQX0lNQUdFUywgdW5wYWNrU2tpcEltYWdlcyk7XG4gICAgfVxuXG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSwgbWF4LXN0YXRlbWVudHMgKi9cblxuICAvKipcbiAgICogQmF0Y2ggdXBkYXRlIHNhbXBsZXIgc2V0dGluZ3NcbiAgICpcbiAgICogQHBhcmFtIHtHTGVudW19IG1hZ0ZpbHRlciAtIHRleHR1cmUgbWFnbmlmaWNhdGlvbiBmaWx0ZXIuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBtaW5GaWx0ZXIgLSB0ZXh0dXJlIG1pbmlmaWNhdGlvbiBmaWx0ZXJcbiAgICogQHBhcmFtIHtHTGVudW19IHdyYXBTIC0gdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHMuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSB3cmFwVCAtIHRleHR1cmUgd3JhcHBpbmcgZnVuY3Rpb24gZm9yIHRleHR1cmUgY29vcmRpbmF0ZSB0LlxuICAgKiBXRUJHTDIgb25seTpcbiAgICogQHBhcmFtIHtHTGVudW19IHdyYXBSIC0gdGV4dHVyZSB3cmFwcGluZyBmdW5jdGlvbiBmb3IgdGV4dHVyZSBjb29yZGluYXRlIHIuXG4gICAqIEBwYXJhbSB7R0xlbnVtfSBjb21wYXJlRnVuYyAtIHRleHR1cmUgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHtHTGVudW19IGNvbXBhcmVNb2RlIC0gdGV4dHVyZSBjb21wYXJpc29uIG1vZGUuXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gbWluTE9EIC0gbWluaW11bSBsZXZlbC1vZi1kZXRhaWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gbWF4TE9EIC0gbWF4aW11bSBsZXZlbC1vZi1kZXRhaWwgdmFsdWUuXG4gICAqIEBwYXJhbSB7R0xmbG9hdH0gYmFzZUxldmVsIC0gVGV4dHVyZSBtaXBtYXAgbGV2ZWxcbiAgICogQHBhcmFtIHtHTGZsb2F0fSBtYXhMZXZlbCAtIE1heGltdW0gdGV4dHVyZSBtaXBtYXAgYXJyYXkgbGV2ZWxcbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG4gIHNldFBhcmFtZXRlcnMoe1xuICAgIG1hZ0ZpbHRlcixcbiAgICBtaW5GaWx0ZXIsXG4gICAgd3JhcFMsXG4gICAgd3JhcFQsXG4gICAgLy8gV0VCR0wyXG4gICAgd3JhcFIsXG4gICAgYmFzZUxldmVsLFxuICAgIG1heExldmVsLFxuICAgIG1pbkxPRCxcbiAgICBtYXhMT0QsXG4gICAgY29tcGFyZUZ1bmMsXG4gICAgY29tcGFyZU1vZGVcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG5cbiAgICBpZiAobWFnRmlsdGVyKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX01BR19GSUxURVIsIG1hZ0ZpbHRlcik7XG4gICAgfVxuICAgIGlmIChtaW5GaWx0ZXIpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgbWluRmlsdGVyKTtcbiAgICB9XG4gICAgaWYgKHdyYXBTKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfUywgd3JhcFMpO1xuICAgIH1cbiAgICBpZiAod3JhcFQpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfV1JBUF9ULCB3cmFwVCk7XG4gICAgfVxuICAgIC8vIFdFQkdMMlxuICAgIGlmICh3cmFwUikge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9XUkFQX1IsIHdyYXBSKTtcbiAgICB9XG4gICAgaWYgKGJhc2VMZXZlbCkge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9CQVNFX0xFVkVMLCBiYXNlTGV2ZWwpO1xuICAgIH1cbiAgICBpZiAobWF4TGV2ZWwpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUFYX0xFVkVMLCBtYXhMZXZlbCk7XG4gICAgfVxuICAgIGlmIChjb21wYXJlRnVuYykge1xuICAgICAgZ2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9DT01QQVJFX0ZVTkMsIGNvbXBhcmVGdW5jKTtcbiAgICB9XG4gICAgaWYgKGNvbXBhcmVNb2RlKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX0NPTVBBUkVfTU9ERSwgY29tcGFyZU1vZGUpO1xuICAgIH1cbiAgICBpZiAobWluTE9EKSB7XG4gICAgICBnbC50ZXhQYXJhbWV0ZXJmKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX01JTl9MT0QsIG1pbkxPRCk7XG4gICAgfVxuICAgIGlmIChtYXhMT0QpIHtcbiAgICAgIGdsLnRleFBhcmFtZXRlcmYodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUFYX0xPRCwgbWF4TE9EKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIGdldFBhcmFtZXRlcnMoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICBjb25zdCB3ZWJnbFBhcmFtcyA9IHtcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuZ2V0VGV4UGFyYW1ldGVyKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX01BR19GSUxURVIpLFxuICAgICAgbWluRmlsdGVyOiBnbC5nZXRUZXhQYXJhbWV0ZXIodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiksXG4gICAgICB3cmFwUzogZ2wuZ2V0VGV4UGFyYW1ldGVyKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfUyksXG4gICAgICB3cmFwVDogZ2wuZ2V0VGV4UGFyYW1ldGVyKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfVClcbiAgICB9O1xuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCBudWxsKTtcbiAgICByZXR1cm4gd2ViZ2xQYXJhbXM7XG4gIH1cblxuICAvLyBEZXByZWNhdGVkIG1ldGhvZHNcblxuICBpbWFnZTJEKHtcbiAgICBwaXhlbHMsXG4gICAgZm9ybWF0ID0gR0wuUkdCQSxcbiAgICB0eXBlID0gR0wuVU5TSUdORURfQllURVxuICB9KSB7XG4gICAgLy8gVE9ETyAtIFdlYkdMMiBjaGVjaz9cbiAgICBpZiAodHlwZSA9PT0gR0wuRkxPQVQgJiYgIXRoaXMuaGFzRmxvYXRUZXh0dXJlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Zsb2F0aW5nIHBvaW50IHRleHR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cblxuICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy50YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICB0aGlzLmdsLnRleEltYWdlMkQoR0wuVEVYVFVSRV8yRCwgMCwgZm9ybWF0LCBmb3JtYXQsIHR5cGUsIHBpeGVscyk7XG4gICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1cGRhdGUob3B0cykge1xuICAgIHRocm93IG5ldyBFcnJvcignVGV4dHVyZS51cGRhdGUoKSBpcyBkZXByZWNhdGVkKCknKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZTJEIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBUZXh0dXJlMkQgPyBvYmplY3QgOlxuICAgICAgLy8gVXNlIC5oYW5kbGUgKGUuZyBmcm9tIHN0YWNrLmdsJ3MgZ2wtYnVmZmVyKSwgZWxzZSB1c2UgYnVmZmVyIGRpcmVjdGx5XG4gICAgICBuZXcgVGV4dHVyZTJEKGdsLCB7aGFuZGxlOiBvYmplY3QuaGFuZGxlIHx8IG9iamVjdH0pO1xuICB9XG5cbiAgc3RhdGljIG1ha2VGcm9tU29saWRDb2xvcihnbCwgW3IgPSAwLCBnID0gMCwgYiA9IDAsIGEgPSAxXSkge1xuICAgIHJldHVybiBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICBwaXhlbHM6IG5ldyBVaW50OEFycmF5KFtyLCBnLCBiLCBhXSksXG4gICAgICB3aWR0aDogMSxcbiAgICAgIGZvcm1hdDogZ2wuUkdCQSxcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIG1pbkZpbHRlcjogZ2wuTkVBUkVTVFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG1ha2VGcm9tUGl4ZWxBcnJheShnbCwge2RhdGFBcnJheSwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCAuLi5vcHRzfSkge1xuICAgIC8vIERvbid0IG5lZWQgdG8gZG8gdGhpcyBpZiB0aGUgZGF0YSBpcyBhbHJlYWR5IGluIGEgdHlwZWQgYXJyYXlcbiAgICBjb25zdCBkYXRhVHlwZWRBcnJheSA9IG5ldyBVaW50OEFycmF5KGRhdGFBcnJheSk7XG4gICAgcmV0dXJuIG5ldyBUZXh0dXJlMkQoZ2wsIHtcbiAgICAgIHBpeGVsczogZGF0YVR5cGVkQXJyYXksXG4gICAgICB3aWR0aDogMSxcbiAgICAgIGZvcm1hdDogZ2wuUkdCQSxcbiAgICAgIC4uLm9wdHNcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIDJEIFdlYkdMIFRleHR1cmVcbiAgICogTm90ZTogQ29uc3RydWN0b3Igd2lsbCBpbml0aWFsaXplIHlvdXIgdGV4dHVyZS5cbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGdsIGNvbnRleHRcbiAgICogQHBhcmFtIHtJbWFnZXxBcnJheUJ1ZmZlcnxudWxsfSBvcHRzPSAtIG5hbWVkIG9wdGlvbnNcbiAgICogQHBhcmFtIHtJbWFnZXxBcnJheUJ1ZmZlcnxudWxsfSBvcHRzLmRhdGE9IC0gYnVmZmVyXG4gICAqIEBwYXJhbSB7R0xpbnR9IHdpZHRoIC0gd2lkdGggb2YgdGV4dHVyZVxuICAgKiBAcGFyYW0ge0dMaW50fSBoZWlnaHQgLSBoZWlnaHQgb2YgdGV4dHVyZVxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG5cbiAgICBzdXBlcihnbCwgey4uLm9wdHMsIHRhcmdldDogZ2wuVEVYVFVSRV8yRH0pO1xuXG4gICAgdGhpcy53aWR0aCA9IG51bGw7XG4gICAgdGhpcy5oZWlnaHQgPSBudWxsO1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgdGhpcy5zZXRJbWFnZURhdGEob3B0cyk7XG4gICAgaWYgKG9wdHMuZ2VuZXJhdGVNaXBtYXApIHtcbiAgICAgIHRoaXMuZ2VuZXJhdGVNaXBtYXAoKTtcbiAgICB9XG4gIH1cblxuICAvLyB0YXJnZXQgY2Fubm90IGJlIG1vZGlmaWVkIGJ5IGJpbmQ6XG4gIC8vIHRleHR1cmVzIGFyZSBzcGVjaWFsIGJlY2F1c2Ugd2hlbiB5b3UgZmlyc3QgYmluZCB0aGVtIHRvIGEgdGFyZ2V0LFxuICAvLyB0aGV5IGdldCBzcGVjaWFsIGluZm9ybWF0aW9uLiBXaGVuIHlvdSBmaXJzdCBiaW5kIGEgdGV4dHVyZSBhcyBhXG4gIC8vIEdMX1RFWFRVUkVfMkQsIHlvdSBhcmUgYWN0dWFsbHkgc2V0dGluZyBzcGVjaWFsIHN0YXRlIGluIHRoZSB0ZXh0dXJlLlxuICAvLyBZb3UgYXJlIHNheWluZyB0aGF0IHRoaXMgdGV4dHVyZSBpcyBhIDJEIHRleHR1cmUuXG4gIC8vIEFuZCBpdCB3aWxsIGFsd2F5cyBiZSBhIDJEIHRleHR1cmU7IHRoaXMgc3RhdGUgY2Fubm90IGJlIGNoYW5nZWQgZXZlci5cbiAgLy8gSWYgeW91IGhhdmUgYSB0ZXh0dXJlIHRoYXQgd2FzIGZpcnN0IGJvdW5kIGFzIGEgR0xfVEVYVFVSRV8yRCxcbiAgLy8geW91IG11c3QgYWx3YXlzIGJpbmQgaXQgYXMgYSBHTF9URVhUVVJFXzJEO1xuICAvLyBhdHRlbXB0aW5nIHRvIGJpbmQgaXQgYXMgR0xfVEVYVFVSRV8xRCB3aWxsIGdpdmUgcmlzZSB0byBhbiBlcnJvclxuICAvLyAod2hpbGUgcnVuLXRpbWUpLlxuXG4gIGJpbmQodGV4dHVyZVVuaXQgPSB0aGlzLnRleHR1cmVVbml0KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRleHR1cmVVbml0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGV4dHVyZS5iaW5kOiBtdXN0IHNwZWNpZnkgdGV4dHVyZSB1bml0Jyk7XG4gICAgfVxuICAgIHRoaXMudGV4dHVyZVVuaXQgPSB0ZXh0dXJlVW5pdDtcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgdGV4dHVyZVVuaXQpO1xuICAgIGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRleHR1cmVVbml0O1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLnRleHR1cmVVbml0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGV4dHVyZS51bmJpbmQ6IHRleHR1cmUgdW5pdCBub3Qgc3BlY2lmaWVkJyk7XG4gICAgfVxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyB0aGlzLnRleHR1cmVVbml0KTtcbiAgICBnbC5iaW5kVGV4dHVyZSh0aGlzLnRhcmdldCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXMudGV4dHVyZVVuaXQ7XG4gIH1cblxuICBnZXRBY3RpdmVVbml0KCkge1xuICAgIHJldHVybiB0aGlzLmdsLmdldFBhcmFtZXRlcihHTC5BQ1RJVkVfVEVYVFVSRSkgLSBHTC5URVhUVVJFMDtcbiAgfVxuXG4gIC8vIFdlYkdMMlxuICBzZXRQaXhlbHMoe1xuICAgIGJ1ZmZlcixcbiAgICBvZmZzZXQgPSAwLFxuICAgIHdpZHRoID0gbnVsbCxcbiAgICBoZWlnaHQgPSBudWxsLFxuICAgIG1pcG1hcExldmVsID0gMCxcbiAgICBpbnRlcm5hbEZvcm1hdCA9IEdMLlJHQkEsXG4gICAgZm9ybWF0ID0gR0wuUkdCQSxcbiAgICB0eXBlID0gR0wuVU5TSUdORURfQllURSxcbiAgICBib3JkZXIgPSAwLFxuICAgIC4uLm9wdHNcbiAgfSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuXG4gICAgLy8gVGhpcyBzaWduYXR1cmUgb2YgdGV4SW1hZ2UyRCB1c2VzIGN1cnJlbnRseSBib3VuZCBHTF9QSVhFTF9VTlBBQ0tfQlVGRkVSXG4gICAgYnVmZmVyID0gQnVmZmVyLm1ha2VGcm9tKGJ1ZmZlcik7XG4gICAgZ2wuYmluZEJ1ZmZlcihHTC5QSVhFTF9VTlBBQ0tfQlVGRkVSLCBidWZmZXIudGFyZ2V0KTtcbiAgICAvLyBBbmQgYXMgYWx3YXlzLCB3ZSBtdXN0IGFsc28gYmluZCB0aGUgdGV4dHVyZSBpdHNlbGZcbiAgICB0aGlzLmJpbmQoKTtcblxuICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCxcbiAgICAgIG1pcG1hcExldmVsLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBidWZmZXIudGFyZ2V0KTtcblxuICAgIHRoaXMudW5iaW5kKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihHTC5HTF9QSVhFTF9VTlBBQ0tfQlVGRkVSLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEltYWdlRGF0YUZyb21Db21wcmVzc2VkQnVmZmVyKHtcbiAgICBidWZmZXIsXG4gICAgb2Zmc2V0ID0gMCxcbiAgICB3aWR0aCA9IG51bGwsXG4gICAgaGVpZ2h0ID0gbnVsbCxcbiAgICBtaXBtYXBMZXZlbCA9IDAsXG4gICAgaW50ZXJuYWxGb3JtYXQgPSBHTC5SR0JBLFxuICAgIGZvcm1hdCA9IEdMLlJHQkEsXG4gICAgdHlwZSA9IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgYm9yZGVyID0gMCxcbiAgICAuLi5vcHRzXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5jb21wcmVzc2VkVGV4SW1hZ2UyRCh0aGlzLnRhcmdldCxcbiAgICAgIG1pcG1hcExldmVsLCBpbnRlcm5hbEZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBidWZmZXIpO1xuICAgIC8vIGdsLmNvbXByZXNzZWRUZXhTdWJJbWFnZTJEKHRhcmdldCxcbiAgICAvLyAgIGxldmVsLCB4b2Zmc2V0LCB5b2Zmc2V0LCB3aWR0aCwgaGVpZ2h0LCBmb3JtYXQsIEFycmF5QnVmZmVyVmlldz8gcGl4ZWxzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgdHdvLWRpbWVuc2lvbmFsIHRleHR1cmUgaW1hZ2Ugb3IgY3ViZS1tYXAgdGV4dHVyZSBpbWFnZSB3aXRoXG4gICAqIHBpeGVscyBmcm9tIHRoZSBjdXJyZW50IGZyYW1lYnVmZmVyIChyYXRoZXIgdGhhbiBmcm9tIGNsaWVudCBtZW1vcnkpLlxuICAgKiAoZ2wuY29weVRleEltYWdlMkQgd3JhcHBlcilcbiAgICovXG4gIGNvcHlJbWFnZUZyb21GcmFtZWJ1ZmZlcih7XG4gICAgZnJhbWVidWZmZXIsXG4gICAgb2Zmc2V0ID0gMCxcbiAgICB4LFxuICAgIHksXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIG1pcG1hcExldmVsID0gMCxcbiAgICBpbnRlcm5hbEZvcm1hdCA9IEdMLlJHQkEsXG4gICAgdHlwZSA9IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgYm9yZGVyID0gMCxcbiAgICAuLi5vcHRzXG4gIH0pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBmcmFtZWJ1ZmZlciA9IEZyYW1lYnVmZmVyLm1ha2VGcm9tKGZyYW1lYnVmZmVyKTtcbiAgICBmcmFtZWJ1ZmZlci5iaW5kKCk7XG5cbiAgICAvLyB0YXJnZXRcbiAgICB0aGlzLmJpbmQoKTtcbiAgICBnbC5jb3B5VGV4SW1hZ2UyRChcbiAgICAgIHRoaXMudGFyZ2V0LCBtaXBtYXBMZXZlbCwgaW50ZXJuYWxGb3JtYXQsIHgsIHksIHdpZHRoLCBoZWlnaHQsIGJvcmRlcik7XG4gICAgdGhpcy51bmJpbmQoKTtcblxuICAgIGZyYW1lYnVmZmVyLnVuYmluZCgpO1xuICB9XG5cbiAgY29weVN1YkltYWdlKHtcbiAgICBwaXhlbHMsXG4gICAgb2Zmc2V0ID0gMCxcbiAgICB4LFxuICAgIHksXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIG1pcG1hcExldmVsID0gMCxcbiAgICBpbnRlcm5hbEZvcm1hdCA9IEdMLlJHQkEsXG4gICAgdHlwZSA9IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgYm9yZGVyID0gMFxuICB9KSB7XG4gICAgLy8gaWYgKHBpeGVscyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyVmlldykge1xuICAgIC8vICAgZ2wudGV4U3ViSW1hZ2UyRCh0YXJnZXQsIGxldmVsLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBmb3JtYXQsIHR5cGUsIHBpeGVscyk7XG4gICAgLy8gfVxuICAgIC8vIGdsLnRleFN1YkltYWdlMkQodGFyZ2V0LCBsZXZlbCwgeCwgeSwgZm9ybWF0LCB0eXBlLCA/IHBpeGVscyk7XG4gICAgLy8gZ2wudGV4U3ViSW1hZ2UyRCh0YXJnZXQsIGxldmVsLCB4LCB5LCBmb3JtYXQsIHR5cGUsIEhUTUxJbWFnZUVsZW1lbnQgcGl4ZWxzKTtcbiAgICAvLyBnbC50ZXhTdWJJbWFnZTJEKHRhcmdldCwgbGV2ZWwsIHgsIHksIGZvcm1hdCwgdHlwZSwgSFRNTENhbnZhc0VsZW1lbnQgcGl4ZWxzKTtcbiAgICAvLyBnbC50ZXhTdWJJbWFnZTJEKHRhcmdldCwgbGV2ZWwsIHgsIHksIGZvcm1hdCwgdHlwZSwgSFRNTFZpZGVvRWxlbWVudCBwaXhlbHMpO1xuICAgIC8vIC8vIEFkZGl0aW9uYWwgc2lnbmF0dXJlIGluIGEgV2ViR0wgMiBjb250ZXh0OlxuICAgIC8vIGdsLnRleFN1YkltYWdlMkQodGFyZ2V0LCBsZXZlbCwgeCwgeSwgZm9ybWF0LCB0eXBlLCBHTGludHB0ciBvZmZzZXQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlQ3ViZSBleHRlbmRzIFRleHR1cmUge1xuXG4gIHN0YXRpYyBtYWtlRnJvbShnbCwgb2JqZWN0ID0ge30pIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgVGV4dHVyZUN1YmUgPyBvYmplY3QgOlxuICAgICAgLy8gVXNlIC5oYW5kbGUgKGUuZyBmcm9tIHN0YWNrLmdsJ3MgZ2wtYnVmZmVyKSwgZWxzZSB1c2UgYnVmZmVyIGRpcmVjdGx5XG4gICAgICBuZXcgVGV4dHVyZUN1YmUoZ2wsIHtoYW5kbGU6IG9iamVjdC5oYW5kbGUgfHwgb2JqZWN0fSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICAgIHN1cGVyKGdsLCB7Li4ub3B0cywgdGFyZ2V0OiBnbC5URVhUVVJFX0NVQkVfTUFQfSk7XG4gICAgdGhpcy5zZXRDdWJlTWFwSW1hZ2VEYXRhKG9wdHMpO1xuICB9XG5cbiAgYmluZCh7aW5kZXh9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGhpcy5oYW5kbGUpO1xuICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpIC0gZ2wuVEVYVFVSRTA7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbCk7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbWF4LWxlbiAqL1xuICBzZXRDdWJlTWFwSW1hZ2VEYXRhKHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgcGl4ZWxzLFxuICAgIGRhdGEsXG4gICAgYm9yZGVyID0gMCxcbiAgICBmb3JtYXQgPSBHTC5SR0JBLFxuICAgIHR5cGUgPSBHTC5VTlNJR05FRF9CWVRFLFxuICAgIGdlbmVyYXRlTWlwbWFwID0gZmFsc2UsXG4gICAgLi4ub3B0c1xuICB9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgcGl4ZWxzID0gcGl4ZWxzIHx8IGRhdGE7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLFxuICAgICAgICAwLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMucG9zLngpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksXG4gICAgICAgIDAsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscy5wb3MueSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWixcbiAgICAgICAgMCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzLnBvcy56KTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLFxuICAgICAgICAwLCBmb3JtYXQsIHdpZHRoLCBoZWlnaHQsIGJvcmRlciwgZm9ybWF0LCB0eXBlLCBwaXhlbHMubmVnLngpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1ksXG4gICAgICAgIDAsIGZvcm1hdCwgd2lkdGgsIGhlaWdodCwgYm9yZGVyLCBmb3JtYXQsIHR5cGUsIHBpeGVscy5uZWcueSk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWixcbiAgICAgICAgMCwgZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCBib3JkZXIsIGZvcm1hdCwgdHlwZSwgcGl4ZWxzLm5lZy56KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsXG4gICAgICAgIDAsIGZvcm1hdCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMucG9zLngpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksXG4gICAgICAgIDAsIGZvcm1hdCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMucG9zLnkpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osXG4gICAgICAgIDAsIGZvcm1hdCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMucG9zLnopO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsXG4gICAgICAgIDAsIGZvcm1hdCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMubmVnLngpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1ksXG4gICAgICAgIDAsIGZvcm1hdCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMubmVnLnkpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osXG4gICAgICAgIDAsIGZvcm1hdCwgZm9ybWF0LCB0eXBlLCBwaXhlbHMubmVnLnopO1xuICAgIH1cblxuICAgIHRoaXMudW5iaW5kKCk7XG5cbiAgICBpZiAoZ2VuZXJhdGVNaXBtYXApIHtcbiAgICAgIHRoaXMuZ2VuZXJhdGVNaXBtYXAoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiJdfQ==