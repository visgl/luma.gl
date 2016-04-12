'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _texture = require('./texture');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Framebuffer = function () {
  function Framebuffer(gl) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Framebuffer);

    this.gl = gl;

    this.width = opts.width ? opts.width : 1;
    this.height = opts.height ? opts.height : 1;
    this.depth = opts.depth === undefined ? true : opts.depth;
    this.minFilter = opts.minFilter || gl.NEAREST;
    this.magFilter = opts.magFilter || gl.NEAREST;
    this.format = opts.format || gl.RGBA;
    this.type = opts.type || gl.UNSIGNED_BYTE;
    this.fbo = gl.createFramebuffer();
    this.bind();

    this.texture = new _texture.Texture2D(gl, {
      width: this.width,
      height: this.height,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      type: this.type,
      format: this.format
    });

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0);

    if (this.depth) {
      this.depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);
    }

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer creation failed.');
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _createClass(Framebuffer, [{
    key: 'bind',
    value: function bind() {
      var gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    }
  }]);

  return Framebuffer;
}();

exports.default = Framebuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9mYm8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFDQTs7OztJQUVxQjtBQUVuQixXQUZtQixXQUVuQixDQUFZLEVBQVosRUFBMkI7UUFBWCw2REFBTyxrQkFBSTs7MEJBRlIsYUFFUTs7QUFDekIsU0FBSyxFQUFMLEdBQVUsRUFBVixDQUR5Qjs7QUFHekIsU0FBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLEdBQWEsQ0FBMUIsQ0FIWTtBQUl6QixTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQUwsR0FBYyxLQUFLLE1BQUwsR0FBYyxDQUE1QixDQUpXO0FBS3pCLFNBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxLQUFlLFNBQWYsR0FBMkIsSUFBM0IsR0FBa0MsS0FBSyxLQUFMLENBTHRCO0FBTXpCLFNBQUssU0FBTCxHQUFpQixLQUFLLFNBQUwsSUFBa0IsR0FBRyxPQUFILENBTlY7QUFPekIsU0FBSyxTQUFMLEdBQWlCLEtBQUssU0FBTCxJQUFrQixHQUFHLE9BQUgsQ0FQVjtBQVF6QixTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQUwsSUFBZSxHQUFHLElBQUgsQ0FSSjtBQVN6QixTQUFLLElBQUwsR0FBWSxLQUFLLElBQUwsSUFBYSxHQUFHLGFBQUgsQ0FUQTtBQVV6QixTQUFLLEdBQUwsR0FBVyxHQUFHLGlCQUFILEVBQVgsQ0FWeUI7QUFXekIsU0FBSyxJQUFMLEdBWHlCOztBQWF6QixTQUFLLE9BQUwsR0FBZSx1QkFBYyxFQUFkLEVBQWtCO0FBQy9CLGFBQU8sS0FBSyxLQUFMO0FBQ1AsY0FBUSxLQUFLLE1BQUw7QUFDUixpQkFBVyxLQUFLLFNBQUw7QUFDWCxpQkFBVyxLQUFLLFNBQUw7QUFDWCxZQUFNLEtBQUssSUFBTDtBQUNOLGNBQVEsS0FBSyxNQUFMO0tBTkssQ0FBZixDQWJ5Qjs7QUFzQnpCLE9BQUcsb0JBQUgsQ0FDRSxHQUFHLFdBQUgsRUFDQSxHQUFHLGlCQUFILEVBQXNCLEdBQUcsVUFBSCxFQUFlLEtBQUssT0FBTCxDQUFhLE9BQWIsRUFBc0IsQ0FGN0QsRUF0QnlCOztBQTJCekIsUUFBSSxLQUFLLEtBQUwsRUFBWTtBQUNkLFdBQUssS0FBTCxHQUFhLEdBQUcsa0JBQUgsRUFBYixDQURjO0FBRWQsU0FBRyxnQkFBSCxDQUFvQixHQUFHLFlBQUgsRUFBaUIsS0FBSyxLQUFMLENBQXJDLENBRmM7QUFHZCxTQUFHLG1CQUFILENBQ0UsR0FBRyxZQUFILEVBQWlCLEdBQUcsaUJBQUgsRUFBc0IsS0FBSyxLQUFMLEVBQVksS0FBSyxNQUFMLENBRHJELENBSGM7QUFNZCxTQUFHLHVCQUFILENBQ0UsR0FBRyxXQUFILEVBQWdCLEdBQUcsZ0JBQUgsRUFBcUIsR0FBRyxZQUFILEVBQWlCLEtBQUssS0FBTCxDQUR4RCxDQU5jO0tBQWhCOztBQVdBLFFBQUksU0FBUyxHQUFHLHNCQUFILENBQTBCLEdBQUcsV0FBSCxDQUFuQyxDQXRDcUI7QUF1Q3pCLFFBQUksV0FBVyxHQUFHLG9CQUFILEVBQXlCO0FBQ3RDLFlBQU0sSUFBSSxLQUFKLENBQVUsOEJBQVYsQ0FBTixDQURzQztLQUF4Qzs7QUFJQSxPQUFHLGdCQUFILENBQW9CLEdBQUcsWUFBSCxFQUFpQixJQUFyQyxFQTNDeUI7QUE0Q3pCLE9BQUcsZUFBSCxDQUFtQixHQUFHLFdBQUgsRUFBZ0IsSUFBbkMsRUE1Q3lCO0dBQTNCOztlQUZtQjs7MkJBa0RaO0FBQ0wsVUFBTSxLQUFLLEtBQUssRUFBTCxDQUROO0FBRUwsU0FBRyxlQUFILENBQW1CLEdBQUcsV0FBSCxFQUFnQixLQUFLLEdBQUwsQ0FBbkMsQ0FGSzs7OztTQWxEWSIsImZpbGUiOiJmYm8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7VGV4dHVyZTJEfSBmcm9tICcuL3RleHR1cmUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGcmFtZWJ1ZmZlciB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMgPSB7fSkge1xuICAgIHRoaXMuZ2wgPSBnbDtcblxuICAgIHRoaXMud2lkdGggPSBvcHRzLndpZHRoID8gb3B0cy53aWR0aCA6IDE7XG4gICAgdGhpcy5oZWlnaHQgPSBvcHRzLmhlaWdodCA/IG9wdHMuaGVpZ2h0IDogMTtcbiAgICB0aGlzLmRlcHRoID0gb3B0cy5kZXB0aCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IG9wdHMuZGVwdGg7XG4gICAgdGhpcy5taW5GaWx0ZXIgPSBvcHRzLm1pbkZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMubWFnRmlsdGVyID0gb3B0cy5tYWdGaWx0ZXIgfHwgZ2wuTkVBUkVTVDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdHMuZm9ybWF0IHx8IGdsLlJHQkE7XG4gICAgdGhpcy50eXBlID0gb3B0cy50eXBlIHx8IGdsLlVOU0lHTkVEX0JZVEU7XG4gICAgdGhpcy5mYm8gPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIHRoaXMuYmluZCgpO1xuXG4gICAgdGhpcy50ZXh0dXJlID0gbmV3IFRleHR1cmUyRChnbCwge1xuICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgbWluRmlsdGVyOiB0aGlzLm1pbkZpbHRlcixcbiAgICAgIG1hZ0ZpbHRlcjogdGhpcy5tYWdGaWx0ZXIsXG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBmb3JtYXQ6IHRoaXMuZm9ybWF0XG4gICAgfSk7XG5cbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChcbiAgICAgIGdsLkZSQU1FQlVGRkVSLFxuICAgICAgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZS50ZXh0dXJlLCAwXG4gICAgKTtcblxuICAgIGlmICh0aGlzLmRlcHRoKSB7XG4gICAgICB0aGlzLmRlcHRoID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgdGhpcy5kZXB0aCk7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKFxuICAgICAgICBnbC5SRU5ERVJCVUZGRVIsIGdsLkRFUFRIX0NPTVBPTkVOVDE2LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodFxuICAgICAgKTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKFxuICAgICAgICBnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfQVRUQUNITUVOVCwgZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoXG4gICAgICApO1xuICAgIH1cblxuICAgIHZhciBzdGF0dXMgPSBnbC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKGdsLkZSQU1FQlVGRkVSKTtcbiAgICBpZiAoc3RhdHVzICE9PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGcmFtZWJ1ZmZlciBjcmVhdGlvbiBmYWlsZWQuJyk7XG4gICAgfVxuXG4gICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG5cbiAgfVxuXG4gIGJpbmQoKSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgdGhpcy5mYm8pO1xuICB9XG5cbn1cbiJdfQ==