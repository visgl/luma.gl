'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // media has utility functions for image, video and audio manipulation (and
// maybe others like device, etc).

/* eslint-disable */ // TODO - this file needs cleanup


var _webgl = require('./webgl');

var _objects = require('./objects');

var _camera = require('./camera');

var _scenegraph = require('./scenegraph');

var _scenegraph2 = _interopRequireDefault(_scenegraph);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// length given a 45 fov angle, and 0.2 distance to camera
var length = 0.16568542494923805;
var camera = new _camera.PerspectiveCamera({
  fov: 45,
  aspect: 1,
  near: 0.1,
  far: 500,
  position: [0, 0, 0.2]
});

// TODO/rye: temporarily renaming this Img until we decide on a name that
// doesn't shadow the builtin Image class.

var Img = function () {
  function Img() {
    _classCallCheck(this, Img);
  }

  _createClass(Img, null, [{
    key: 'postProcess',


    // post process an image by setting it to a texture with a specified fragment
    // and vertex shader.
    value: function postProcess(opt) {
      var plane = new _objects.Plane({ type: 'x,y', xlen: length, ylen: length, offset: 0 });

      var program = app.program instanceof _webgl.Program ? app.program : app.program[opt.program];
      var textures = opt.fromTexture ? (0, _utils.splat)(opt.fromTexture) : [],
          framebuffer = opt.toFrameBuffer,
          screen = !!opt.toScreen,
          width = opt.width || app.canvas.width,
          height = opt.height || app.canvas.height,
          x = opt.viewportX || 0,
          y = opt.viewportY || 0;

      camera.aspect = opt.aspectRatio ? opt.aspectRatio : Math.max(height / width, width / height);
      camera.update();

      var scene = new _scenegraph2.default(app, program, camera);

      scene.program = program;

      plane.textures = textures;
      plane.program = program;

      if (!scene.models.length) {
        scene.add(plane);
      }

      if (framebuffer) {
        // create framebuffer
        if (!(framebuffer in app.frameBufferMemo)) {
          app.setFrameBuffer(framebuffer, {
            width: width,
            height: height,
            bindToTexture: {
              parameters: [{
                name: 'TEXTURE_MAG_FILTER',
                value: 'LINEAR'
              }, {
                name: 'TEXTURE_MIN_FILTER',
                value: 'LINEAR',
                generateMipmap: false
              }]
            },
            bindToRenderBuffer: false
          });
        }
        program.use();
        app.setFrameBuffer(framebuffer, true);
        gl.viewport(x, y, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.setUniforms(opt.uniforms || {});
        scene.renderToTexture(framebuffer);
        app.setFrameBuffer(framebuffer, false);
      }

      if (screen) {
        program.use();
        gl.viewport(x, y, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.setUniforms(opt.uniforms || {});
        scene.render();
      }

      return this;
    }
  }]);

  return Img;
}();

exports.default = Img;
//# sourceMappingURL=data:application/json;base64,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QVEsR0FBUixHQURVO0FBRVYsV0FBRyxRQUFILENBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsS0FBbEIsRUFBeUIsTUFBekIsRUFGVTtBQUdWLFdBQUcsS0FBSCxDQUFTLEdBQUcsZ0JBQUgsR0FBc0IsR0FBRyxnQkFBSCxDQUEvQixDQUhVO0FBSVYsZ0JBQVEsV0FBUixDQUFvQixJQUFJLFFBQUosSUFBZ0IsRUFBaEIsQ0FBcEIsQ0FKVTtBQUtWLGNBQU0sTUFBTixHQUxVO09BQVo7O0FBUUEsYUFBTyxJQUFQLENBbEVzQjs7OztTQUpMIiwiZmlsZSI6Im1lZGlhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbWVkaWEgaGFzIHV0aWxpdHkgZnVuY3Rpb25zIGZvciBpbWFnZSwgdmlkZW8gYW5kIGF1ZGlvIG1hbmlwdWxhdGlvbiAoYW5kXG4vLyBtYXliZSBvdGhlcnMgbGlrZSBkZXZpY2UsIGV0YykuXG5cbi8qIGVzbGludC1kaXNhYmxlICovIC8vIFRPRE8gLSB0aGlzIGZpbGUgbmVlZHMgY2xlYW51cFxuaW1wb3J0IHtQcm9ncmFtfSBmcm9tICcuL3dlYmdsJztcbmltcG9ydCB7UGxhbmV9IGZyb20gJy4vb2JqZWN0cyc7XG5pbXBvcnQge1BlcnNwZWN0aXZlQ2FtZXJhfSBmcm9tICcuL2NhbWVyYSc7XG5pbXBvcnQgU2NlbmUgZnJvbSAnLi9zY2VuZWdyYXBoJztcbmltcG9ydCB7c3BsYXR9IGZyb20gJy4vdXRpbHMnO1xuXG4vLyBsZW5ndGggZ2l2ZW4gYSA0NSBmb3YgYW5nbGUsIGFuZCAwLjIgZGlzdGFuY2UgdG8gY2FtZXJhXG5jb25zdCBsZW5ndGggPSAwLjE2NTY4NTQyNDk0OTIzODA1O1xuY29uc3QgY2FtZXJhID0gbmV3IFBlcnNwZWN0aXZlQ2FtZXJhKHtcbiAgZm92OiA0NSxcbiAgYXNwZWN0OiAxLFxuICBuZWFyOiAwLjEsXG4gIGZhcjogNTAwLFxuICBwb3NpdGlvbjogWzAsIDAsIDAuMl1cbn0pO1xuXG4vLyBUT0RPL3J5ZTogdGVtcG9yYXJpbHkgcmVuYW1pbmcgdGhpcyBJbWcgdW50aWwgd2UgZGVjaWRlIG9uIGEgbmFtZSB0aGF0XG4vLyBkb2Vzbid0IHNoYWRvdyB0aGUgYnVpbHRpbiBJbWFnZSBjbGFzcy5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW1nIHtcblxuICAvLyBwb3N0IHByb2Nlc3MgYW4gaW1hZ2UgYnkgc2V0dGluZyBpdCB0byBhIHRleHR1cmUgd2l0aCBhIHNwZWNpZmllZCBmcmFnbWVudFxuICAvLyBhbmQgdmVydGV4IHNoYWRlci5cbiAgc3RhdGljIHBvc3RQcm9jZXNzKG9wdCkge1xuICAgIGNvbnN0IHBsYW5lID1cbiAgICAgIG5ldyBQbGFuZSh7dHlwZTogJ3gseScsIHhsZW46IGxlbmd0aCwgeWxlbjogbGVuZ3RoLCBvZmZzZXQ6IDB9KTtcblxuICAgIGNvbnN0IHByb2dyYW0gPSBhcHAucHJvZ3JhbSBpbnN0YW5jZW9mIFByb2dyYW0gP1xuICAgICAgYXBwLnByb2dyYW0gOlxuICAgICAgYXBwLnByb2dyYW1bb3B0LnByb2dyYW1dO1xuICAgIHZhciB0ZXh0dXJlcyA9IG9wdC5mcm9tVGV4dHVyZSA/IHNwbGF0KG9wdC5mcm9tVGV4dHVyZSkgOiBbXSxcbiAgICAgICAgZnJhbWVidWZmZXIgPSBvcHQudG9GcmFtZUJ1ZmZlcixcbiAgICAgICAgc2NyZWVuID0gISFvcHQudG9TY3JlZW4sXG4gICAgICAgIHdpZHRoID0gb3B0LndpZHRoIHx8IGFwcC5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodCA9IG9wdC5oZWlnaHQgfHwgYXBwLmNhbnZhcy5oZWlnaHQsXG4gICAgICAgIHggPSBvcHQudmlld3BvcnRYIHx8IDAsXG4gICAgICAgIHkgPSBvcHQudmlld3BvcnRZIHx8IDA7XG5cbiAgICBjYW1lcmEuYXNwZWN0ID0gb3B0LmFzcGVjdFJhdGlvID9cbiAgICAgIG9wdC5hc3BlY3RSYXRpbyA6IE1hdGgubWF4KGhlaWdodCAvIHdpZHRoLCB3aWR0aCAvIGhlaWdodCk7XG4gICAgY2FtZXJhLnVwZGF0ZSgpO1xuXG4gICAgY29uc3Qgc2NlbmUgPSBuZXcgU2NlbmUoYXBwLCBwcm9ncmFtLCBjYW1lcmEpO1xuXG4gICAgc2NlbmUucHJvZ3JhbSA9IHByb2dyYW07XG5cbiAgICBwbGFuZS50ZXh0dXJlcyA9IHRleHR1cmVzO1xuICAgIHBsYW5lLnByb2dyYW0gPSBwcm9ncmFtO1xuXG4gICAgaWYgKCFzY2VuZS5tb2RlbHMubGVuZ3RoKSB7XG4gICAgICBzY2VuZS5hZGQocGxhbmUpO1xuICAgIH1cblxuICAgIGlmIChmcmFtZWJ1ZmZlcikge1xuICAgICAgLy8gY3JlYXRlIGZyYW1lYnVmZmVyXG4gICAgICBpZiAoIShmcmFtZWJ1ZmZlciBpbiBhcHAuZnJhbWVCdWZmZXJNZW1vKSkge1xuICAgICAgICBhcHAuc2V0RnJhbWVCdWZmZXIoZnJhbWVidWZmZXIsIHtcbiAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgYmluZFRvVGV4dHVyZToge1xuICAgICAgICAgICAgcGFyYW1ldGVyczogW3tcbiAgICAgICAgICAgICAgbmFtZTogJ1RFWFRVUkVfTUFHX0ZJTFRFUicsXG4gICAgICAgICAgICAgIHZhbHVlOiAnTElORUFSJ1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBuYW1lOiAnVEVYVFVSRV9NSU5fRklMVEVSJyxcbiAgICAgICAgICAgICAgdmFsdWU6ICdMSU5FQVInLFxuICAgICAgICAgICAgICBnZW5lcmF0ZU1pcG1hcDogZmFsc2VcbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgfSxcbiAgICAgICAgICBiaW5kVG9SZW5kZXJCdWZmZXI6IGZhbHNlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcHJvZ3JhbS51c2UoKTtcbiAgICAgIGFwcC5zZXRGcmFtZUJ1ZmZlcihmcmFtZWJ1ZmZlciwgdHJ1ZSk7XG4gICAgICBnbC52aWV3cG9ydCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMob3B0LnVuaWZvcm1zIHx8IHt9KTtcbiAgICAgIHNjZW5lLnJlbmRlclRvVGV4dHVyZShmcmFtZWJ1ZmZlcik7XG4gICAgICBhcHAuc2V0RnJhbWVCdWZmZXIoZnJhbWVidWZmZXIsIGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZiAoc2NyZWVuKSB7XG4gICAgICBwcm9ncmFtLnVzZSgpO1xuICAgICAgZ2wudmlld3BvcnQoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKG9wdC51bmlmb3JtcyB8fCB7fSk7XG4gICAgICBzY2VuZS5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iXX0=