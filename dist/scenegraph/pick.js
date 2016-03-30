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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3BpY2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFTZ0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRmhCLElBQU0sY0FBYywwQkFBZDs7QUFFQyxTQUFTLFVBQVQsQ0FBb0IsRUFBcEIsUUFLSjtNQUpELG1CQUlDO01BSk0scUJBSU47TUFKYyw2QkFJZDtNQUowQixXQUkxQjtNQUo2QixXQUk3Qjs2QkFIRCxXQUdDO01BSEQsNkNBQWEsdUJBR1o7aUNBRkQsZUFFQztNQUZELHFEQUFpQiwyQkFFaEI7Z0NBREQsY0FDQztNQURELG1EQUFnQiwwQkFDZjs7QUFDRCx3QkFBTywrQ0FBUCxFQUE0QyxXQUE1QyxFQURDO0FBRUQsd0JBQU8sZ0NBQVAsRUFBK0IsV0FBL0IsRUFGQztBQUdELHdCQUFPLE1BQU0sT0FBTixDQUFjLFVBQWQsQ0FBUCxFQUFrQyxXQUFsQzs7OztBQUhDLFlBT0QsR0FBYSxjQUFjLHVCQUFnQixFQUFoQixFQUFvQjtBQUM3QyxXQUFPLEdBQUcsTUFBSCxDQUFVLEtBQVY7QUFDUCxZQUFRLEdBQUcsTUFBSCxDQUFVLE1BQVY7R0FGaUIsQ0FBZCxDQVBaOztBQVlELE1BQU0sU0FBUyxFQUFUOzs7QUFaTCxnQ0FlRCxDQUFtQixFQUFuQixFQUF1QjtBQUNyQixpQkFBYSxVQUFiOztBQUVBLGlCQUFhLEVBQUMsSUFBRCxFQUFJLEdBQUcsR0FBRyxNQUFILENBQVUsTUFBVixHQUFtQixDQUFuQixFQUFzQixHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBaEQ7R0FIRixFQUlHLFlBQU07Ozs7Ozs7QUFFUCwyQkFBb0IsTUFBTSxlQUFOLENBQXNCLEVBQUMsc0JBQUQsRUFBdEIsMkJBQXBCLG9HQUF5RDtZQUE5QyxvQkFBOEM7O0FBQ3ZELFlBQUksTUFBTSxVQUFOLEVBQUosRUFBd0I7QUFDdEIsY0FBTSxVQUFVLE1BQU0sVUFBTixFQUFWLENBRGdCO0FBRXRCLGtCQUFRLEdBQVIsR0FGc0I7QUFHdEIsa0JBQVEsV0FBUixDQUFvQixFQUFDLHFCQUFxQixDQUFyQixFQUFyQixFQUhzQjtBQUl0QixnQkFBTSxlQUFOLENBQXNCLE9BQXRCOzs7QUFKc0IsWUFPdEIsQ0FBRyxLQUFILENBQVMsR0FBRyxnQkFBSCxDQUFULENBUHNCO0FBUXRCLGdCQUFNLE1BQU4sQ0FBYSxFQUFiLEVBQWlCLEVBQUMsY0FBRCxFQUFTLHNCQUFULEVBQWpCOzs7QUFSc0IsY0FXaEIsUUFBUSxJQUFJLFVBQUosQ0FBZSxDQUFmLENBQVIsQ0FYZ0I7QUFZdEIsYUFBRyxVQUFILENBQ0UsQ0FERixFQUNLLEdBQUcsTUFBSCxDQUFVLE1BQVYsR0FBbUIsQ0FBbkIsRUFBc0IsQ0FEM0IsRUFDOEIsQ0FEOUIsRUFDaUMsR0FBRyxJQUFILEVBQVMsR0FBRyxhQUFILEVBQWtCLEtBRDVELEVBWnNCOztBQWdCdEIsa0JBQVEsVUFBUixDQUFtQixxQkFBbkIsRUFBMEMsQ0FBMUMsRUFoQnNCO0FBaUJ0QixnQkFBTSxpQkFBTixDQUF3QixPQUF4Qjs7O0FBakJzQixnQkFvQnRCLENBQU8sSUFBUCxDQUFZLEVBQUMsWUFBRCxFQUFRLFlBQVIsRUFBWixFQXBCc0I7U0FBeEI7T0FERjs7Ozs7Ozs7Ozs7Ozs7S0FGTztHQUFOLENBSkgsQ0FmQzs7QUFnREQsU0FBTyxNQUFQLENBaERDO0NBTEkiLCJmaWxlIjoicGljay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gLSB0aGlzIGlzIHRoZSBuZXcgcGlja2luZyBmb3IgZGVjay5nbFxuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG5vLXRyeS1jYXRjaCAqL1xuaW1wb3J0IHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4uL3dlYmdsL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7RnJhbWVidWZmZXIsIGdsQ29udGV4dFdpdGhTdGF0ZX0gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IEdyb3VwIGZyb20gJy4vZ3JvdXAnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBJTExFR0FMX0FSRyA9ICdJbGxlZ2FsIGFyZ3VtZW50IHRvIHBpY2snO1xuXG5leHBvcnQgZnVuY3Rpb24gcGlja01vZGVscyhnbCwge1xuICBncm91cCwgY2FtZXJhLCB2aWV3TWF0cml4LCB4LCB5LFxuICBwaWNraW5nRkJPID0gbnVsbCxcbiAgcGlja2luZ1Byb2dyYW0gPSBudWxsLFxuICBwaWNraW5nQ29sb3JzID0gbnVsbFxufSkge1xuICBhc3NlcnQoZ2wgaW5zdGFuY2VvZiBXZWJHTFJlbmRlcmluZ0NvbnRleHQsIElMTEVHQUxfQVJHKTtcbiAgYXNzZXJ0KGdyb3VwIGluc3RhbmNlb2YgR3JvdXAsIElMTEVHQUxfQVJHKTtcbiAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodmlld01hdHJpeCksIElMTEVHQUxfQVJHKTtcblxuICAvLyBTZXQgdXAgYSBmcmFtZSBidWZmZXIgaWYgbmVlZGVkXG4gIC8vIFRPRE8gLSBjYWNoZSBwaWNraW5nIGZibyAobmVlZHMgdG8gYmUgcmVzaXplZCk/XG4gIHBpY2tpbmdGQk8gPSBwaWNraW5nRkJPIHx8IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgIHdpZHRoOiBnbC5jYW52YXMud2lkdGgsXG4gICAgaGVpZ2h0OiBnbC5jYW52YXMuaGVpZ2h0XG4gIH0pO1xuXG4gIGNvbnN0IHBpY2tlZCA9IFtdO1xuXG4gIC8vIE1ha2Ugc3VyZSB3ZSBjbGVhciBzY2lzc29yIHRlc3QgYW5kIGZibyBiaW5kaW5ncyBpbiBjYXNlIG9mIGV4Y2VwdGlvbnNcbiAgZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7XG4gICAgZnJhbWVCdWZmZXI6IHBpY2tpbmdGQk8sXG4gICAgLy8gV2UgYXJlIG9ubHkgaW50ZXJlc3RlZCBpbiBvbmUgcGl4ZWwsIG5vIG5lZWQgdG8gcmVuZGVyIGFueXRoaW5nIGVsc2VcbiAgICBzY2lzc29yVGVzdDoge3gsIHk6IGdsLmNhbnZhcy5oZWlnaHQgLSB5LCB3OiAxLCBoOiAxfVxuICB9LCAoKSA9PiB7XG5cbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIGdyb3VwLnRyYXZlcnNlUmV2ZXJzZSh7dmlld01hdHJpeH0pKSB7XG4gICAgICBpZiAobW9kZWwuaXNQaWNrYWJsZSgpKSB7XG4gICAgICAgIGNvbnN0IHByb2dyYW0gPSBtb2RlbC5nZXRQcm9ncmFtKCk7XG4gICAgICAgIHByb2dyYW0udXNlKCk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe3JlbmRlclBpY2tpbmdCdWZmZXI6IDF9KTtcbiAgICAgICAgbW9kZWwuc2V0UHJvZ3JhbVN0YXRlKHByb2dyYW0pO1xuXG4gICAgICAgIC8vIENsZWFyIHRoZSBmcmFtZSBidWZmZXIsIHJlbmRlciBhbmQgc2FtcGxlXG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgICAgICBtb2RlbC5yZW5kZXIoZ2wsIHtjYW1lcmEsIHZpZXdNYXRyaXh9KTtcblxuICAgICAgICAvLyBSZWFkIGNvbG9yIGluIHRoZSBjZW50cmFsIHBpeGVsLCB0byBiZSBtYXBwZWQgd2l0aCBwaWNraW5nIGNvbG9yc1xuICAgICAgICBjb25zdCBjb2xvciA9IG5ldyBVaW50OEFycmF5KDQpO1xuICAgICAgICBnbC5yZWFkUGl4ZWxzKFxuICAgICAgICAgIHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBjb2xvclxuICAgICAgICApO1xuXG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgncmVuZGVyUGlja2luZ0J1ZmZlcicsIDApO1xuICAgICAgICBtb2RlbC51bnNldFByb2dyYW1TdGF0ZShwcm9ncmFtKTtcblxuICAgICAgICAvLyBBZGQgdGhlIGluZm9ybWF0aW9uIHRvIHRoZSBzdGFja1xuICAgICAgICBwaWNrZWQucHVzaCh7bW9kZWwsIGNvbG9yfSk7XG4gICAgICB9XG4gICAgfVxuXG4gIH0pO1xuXG4gIHJldHVybiBwaWNrZWQ7XG59XG4iXX0=