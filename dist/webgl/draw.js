'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;
exports.draw2 = draw2;
exports.draw3 = draw3;

var _context = require('./context');

var _types = require('./types');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// A good thing about webGL is that there are so many ways to draw things...
// TODO - Use polyfilled WebGL2 methods instead of ANGLE extension
function draw(gl, _ref) {
  var drawMode = _ref.drawMode;
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

  drawMode = gl.get(drawMode);
  indexType = gl.get(indexType) || gl.UNSIGNED_SHORT;

  (0, _assert2.default)((0, _types.GL_DRAW_MODES)(gl).indexOf(drawMode) > -1, 'Invalid draw mode');
  (0, _assert2.default)((0, _types.GL_INDEX_TYPES)(gl).indexOf(indexType) > -1, 'Invalid index type');

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
}

// Call the proper draw function for the used program based on attributes etc
/* eslint-disable */
// TODO - generic draw call
// One of the good things about GL is that there are so many ways to draw things
function draw2(_ref2) {
  var gl = _ref2.gl;
  var drawMode = _ref2.drawMode;
  var elementType = _ref2.elementType;
  var count = _ref2.count;
  var indices = _ref2.indices;
  var vertices = _ref2.vertices;
  var instanced = _ref2.instanced;
  var numInstances = _ref2.numInstances;

  var numIndices = indices ? indices.value.length : 0;
  var numVertices = vertices ? vertices.value.length / 3 : 0;
  count = count || numIndices || numVertices;
  return draw({ gl: gl, drawMode: drawMode, elementType: elementType, count: count });
}

// Call the proper draw function for the used program based on attributes etc
function draw3(_ref3) {
  var gl = _ref3.gl;
  var drawMode = _ref3.drawMode;
  var indexType = _ref3.indexType;
  var numPoints = _ref3.numPoints;
  var numInstances = _ref3.numInstances;

  drawMode = drawMode || gl.POINTS;

  (0, _assert2.default)((0, _types.GL_DRAW_MODES)(gl).indexOf(indexType) > -1, 'Invalid draw mode');
  (0, _assert2.default)((0, _types.GL_INDEX_TYPES)(gl).indexOf(indexType) > -1, 'Invalid index type');

  if (numInstances) {
    // this instanced primitive does has indices, use drawElements extension
    var extension = (0, _context.getExtension)('ANGLE_instanced_arrays');
    extension.drawElementsInstancedANGLE(drawMode, numPoints, indexType, 0, numInstances);
  } else if (indices) {
    gl.drawElements(drawMode, numIndices, indexType, 0);
  } else if (numInstances !== undefined) {
    // this instanced primitive does not have indices, use drawArrays ext
    var extension = (0, _context.getExtension)('ANGLE_instanced_arrays');
    extension.drawArraysInstancedANGLE(drawMode, 0, numPoints, numInstances);
  } else {
    // else if this.primitive does not have indices
    gl.drawArrays(drawMode, 0, numPoints);
  }
}
//# sourceMappingURL=data:application/json;base64,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WUFBSCxDQUFnQixRQUFoQixFQUEwQixVQUExQixFQUFzQyxTQUF0QyxFQUFpRCxDQUFqRCxFQURrQjtHQUFiLE1BRUEsSUFBSSxpQkFBaUIsU0FBakIsRUFBNEI7O0FBRXJDLFFBQU0sWUFBWSwyQkFBYSx3QkFBYixDQUFaLENBRitCO0FBR3JDLGNBQVUsd0JBQVYsQ0FDRSxRQURGLEVBQ1ksQ0FEWixFQUNlLFNBRGYsRUFDMEIsWUFEMUIsRUFIcUM7R0FBaEMsTUFNQTs7QUFFTCxPQUFHLFVBQUgsQ0FBYyxRQUFkLEVBQXdCLENBQXhCLEVBQTJCLFNBQTNCLEVBRks7R0FOQTtDQWRGIiwiZmlsZSI6ImRyYXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETyAtIGdlbmVyaWMgZHJhdyBjYWxsXG4vLyBPbmUgb2YgdGhlIGdvb2QgdGhpbmdzIGFib3V0IEdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5nc1xuaW1wb3J0IHtnZXRFeHRlbnNpb259IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge0dMX0lOREVYX1RZUEVTLCBHTF9EUkFXX01PREVTfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQSBnb29kIHRoaW5nIGFib3V0IHdlYkdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5ncy4uLlxuLy8gVE9ETyAtIFVzZSBwb2x5ZmlsbGVkIFdlYkdMMiBtZXRob2RzIGluc3RlYWQgb2YgQU5HTEUgZXh0ZW5zaW9uXG5leHBvcnQgZnVuY3Rpb24gZHJhdyhnbCwge1xuICBkcmF3TW9kZSwgdmVydGV4Q291bnQsIG9mZnNldCA9IDAsXG4gIGluZGV4ZWQsIGluZGV4VHlwZSA9IG51bGwsXG4gIGluc3RhbmNlZCA9IGZhbHNlLCBpbnN0YW5jZUNvdW50ID0gMFxufSkge1xuICBkcmF3TW9kZSA9IGdsLmdldChkcmF3TW9kZSk7XG4gIGluZGV4VHlwZSA9IGdsLmdldChpbmRleFR5cGUpIHx8IGdsLlVOU0lHTkVEX1NIT1JUO1xuXG4gIGFzc2VydChHTF9EUkFXX01PREVTKGdsKS5pbmRleE9mKGRyYXdNb2RlKSA+IC0xLCAnSW52YWxpZCBkcmF3IG1vZGUnKTtcbiAgYXNzZXJ0KEdMX0lOREVYX1RZUEVTKGdsKS5pbmRleE9mKGluZGV4VHlwZSkgPiAtMSwgJ0ludmFsaWQgaW5kZXggdHlwZScpO1xuXG4gIGlmIChpbnN0YW5jZWQpIHtcbiAgICBjb25zdCBleHRlbnNpb24gPSBnbC5nZXRFeHRlbnNpb24oJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICBpZiAoaW5kZXhlZCkge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdFbGVtZW50c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0LCBpbnN0YW5jZUNvdW50XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHRlbnNpb24uZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFKFxuICAgICAgICBkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5kZXhlZCkge1xuICAgIGdsLmRyYXdFbGVtZW50cyhkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0KTtcbiAgfSBlbHNlIHtcbiAgICBnbC5kcmF3QXJyYXlzKGRyYXdNb2RlLCBvZmZzZXQsIHZlcnRleENvdW50KTtcbiAgfVxufVxuXG4vLyBDYWxsIHRoZSBwcm9wZXIgZHJhdyBmdW5jdGlvbiBmb3IgdGhlIHVzZWQgcHJvZ3JhbSBiYXNlZCBvbiBhdHRyaWJ1dGVzIGV0Y1xuZXhwb3J0IGZ1bmN0aW9uIGRyYXcyKHtnbCwgZHJhd01vZGUsIGVsZW1lbnRUeXBlLCBjb3VudCxcbiAgaW5kaWNlcywgdmVydGljZXMsIGluc3RhbmNlZCwgbnVtSW5zdGFuY2VzfSkge1xuICBjb25zdCBudW1JbmRpY2VzID0gaW5kaWNlcyA/IGluZGljZXMudmFsdWUubGVuZ3RoIDogMDtcbiAgY29uc3QgbnVtVmVydGljZXMgPSB2ZXJ0aWNlcyA/IHZlcnRpY2VzLnZhbHVlLmxlbmd0aCAvIDMgOiAwO1xuICBjb3VudCA9IGNvdW50IHx8IG51bUluZGljZXMgfHwgbnVtVmVydGljZXM7XG4gIHJldHVybiBkcmF3KHtnbCwgZHJhd01vZGUsIGVsZW1lbnRUeXBlLCBjb3VudCwgfSk7XG59XG5cbi8vIENhbGwgdGhlIHByb3BlciBkcmF3IGZ1bmN0aW9uIGZvciB0aGUgdXNlZCBwcm9ncmFtIGJhc2VkIG9uIGF0dHJpYnV0ZXMgZXRjXG5leHBvcnQgZnVuY3Rpb24gZHJhdzMoe2dsLCBkcmF3TW9kZSwgaW5kZXhUeXBlLCBudW1Qb2ludHMsIG51bUluc3RhbmNlc30pIHtcbiAgZHJhd01vZGUgPSBkcmF3TW9kZSB8fCBnbC5QT0lOVFM7XG5cbiAgYXNzZXJ0KEdMX0RSQVdfTU9ERVMoZ2wpLmluZGV4T2YoaW5kZXhUeXBlKSA+IC0xLCAnSW52YWxpZCBkcmF3IG1vZGUnKTtcbiAgYXNzZXJ0KEdMX0lOREVYX1RZUEVTKGdsKS5pbmRleE9mKGluZGV4VHlwZSkgPiAtMSwgJ0ludmFsaWQgaW5kZXggdHlwZScpO1xuXG4gIGlmIChudW1JbnN0YW5jZXMpIHtcbiAgICAvLyB0aGlzIGluc3RhbmNlZCBwcmltaXRpdmUgZG9lcyBoYXMgaW5kaWNlcywgdXNlIGRyYXdFbGVtZW50cyBleHRlbnNpb25cbiAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICBleHRlbnNpb24uZHJhd0VsZW1lbnRzSW5zdGFuY2VkQU5HTEUoXG4gICAgICBkcmF3TW9kZSwgbnVtUG9pbnRzLCBpbmRleFR5cGUsIDAsIG51bUluc3RhbmNlc1xuICAgICk7XG4gIH0gZWxzZSBpZiAoaW5kaWNlcykge1xuICAgIGdsLmRyYXdFbGVtZW50cyhkcmF3TW9kZSwgbnVtSW5kaWNlcywgaW5kZXhUeXBlLCAwKTtcbiAgfSBlbHNlIGlmIChudW1JbnN0YW5jZXMgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIHRoaXMgaW5zdGFuY2VkIHByaW1pdGl2ZSBkb2VzIG5vdCBoYXZlIGluZGljZXMsIHVzZSBkcmF3QXJyYXlzIGV4dFxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbignQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgIGV4dGVuc2lvbi5kcmF3QXJyYXlzSW5zdGFuY2VkQU5HTEUoXG4gICAgICBkcmF3TW9kZSwgMCwgbnVtUG9pbnRzLCBudW1JbnN0YW5jZXNcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGVsc2UgaWYgdGhpcy5wcmltaXRpdmUgZG9lcyBub3QgaGF2ZSBpbmRpY2VzXG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgMCwgbnVtUG9pbnRzKTtcbiAgfVxufVxuIl19