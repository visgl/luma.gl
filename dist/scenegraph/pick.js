'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pickModels = pickModels;

var _webglTypes = require('../webgl/webgl-types');

var _webgl = require('../webgl');

var _group = require('./group');

var _group2 = _interopRequireDefault(_group);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO - this is the new picking for deck.gl
/* eslint-disable max-statements, no-try-catch */


var ILLEGAL_ARG = 'Illegal argument to pick';

function pickModels(gl, _ref) {
  var group = _ref.group;
  var camera = _ref.camera;
  var viewMatrix = _ref.viewMatrix;
  var x = _ref.x;
  var y = _ref.y;
  var _ref$pickingFBO = _ref.pickingFBO;
  var pickingFBO = _ref$pickingFBO === undefined ? null : _ref$pickingFBO;
  var _ref$pickingProgram = _ref.pickingProgram;
  var pickingProgram = _ref$pickingProgram === undefined ? null : _ref$pickingProgram;
  var _ref$pickingColors = _ref.pickingColors;
  var pickingColors = _ref$pickingColors === undefined ? null : _ref$pickingColors;

  (0, _assert2.default)(gl instanceof _webglTypes.WebGLRenderingContext, ILLEGAL_ARG);
  (0, _assert2.default)(group instanceof _group2.default, ILLEGAL_ARG);
  (0, _assert2.default)(Array.isArray(viewMatrix), ILLEGAL_ARG);

  // Set up a frame buffer if needed
  // TODO - cache picking fbo (needs to be resized)?
  pickingFBO = pickingFBO || new _webgl.Framebuffer(gl, {
    width: gl.canvas.width,
    height: gl.canvas.height
  });

  var picked = [];

  // Make sure we clear scissor test and fbo bindings in case of exceptions
  (0, _webgl.glContextWithState)(gl, {
    frameBuffer: pickingFBO,
    // We are only interested in one pixel, no need to render anything else
    scissorTest: { x: x, y: gl.canvas.height - y, w: 1, h: 1 }
  }, function () {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {

      for (var _iterator = group.traverseReverse({ viewMatrix: viewMatrix })[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var model = _step.value;

        if (model.isPickable()) {
          var program = model.getProgram();
          program.use();
          program.setUniforms({ renderPickingBuffer: 1 });
          model.setProgramState(program);

          // Clear the frame buffer, render and sample
          gl.clear(gl.COLOR_BUFFER_BIT);
          model.render(gl, { camera: camera, viewMatrix: viewMatrix });

          // Read color in the central pixel, to be mapped with picking colors
          var color = new Uint8Array(4);
          gl.readPixels(x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

          program.setUniform('renderPickingBuffer', 0);
          model.unsetProgramState(program);

          // Add the information to the stack
          picked.push({ model: model, color: color });
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });

  return picked;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3BpY2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFTZ0I7O0FBUGhCOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFNLGNBQWMsMEJBQWQ7O0FBRUMsU0FBUyxVQUFULENBQW9CLEVBQXBCLFFBS0o7TUFKRCxtQkFJQztNQUpNLHFCQUlOO01BSmMsNkJBSWQ7TUFKMEIsV0FJMUI7TUFKNkIsV0FJN0I7NkJBSEQsV0FHQztNQUhELDZDQUFhLHVCQUdaO2lDQUZELGVBRUM7TUFGRCxxREFBaUIsMkJBRWhCO2dDQURELGNBQ0M7TUFERCxtREFBZ0IsMEJBQ2Y7O0FBQ0Qsd0JBQU8sK0NBQVAsRUFBNEMsV0FBNUMsRUFEQztBQUVELHdCQUFPLGdDQUFQLEVBQStCLFdBQS9CLEVBRkM7QUFHRCx3QkFBTyxNQUFNLE9BQU4sQ0FBYyxVQUFkLENBQVAsRUFBa0MsV0FBbEM7Ozs7QUFIQyxZQU9ELEdBQWEsY0FBYyx1QkFBZ0IsRUFBaEIsRUFBb0I7QUFDN0MsV0FBTyxHQUFHLE1BQUgsQ0FBVSxLQUFWO0FBQ1AsWUFBUSxHQUFHLE1BQUgsQ0FBVSxNQUFWO0dBRmlCLENBQWQsQ0FQWjs7QUFZRCxNQUFNLFNBQVMsRUFBVDs7O0FBWkwsZ0NBZUQsQ0FBbUIsRUFBbkIsRUFBdUI7QUFDckIsaUJBQWEsVUFBYjs7QUFFQSxpQkFBYSxFQUFDLElBQUQsRUFBSSxHQUFHLEdBQUcsTUFBSCxDQUFVLE1BQVYsR0FBbUIsQ0FBbkIsRUFBc0IsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQWhEO0dBSEYsRUFJRyxZQUFNOzs7Ozs7O0FBRVAsMkJBQW9CLE1BQU0sZUFBTixDQUFzQixFQUFDLHNCQUFELEVBQXRCLDJCQUFwQixvR0FBeUQ7WUFBOUMsb0JBQThDOztBQUN2RCxZQUFJLE1BQU0sVUFBTixFQUFKLEVBQXdCO0FBQ3RCLGNBQU0sVUFBVSxNQUFNLFVBQU4sRUFBVixDQURnQjtBQUV0QixrQkFBUSxHQUFSLEdBRnNCO0FBR3RCLGtCQUFRLFdBQVIsQ0FBb0IsRUFBQyxxQkFBcUIsQ0FBckIsRUFBckIsRUFIc0I7QUFJdEIsZ0JBQU0sZUFBTixDQUFzQixPQUF0Qjs7O0FBSnNCLFlBT3RCLENBQUcsS0FBSCxDQUFTLEdBQUcsZ0JBQUgsQ0FBVCxDQVBzQjtBQVF0QixnQkFBTSxNQUFOLENBQWEsRUFBYixFQUFpQixFQUFDLGNBQUQsRUFBUyxzQkFBVCxFQUFqQjs7O0FBUnNCLGNBV2hCLFFBQVEsSUFBSSxVQUFKLENBQWUsQ0FBZixDQUFSLENBWGdCO0FBWXRCLGFBQUcsVUFBSCxDQUNFLENBREYsRUFDSyxHQUFHLE1BQUgsQ0FBVSxNQUFWLEdBQW1CLENBQW5CLEVBQXNCLENBRDNCLEVBQzhCLENBRDlCLEVBQ2lDLEdBQUcsSUFBSCxFQUFTLEdBQUcsYUFBSCxFQUFrQixLQUQ1RCxFQVpzQjs7QUFnQnRCLGtCQUFRLFVBQVIsQ0FBbUIscUJBQW5CLEVBQTBDLENBQTFDLEVBaEJzQjtBQWlCdEIsZ0JBQU0saUJBQU4sQ0FBd0IsT0FBeEI7OztBQWpCc0IsZ0JBb0J0QixDQUFPLElBQVAsQ0FBWSxFQUFDLFlBQUQsRUFBUSxZQUFSLEVBQVosRUFwQnNCO1NBQXhCO09BREY7Ozs7Ozs7Ozs7Ozs7O0tBRk87R0FBTixDQUpILENBZkM7O0FBZ0RELFNBQU8sTUFBUCxDQWhEQztDQUxJIiwiZmlsZSI6InBpY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPIC0gdGhpcyBpcyB0aGUgbmV3IHBpY2tpbmcgZm9yIGRlY2suZ2xcbi8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBuby10cnktY2F0Y2ggKi9cbmltcG9ydCB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBmcm9tICcuLi93ZWJnbC93ZWJnbC10eXBlcyc7XG5pbXBvcnQge0ZyYW1lYnVmZmVyLCBnbENvbnRleHRXaXRoU3RhdGV9IGZyb20gJy4uL3dlYmdsJztcbmltcG9ydCBHcm91cCBmcm9tICcuL2dyb3VwJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgSUxMRUdBTF9BUkcgPSAnSWxsZWdhbCBhcmd1bWVudCB0byBwaWNrJztcblxuZXhwb3J0IGZ1bmN0aW9uIHBpY2tNb2RlbHMoZ2wsIHtcbiAgZ3JvdXAsIGNhbWVyYSwgdmlld01hdHJpeCwgeCwgeSxcbiAgcGlja2luZ0ZCTyA9IG51bGwsXG4gIHBpY2tpbmdQcm9ncmFtID0gbnVsbCxcbiAgcGlja2luZ0NvbG9ycyA9IG51bGxcbn0pIHtcbiAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBJTExFR0FMX0FSRyk7XG4gIGFzc2VydChncm91cCBpbnN0YW5jZW9mIEdyb3VwLCBJTExFR0FMX0FSRyk7XG4gIGFzc2VydChBcnJheS5pc0FycmF5KHZpZXdNYXRyaXgpLCBJTExFR0FMX0FSRyk7XG5cbiAgLy8gU2V0IHVwIGEgZnJhbWUgYnVmZmVyIGlmIG5lZWRlZFxuICAvLyBUT0RPIC0gY2FjaGUgcGlja2luZyBmYm8gKG5lZWRzIHRvIGJlIHJlc2l6ZWQpP1xuICBwaWNraW5nRkJPID0gcGlja2luZ0ZCTyB8fCBuZXcgRnJhbWVidWZmZXIoZ2wsIHtcbiAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgIGhlaWdodDogZ2wuY2FudmFzLmhlaWdodFxuICB9KTtcblxuICBjb25zdCBwaWNrZWQgPSBbXTtcblxuICAvLyBNYWtlIHN1cmUgd2UgY2xlYXIgc2Npc3NvciB0ZXN0IGFuZCBmYm8gYmluZGluZ3MgaW4gY2FzZSBvZiBleGNlcHRpb25zXG4gIGdsQ29udGV4dFdpdGhTdGF0ZShnbCwge1xuICAgIGZyYW1lQnVmZmVyOiBwaWNraW5nRkJPLFxuICAgIC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gb25lIHBpeGVsLCBubyBuZWVkIHRvIHJlbmRlciBhbnl0aGluZyBlbHNlXG4gICAgc2Npc3NvclRlc3Q6IHt4LCB5OiBnbC5jYW52YXMuaGVpZ2h0IC0geSwgdzogMSwgaDogMX1cbiAgfSwgKCkgPT4ge1xuXG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiBncm91cC50cmF2ZXJzZVJldmVyc2Uoe3ZpZXdNYXRyaXh9KSkge1xuICAgICAgaWYgKG1vZGVsLmlzUGlja2FibGUoKSkge1xuICAgICAgICBjb25zdCBwcm9ncmFtID0gbW9kZWwuZ2V0UHJvZ3JhbSgpO1xuICAgICAgICBwcm9ncmFtLnVzZSgpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtyZW5kZXJQaWNraW5nQnVmZmVyOiAxfSk7XG4gICAgICAgIG1vZGVsLnNldFByb2dyYW1TdGF0ZShwcm9ncmFtKTtcblxuICAgICAgICAvLyBDbGVhciB0aGUgZnJhbWUgYnVmZmVyLCByZW5kZXIgYW5kIHNhbXBsZVxuICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICAgICAgbW9kZWwucmVuZGVyKGdsLCB7Y2FtZXJhLCB2aWV3TWF0cml4fSk7XG5cbiAgICAgICAgLy8gUmVhZCBjb2xvciBpbiB0aGUgY2VudHJhbCBwaXhlbCwgdG8gYmUgbWFwcGVkIHdpdGggcGlja2luZyBjb2xvcnNcbiAgICAgICAgY29uc3QgY29sb3IgPSBuZXcgVWludDhBcnJheSg0KTtcbiAgICAgICAgZ2wucmVhZFBpeGVscyhcbiAgICAgICAgICB4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgY29sb3JcbiAgICAgICAgKTtcblxuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3JlbmRlclBpY2tpbmdCdWZmZXInLCAwKTtcbiAgICAgICAgbW9kZWwudW5zZXRQcm9ncmFtU3RhdGUocHJvZ3JhbSk7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBpbmZvcm1hdGlvbiB0byB0aGUgc3RhY2tcbiAgICAgICAgcGlja2VkLnB1c2goe21vZGVsLCBjb2xvcn0pO1xuICAgICAgfVxuICAgIH1cblxuICB9KTtcblxuICByZXR1cm4gcGlja2VkO1xufVxuIl19