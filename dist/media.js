'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.postProcessImage = postProcessImage;

var _webgl = require('./webgl');

var _objects = require('./objects');

var _camera = require('./camera');

var _scenegraph = require('./scenegraph');

var _scenegraph2 = _interopRequireDefault(_scenegraph);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// length given a 45 fov angle, and 0.2 distance to camera
var length = 0.16568542494923805; // media has utility functions for image, video and audio manipulation (and
// maybe others like device, etc).

/* eslint-disable */ // TODO - this file needs cleanup

var camera = new _camera.PerspectiveCamera({
  fov: 45,
  aspect: 1,
  near: 0.1,
  far: 500,
  position: [0, 0, 0.2]
});

// post process an image by setting it to a texture with a specified fragment
// and vertex shader.
function postProcessImage() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var program = _ref.program;
  var fromTexture = _ref.fromTexture;
  var toFrameBuffer = _ref.toFrameBuffer;
  var toScreen = _ref.toScreen;
  var width = _ref.width;
  var height = _ref.height;
  var _ref$viewportX = _ref.viewportX;
  var viewportX = _ref$viewportX === undefined ? 0 : _ref$viewportX;
  var _ref$viewportY = _ref.viewportY;
  var viewportY = _ref$viewportY === undefined ? 0 : _ref$viewportY;
  var _ref$aspectRatio = _ref.aspectRatio;
  var aspectRatio = _ref$aspectRatio === undefined ? Math.max(height / width, width / height) : _ref$aspectRatio;

  var textures = opt.fromTexture ? (0, _utils.splat)(opt.fromTexture) : [];
  var framebuffer = opt.toFrameBuffer;
  var screen = !!opt.toScreen;
  var width = opt.width || app.canvas.width;
  var height = opt.height || app.canvas.height;
  var x = opt.viewportX;
  var y = opt.viewportY;

  var plane = new _objects.Plane({
    program: program,
    type: 'x,y',
    xlen: length,
    ylen: length,
    offset: 0
  });
  plane.textures = textures;
  plane.program = program;

  camera.aspect = opt.aspectRatio;
  camera.update();

  var scene = new _scenegraph2.default(app, program, camera);
  scene.program = program;

  if (!scene.models.length) {
    scene.add(plane);
  }

  var fbo = new FrameBuffer(framebuffer, {
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

  fbo.bind();
  gl.viewport(x, y, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  program.setUniforms(opt.uniforms || {});
  scene.renderToTexture(framebuffer);
  app.setFrameBuffer(framebuffer, false);

  if (screen) {
    program.use();
    gl.viewport(x, y, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    program.setUniforms(opt.uniforms || {});
    scene.render();
  }

  return this;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tZWRpYS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQXNCZ0IsZ0IsR0FBQSxnQjs7QUFsQmhCOztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7O0FBR0EsSUFBTSxTQUFTLG1CQUFmLEM7Ozs7O0FBQ0EsSUFBTSxTQUFTLDhCQUFzQjtBQUNuQyxPQUFLLEVBRDhCO0FBRW5DLFVBQVEsQ0FGMkI7QUFHbkMsUUFBTSxHQUg2QjtBQUluQyxPQUFLLEdBSjhCO0FBS25DLFlBQVUsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLEdBQVA7QUFMeUIsQ0FBdEIsQ0FBZjs7OztBQVVPLFNBQVMsZ0JBQVQsR0FVQztBQUFBLG1FQUFKLEVBQUk7O0FBQUEsTUFUTixPQVNNLFFBVE4sT0FTTTtBQUFBLE1BUk4sV0FRTSxRQVJOLFdBUU07QUFBQSxNQVBOLGFBT00sUUFQTixhQU9NO0FBQUEsTUFOTixRQU1NLFFBTk4sUUFNTTtBQUFBLE1BTE4sS0FLTSxRQUxOLEtBS007QUFBQSxNQUpOLE1BSU0sUUFKTixNQUlNO0FBQUEsNEJBSE4sU0FHTTtBQUFBLE1BSE4sU0FHTSxrQ0FITSxDQUdOO0FBQUEsNEJBRk4sU0FFTTtBQUFBLE1BRk4sU0FFTSxrQ0FGTSxDQUVOO0FBQUEsOEJBRE4sV0FDTTtBQUFBLE1BRE4sV0FDTSxvQ0FEUSxLQUFLLEdBQUwsQ0FBUyxTQUFTLEtBQWxCLEVBQXlCLFFBQVEsTUFBakMsQ0FDUjs7QUFDTixNQUFJLFdBQVcsSUFBSSxXQUFKLEdBQWtCLGtCQUFNLElBQUksV0FBVixDQUFsQixHQUEyQyxFQUExRDtBQUNBLE1BQUksY0FBYyxJQUFJLGFBQXRCO0FBQ0EsTUFBSSxTQUFTLENBQUMsQ0FBQyxJQUFJLFFBQW5CO0FBQ0EsTUFBSSxRQUFRLElBQUksS0FBSixJQUFhLElBQUksTUFBSixDQUFXLEtBQXBDO0FBQ0EsTUFBSSxTQUFTLElBQUksTUFBSixJQUFjLElBQUksTUFBSixDQUFXLE1BQXRDO0FBQ0EsTUFBSSxJQUFJLElBQUksU0FBWjtBQUNBLE1BQUksSUFBSSxJQUFJLFNBQVo7O0FBRUEsTUFBTSxRQUFRLG1CQUFVO0FBQ3RCLG9CQURzQjtBQUV0QixVQUFNLEtBRmdCO0FBR3RCLFVBQU0sTUFIZ0I7QUFJdEIsVUFBTSxNQUpnQjtBQUt0QixZQUFRO0FBTGMsR0FBVixDQUFkO0FBT0EsUUFBTSxRQUFOLEdBQWlCLFFBQWpCO0FBQ0EsUUFBTSxPQUFOLEdBQWdCLE9BQWhCOztBQUVBLFNBQU8sTUFBUCxHQUFnQixJQUFJLFdBQXBCO0FBQ0EsU0FBTyxNQUFQOztBQUVBLE1BQU0sUUFBUSx5QkFBVSxHQUFWLEVBQWUsT0FBZixFQUF3QixNQUF4QixDQUFkO0FBQ0EsUUFBTSxPQUFOLEdBQWdCLE9BQWhCOztBQUVBLE1BQUksQ0FBQyxNQUFNLE1BQU4sQ0FBYSxNQUFsQixFQUEwQjtBQUN4QixVQUFNLEdBQU4sQ0FBVSxLQUFWO0FBQ0Q7O0FBRUQsTUFBSSxNQUFNLElBQUksV0FBSixDQUFnQixXQUFoQixFQUE2QjtBQUNyQyxXQUFPLEtBRDhCO0FBRXJDLFlBQVEsTUFGNkI7QUFHckMsbUJBQWU7QUFDYixrQkFBWSxDQUFDO0FBQ1gsY0FBTSxvQkFESztBQUVYLGVBQU87QUFGSSxPQUFELEVBR1Q7QUFDRCxjQUFNLG9CQURMO0FBRUQsZUFBTyxRQUZOO0FBR0Qsd0JBQWdCO0FBSGYsT0FIUztBQURDLEtBSHNCO0FBYXJDLHdCQUFvQjtBQWJpQixHQUE3QixDQUFWOztBQWdCQSxNQUFJLElBQUo7QUFDQSxLQUFHLFFBQUgsQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixLQUFsQixFQUF5QixNQUF6QjtBQUNBLEtBQUcsS0FBSCxDQUFTLEdBQUcsZ0JBQUgsR0FBc0IsR0FBRyxnQkFBbEM7QUFDQSxVQUFRLFdBQVIsQ0FBb0IsSUFBSSxRQUFKLElBQWdCLEVBQXBDO0FBQ0EsUUFBTSxlQUFOLENBQXNCLFdBQXRCO0FBQ0EsTUFBSSxjQUFKLENBQW1CLFdBQW5CLEVBQWdDLEtBQWhDOztBQUVBLE1BQUksTUFBSixFQUFZO0FBQ1YsWUFBUSxHQUFSO0FBQ0EsT0FBRyxRQUFILENBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsS0FBbEIsRUFBeUIsTUFBekI7QUFDQSxPQUFHLEtBQUgsQ0FBUyxHQUFHLGdCQUFILEdBQXNCLEdBQUcsZ0JBQWxDO0FBQ0EsWUFBUSxXQUFSLENBQW9CLElBQUksUUFBSixJQUFnQixFQUFwQztBQUNBLFVBQU0sTUFBTjtBQUNEOztBQUVELFNBQU8sSUFBUDtBQUNEIiwiZmlsZSI6Im1lZGlhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbWVkaWEgaGFzIHV0aWxpdHkgZnVuY3Rpb25zIGZvciBpbWFnZSwgdmlkZW8gYW5kIGF1ZGlvIG1hbmlwdWxhdGlvbiAoYW5kXG4vLyBtYXliZSBvdGhlcnMgbGlrZSBkZXZpY2UsIGV0YykuXG5cbi8qIGVzbGludC1kaXNhYmxlICovIC8vIFRPRE8gLSB0aGlzIGZpbGUgbmVlZHMgY2xlYW51cFxuaW1wb3J0IHtQcm9ncmFtfSBmcm9tICcuL3dlYmdsJztcbmltcG9ydCB7UGxhbmV9IGZyb20gJy4vb2JqZWN0cyc7XG5pbXBvcnQge1BlcnNwZWN0aXZlQ2FtZXJhfSBmcm9tICcuL2NhbWVyYSc7XG5pbXBvcnQgU2NlbmUgZnJvbSAnLi9zY2VuZWdyYXBoJztcbmltcG9ydCB7c3BsYXR9IGZyb20gJy4vdXRpbHMnO1xuXG4vLyBsZW5ndGggZ2l2ZW4gYSA0NSBmb3YgYW5nbGUsIGFuZCAwLjIgZGlzdGFuY2UgdG8gY2FtZXJhXG5jb25zdCBsZW5ndGggPSAwLjE2NTY4NTQyNDk0OTIzODA1O1xuY29uc3QgY2FtZXJhID0gbmV3IFBlcnNwZWN0aXZlQ2FtZXJhKHtcbiAgZm92OiA0NSxcbiAgYXNwZWN0OiAxLFxuICBuZWFyOiAwLjEsXG4gIGZhcjogNTAwLFxuICBwb3NpdGlvbjogWzAsIDAsIDAuMl1cbn0pO1xuXG4vLyBwb3N0IHByb2Nlc3MgYW4gaW1hZ2UgYnkgc2V0dGluZyBpdCB0byBhIHRleHR1cmUgd2l0aCBhIHNwZWNpZmllZCBmcmFnbWVudFxuLy8gYW5kIHZlcnRleCBzaGFkZXIuXG5leHBvcnQgZnVuY3Rpb24gcG9zdFByb2Nlc3NJbWFnZSh7XG4gIHByb2dyYW0sXG4gIGZyb21UZXh0dXJlLFxuICB0b0ZyYW1lQnVmZmVyLFxuICB0b1NjcmVlbixcbiAgd2lkdGgsXG4gIGhlaWdodCxcbiAgdmlld3BvcnRYID0gMCxcbiAgdmlld3BvcnRZID0gMCxcbiAgYXNwZWN0UmF0aW8gPSBNYXRoLm1heChoZWlnaHQgLyB3aWR0aCwgd2lkdGggLyBoZWlnaHQpXG59ID0ge30pIHtcbiAgdmFyIHRleHR1cmVzID0gb3B0LmZyb21UZXh0dXJlID8gc3BsYXQob3B0LmZyb21UZXh0dXJlKSA6IFtdO1xuICB2YXIgZnJhbWVidWZmZXIgPSBvcHQudG9GcmFtZUJ1ZmZlcjtcbiAgdmFyIHNjcmVlbiA9ICEhb3B0LnRvU2NyZWVuO1xuICB2YXIgd2lkdGggPSBvcHQud2lkdGggfHwgYXBwLmNhbnZhcy53aWR0aDtcbiAgdmFyIGhlaWdodCA9IG9wdC5oZWlnaHQgfHwgYXBwLmNhbnZhcy5oZWlnaHQ7XG4gIHZhciB4ID0gb3B0LnZpZXdwb3J0WDtcbiAgdmFyIHkgPSBvcHQudmlld3BvcnRZO1xuXG4gIGNvbnN0IHBsYW5lID0gbmV3IFBsYW5lKHtcbiAgICBwcm9ncmFtLFxuICAgIHR5cGU6ICd4LHknLFxuICAgIHhsZW46IGxlbmd0aCxcbiAgICB5bGVuOiBsZW5ndGgsXG4gICAgb2Zmc2V0OiAwXG4gIH0pO1xuICBwbGFuZS50ZXh0dXJlcyA9IHRleHR1cmVzO1xuICBwbGFuZS5wcm9ncmFtID0gcHJvZ3JhbTtcblxuICBjYW1lcmEuYXNwZWN0ID0gb3B0LmFzcGVjdFJhdGlvO1xuICBjYW1lcmEudXBkYXRlKCk7XG5cbiAgY29uc3Qgc2NlbmUgPSBuZXcgU2NlbmUoYXBwLCBwcm9ncmFtLCBjYW1lcmEpO1xuICBzY2VuZS5wcm9ncmFtID0gcHJvZ3JhbTtcblxuICBpZiAoIXNjZW5lLm1vZGVscy5sZW5ndGgpIHtcbiAgICBzY2VuZS5hZGQocGxhbmUpO1xuICB9XG5cbiAgdmFyIGZibyA9IG5ldyBGcmFtZUJ1ZmZlcihmcmFtZWJ1ZmZlciwge1xuICAgIHdpZHRoOiB3aWR0aCxcbiAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICBiaW5kVG9UZXh0dXJlOiB7XG4gICAgICBwYXJhbWV0ZXJzOiBbe1xuICAgICAgICBuYW1lOiAnVEVYVFVSRV9NQUdfRklMVEVSJyxcbiAgICAgICAgdmFsdWU6ICdMSU5FQVInXG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6ICdURVhUVVJFX01JTl9GSUxURVInLFxuICAgICAgICB2YWx1ZTogJ0xJTkVBUicsXG4gICAgICAgIGdlbmVyYXRlTWlwbWFwOiBmYWxzZVxuICAgICAgfV1cbiAgICB9LFxuICAgIGJpbmRUb1JlbmRlckJ1ZmZlcjogZmFsc2VcbiAgfSk7XG5cbiAgZmJvLmJpbmQoKTtcbiAgZ2wudmlld3BvcnQoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgcHJvZ3JhbS5zZXRVbmlmb3JtcyhvcHQudW5pZm9ybXMgfHwge30pO1xuICBzY2VuZS5yZW5kZXJUb1RleHR1cmUoZnJhbWVidWZmZXIpO1xuICBhcHAuc2V0RnJhbWVCdWZmZXIoZnJhbWVidWZmZXIsIGZhbHNlKTtcblxuICBpZiAoc2NyZWVuKSB7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICBnbC52aWV3cG9ydCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3JtcyhvcHQudW5pZm9ybXMgfHwge30pO1xuICAgIHNjZW5lLnJlbmRlcigpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59XG4iXX0=