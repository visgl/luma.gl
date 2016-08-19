'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.postProcessImage = postProcessImage;

var _webgl = require('../webgl');

var _geometry = require('../core/geometry');

var _camera = require('../core/camera');

var _scenegraph = require('../scenegraph');

var _scenegraph2 = _interopRequireDefault(_scenegraph);

var _utils = require('../utils');

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

  var plane = new _geometry.Plane({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvbWVkaWEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFzQmdCLGdCLEdBQUEsZ0I7O0FBbEJoQjs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBRUE7QUFDQSxJQUFNLFNBQVMsbUJBQWYsQyxDQVhBO0FBQ0E7O0FBRUEsb0IsQ0FBcUI7O0FBU3JCLElBQU0sU0FBUyw4QkFBc0I7QUFDbkMsT0FBSyxFQUQ4QjtBQUVuQyxVQUFRLENBRjJCO0FBR25DLFFBQU0sR0FINkI7QUFJbkMsT0FBSyxHQUo4QjtBQUtuQyxZQUFVLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxHQUFQO0FBTHlCLENBQXRCLENBQWY7O0FBUUE7QUFDQTtBQUNPLFNBQVMsZ0JBQVQsR0FVQztBQUFBLG1FQUFKLEVBQUk7O0FBQUEsTUFUTixPQVNNLFFBVE4sT0FTTTtBQUFBLE1BUk4sV0FRTSxRQVJOLFdBUU07QUFBQSxNQVBOLGFBT00sUUFQTixhQU9NO0FBQUEsTUFOTixRQU1NLFFBTk4sUUFNTTtBQUFBLE1BTE4sS0FLTSxRQUxOLEtBS007QUFBQSxNQUpOLE1BSU0sUUFKTixNQUlNO0FBQUEsNEJBSE4sU0FHTTtBQUFBLE1BSE4sU0FHTSxrQ0FITSxDQUdOO0FBQUEsNEJBRk4sU0FFTTtBQUFBLE1BRk4sU0FFTSxrQ0FGTSxDQUVOO0FBQUEsOEJBRE4sV0FDTTtBQUFBLE1BRE4sV0FDTSxvQ0FEUSxLQUFLLEdBQUwsQ0FBUyxTQUFTLEtBQWxCLEVBQXlCLFFBQVEsTUFBakMsQ0FDUjs7QUFDTixNQUFJLFdBQVcsSUFBSSxXQUFKLEdBQWtCLGtCQUFNLElBQUksV0FBVixDQUFsQixHQUEyQyxFQUExRDtBQUNBLE1BQUksY0FBYyxJQUFJLGFBQXRCO0FBQ0EsTUFBSSxTQUFTLENBQUMsQ0FBQyxJQUFJLFFBQW5CO0FBQ0EsTUFBSSxRQUFRLElBQUksS0FBSixJQUFhLElBQUksTUFBSixDQUFXLEtBQXBDO0FBQ0EsTUFBSSxTQUFTLElBQUksTUFBSixJQUFjLElBQUksTUFBSixDQUFXLE1BQXRDO0FBQ0EsTUFBSSxJQUFJLElBQUksU0FBWjtBQUNBLE1BQUksSUFBSSxJQUFJLFNBQVo7O0FBRUEsTUFBTSxRQUFRLG9CQUFVO0FBQ3RCLG9CQURzQjtBQUV0QixVQUFNLEtBRmdCO0FBR3RCLFVBQU0sTUFIZ0I7QUFJdEIsVUFBTSxNQUpnQjtBQUt0QixZQUFRO0FBTGMsR0FBVixDQUFkO0FBT0EsUUFBTSxRQUFOLEdBQWlCLFFBQWpCO0FBQ0EsUUFBTSxPQUFOLEdBQWdCLE9BQWhCOztBQUVBLFNBQU8sTUFBUCxHQUFnQixJQUFJLFdBQXBCO0FBQ0EsU0FBTyxNQUFQOztBQUVBLE1BQU0sUUFBUSx5QkFBVSxHQUFWLEVBQWUsT0FBZixFQUF3QixNQUF4QixDQUFkO0FBQ0EsUUFBTSxPQUFOLEdBQWdCLE9BQWhCOztBQUVBLE1BQUksQ0FBQyxNQUFNLE1BQU4sQ0FBYSxNQUFsQixFQUEwQjtBQUN4QixVQUFNLEdBQU4sQ0FBVSxLQUFWO0FBQ0Q7O0FBRUQsTUFBSSxNQUFNLElBQUksV0FBSixDQUFnQixXQUFoQixFQUE2QjtBQUNyQyxXQUFPLEtBRDhCO0FBRXJDLFlBQVEsTUFGNkI7QUFHckMsbUJBQWU7QUFDYixrQkFBWSxDQUFDO0FBQ1gsY0FBTSxvQkFESztBQUVYLGVBQU87QUFGSSxPQUFELEVBR1Q7QUFDRCxjQUFNLG9CQURMO0FBRUQsZUFBTyxRQUZOO0FBR0Qsd0JBQWdCO0FBSGYsT0FIUztBQURDLEtBSHNCO0FBYXJDLHdCQUFvQjtBQWJpQixHQUE3QixDQUFWOztBQWdCQSxNQUFJLElBQUo7QUFDQSxLQUFHLFFBQUgsQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixLQUFsQixFQUF5QixNQUF6QjtBQUNBLEtBQUcsS0FBSCxDQUFTLEdBQUcsZ0JBQUgsR0FBc0IsR0FBRyxnQkFBbEM7QUFDQSxVQUFRLFdBQVIsQ0FBb0IsSUFBSSxRQUFKLElBQWdCLEVBQXBDO0FBQ0EsUUFBTSxlQUFOLENBQXNCLFdBQXRCO0FBQ0EsTUFBSSxjQUFKLENBQW1CLFdBQW5CLEVBQWdDLEtBQWhDOztBQUVBLE1BQUksTUFBSixFQUFZO0FBQ1YsWUFBUSxHQUFSO0FBQ0EsT0FBRyxRQUFILENBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsS0FBbEIsRUFBeUIsTUFBekI7QUFDQSxPQUFHLEtBQUgsQ0FBUyxHQUFHLGdCQUFILEdBQXNCLEdBQUcsZ0JBQWxDO0FBQ0EsWUFBUSxXQUFSLENBQW9CLElBQUksUUFBSixJQUFnQixFQUFwQztBQUNBLFVBQU0sTUFBTjtBQUNEOztBQUVELFNBQU8sSUFBUDtBQUNEIiwiZmlsZSI6Im1lZGlhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbWVkaWEgaGFzIHV0aWxpdHkgZnVuY3Rpb25zIGZvciBpbWFnZSwgdmlkZW8gYW5kIGF1ZGlvIG1hbmlwdWxhdGlvbiAoYW5kXG4vLyBtYXliZSBvdGhlcnMgbGlrZSBkZXZpY2UsIGV0YykuXG5cbi8qIGVzbGludC1kaXNhYmxlICovIC8vIFRPRE8gLSB0aGlzIGZpbGUgbmVlZHMgY2xlYW51cFxuaW1wb3J0IHtQcm9ncmFtfSBmcm9tICcuLi93ZWJnbCc7XG5pbXBvcnQge1BsYW5lfSBmcm9tICcuLi9jb3JlL2dlb21ldHJ5JztcbmltcG9ydCB7UGVyc3BlY3RpdmVDYW1lcmF9IGZyb20gJy4uL2NvcmUvY2FtZXJhJztcbmltcG9ydCBTY2VuZSBmcm9tICcuLi9zY2VuZWdyYXBoJztcbmltcG9ydCB7c3BsYXR9IGZyb20gJy4uL3V0aWxzJztcblxuLy8gbGVuZ3RoIGdpdmVuIGEgNDUgZm92IGFuZ2xlLCBhbmQgMC4yIGRpc3RhbmNlIHRvIGNhbWVyYVxuY29uc3QgbGVuZ3RoID0gMC4xNjU2ODU0MjQ5NDkyMzgwNTtcbmNvbnN0IGNhbWVyYSA9IG5ldyBQZXJzcGVjdGl2ZUNhbWVyYSh7XG4gIGZvdjogNDUsXG4gIGFzcGVjdDogMSxcbiAgbmVhcjogMC4xLFxuICBmYXI6IDUwMCxcbiAgcG9zaXRpb246IFswLCAwLCAwLjJdXG59KTtcblxuLy8gcG9zdCBwcm9jZXNzIGFuIGltYWdlIGJ5IHNldHRpbmcgaXQgdG8gYSB0ZXh0dXJlIHdpdGggYSBzcGVjaWZpZWQgZnJhZ21lbnRcbi8vIGFuZCB2ZXJ0ZXggc2hhZGVyLlxuZXhwb3J0IGZ1bmN0aW9uIHBvc3RQcm9jZXNzSW1hZ2Uoe1xuICBwcm9ncmFtLFxuICBmcm9tVGV4dHVyZSxcbiAgdG9GcmFtZUJ1ZmZlcixcbiAgdG9TY3JlZW4sXG4gIHdpZHRoLFxuICBoZWlnaHQsXG4gIHZpZXdwb3J0WCA9IDAsXG4gIHZpZXdwb3J0WSA9IDAsXG4gIGFzcGVjdFJhdGlvID0gTWF0aC5tYXgoaGVpZ2h0IC8gd2lkdGgsIHdpZHRoIC8gaGVpZ2h0KVxufSA9IHt9KSB7XG4gIHZhciB0ZXh0dXJlcyA9IG9wdC5mcm9tVGV4dHVyZSA/IHNwbGF0KG9wdC5mcm9tVGV4dHVyZSkgOiBbXTtcbiAgdmFyIGZyYW1lYnVmZmVyID0gb3B0LnRvRnJhbWVCdWZmZXI7XG4gIHZhciBzY3JlZW4gPSAhIW9wdC50b1NjcmVlbjtcbiAgdmFyIHdpZHRoID0gb3B0LndpZHRoIHx8IGFwcC5jYW52YXMud2lkdGg7XG4gIHZhciBoZWlnaHQgPSBvcHQuaGVpZ2h0IHx8IGFwcC5jYW52YXMuaGVpZ2h0O1xuICB2YXIgeCA9IG9wdC52aWV3cG9ydFg7XG4gIHZhciB5ID0gb3B0LnZpZXdwb3J0WTtcblxuICBjb25zdCBwbGFuZSA9IG5ldyBQbGFuZSh7XG4gICAgcHJvZ3JhbSxcbiAgICB0eXBlOiAneCx5JyxcbiAgICB4bGVuOiBsZW5ndGgsXG4gICAgeWxlbjogbGVuZ3RoLFxuICAgIG9mZnNldDogMFxuICB9KTtcbiAgcGxhbmUudGV4dHVyZXMgPSB0ZXh0dXJlcztcbiAgcGxhbmUucHJvZ3JhbSA9IHByb2dyYW07XG5cbiAgY2FtZXJhLmFzcGVjdCA9IG9wdC5hc3BlY3RSYXRpbztcbiAgY2FtZXJhLnVwZGF0ZSgpO1xuXG4gIGNvbnN0IHNjZW5lID0gbmV3IFNjZW5lKGFwcCwgcHJvZ3JhbSwgY2FtZXJhKTtcbiAgc2NlbmUucHJvZ3JhbSA9IHByb2dyYW07XG5cbiAgaWYgKCFzY2VuZS5tb2RlbHMubGVuZ3RoKSB7XG4gICAgc2NlbmUuYWRkKHBsYW5lKTtcbiAgfVxuXG4gIHZhciBmYm8gPSBuZXcgRnJhbWVCdWZmZXIoZnJhbWVidWZmZXIsIHtcbiAgICB3aWR0aDogd2lkdGgsXG4gICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgYmluZFRvVGV4dHVyZToge1xuICAgICAgcGFyYW1ldGVyczogW3tcbiAgICAgICAgbmFtZTogJ1RFWFRVUkVfTUFHX0ZJTFRFUicsXG4gICAgICAgIHZhbHVlOiAnTElORUFSJ1xuICAgICAgfSwge1xuICAgICAgICBuYW1lOiAnVEVYVFVSRV9NSU5fRklMVEVSJyxcbiAgICAgICAgdmFsdWU6ICdMSU5FQVInLFxuICAgICAgICBnZW5lcmF0ZU1pcG1hcDogZmFsc2VcbiAgICAgIH1dXG4gICAgfSxcbiAgICBiaW5kVG9SZW5kZXJCdWZmZXI6IGZhbHNlXG4gIH0pO1xuXG4gIGZiby5iaW5kKCk7XG4gIGdsLnZpZXdwb3J0KHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gIHByb2dyYW0uc2V0VW5pZm9ybXMob3B0LnVuaWZvcm1zIHx8IHt9KTtcbiAgc2NlbmUucmVuZGVyVG9UZXh0dXJlKGZyYW1lYnVmZmVyKTtcbiAgYXBwLnNldEZyYW1lQnVmZmVyKGZyYW1lYnVmZmVyLCBmYWxzZSk7XG5cbiAgaWYgKHNjcmVlbikge1xuICAgIHByb2dyYW0udXNlKCk7XG4gICAgZ2wudmlld3BvcnQoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMob3B0LnVuaWZvcm1zIHx8IHt9KTtcbiAgICBzY2VuZS5yZW5kZXIoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufVxuIl19