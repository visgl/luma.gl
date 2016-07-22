'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;

var _context = require('./context');

var _webglChecks = require('./webgl-checks');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// A good thing about webGL is that there are so many ways to draw things,
// e.g. depending on whether data is indexed and/or isInstanced.
// This function unifies those into a single call with simple parameters
// that have sane defaults.
function draw(gl, _ref) {
  var _ref$drawMode = _ref.drawMode;
  var drawMode = _ref$drawMode === undefined ? gl.TRIANGLES : _ref$drawMode;
  var vertexCount = _ref.vertexCount;
  var _ref$offset = _ref.offset;
  var offset = _ref$offset === undefined ? 0 : _ref$offset;
  var _ref$isIndexed = _ref.isIndexed;
  var isIndexed = _ref$isIndexed === undefined ? false : _ref$isIndexed;
  var _ref$indexType = _ref.indexType;
  var indexType = _ref$indexType === undefined ? gl.UNSIGNED_SHORT : _ref$indexType;
  var _ref$isInstanced = _ref.isInstanced;
  var isInstanced = _ref$isInstanced === undefined ? false : _ref$isInstanced;
  var _ref$instanceCount = _ref.instanceCount;
  var instanceCount = _ref$instanceCount === undefined ? 0 : _ref$instanceCount;

  (0, _webglChecks.assertWebGLRenderingContext)(gl);

  drawMode = (0, _context.glGet)(gl, drawMode);
  indexType = (0, _context.glGet)(gl, indexType);

  (0, _webglChecks.assertDrawMode)(drawMode, 'in draw');
  if (isIndexed) {
    (0, _webglChecks.assertIndexType)(indexType, 'in draw');
  }

  // TODO - Use polyfilled WebGL2RenderingContext instead of ANGLE extension
  if (isInstanced) {
    var extension = gl.getExtension('ANGLE_instanced_arrays');
    if (isIndexed) {
      extension.drawElementsInstancedANGLE(drawMode, vertexCount, indexType, offset, instanceCount);
    } else {
      extension.drawArraysInstancedANGLE(drawMode, offset, vertexCount, instanceCount);
    }
  } else if (isIndexed) {
    gl.drawElements(drawMode, vertexCount, indexType, offset);
  } else {
    gl.drawArrays(drawMode, offset, vertexCount);
  }
} /* eslint-disable */
// TODO - generic draw call
// One of the good things about GL is that there are so many ways to draw things
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9kcmF3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBWWdCLEksR0FBQSxJOztBQVRoQjs7QUFDQTs7QUFFQTs7Ozs7Ozs7OztBQU1PLFNBQVMsSUFBVCxDQUFjLEVBQWQsUUFRSjtBQUFBLDJCQVBELFFBT0M7QUFBQSxNQVBELFFBT0MsaUNBUFUsR0FBRyxTQU9iO0FBQUEsTUFORCxXQU1DLFFBTkQsV0FNQztBQUFBLHlCQUxELE1BS0M7QUFBQSxNQUxELE1BS0MsK0JBTFEsQ0FLUjtBQUFBLDRCQUpELFNBSUM7QUFBQSxNQUpELFNBSUMsa0NBSlcsS0FJWDtBQUFBLDRCQUhELFNBR0M7QUFBQSxNQUhELFNBR0Msa0NBSFcsR0FBRyxjQUdkO0FBQUEsOEJBRkQsV0FFQztBQUFBLE1BRkQsV0FFQyxvQ0FGYSxLQUViO0FBQUEsZ0NBREQsYUFDQztBQUFBLE1BREQsYUFDQyxzQ0FEZSxDQUNmOztBQUNELGdEQUE0QixFQUE1Qjs7QUFFQSxhQUFXLG9CQUFNLEVBQU4sRUFBVSxRQUFWLENBQVg7QUFDQSxjQUFZLG9CQUFNLEVBQU4sRUFBVSxTQUFWLENBQVo7O0FBRUEsbUNBQWUsUUFBZixFQUF5QixTQUF6QjtBQUNBLE1BQUksU0FBSixFQUFlO0FBQ2Isc0NBQWdCLFNBQWhCLEVBQTJCLFNBQTNCO0FBQ0Q7OztBQUdELE1BQUksV0FBSixFQUFpQjtBQUNmLFFBQU0sWUFBWSxHQUFHLFlBQUgsQ0FBZ0Isd0JBQWhCLENBQWxCO0FBQ0EsUUFBSSxTQUFKLEVBQWU7QUFDYixnQkFBVSwwQkFBVixDQUNFLFFBREYsRUFDWSxXQURaLEVBQ3lCLFNBRHpCLEVBQ29DLE1BRHBDLEVBQzRDLGFBRDVDO0FBR0QsS0FKRCxNQUlPO0FBQ0wsZ0JBQVUsd0JBQVYsQ0FDRSxRQURGLEVBQ1ksTUFEWixFQUNvQixXQURwQixFQUNpQyxhQURqQztBQUdEO0FBQ0YsR0FYRCxNQVdPLElBQUksU0FBSixFQUFlO0FBQ3BCLE9BQUcsWUFBSCxDQUFnQixRQUFoQixFQUEwQixXQUExQixFQUF1QyxTQUF2QyxFQUFrRCxNQUFsRDtBQUNELEdBRk0sTUFFQTtBQUNMLE9BQUcsVUFBSCxDQUFjLFFBQWQsRUFBd0IsTUFBeEIsRUFBZ0MsV0FBaEM7QUFDRDtBQUNGLEMiLCJmaWxlIjoiZHJhdy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG4vLyBUT0RPIC0gZ2VuZXJpYyBkcmF3IGNhbGxcbi8vIE9uZSBvZiB0aGUgZ29vZCB0aGluZ3MgYWJvdXQgR0wgaXMgdGhhdCB0aGVyZSBhcmUgc28gbWFueSB3YXlzIHRvIGRyYXcgdGhpbmdzXG5pbXBvcnQge2dldEV4dGVuc2lvbiwgZ2xHZXR9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge2Fzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgYXNzZXJ0RHJhd01vZGUsIGFzc2VydEluZGV4VHlwZX1cbiAgZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBBIGdvb2QgdGhpbmcgYWJvdXQgd2ViR0wgaXMgdGhhdCB0aGVyZSBhcmUgc28gbWFueSB3YXlzIHRvIGRyYXcgdGhpbmdzLFxuLy8gZS5nLiBkZXBlbmRpbmcgb24gd2hldGhlciBkYXRhIGlzIGluZGV4ZWQgYW5kL29yIGlzSW5zdGFuY2VkLlxuLy8gVGhpcyBmdW5jdGlvbiB1bmlmaWVzIHRob3NlIGludG8gYSBzaW5nbGUgY2FsbCB3aXRoIHNpbXBsZSBwYXJhbWV0ZXJzXG4vLyB0aGF0IGhhdmUgc2FuZSBkZWZhdWx0cy5cbmV4cG9ydCBmdW5jdGlvbiBkcmF3KGdsLCB7XG4gIGRyYXdNb2RlID0gZ2wuVFJJQU5HTEVTLFxuICB2ZXJ0ZXhDb3VudCxcbiAgb2Zmc2V0ID0gMCxcbiAgaXNJbmRleGVkID0gZmFsc2UsXG4gIGluZGV4VHlwZSA9IGdsLlVOU0lHTkVEX1NIT1JULFxuICBpc0luc3RhbmNlZCA9IGZhbHNlLFxuICBpbnN0YW5jZUNvdW50ID0gMFxufSkge1xuICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGRyYXdNb2RlID0gZ2xHZXQoZ2wsIGRyYXdNb2RlKTtcbiAgaW5kZXhUeXBlID0gZ2xHZXQoZ2wsIGluZGV4VHlwZSk7XG5cbiAgYXNzZXJ0RHJhd01vZGUoZHJhd01vZGUsICdpbiBkcmF3Jyk7XG4gIGlmIChpc0luZGV4ZWQpIHtcbiAgICBhc3NlcnRJbmRleFR5cGUoaW5kZXhUeXBlLCAnaW4gZHJhdycpO1xuICB9XG5cbiAgLy8gVE9ETyAtIFVzZSBwb2x5ZmlsbGVkIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgaW5zdGVhZCBvZiBBTkdMRSBleHRlbnNpb25cbiAgaWYgKGlzSW5zdGFuY2VkKSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgaWYgKGlzSW5kZXhlZCkge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdFbGVtZW50c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0LCBpbnN0YW5jZUNvdW50XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHRlbnNpb24uZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNJbmRleGVkKSB7XG4gICAgZ2wuZHJhd0VsZW1lbnRzKGRyYXdNb2RlLCB2ZXJ0ZXhDb3VudCwgaW5kZXhUeXBlLCBvZmZzZXQpO1xuICB9IGVsc2Uge1xuICAgIGdsLmRyYXdBcnJheXMoZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQpO1xuICB9XG59XG4iXX0=