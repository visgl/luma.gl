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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC90ZXh0dXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHTTtBQUVKLFdBRkksT0FFSixDQUFZLEVBQVosRUFBMkI7UUFBWCw2REFBTyxrQkFBSTs7MEJBRnZCLFNBRXVCOztBQUN6QixTQUFLLEVBQUwsR0FBVSxFQUFWLENBRHlCO0FBRXpCLFNBQUssTUFBTCxHQUFjLEdBQUcsVUFBSCxDQUZXOztBQUl6QixXQUFPLGtCQUFNO0FBQ1gsYUFBTyxJQUFQO0FBQ0EsaUJBQVcsQ0FBWDtBQUNBLGlCQUFXLEdBQUcsT0FBSDtBQUNYLGlCQUFXLEdBQUcsT0FBSDtBQUNYLGFBQU8sR0FBRyxhQUFIO0FBQ1AsYUFBTyxHQUFHLGFBQUg7QUFDUCxjQUFRLEdBQUcsSUFBSDtBQUNSLFlBQU0sR0FBRyxhQUFIO0FBQ04sc0JBQWdCLEtBQWhCO0tBVEssRUFVSixJQVZJLENBQVAsQ0FKeUI7O0FBZ0J6QixTQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsQ0FoQlk7QUFpQnpCLFNBQUssU0FBTCxHQUFpQixLQUFLLFNBQUwsQ0FqQlE7QUFrQnpCLFNBQUssU0FBTCxHQUFpQixLQUFLLFNBQUwsQ0FsQlE7QUFtQnpCLFNBQUssU0FBTCxHQUFpQixLQUFLLFNBQUwsQ0FuQlE7QUFvQnpCLFNBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQXBCWTtBQXFCekIsU0FBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLENBckJZO0FBc0J6QixTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQUwsQ0F0Qlc7QUF1QnpCLFNBQUssSUFBTCxHQUFZLEtBQUssSUFBTCxDQXZCYTtBQXdCekIsU0FBSyxjQUFMLEdBQXNCLEtBQUssY0FBTCxDQXhCRzs7QUEwQnpCLFFBQUksS0FBSyxJQUFMLEtBQWMsR0FBRyxLQUFILEVBQVU7QUFDMUIsV0FBSyxjQUFMLEdBQXNCLEdBQUcsWUFBSCxDQUFnQixtQkFBaEIsQ0FBdEIsQ0FEMEI7QUFFMUIs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TCxFQUFXLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBYyxDQUFkLENBQXRGLENBWEs7QUFZTCxtQ0FBYSxFQUFiLEVBWks7T0FiUDtBQTJCQSxTQUFHLGFBQUgsQ0FBaUIsR0FBRyxnQkFBSCxFQUFxQixHQUFHLGtCQUFILEVBQXVCLEtBQUssU0FBTCxDQUE3RCxDQWxDVztBQW1DWCxpQ0FBYSxFQUFiLEVBbkNXO0FBb0NYLFNBQUcsYUFBSCxDQUFpQixHQUFHLGdCQUFILEVBQXFCLEdBQUcsa0JBQUgsRUFBdUIsS0FBSyxTQUFMLENBQTdELENBcENXO0FBcUNYLGlDQUFhLEVBQWIsRUFyQ1c7QUFzQ1gsU0FBRyxhQUFILENBQWlCLEdBQUcsZ0JBQUgsRUFBcUIsR0FBRyxjQUFILEVBQW1CLEtBQUssS0FBTCxDQUF6RCxDQXRDVztBQXVDWCxpQ0FBYSxFQUFiLEVBdkNXO0FBd0NYLFNBQUcsYUFBSCxDQUFpQixHQUFHLGdCQUFILEVBQXFCLEdBQUcsY0FBSCxFQUFtQixLQUFLLEtBQUwsQ0FBekQsQ0F4Q1c7QUF5Q1gsaUNBQWEsRUFBYixFQXpDVztBQTBDWCxVQUFJLEtBQUssY0FBTCxFQUFxQjtBQUN2QixXQUFHLGNBQUgsQ0FBa0IsR0FBRyxnQkFBSCxDQUFsQixDQUR1QjtBQUV2QixtQ0FBYSxFQUFiLEVBRnVCO09BQXpCO0FBSUEsU0FBRyxXQUFILENBQWUsR0FBRyxnQkFBSCxFQUFxQixJQUFwQyxFQTlDVztBQStDWCxpQ0FBYSxFQUFiLEVBL0NXOzs7O1NBekJGO0VBQW9CIiwiZmlsZSI6InRleHR1cmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcblxuY2xhc3MgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLnRhcmdldCA9IGdsLlRFWFRVUkVfMkQ7XG5cbiAgICBvcHRzID0gbWVyZ2Uoe1xuICAgICAgZmxpcFk6IHRydWUsXG4gICAgICBhbGlnbm1lbnQ6IDEsXG4gICAgICBtYWdGaWx0ZXI6IGdsLk5FQVJFU1QsXG4gICAgICBtaW5GaWx0ZXI6IGdsLk5FQVJFU1QsXG4gICAgICB3cmFwUzogZ2wuQ0xBTVBfVE9fRURHRSxcbiAgICAgIHdyYXBUOiBnbC5DTEFNUF9UT19FREdFLFxuICAgICAgZm9ybWF0OiBnbC5SR0JBLFxuICAgICAgdHlwZTogZ2wuVU5TSUdORURfQllURSxcbiAgICAgIGdlbmVyYXRlTWlwbWFwOiBmYWxzZVxuICAgIH0sIG9wdHMpO1xuXG4gICAgdGhpcy5mbGlwWSA9IG9wdHMuZmxpcFk7XG4gICAgdGhpcy5hbGlnbm1lbnQgPSBvcHRzLmFsaWdubWVudDtcbiAgICB0aGlzLm1hZ0ZpbHRlciA9IG9wdHMubWFnRmlsdGVyO1xuICAgIHRoaXMubWluRmlsdGVyID0gb3B0cy5taW5GaWx0ZXI7XG4gICAgdGhpcy53cmFwUyA9IG9wdHMud3JhcFM7XG4gICAgdGhpcy53cmFwVCA9IG9wdHMud3JhcFQ7XG4gICAgdGhpcy5mb3JtYXQgPSBvcHRzLmZvcm1hdDtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGU7XG4gICAgdGhpcy5nZW5lcmF0ZU1pcG1hcCA9IG9wdHMuZ2VuZXJhdGVNaXBtYXA7XG5cbiAgICBpZiAodGhpcy50eXBlID09PSBnbC5GTE9BVCkge1xuICAgICAgdGhpcy5mbG9hdEV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbignT0VTX3RleHR1cmVfZmxvYXQnKTtcbiAgICAgIGlmICghdGhpcy5mbG9hdEV4dGVuc2lvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09FU190ZXh0dXJlX2Zsb2F0IGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy50ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIGlmICghdGhpcy50ZXh0dXJlKSB7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cblxuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZSk7XG4gICAgdGhpcy50ZXh0dXJlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgVGV4dHVyZTJEIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBzdXBlcihnbCwgb3B0cyk7XG4gICAgb3B0cy5kYXRhID0gb3B0cy5kYXRhIHx8IG51bGw7XG5cbiAgICB0aGlzLndpZHRoID0gMDtcbiAgICB0aGlzLmhlaWdodCA9IDA7XG4gICAgdGhpcy5ib3JkZXIgPSAwO1xuICAgIHRoaXMuZGF0YSA9IG51bGw7XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG5cbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGJpbmQoaW5kZXgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyBpbmRleCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSkgLSBnbC5URVhUVVJFMDtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICB1cGRhdGUob3B0cykge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcbiAgICB0aGlzLndpZHRoID0gb3B0cy53aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0O1xuICAgIHRoaXMuYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGE7XG4gICAgaWYgKHRoaXMuZmxpcFkpIHtcbiAgICAgIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgZmFsc2UpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgdGhpcy5iaW5kKCk7XG4gICAgaWYgKHRoaXMud2lkdGggfHwgdGhpcy5oZWlnaHQpIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LFxuICAgICAgICB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsXG4gICAgICAgIHRoaXMuZGF0YSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMubWFnRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMud3JhcFMpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgdGhpcy53cmFwVCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBpZiAodGhpcy5nZW5lcmF0ZU1pcG1hcCkge1xuICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFRleHR1cmVDdWJlIGV4dGVuZHMgVGV4dHVyZSB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBzdXBlcihnbCwgb3B0cyk7XG4gICAgb3B0cy5kYXRhID0gb3B0cy5kYXRhIHx8IG51bGw7XG4gICAgdGhpcy51cGRhdGUob3B0cyk7XG4gIH1cblxuICBiaW5kKGluZGV4KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgaW5kZXgpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGhpcy50ZXh0dXJlKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGlmIChpbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpIC0gZ2wuVEVYVFVSRTA7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG1heC1sZW4gKi9cbiAgdXBkYXRlKG9wdHMpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRzLmhlaWdodDtcbiAgICB0aGlzLmJvcmRlciA9IG9wdHMuYm9yZGVyIHx8IDA7XG4gICAgdGhpcy5kYXRhID0gb3B0cy5kYXRhO1xuICAgIHRoaXMuYmluZCgpO1xuICAgIGlmICh0aGlzLndpZHRoIHx8IHRoaXMuaGVpZ2h0KSB7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy55KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgdGhpcy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmJvcmRlciwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy56KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLnBvcy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5wb3MueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEucG9zLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCB0aGlzLmZvcm1hdCwgdGhpcy5mb3JtYXQsIHRoaXMudHlwZSwgdGhpcy5kYXRhLm5lZy54KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIHRoaXMuZGF0YS5uZWcueSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIDAsIHRoaXMuZm9ybWF0LCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCB0aGlzLmRhdGEubmVnLnopO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFX0NVQkVfTUFQLCBnbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMubWluRmlsdGVyKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLm1hZ0ZpbHRlcik7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLndyYXBTKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMud3JhcFQpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgaWYgKHRoaXMuZ2VuZXJhdGVNaXBtYXApIHtcbiAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfQ1VCRV9NQVApO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbCk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgfVxuXG59XG4iXX0=