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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9mYm8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBR3FCO0FBRW5CLFdBRm1CLFdBRW5CLENBQVksRUFBWixFQUEyQjtRQUFYLDZEQUFPLGtCQUFJOzswQkFGUixhQUVROztBQUN6QixTQUFLLEVBQUwsR0FBVSxFQUFWLENBRHlCOztBQUd6QixTQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsR0FBYSxDQUExQixDQUhZO0FBSXpCLFNBQUssTUFBTCxHQUFjLEtBQUssTUFBTCxHQUFjLEtBQUssTUFBTCxHQUFjLENBQTVCLENBSlc7QUFLekIsU0FBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLEtBQWUsU0FBZixHQUEyQixJQUEzQixHQUFrQyxLQUFLLEtBQUwsQ0FMdEI7QUFNekIsU0FBSyxTQUFMLEdBQWlCLEtBQUssU0FBTCxJQUFrQixHQUFHLE9BQUgsQ0FOVjtBQU96QixTQUFLLFNBQUwsR0FBaUIsS0FBSyxTQUFMLElBQWtCLEdBQUcsT0FBSCxDQVBWO0FBUXpCLFNBQUssTUFBTCxHQUFjLEtBQUssTUFBTCxJQUFlLEdBQUcsSUFBSCxDQVJKO0FBU3pCLFNBQUssSUFBTCxHQUFZLEtBQUssSUFBTCxJQUFhLEdBQUcsYUFBSCxDQVRBO0FBVXpCLFNBQUssR0FBTCxHQUFXLEdBQUcsaUJBQUgsRUFBWCxDQVZ5QjtBQVd6QixTQUFLLElBQUwsR0FYeUI7O0FBYXpCLFNBQUssT0FBTCxHQUFlLHVCQUFjLEVBQWQsRUFBa0I7QUFDL0IsYUFBTyxLQUFLLEtBQUw7QUFDUCxjQUFRLEtBQUssTUFBTDtBQUNSLGlCQUFXLEtBQUssU0FBTDtBQUNYLGlCQUFXLEtBQUssU0FBTDtBQUNYLFlBQU0sS0FBSyxJQUFMO0FBQ04sY0FBUSxLQUFLLE1BQUw7S0FOSyxDQUFmLENBYnlCOztBQXNCekIsT0FBRyxvQkFBSCxDQUNFLEdBQUcsV0FBSCxFQUNBLEdBQUcsaUJBQUgsRUFBc0IsR0FBRyxVQUFILEVBQWUsS0FBSyxPQUFMLENBQWEsT0FBYixFQUFzQixDQUY3RCxFQXRCeUI7O0FBMkJ6QixRQUFJLEtBQUssS0FBTCxFQUFZO0FBQ2QsV0FBSyxLQUFMLEdBQWEsR0FBRyxrQkFBSCxFQUFiLENBRGM7QUFFZCxTQUFHLGdCQUFILENBQW9CLEdBQUcsWUFBSCxFQUFpQixLQUFLLEtBQUwsQ0FBckMsQ0FGYztBQUdkLFNBQUcsbUJBQUgsQ0FDRSxHQUFHLFlBQUgsRUFBaUIsR0FBRyxpQkFBSCxFQUFzQixLQUFLLEtBQUwsRUFBWSxLQUFLLE1BQUwsQ0FEckQsQ0FIYztBQU1kLFNBQUcsdUJBQUgsQ0FDRSxHQUFHLFdBQUgsRUFBZ0IsR0FBRyxnQkFBSCxFQUFxQixHQUFHLFlBQUgsRUFBaUIsS0FBSyxLQUFMLENBRHhELENBTmM7S0FBaEI7O0FBV0EsUUFBSSxTQUFTLEdBQUcsc0JBQUgsQ0FBMEIsR0FBRyxXQUFILENBQW5DLENBdENxQjtBQXVDekIsUUFBSSxXQUFXLEdBQUcsb0JBQUgsRUFBeUI7QUFDdEMsWUFBTSxJQUFJLEtBQUosQ0FBVSw4QkFBVixDQUFOLENBRHNDO0tBQXhDOztBQUlBLE9BQUcsZ0JBQUgsQ0FBb0IsR0FBRyxZQUFILEVBQWlCLElBQXJDLEVBM0N5QjtBQTRDekIsT0FBRyxlQUFILENBQW1CLEdBQUcsV0FBSCxFQUFnQixJQUFuQyxFQTVDeUI7R0FBM0I7O2VBRm1COzsyQkFrRFo7QUFDTCxVQUFNLEtBQUssS0FBSyxFQUFMLENBRE47QUFFTCxTQUFHLGVBQUgsQ0FBbUIsR0FBRyxXQUFILEVBQWdCLEtBQUssR0FBTCxDQUFuQyxDQUZLOzs7O1NBbERZIiwiZmlsZSI6ImZiby5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0IHtUZXh0dXJlMkR9IGZyb20gJy4vdGV4dHVyZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZyYW1lYnVmZmVyIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cyA9IHt9KSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuXG4gICAgdGhpcy53aWR0aCA9IG9wdHMud2lkdGggPyBvcHRzLndpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IG9wdHMuaGVpZ2h0ID8gb3B0cy5oZWlnaHQgOiAxO1xuICAgIHRoaXMuZGVwdGggPSBvcHRzLmRlcHRoID09PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0cy5kZXB0aDtcbiAgICB0aGlzLm1pbkZpbHRlciA9IG9wdHMubWluRmlsdGVyIHx8IGdsLk5FQVJFU1Q7XG4gICAgdGhpcy5tYWdGaWx0ZXIgPSBvcHRzLm1hZ0ZpbHRlciB8fCBnbC5ORUFSRVNUO1xuICAgIHRoaXMuZm9ybWF0ID0gb3B0cy5mb3JtYXQgfHwgZ2wuUkdCQTtcbiAgICB0aGlzLnR5cGUgPSBvcHRzLnR5cGUgfHwgZ2wuVU5TSUdORURfQllURTtcbiAgICB0aGlzLmZibyA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgdGhpcy5iaW5kKCk7XG5cbiAgICB0aGlzLnRleHR1cmUgPSBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBtaW5GaWx0ZXI6IHRoaXMubWluRmlsdGVyLFxuICAgICAgbWFnRmlsdGVyOiB0aGlzLm1hZ0ZpbHRlcixcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGZvcm1hdDogdGhpcy5mb3JtYXRcbiAgICB9KTtcblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxuICAgICAgZ2wuRlJBTUVCVUZGRVIsXG4gICAgICBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlLnRleHR1cmUsIDBcbiAgICApO1xuXG4gICAgaWYgKHRoaXMuZGVwdGgpIHtcbiAgICAgIHRoaXMuZGVwdGggPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCB0aGlzLmRlcHRoKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoXG4gICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0XG4gICAgICApO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoXG4gICAgICAgIGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIHRoaXMuZGVwdGhcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuICAgIGlmIChzdGF0dXMgIT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZyYW1lYnVmZmVyIGNyZWF0aW9uIGZhaWxlZC4nKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZibyk7XG4gIH1cblxufVxuIl19