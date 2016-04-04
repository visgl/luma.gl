'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TextureCube = exports.Texture2D = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('../utils');

var _context = require('./context');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Texture = function () {
  function Texture(gl) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Texture);

    this.gl = gl;
    this.target = gl.TEXTURE_2D;

    opts = (0, _utils.merge)({
      flipY: true,
      alignment: 1,
      magFilter: gl.NEAREST,
      minFilter: gl.NEAREST,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      format: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
      generateMipmap: false
    }, opts);

    this.flipY = opts.flipY;
    this.alignment = opts.alignment;
    this.magFilter = opts.magFilter;
    this.minFilter = opts.minFilter;
    this.wrapS = opts.wrapS;
    this.wrapT = opts.wrapT;
    this.format = opts.format;
    this.type = opts.type;
    this.generateMipmap = opts.generateMipmap;

    if (this.type === gl.FLOAT) {
      this.floatExtension = gl.getExtension('OES_texture_float');
      if (!this.floatExtension) {
        throw new Error('OES_texture_float is not supported.');
      }
    }

    this.texture = gl.createTexture();
    if (!this.texture) {
      (0, _context.glCheckError)(gl);
    }

    this.userData = {};
  }

  _createClass(Texture, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteTexture(this.texture);
      this.texture = null;
      (0, _context.glCheckError)(gl);

      return this;
    }
  }]);

  return Texture;
}();

var Texture2D = exports.Texture2D = function (_Texture) {
  _inherits(Texture2D, _Texture);

  function Texture2D(gl, opts) {
    _classCallCheck(this, Texture2D);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Texture2D).call(this, gl, opts));

    opts.data = opts.data || null;

    _this.width = 0;
    _this.height = 0;
    _this.border = 0;
    _this.data = null;
    Object.seal(_this);

    _this.update(opts);
    return _this;
  }

  _createClass(Texture2D, [{
    key: 'bind',
    value: function bind(index) {
      var gl = this.gl;
      if (index !== undefined) {
        gl.activeTexture(gl.TEXTURE0 + index);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      (0, _context.glCheckError)(gl);
      if (index === undefined) {
        var result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
        (0, _context.glCheckError)(gl);
        return result;
      }
      return index;
    }

    /* eslint-disable max-statements */

  }, {
    key: 'update',
    value: function update(opts) {
      var gl = this.gl;
      this.width = opts.width;
      this.height = opts.height;
      this.border = opts.border || 0;
      this.data = opts.data;
      if (this.flipY) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        (0, _context.glCheckError)(gl);
      } else {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        (0, _context.glCheckError)(gl);
      }
      this.bind();
      if (this.width || this.height) {
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data);
        (0, _context.glCheckError)(gl);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, this.data);
        (0, _context.glCheckError)(gl);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
      (0, _context.glCheckError)(gl);
      if (this.generateMipmap) {
        gl.generateMipmap(gl.TEXTURE_2D);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_2D, null);
      (0, _context.glCheckError)(gl);
    }
  }]);

  return Texture2D;
}(Texture);

var TextureCube = exports.TextureCube = function (_Texture2) {
  _inherits(TextureCube, _Texture2);

  function TextureCube(gl, opts) {
    _classCallCheck(this, TextureCube);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(TextureCube).call(this, gl, opts));

    opts.data = opts.data || null;
    _this2.update(opts);
    return _this2;
  }

  _createClass(TextureCube, [{
    key: 'bind',
    value: function bind(index) {
      var gl = this.gl;
      if (index !== undefined) {
        gl.activeTexture(gl.TEXTURE0 + index);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
      (0, _context.glCheckError)(gl);
      if (index === undefined) {
        var result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
        (0, _context.glCheckError)(gl);
        return result;
      }
      return index;
    }

    /* eslint-disable max-statements, max-len */

  }, {
    key: 'update',
    value: function update(opts) {
      var gl = this.gl;
      this.width = opts.width;
      this.height = opts.height;
      this.border = opts.border || 0;
      this.data = opts.data;
      this.bind();
      if (this.width || this.height) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.pos.z);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.format, this.width, this.height, this.border, this.format, this.type, this.data.neg.z);
        (0, _context.glCheckError)(gl);
      } else {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, this.format, this.format, this.type, this.data.pos.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, this.format, this.format, this.type, this.data.pos.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, this.format, this.format, this.type, this.data.pos.z);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, this.format, this.format, this.type, this.data.neg.x);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, this.format, this.format, this.type, this.data.neg.y);
        (0, _context.glCheckError)(gl);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, this.format, this.format, this.type, this.data.neg.z);
        (0, _context.glCheckError)(gl);
      }
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, this.minFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, this.magFilter);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, this.wrapS);
      (0, _context.glCheckError)(gl);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, this.wrapT);
      (0, _context.glCheckError)(gl);
      if (this.generateMipmap) {
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        (0, _context.glCheckError)(gl);
      }
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      (0, _context.glCheckError)(gl);
    }
  }]);

  return TextureCube;
}(Texture);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC90ZXh0dXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7OztJQUVNO0FBRUosV0FGSSxPQUVKLENBQVksRUFBWixFQUEyQjtRQUFYLDZEQUFPLGtCQUFJOzswQkFGdkIsU0FFdUI7O0FBQ3pCLFNBQUssRUFBTCxHQUFVLEVBQVYsQ0FEeUI7QUFFekIsU0FBSyxNQUFMLEdBQWMsR0FBRyxVQUFILENBRlc7O0FBSXpCLFdBQU8sa0JBQU07QUFDWCxhQUFPLElBQVA7QUFDQSxpQkFBVyxDQUFYO0FBQ0EsaUJBQVcsR0FBRyxPQUFIO0FBQ1gsaUJBQVcsR0FBRyxPQUFIO0FBQ1gsYUFBTyxHQUFHLGFBQUg7QUFDUCxhQUFPLEdBQUcsYUFBSDtBQUNQLGNBQVEsR0FBRyxJQUFIO0FBQ1IsWUFBTSxHQUFHLGFBQUg7QUFDTixzQkFBZ0IsS0FBaEI7S0FUSyxFQVVKLElBVkksQ0FBUCxDQUp5Qjs7QUFnQnpCLFNBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQWhCWTtBQWlCekIsU0FBSyxTQUFMLEdBQWlCLEtBQUssU0FBTCxDQWpCUTtBQWtCekIsU0FBSyxTQUFMLEdBQWlCLEtBQUssU0FBTCxDQWxCUTtBQW1CekIsU0FBSyxTQUFMLEdBQWlCLEtBQUssU0FBTCxDQW5CUTtBQW9CekIsU0FBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLENBcEJZO0FBcUJ6QixTQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsQ0FyQlk7QUFzQnpCLFNBQUssTUFBTCxHQUFjLEtBQUssTUFBTCxDQXRCVztBQXVCekIsU0FBSyxJQUFMLEdBQVksS0FBSyxJQUFMLENBdkJhO0FBd0J6QixTQUFLLGNBQUwsR0FBc0IsS0FBSyxjQUFMLENBeEJHOztBQTBCekIsUUFBSSxLQUFLLElBQUwsS0FBYyxHQUFHLEtBQUgsRUFBVTtBQUMxQixXQUFLLGNBQUwsR0FBc0IsR0FBRyxZQUFILENBQWdCLG1CQUFoQixDQUF0QixDQUQw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S0FBSyxJQUFMLEVBQVcsS0FBSyxJQUFMLENBQVUsR0FBVixDQUFjLENBQWQsQ0FBdEYsQ0FYSztBQVlMLG1DQUFhLEVBQWIsRUFaSztPQWJQO0FBMkJBLFNBQUcsYUFBSCxDQUFpQixHQUFHLGdCQUFILEVBQXFCLEdBQUcsa0JBQUgsRUFBdUIsS0FBSyxTQUFMLENBQTdELENBbENXO0FBbUNYLGlDQUFhLEVBQWIsRUFuQ1c7QUFvQ1gsU0FBRyxhQUFILENBQWlCLEdBQUcsZ0JBQUgsRUFBcUIsR0FBRyxrQkFBSCxFQUF1QixLQUFLLFNBQUwsQ0FBN0QsQ0FwQ1c7QUFxQ1gsaUNBQWEsRUFBYixFQXJDVztBQXNDWCxTQUFHLGFBQUgsQ0FBaUIsR0FBRyxnQkFBSCxFQUFxQixHQUFHLGNBQUgsRUFBbUIsS0FBSyxLQUFMLENBQXpELENBdENXO0FBdUNYLGlDQUFhLEVBQWIsRUF2Q1c7QUF3Q1gsU0FBRyxhQUFILENBQWlCLEdBQUcsZ0JBQUgsRUFBcUIsR0FBRyxjQUFILEVBQW1CLEtBQUssS0FBTCxDQUF6RCxDQXhDVztBQXlDWCxpQ0FBYSxFQUFiLEVBekNXO0FBMENYLFVBQUksS0FBSyxjQUFMLEVBQXFCO0FBQ3ZCLFdBQUcsY0FBSCxDQUFrQixHQUFHLGdCQUFILENBQWxCLENBRHVCO0FBRXZCLG1DQUFhLEVBQWIsRUFGdUI7T0FBekI7QUFJQSxTQUFHLFdBQUgsQ0FBZSxHQUFHLGdCQUFILEVBQXFCLElBQXBDLEVBOUNXO0FBK0NYLGlDQUFhLEVBQWIsRUEvQ1c7Ozs7U0F6QkY7RUFBb0IiLCJmaWxlIjoidGV4dHVyZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuXG5jbGFzcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMudGFyZ2V0ID0gZ2wuVEVYVFVSRV8yRDtcblxuICAgIG9wdHMgPSBtZXJnZSh7XG4gICAgICBmbGlwWTogdHJ1ZSxcbiAgICAgIGFsaWdubWVudDogMSxcbiAgICAgIG1hZ0ZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIG1pbkZpbHRlcjogZ2wuTkVBUkVTVCxcbiAgICAgIHdyYXBTOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgd3JhcFQ6IGdsLkNMQU1QX1RPX0VER0UsXG4gICAgICBmb3JtYXQ6IGdsLlJHQkEsXG4gICAgICB0eXBlOiBnbC5VTlNJR05FRF9CWVRFLFxuICAgICAgZ2VuZXJhdGVNaXBtYXA6IGZhbHNlXG4gICAgfSwgb3B0cyk7XG5cbiAgICB0aGlzLmZsaXBZID0gb3B0cy5mbGlwWTtcbiAgICB0aGlzLmFsaWdubWVudCA9IG9wdHMuYWxpZ25tZW50O1xuICAgIHRoaXMubWFnRmlsdGVyID0gb3B0cy5tYWdGaWx0ZXI7XG4gICAgdGhpcy5taW5GaWx0ZXIgPSBvcHRzLm1pbkZpbHRlcjtcbiAgICB0aGlzLndyYXBTID0gb3B0cy53cmFwUztcbiAgICB0aGlzLndyYXBUID0gb3B0cy53cmFwVDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0O1xuICAgIHRoaXMudHlwZSA9IG9wdHMudHlwZTtcbiAgICB0aGlzLmdlbmVyYXRlTWlwbWFwID0gb3B0cy5nZW5lcmF0ZU1pcG1hcDtcblxuICAgIGlmICh0aGlzLnR5cGUgPT09IGdsLkZMT0FUKSB7XG4gICAgICB0aGlzLmZsb2F0RXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9mbG9hdCcpO1xuICAgICAgaWYgKCF0aGlzLmZsb2F0RXh0ZW5zaW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignT0VTX3RleHR1cmVfZmxvYXQgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgaWYgKCF0aGlzLnRleHR1cmUpIHtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuXG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlKTtcbiAgICB0aGlzLnRleHR1cmUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0dXJlMkQgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcblxuICAgIHRoaXMud2lkdGggPSAwO1xuICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICB0aGlzLmJvcmRlciA9IDA7XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgYmluZChpbmRleCkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIGluZGV4KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKSAtIGdsLlRFWFRVUkUwO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHVwZGF0ZShvcHRzKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0cy5oZWlnaHQ7XG4gICAgdGhpcy5ib3JkZXIgPSBvcHRzLmJvcmRlciB8fCAwO1xuICAgIHRoaXMuZGF0YSA9IG9wdHMuZGF0YTtcbiAgICBpZiAodGhpcy5mbGlwWSkge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH0gZWxzZSB7XG4gICAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICB0aGlzLmJpbmQoKTtcbiAgICBpZiAodGhpcy53aWR0aCB8fCB0aGlzLmhlaWdodCkge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsXG4gICAgICAgIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSxcbiAgICAgICAgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLm1pbkZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5tYWdGaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgdGhpcy53cmFwUyk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLndyYXBUKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmICh0aGlzLmdlbmVyYXRlTWlwbWFwKSB7XG4gICAgICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZUN1YmUgZXh0ZW5kcyBUZXh0dXJlIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIHN1cGVyKGdsLCBvcHRzKTtcbiAgICBvcHRzLmRhdGEgPSBvcHRzLmRhdGEgfHwgbnVsbDtcbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbWF4LWxlbiAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuYm9yZGVyLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3Mueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLngpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueik7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV9DVUJFX01BUCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cbiJdfQ==