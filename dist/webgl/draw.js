'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;

var _context = require('./context');

var _types = require('./types');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// A good thing about webGL is that there are so many ways to draw things,
// depending on whether data is indexed and/or instanced.
// This function unifies those into a single call with simple parameters
// that have sane defaults.
function draw(gl, _ref) {
  var _ref$drawMode = _ref.drawMode;
  var drawMode = _ref$drawMode === undefined ? null : _ref$drawMode;
  var vertexCount = _ref.vertexCount;
  var _ref$offset = _ref.offset;
  var offset = _ref$offset === undefined ? 0 : _ref$offset;
  var indexed = _ref.indexed;
  var _ref$indexType = _ref.indexType;
  var indexType = _ref$indexType === undefined ? null : _ref$indexType;
  var _ref$instanced = _ref.instanced;
  var instanced = _ref$instanced === undefined ? false : _ref$instanced;
  var _ref$instanceCount = _ref.instanceCount;
  var instanceCount = _ref$instanceCount === undefined ? 0 : _ref$instanceCount;

  drawMode = drawMode ? gl.get(drawMode) : gl.TRIANGLES;
  indexType = indexType ? gl.get(indexType) : gl.UNSIGNED_SHORT;

  (0, _assert2.default)((0, _types.GL_DRAW_MODES)(gl).indexOf(drawMode) > -1, 'Invalid draw mode');
  (0, _assert2.default)((0, _types.GL_INDEX_TYPES)(gl).indexOf(indexType) > -1, 'Invalid index type');

  // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
  if (instanced) {
    var extension = gl.getExtension('ANGLE_instanced_arrays');
    if (indexed) {
      extension.drawElementsInstancedANGLE(drawMode, vertexCount, indexType, offset, instanceCount);
    } else {
      extension.drawArraysInstancedANGLE(drawMode, offset, vertexCount, instanceCount);
    }
  } else if (indexed) {
    gl.drawElements(drawMode, vertexCount, indexType, offset);
  } else {
    gl.drawArrays(drawMode, offset, vertexCount);
  }
} /* eslint-disable */
// TODO - generic draw call
// One of the good things about GL is that there are so many ways to draw things
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9kcmF3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBV2dCOzs7Ozs7Ozs7Ozs7Ozs7O0FBQVQsU0FBUyxJQUFULENBQWMsRUFBZCxRQUlKOzJCQUhELFNBR0M7TUFIRCx5Q0FBVyxxQkFHVjtNQUhnQiwrQkFHaEI7eUJBSDZCLE9BRzdCO01BSDZCLHFDQUFTLGdCQUd0QztNQUZELHVCQUVDOzRCQUZRLFVBRVI7TUFGUSwyQ0FBWSxzQkFFcEI7NEJBREQsVUFDQztNQURELDJDQUFZLHVCQUNYO2dDQURrQixjQUNsQjtNQURrQixtREFBZ0IsdUJBQ2xDOztBQUNELGFBQVcsV0FBVyxHQUFHLEdBQUgsQ0FBTyxRQUFQLENBQVgsR0FBOEIsR0FBRyxTQUFILENBRHhDO0FBRUQsY0FBWSxZQUFZLEdBQUcsR0FBSCxDQUFPLFNBQVAsQ0FBWixHQUFnQyxHQUFHLGNBQUgsQ0FGM0M7O0FBSUQsd0JBQU8sMEJBQWMsRUFBZCxFQUFrQixPQUFsQixDQUEwQixRQUExQixJQUFzQyxDQUFDLENBQUQsRUFBSSxtQkFBakQsRUFKQztBQUtELHdCQUFPLDJCQUFlLEVBQWYsRUFBbUIsT0FBbkIsQ0FBMkIsU0FBM0IsSUFBd0MsQ0FBQyxDQUFELEVBQUksb0JBQW5EOzs7QUFMQyxNQVFHLFNBQUosRUFBZTtBQUNiLFFBQU0sWUFBWSxHQUFHLFlBQUgsQ0FBZ0Isd0JBQWhCLENBQVosQ0FETztBQUViLFFBQUksT0FBSixFQUFhO0FBQ1gsZ0JBQVUsMEJBQVYsQ0FDRSxRQURGLEVBQ1ksV0FEWixFQUN5QixTQUR6QixFQUNvQyxNQURwQyxFQUM0QyxhQUQ1QyxFQURXO0tBQWIsTUFJTztBQUNMLGdCQUFVLHdCQUFWLENBQ0UsUUFERixFQUNZLE1BRFosRUFDb0IsV0FEcEIsRUFDaUMsYUFEakMsRUFESztLQUpQO0dBRkYsTUFXTyxJQUFJLE9BQUosRUFBYTtBQUNsQixPQUFHLFlBQUgsQ0FBZ0IsUUFBaEIsRUFBMEIsV0FBMUIsRUFBdUMsU0FBdkMsRUFBa0QsTUFBbEQsRUFEa0I7R0FBYixNQUVBO0FBQ0wsT0FBRyxVQUFILENBQWMsUUFBZCxFQUF3QixNQUF4QixFQUFnQyxXQUFoQyxFQURLO0dBRkE7Q0F2QkYiLCJmaWxlIjoiZHJhdy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG4vLyBUT0RPIC0gZ2VuZXJpYyBkcmF3IGNhbGxcbi8vIE9uZSBvZiB0aGUgZ29vZCB0aGluZ3MgYWJvdXQgR0wgaXMgdGhhdCB0aGVyZSBhcmUgc28gbWFueSB3YXlzIHRvIGRyYXcgdGhpbmdzXG5pbXBvcnQge2dldEV4dGVuc2lvbn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCB7R0xfSU5ERVhfVFlQRVMsIEdMX0RSQVdfTU9ERVN9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBBIGdvb2QgdGhpbmcgYWJvdXQgd2ViR0wgaXMgdGhhdCB0aGVyZSBhcmUgc28gbWFueSB3YXlzIHRvIGRyYXcgdGhpbmdzLFxuLy8gZGVwZW5kaW5nIG9uIHdoZXRoZXIgZGF0YSBpcyBpbmRleGVkIGFuZC9vciBpbnN0YW5jZWQuXG4vLyBUaGlzIGZ1bmN0aW9uIHVuaWZpZXMgdGhvc2UgaW50byBhIHNpbmdsZSBjYWxsIHdpdGggc2ltcGxlIHBhcmFtZXRlcnNcbi8vIHRoYXQgaGF2ZSBzYW5lIGRlZmF1bHRzLlxuZXhwb3J0IGZ1bmN0aW9uIGRyYXcoZ2wsIHtcbiAgZHJhd01vZGUgPSBudWxsLCB2ZXJ0ZXhDb3VudCwgb2Zmc2V0ID0gMCxcbiAgaW5kZXhlZCwgaW5kZXhUeXBlID0gbnVsbCxcbiAgaW5zdGFuY2VkID0gZmFsc2UsIGluc3RhbmNlQ291bnQgPSAwXG59KSB7XG4gIGRyYXdNb2RlID0gZHJhd01vZGUgPyBnbC5nZXQoZHJhd01vZGUpIDogZ2wuVFJJQU5HTEVTO1xuICBpbmRleFR5cGUgPSBpbmRleFR5cGUgPyBnbC5nZXQoaW5kZXhUeXBlKSA6IGdsLlVOU0lHTkVEX1NIT1JUO1xuXG4gIGFzc2VydChHTF9EUkFXX01PREVTKGdsKS5pbmRleE9mKGRyYXdNb2RlKSA+IC0xLCAnSW52YWxpZCBkcmF3IG1vZGUnKTtcbiAgYXNzZXJ0KEdMX0lOREVYX1RZUEVTKGdsKS5pbmRleE9mKGluZGV4VHlwZSkgPiAtMSwgJ0ludmFsaWQgaW5kZXggdHlwZScpO1xuXG4gIC8vIFRPRE8gLSBVc2UgcG9seWZpbGxlZCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0IGluc3RlYWQgb2YgQU5HTEUgZXh0ZW5zaW9uXG4gIGlmIChpbnN0YW5jZWQpIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBnbC5nZXRFeHRlbnNpb24oJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICBpZiAoaW5kZXhlZCkge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdFbGVtZW50c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0LCBpbnN0YW5jZUNvdW50XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHRlbnNpb24uZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5kZXhlZCkge1xuICAgIGdsLmRyYXdFbGVtZW50cyhkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0KTtcbiAgfSBlbHNlIHtcbiAgICBnbC5kcmF3QXJyYXlzKGRyYXdNb2RlLCBvZmZzZXQsIHZlcnRleENvdW50KTtcbiAgfVxufVxuIl19