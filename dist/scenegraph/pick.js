'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pickModels = pickModels;

var _webgl = require('../webgl');

var _group = require('./group');

var _group2 = _interopRequireDefault(_group);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ILLEGAL_ARG = 'Illegal argument to pick'; // TODO - this is the new picking for deck.gl
/* eslint-disable max-statements, no-try-catch */


function pickModels(gl, _ref) {
  var group = _ref.group;
  var viewMatrix = _ref.viewMatrix;
  var x = _ref.x;
  var y = _ref.y;
  var _ref$pickingFBO = _ref.pickingFBO;
  var pickingFBO = _ref$pickingFBO === undefined ? null : _ref$pickingFBO;
  var _ref$pickingProgram = _ref.pickingProgram;
  var pickingProgram = _ref$pickingProgram === undefined ? null : _ref$pickingProgram;
  var _ref$pickingColors = _ref.pickingColors;
  var pickingColors = _ref$pickingColors === undefined ? null : _ref$pickingColors;

  (0, _assert2.default)(gl instanceof _webgl.WebGLRenderingContext, ILLEGAL_ARG);
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
          model.render(gl);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3BpY2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFRZ0I7Ozs7Ozs7Ozs7Ozs7O0FBRmhCLElBQU0sY0FBYywwQkFBZDs7OztBQUVDLFNBQVMsVUFBVCxDQUFvQixFQUFwQixRQUtKO01BSkQsbUJBSUM7TUFKTSw2QkFJTjtNQUprQixXQUlsQjtNQUpxQixXQUlyQjs2QkFIRCxXQUdDO01BSEQsNkNBQWEsdUJBR1o7aUNBRkQsZUFFQztNQUZELHFEQUFpQiwyQkFFaEI7Z0NBREQsY0FDQztNQURELG1EQUFnQiwwQkFDZjs7QUFDRCx3QkFBTywwQ0FBUCxFQUE0QyxXQUE1QyxFQURDO0FBRUQsd0JBQU8sZ0NBQVAsRUFBK0IsV0FBL0IsRUFGQztBQUdELHdCQUFPLE1BQU0sT0FBTixDQUFjLFVBQWQsQ0FBUCxFQUFrQyxXQUFsQzs7OztBQUhDLFlBT0QsR0FBYSxjQUFjLHVCQUFnQixFQUFoQixFQUFvQjtBQUM3QyxXQUFPLEdBQUcsTUFBSCxDQUFVLEtBQVY7QUFDUCxZQUFRLEdBQUcsTUFBSCxDQUFVLE1BQVY7R0FGaUIsQ0FBZCxDQVBaOztBQVlELE1BQU0sU0FBUyxFQUFUOzs7QUFaTCxnQ0FlRCxDQUFtQixFQUFuQixFQUF1QjtBQUNyQixpQkFBYSxVQUFiOztBQUVBLGlCQUFhLEVBQUMsSUFBRCxFQUFJLEdBQUcsR0FBRyxNQUFILENBQVUsTUFBVixHQUFtQixDQUFuQixFQUFzQixHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBaEQ7R0FIRixFQUlHLFlBQU07Ozs7Ozs7QUFFUCwyQkFBb0IsTUFBTSxlQUFOLENBQXNCLEVBQUMsc0JBQUQsRUFBdEIsMkJBQXBCLG9HQUF5RDtZQUE5QyxvQkFBOEM7O0FBQ3ZELFlBQUksTUFBTSxVQUFOLEVBQUosRUFBd0I7QUFDdEIsY0FBTSxVQUFVLE1BQU0sVUFBTixFQUFWLENBRGdCO0FBRXRCLGtCQUFRLEdBQVIsR0FGc0I7QUFHdEIsa0JBQVEsV0FBUixDQUFvQixFQUFDLHFCQUFxQixDQUFyQixFQUFyQixFQUhzQjtBQUl0QixnQkFBTSxlQUFOLENBQXNCLE9BQXRCOzs7QUFKc0IsWUFPdEIsQ0FBRyxLQUFILENBQVMsR0FBRyxnQkFBSCxDQUFULENBUHNCO0FBUXRCLGdCQUFNLE1BQU4sQ0FBYSxFQUFiOzs7QUFSc0IsY0FXaEIsUUFBUSxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQVIsQ0FYZ0I7QUFZdEIsYUFBRyxVQUFILENBQ0UsQ0FERixFQUNLLEdBQUcsTUFBSCxDQUFVLE1BQVYsR0FBbUIsQ0FBbkIsRUFBc0IsQ0FEM0IsRUFDOEIsQ0FEOUIsRUFDaUMsR0FBRyxJQUFILEVBQVMsR0FBRyxhQUFILEVBQWtCLEtBRDVELEVBWnNCOztBQWdCdEIsa0JBQVEsVUFBUixDQUFtQixxQkFBbkIsRUFBMEMsQ0FBMUMsRUFoQnNCO0FBaUJ0QixnQkFBTSxpQkFBTixDQUF3QixPQUF4Qjs7O0FBakJzQixnQkFvQnRCLENBQU8sSUFBUCxDQUFZLEVBQUMsWUFBRCxFQUFRLFlBQVIsRUFBWixFQXBCc0I7U0FBeEI7T0FERjs7Ozs7Ozs7Ozs7Ozs7S0FGTztHQUFOLENBSkgsQ0FmQzs7QUFnREQsU0FBTyxNQUFQLENBaERDO0NBTEkiLCJmaWxlIjoicGljay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gLSB0aGlzIGlzIHRoZSBuZXcgcGlja2luZyBmb3IgZGVjay5nbFxuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG5vLXRyeS1jYXRjaCAqL1xuaW1wb3J0IHtGcmFtZWJ1ZmZlciwgZ2xDb250ZXh0V2l0aFN0YXRlLCBXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4uL3dlYmdsJztcbmltcG9ydCBHcm91cCBmcm9tICcuL2dyb3VwJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgSUxMRUdBTF9BUkcgPSAnSWxsZWdhbCBhcmd1bWVudCB0byBwaWNrJztcblxuZXhwb3J0IGZ1bmN0aW9uIHBpY2tNb2RlbHMoZ2wsIHtcbiAgZ3JvdXAsIHZpZXdNYXRyaXgsIHgsIHksXG4gIHBpY2tpbmdGQk8gPSBudWxsLFxuICBwaWNraW5nUHJvZ3JhbSA9IG51bGwsXG4gIHBpY2tpbmdDb2xvcnMgPSBudWxsXG59KSB7XG4gIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgSUxMRUdBTF9BUkcpO1xuICBhc3NlcnQoZ3JvdXAgaW5zdGFuY2VvZiBHcm91cCwgSUxMRUdBTF9BUkcpO1xuICBhc3NlcnQoQXJyYXkuaXNBcnJheSh2aWV3TWF0cml4KSwgSUxMRUdBTF9BUkcpO1xuXG4gIC8vIFNldCB1cCBhIGZyYW1lIGJ1ZmZlciBpZiBuZWVkZWRcbiAgLy8gVE9ETyAtIGNhY2hlIHBpY2tpbmcgZmJvIChuZWVkcyB0byBiZSByZXNpemVkKT9cbiAgcGlja2luZ0ZCTyA9IHBpY2tpbmdGQk8gfHwgbmV3IEZyYW1lYnVmZmVyKGdsLCB7XG4gICAgd2lkdGg6IGdsLmNhbnZhcy53aWR0aCxcbiAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgfSk7XG5cbiAgY29uc3QgcGlja2VkID0gW107XG5cbiAgLy8gTWFrZSBzdXJlIHdlIGNsZWFyIHNjaXNzb3IgdGVzdCBhbmQgZmJvIGJpbmRpbmdzIGluIGNhc2Ugb2YgZXhjZXB0aW9uc1xuICBnbENvbnRleHRXaXRoU3RhdGUoZ2wsIHtcbiAgICBmcmFtZUJ1ZmZlcjogcGlja2luZ0ZCTyxcbiAgICAvLyBXZSBhcmUgb25seSBpbnRlcmVzdGVkIGluIG9uZSBwaXhlbCwgbm8gbmVlZCB0byByZW5kZXIgYW55dGhpbmcgZWxzZVxuICAgIHNjaXNzb3JUZXN0OiB7eCwgeTogZ2wuY2FudmFzLmhlaWdodCAtIHksIHc6IDEsIGg6IDF9XG4gIH0sICgpID0+IHtcblxuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgZ3JvdXAudHJhdmVyc2VSZXZlcnNlKHt2aWV3TWF0cml4fSkpIHtcbiAgICAgIGlmIChtb2RlbC5pc1BpY2thYmxlKCkpIHtcbiAgICAgICAgY29uc3QgcHJvZ3JhbSA9IG1vZGVsLmdldFByb2dyYW0oKTtcbiAgICAgICAgcHJvZ3JhbS51c2UoKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7cmVuZGVyUGlja2luZ0J1ZmZlcjogMX0pO1xuICAgICAgICBtb2RlbC5zZXRQcm9ncmFtU3RhdGUocHJvZ3JhbSk7XG5cbiAgICAgICAgLy8gQ2xlYXIgdGhlIGZyYW1lIGJ1ZmZlciwgcmVuZGVyIGFuZCBzYW1wbGVcbiAgICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgICAgIG1vZGVsLnJlbmRlcihnbCk7XG5cbiAgICAgICAgLy8gUmVhZCBjb2xvciBpbiB0aGUgY2VudHJhbCBwaXhlbCwgdG8gYmUgbWFwcGVkIHdpdGggcGlja2luZyBjb2xvcnNcbiAgICAgICAgY29uc3QgY29sb3IgPSBuZXcgVWludDhBcnJheSg0KTtcbiAgICAgICAgZ2wucmVhZFBpeGVscyhcbiAgICAgICAgICB4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgY29sb3JcbiAgICAgICAgKTtcblxuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3JlbmRlclBpY2tpbmdCdWZmZXInLCAwKTtcbiAgICAgICAgbW9kZWwudW5zZXRQcm9ncmFtU3RhdGUocHJvZ3JhbSk7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBpbmZvcm1hdGlvbiB0byB0aGUgc3RhY2tcbiAgICAgICAgcGlja2VkLnB1c2goe21vZGVsLCBjb2xvcn0pO1xuICAgICAgfVxuICAgIH1cblxuICB9KTtcblxuICByZXR1cm4gcGlja2VkO1xufVxuIl19