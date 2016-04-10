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
//# sourceMappingURL=data:application/json;base64,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SSxNQUFKLEVBQVk7QUFDVixnQkFBUSxHQUFSLEdBRFU7QUFFVixXQUFHLFFBQUgsQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixLQUFsQixFQUF5QixNQUF6QixFQUZVO0FBR1YsV0FBRyxLQUFILENBQVMsR0FBRyxnQkFBSCxHQUFzQixHQUFHLGdCQUFILENBQS9CLENBSFU7QUFJVixnQkFBUSxXQUFSLENBQW9CLElBQUksUUFBSixJQUFnQixFQUFoQixDQUFwQixDQUpVO0FBS1YsY0FBTSxNQUFOLEdBTFU7T0FBWjs7QUFRQSxhQUFPLElBQVAsQ0FsRXNCOzs7O1NBSkwiLCJmaWxlIjoibWVkaWEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBtZWRpYSBoYXMgdXRpbGl0eSBmdW5jdGlvbnMgZm9yIGltYWdlLCB2aWRlbyBhbmQgYXVkaW8gbWFuaXB1bGF0aW9uIChhbmRcbi8vIG1heWJlIG90aGVycyBsaWtlIGRldmljZSwgZXRjKS5cblxuLyogZXNsaW50LWRpc2FibGUgKi8gLy8gVE9ETyAtIHRoaXMgZmlsZSBuZWVkcyBjbGVhbnVwXG5pbXBvcnQge1Byb2dyYW19IGZyb20gJy4vd2ViZ2wnO1xuaW1wb3J0IHtQbGFuZX0gZnJvbSAnLi9vYmplY3RzJztcbmltcG9ydCB7UGVyc3BlY3RpdmVDYW1lcmF9IGZyb20gJy4vY2FtZXJhJztcbmltcG9ydCBTY2VuZSBmcm9tICcuL3NjZW5lZ3JhcGgnO1xuaW1wb3J0IHtzcGxhdH0gZnJvbSAnLi91dGlscyc7XG5cbi8vIGxlbmd0aCBnaXZlbiBhIDQ1IGZvdiBhbmdsZSwgYW5kIDAuMiBkaXN0YW5jZSB0byBjYW1lcmFcbmNvbnN0IGxlbmd0aCA9IDAuMTY1Njg1NDI0OTQ5MjM4MDU7XG5jb25zdCBjYW1lcmEgPSBuZXcgUGVyc3BlY3RpdmVDYW1lcmEoe1xuICBmb3Y6IDQ1LFxuICBhc3BlY3Q6IDEsXG4gIG5lYXI6IDAuMSxcbiAgZmFyOiA1MDAsXG4gIHBvc2l0aW9uOiBbMCwgMCwgMC4yXVxufSk7XG5cbi8vIFRPRE8vcnllOiB0ZW1wb3JhcmlseSByZW5hbWluZyB0aGlzIEltZyB1bnRpbCB3ZSBkZWNpZGUgb24gYSBuYW1lIHRoYXRcbi8vIGRvZXNuJ3Qgc2hhZG93IHRoZSBidWlsdGluIEltYWdlIGNsYXNzLlxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbWcge1xuXG4gIC8vIHBvc3QgcHJvY2VzcyBhbiBpbWFnZSBieSBzZXR0aW5nIGl0IHRvIGEgdGV4dHVyZSB3aXRoIGEgc3BlY2lmaWVkIGZyYWdtZW50XG4gIC8vIGFuZCB2ZXJ0ZXggc2hhZGVyLlxuICBzdGF0aWMgcG9zdFByb2Nlc3Mob3B0KSB7XG4gICAgY29uc3QgcGxhbmUgPVxuICAgICAgbmV3IFBsYW5lKHt0eXBlOiAneCx5JywgeGxlbjogbGVuZ3RoLCB5bGVuOiBsZW5ndGgsIG9mZnNldDogMH0pO1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IGFwcC5wcm9ncmFtIGluc3RhbmNlb2YgUHJvZ3JhbSA/XG4gICAgICBhcHAucHJvZ3JhbSA6XG4gICAgICBhcHAucHJvZ3JhbVtvcHQucHJvZ3JhbV07XG4gICAgdmFyIHRleHR1cmVzID0gb3B0LmZyb21UZXh0dXJlID8gc3BsYXQob3B0LmZyb21UZXh0dXJlKSA6IFtdLFxuICAgICAgICBmcmFtZWJ1ZmZlciA9IG9wdC50b0ZyYW1lQnVmZmVyLFxuICAgICAgICBzY3JlZW4gPSAhIW9wdC50b1NjcmVlbixcbiAgICAgICAgd2lkdGggPSBvcHQud2lkdGggfHwgYXBwLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0ID0gb3B0LmhlaWdodCB8fCBhcHAuY2FudmFzLmhlaWdodCxcbiAgICAgICAgeCA9IG9wdC52aWV3cG9ydFggfHwgMCxcbiAgICAgICAgeSA9IG9wdC52aWV3cG9ydFkgfHwgMDtcblxuICAgIGNhbWVyYS5hc3BlY3QgPSBvcHQuYXNwZWN0UmF0aW8gP1xuICAgICAgb3B0LmFzcGVjdFJhdGlvIDogTWF0aC5tYXgoaGVpZ2h0IC8gd2lkdGgsIHdpZHRoIC8gaGVpZ2h0KTtcbiAgICBjYW1lcmEudXBkYXRlKCk7XG5cbiAgICBjb25zdCBzY2VuZSA9IG5ldyBTY2VuZShhcHAsIHByb2dyYW0sIGNhbWVyYSk7XG5cbiAgICBzY2VuZS5wcm9ncmFtID0gcHJvZ3JhbTtcblxuICAgIHBsYW5lLnRleHR1cmVzID0gdGV4dHVyZXM7XG4gICAgcGxhbmUucHJvZ3JhbSA9IHByb2dyYW07XG5cbiAgICBpZiAoIXNjZW5lLm1vZGVscy5sZW5ndGgpIHtcbiAgICAgIHNjZW5lLmFkZChwbGFuZSk7XG4gICAgfVxuXG4gICAgaWYgKGZyYW1lYnVmZmVyKSB7XG4gICAgICAvLyBjcmVhdGUgZnJhbWVidWZmZXJcbiAgICAgIGlmICghKGZyYW1lYnVmZmVyIGluIGFwcC5mcmFtZUJ1ZmZlck1lbW8pKSB7XG4gICAgICAgIGFwcC5zZXRGcmFtZUJ1ZmZlcihmcmFtZWJ1ZmZlciwge1xuICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICBiaW5kVG9UZXh0dXJlOiB7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiBbe1xuICAgICAgICAgICAgICBuYW1lOiAnVEVYVFVSRV9NQUdfRklMVEVSJyxcbiAgICAgICAgICAgICAgdmFsdWU6ICdMSU5FQVInXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIG5hbWU6ICdURVhUVVJFX01JTl9GSUxURVInLFxuICAgICAgICAgICAgICB2YWx1ZTogJ0xJTkVBUicsXG4gICAgICAgICAgICAgIGdlbmVyYXRlTWlwbWFwOiBmYWxzZVxuICAgICAgICAgICAgfV1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGJpbmRUb1JlbmRlckJ1ZmZlcjogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBwcm9ncmFtLnVzZSgpO1xuICAgICAgYXBwLnNldEZyYW1lQnVmZmVyKGZyYW1lYnVmZmVyLCB0cnVlKTtcbiAgICAgIGdsLnZpZXdwb3J0KHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtcyhvcHQudW5pZm9ybXMgfHwge30pO1xuICAgICAgc2NlbmUucmVuZGVyVG9UZXh0dXJlKGZyYW1lYnVmZmVyKTtcbiAgICAgIGFwcC5zZXRGcmFtZUJ1ZmZlcihmcmFtZWJ1ZmZlciwgZmFsc2UpO1xuICAgIH1cblxuICAgIGlmIChzY3JlZW4pIHtcbiAgICAgIHByb2dyYW0udXNlKCk7XG4gICAgICBnbC52aWV3cG9ydCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMob3B0LnVuaWZvcm1zIHx8IHt9KTtcbiAgICAgIHNjZW5lLnJlbmRlcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiJdfQ==