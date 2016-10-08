'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pickModels = pickModels;

var _webgl = require('../webgl');

var _webglChecks = require('../webgl/webgl-checks');

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

  (0, _webglChecks.assertWebGLRenderingContext)(gl);
  (0, _assert2.default)(group instanceof _group2.default, ILLEGAL_ARG);
  (0, _assert2.default)(Array.isArray(viewMatrix), ILLEGAL_ARG);

  // Set up a frame buffer if needed
  // TODO - cache picking fbo (needs to be resized)?
  pickingFBO = pickingFBO || new _webgl.FramebufferObject(gl, {
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

          // Clear the frame buffer, render and sample
          gl.clear(_webgl.GL.COLOR_BUFFER_BIT | _webgl.GL.DEPTH_BUFFER_BIT);
          model.setUniforms({ renderPickingBuffer: 1 });
          model.render(gl, { camera: camera, viewMatrix: viewMatrix });
          model.setUniforms({ renderPickingBuffer: 0 });

          // Read color in the central pixel, to be mapped with picking colors
          var color = new Uint8Array(4);
          gl.readPixels(x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

          var isPicked = color[0] !== 0 || color[1] !== 0 || color[2] !== 0 || color[3] !== 0;

          // Add the information to the stack
          picked.push({ model: model, color: color, isPicked: isPicked });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3BpY2suanMiXSwibmFtZXMiOlsicGlja01vZGVscyIsIklMTEVHQUxfQVJHIiwiZ2wiLCJncm91cCIsImNhbWVyYSIsInZpZXdNYXRyaXgiLCJ4IiwieSIsInBpY2tpbmdGQk8iLCJwaWNraW5nUHJvZ3JhbSIsInBpY2tpbmdDb2xvcnMiLCJBcnJheSIsImlzQXJyYXkiLCJ3aWR0aCIsImNhbnZhcyIsImhlaWdodCIsInBpY2tlZCIsImZyYW1lQnVmZmVyIiwic2Npc3NvclRlc3QiLCJ3IiwiaCIsInRyYXZlcnNlUmV2ZXJzZSIsIm1vZGVsIiwiaXNQaWNrYWJsZSIsImNsZWFyIiwiQ09MT1JfQlVGRkVSX0JJVCIsIkRFUFRIX0JVRkZFUl9CSVQiLCJzZXRVbmlmb3JtcyIsInJlbmRlclBpY2tpbmdCdWZmZXIiLCJyZW5kZXIiLCJjb2xvciIsIlVpbnQ4QXJyYXkiLCJyZWFkUGl4ZWxzIiwiUkdCQSIsIlVOU0lHTkVEX0JZVEUiLCJpc1BpY2tlZCIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7O1FBU2dCQSxVLEdBQUFBLFU7O0FBUGhCOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7OztBQUxBO0FBQ0E7QUFNQSxJQUFNQyxjQUFjLDBCQUFwQjs7QUFFTyxTQUFTRCxVQUFULENBQW9CRSxFQUFwQixRQVNKO0FBQUEsTUFSREMsS0FRQyxRQVJEQSxLQVFDO0FBQUEsTUFQREMsTUFPQyxRQVBEQSxNQU9DO0FBQUEsTUFOREMsVUFNQyxRQU5EQSxVQU1DO0FBQUEsTUFMREMsQ0FLQyxRQUxEQSxDQUtDO0FBQUEsTUFKREMsQ0FJQyxRQUpEQSxDQUlDO0FBQUEsNkJBSERDLFVBR0M7QUFBQSxNQUhEQSxVQUdDLG1DQUhZLElBR1o7QUFBQSxpQ0FGREMsY0FFQztBQUFBLE1BRkRBLGNBRUMsdUNBRmdCLElBRWhCO0FBQUEsZ0NBRERDLGFBQ0M7QUFBQSxNQUREQSxhQUNDLHNDQURlLElBQ2Y7O0FBQ0QsZ0RBQTRCUixFQUE1QjtBQUNBLHdCQUFPQyxnQ0FBUCxFQUErQkYsV0FBL0I7QUFDQSx3QkFBT1UsTUFBTUMsT0FBTixDQUFjUCxVQUFkLENBQVAsRUFBa0NKLFdBQWxDOztBQUVBO0FBQ0E7QUFDQU8sZUFBYUEsY0FBYyw2QkFBc0JOLEVBQXRCLEVBQTBCO0FBQ25EVyxXQUFPWCxHQUFHWSxNQUFILENBQVVELEtBRGtDO0FBRW5ERSxZQUFRYixHQUFHWSxNQUFILENBQVVDO0FBRmlDLEdBQTFCLENBQTNCOztBQUtBLE1BQU1DLFNBQVMsRUFBZjs7QUFFQTtBQUNBLGlDQUFtQmQsRUFBbkIsRUFBdUI7QUFDckJlLGlCQUFhVCxVQURRO0FBRXJCO0FBQ0FVLGlCQUFhLEVBQUNaLElBQUQsRUFBSUMsR0FBR0wsR0FBR1ksTUFBSCxDQUFVQyxNQUFWLEdBQW1CUixDQUExQixFQUE2QlksR0FBRyxDQUFoQyxFQUFtQ0MsR0FBRyxDQUF0QztBQUhRLEdBQXZCLEVBSUcsWUFBTTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNQLDJCQUFvQmpCLE1BQU1rQixlQUFOLENBQXNCLEVBQUNoQixzQkFBRCxFQUF0QixDQUFwQiw4SEFBeUQ7QUFBQSxZQUE5Q2lCLEtBQThDOztBQUN2RCxZQUFJQSxNQUFNQyxVQUFOLEVBQUosRUFBd0I7O0FBRXRCO0FBQ0FyQixhQUFHc0IsS0FBSCxDQUFTLFVBQUdDLGdCQUFILEdBQXNCLFVBQUdDLGdCQUFsQztBQUNBSixnQkFBTUssV0FBTixDQUFrQixFQUFDQyxxQkFBcUIsQ0FBdEIsRUFBbEI7QUFDQU4sZ0JBQU1PLE1BQU4sQ0FBYTNCLEVBQWIsRUFBaUIsRUFBQ0UsY0FBRCxFQUFTQyxzQkFBVCxFQUFqQjtBQUNBaUIsZ0JBQU1LLFdBQU4sQ0FBa0IsRUFBQ0MscUJBQXFCLENBQXRCLEVBQWxCOztBQUVBO0FBQ0EsY0FBTUUsUUFBUSxJQUFJQyxVQUFKLENBQWUsQ0FBZixDQUFkO0FBQ0E3QixhQUFHOEIsVUFBSCxDQUNFMUIsQ0FERixFQUNLSixHQUFHWSxNQUFILENBQVVDLE1BQVYsR0FBbUJSLENBRHhCLEVBQzJCLENBRDNCLEVBQzhCLENBRDlCLEVBQ2lDTCxHQUFHK0IsSUFEcEMsRUFDMEMvQixHQUFHZ0MsYUFEN0MsRUFDNERKLEtBRDVEOztBQUlBLGNBQU1LLFdBQ0pMLE1BQU0sQ0FBTixNQUFhLENBQWIsSUFBa0JBLE1BQU0sQ0FBTixNQUFhLENBQS9CLElBQW9DQSxNQUFNLENBQU4sTUFBYSxDQUFqRCxJQUFzREEsTUFBTSxDQUFOLE1BQWEsQ0FEckU7O0FBR0E7QUFDQWQsaUJBQU9vQixJQUFQLENBQVksRUFBQ2QsWUFBRCxFQUFRUSxZQUFSLEVBQWVLLGtCQUFmLEVBQVo7QUFDRDtBQUNGO0FBdEJNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUF1QlIsR0EzQkQ7O0FBNkJBLFNBQU9uQixNQUFQO0FBQ0QiLCJmaWxlIjoicGljay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRPRE8gLSB0aGlzIGlzIHRoZSBuZXcgcGlja2luZyBmb3IgZGVjay5nbFxuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG5vLXRyeS1jYXRjaCAqL1xuaW1wb3J0IHtHTCwgZ2xDb250ZXh0V2l0aFN0YXRlLCBGcmFtZWJ1ZmZlck9iamVjdH0gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4uL3dlYmdsL3dlYmdsLWNoZWNrcyc7XG5pbXBvcnQgR3JvdXAgZnJvbSAnLi9ncm91cCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IElMTEVHQUxfQVJHID0gJ0lsbGVnYWwgYXJndW1lbnQgdG8gcGljayc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwaWNrTW9kZWxzKGdsLCB7XG4gIGdyb3VwLFxuICBjYW1lcmEsXG4gIHZpZXdNYXRyaXgsXG4gIHgsXG4gIHksXG4gIHBpY2tpbmdGQk8gPSBudWxsLFxuICBwaWNraW5nUHJvZ3JhbSA9IG51bGwsXG4gIHBpY2tpbmdDb2xvcnMgPSBudWxsXG59KSB7XG4gIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG4gIGFzc2VydChncm91cCBpbnN0YW5jZW9mIEdyb3VwLCBJTExFR0FMX0FSRyk7XG4gIGFzc2VydChBcnJheS5pc0FycmF5KHZpZXdNYXRyaXgpLCBJTExFR0FMX0FSRyk7XG5cbiAgLy8gU2V0IHVwIGEgZnJhbWUgYnVmZmVyIGlmIG5lZWRlZFxuICAvLyBUT0RPIC0gY2FjaGUgcGlja2luZyBmYm8gKG5lZWRzIHRvIGJlIHJlc2l6ZWQpP1xuICBwaWNraW5nRkJPID0gcGlja2luZ0ZCTyB8fCBuZXcgRnJhbWVidWZmZXJPYmplY3QoZ2wsIHtcbiAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgIGhlaWdodDogZ2wuY2FudmFzLmhlaWdodFxuICB9KTtcblxuICBjb25zdCBwaWNrZWQgPSBbXTtcblxuICAvLyBNYWtlIHN1cmUgd2UgY2xlYXIgc2Npc3NvciB0ZXN0IGFuZCBmYm8gYmluZGluZ3MgaW4gY2FzZSBvZiBleGNlcHRpb25zXG4gIGdsQ29udGV4dFdpdGhTdGF0ZShnbCwge1xuICAgIGZyYW1lQnVmZmVyOiBwaWNraW5nRkJPLFxuICAgIC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gb25lIHBpeGVsLCBubyBuZWVkIHRvIHJlbmRlciBhbnl0aGluZyBlbHNlXG4gICAgc2Npc3NvclRlc3Q6IHt4LCB5OiBnbC5jYW52YXMuaGVpZ2h0IC0geSwgdzogMSwgaDogMX1cbiAgfSwgKCkgPT4ge1xuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgZ3JvdXAudHJhdmVyc2VSZXZlcnNlKHt2aWV3TWF0cml4fSkpIHtcbiAgICAgIGlmIChtb2RlbC5pc1BpY2thYmxlKCkpIHtcblxuICAgICAgICAvLyBDbGVhciB0aGUgZnJhbWUgYnVmZmVyLCByZW5kZXIgYW5kIHNhbXBsZVxuICAgICAgICBnbC5jbGVhcihHTC5DT0xPUl9CVUZGRVJfQklUIHwgR0wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgICAgIG1vZGVsLnNldFVuaWZvcm1zKHtyZW5kZXJQaWNraW5nQnVmZmVyOiAxfSk7XG4gICAgICAgIG1vZGVsLnJlbmRlcihnbCwge2NhbWVyYSwgdmlld01hdHJpeH0pO1xuICAgICAgICBtb2RlbC5zZXRVbmlmb3Jtcyh7cmVuZGVyUGlja2luZ0J1ZmZlcjogMH0pO1xuXG4gICAgICAgIC8vIFJlYWQgY29sb3IgaW4gdGhlIGNlbnRyYWwgcGl4ZWwsIHRvIGJlIG1hcHBlZCB3aXRoIHBpY2tpbmcgY29sb3JzXG4gICAgICAgIGNvbnN0IGNvbG9yID0gbmV3IFVpbnQ4QXJyYXkoNCk7XG4gICAgICAgIGdsLnJlYWRQaXhlbHMoXG4gICAgICAgICAgeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGNvbG9yXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgaXNQaWNrZWQgPVxuICAgICAgICAgIGNvbG9yWzBdICE9PSAwIHx8IGNvbG9yWzFdICE9PSAwIHx8IGNvbG9yWzJdICE9PSAwIHx8IGNvbG9yWzNdICE9PSAwO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgaW5mb3JtYXRpb24gdG8gdGhlIHN0YWNrXG4gICAgICAgIHBpY2tlZC5wdXNoKHttb2RlbCwgY29sb3IsIGlzUGlja2VkfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcGlja2VkO1xufVxuIl19