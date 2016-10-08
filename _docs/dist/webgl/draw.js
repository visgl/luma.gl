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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9kcmF3LmpzIl0sIm5hbWVzIjpbImRyYXciLCJnbCIsImRyYXdNb2RlIiwiVFJJQU5HTEVTIiwidmVydGV4Q291bnQiLCJvZmZzZXQiLCJpc0luZGV4ZWQiLCJpbmRleFR5cGUiLCJVTlNJR05FRF9TSE9SVCIsImlzSW5zdGFuY2VkIiwiaW5zdGFuY2VDb3VudCIsImV4dGVuc2lvbiIsImdldEV4dGVuc2lvbiIsImRyYXdFbGVtZW50c0luc3RhbmNlZEFOR0xFIiwiZHJhd0FycmF5c0luc3RhbmNlZEFOR0xFIiwiZHJhd0VsZW1lbnRzIiwiZHJhd0FycmF5cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFZZ0JBLEksR0FBQUEsSTs7QUFUaEI7O0FBQ0E7O0FBRUE7Ozs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sU0FBU0EsSUFBVCxDQUFjQyxFQUFkLFFBUUo7QUFBQSwyQkFQREMsUUFPQztBQUFBLE1BUERBLFFBT0MsaUNBUFVELEdBQUdFLFNBT2I7QUFBQSxNQU5EQyxXQU1DLFFBTkRBLFdBTUM7QUFBQSx5QkFMREMsTUFLQztBQUFBLE1BTERBLE1BS0MsK0JBTFEsQ0FLUjtBQUFBLDRCQUpEQyxTQUlDO0FBQUEsTUFKREEsU0FJQyxrQ0FKVyxLQUlYO0FBQUEsNEJBSERDLFNBR0M7QUFBQSxNQUhEQSxTQUdDLGtDQUhXTixHQUFHTyxjQUdkO0FBQUEsOEJBRkRDLFdBRUM7QUFBQSxNQUZEQSxXQUVDLG9DQUZhLEtBRWI7QUFBQSxnQ0FEREMsYUFDQztBQUFBLE1BRERBLGFBQ0Msc0NBRGUsQ0FDZjs7QUFDRCxnREFBNEJULEVBQTVCOztBQUVBQyxhQUFXLG9CQUFNRCxFQUFOLEVBQVVDLFFBQVYsQ0FBWDtBQUNBSyxjQUFZLG9CQUFNTixFQUFOLEVBQVVNLFNBQVYsQ0FBWjs7QUFFQSxtQ0FBZUwsUUFBZixFQUF5QixTQUF6QjtBQUNBLE1BQUlJLFNBQUosRUFBZTtBQUNiLHNDQUFnQkMsU0FBaEIsRUFBMkIsU0FBM0I7QUFDRDs7QUFFRDtBQUNBLE1BQUlFLFdBQUosRUFBaUI7QUFDZixRQUFNRSxZQUFZVixHQUFHVyxZQUFILENBQWdCLHdCQUFoQixDQUFsQjtBQUNBLFFBQUlOLFNBQUosRUFBZTtBQUNiSyxnQkFBVUUsMEJBQVYsQ0FDRVgsUUFERixFQUNZRSxXQURaLEVBQ3lCRyxTQUR6QixFQUNvQ0YsTUFEcEMsRUFDNENLLGFBRDVDO0FBR0QsS0FKRCxNQUlPO0FBQ0xDLGdCQUFVRyx3QkFBVixDQUNFWixRQURGLEVBQ1lHLE1BRFosRUFDb0JELFdBRHBCLEVBQ2lDTSxhQURqQztBQUdEO0FBQ0YsR0FYRCxNQVdPLElBQUlKLFNBQUosRUFBZTtBQUNwQkwsT0FBR2MsWUFBSCxDQUFnQmIsUUFBaEIsRUFBMEJFLFdBQTFCLEVBQXVDRyxTQUF2QyxFQUFrREYsTUFBbEQ7QUFDRCxHQUZNLE1BRUE7QUFDTEosT0FBR2UsVUFBSCxDQUFjZCxRQUFkLEVBQXdCRyxNQUF4QixFQUFnQ0QsV0FBaEM7QUFDRDtBQUNGLEMsQ0FoREQ7QUFDQTtBQUNBIiwiZmlsZSI6ImRyYXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETyAtIGdlbmVyaWMgZHJhdyBjYWxsXG4vLyBPbmUgb2YgdGhlIGdvb2QgdGhpbmdzIGFib3V0IEdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5nc1xuaW1wb3J0IHtnZXRFeHRlbnNpb24sIGdsR2V0fSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQsIGFzc2VydERyYXdNb2RlLCBhc3NlcnRJbmRleFR5cGV9XG4gIGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQSBnb29kIHRoaW5nIGFib3V0IHdlYkdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5ncyxcbi8vIGUuZy4gZGVwZW5kaW5nIG9uIHdoZXRoZXIgZGF0YSBpcyBpbmRleGVkIGFuZC9vciBpc0luc3RhbmNlZC5cbi8vIFRoaXMgZnVuY3Rpb24gdW5pZmllcyB0aG9zZSBpbnRvIGEgc2luZ2xlIGNhbGwgd2l0aCBzaW1wbGUgcGFyYW1ldGVyc1xuLy8gdGhhdCBoYXZlIHNhbmUgZGVmYXVsdHMuXG5leHBvcnQgZnVuY3Rpb24gZHJhdyhnbCwge1xuICBkcmF3TW9kZSA9IGdsLlRSSUFOR0xFUyxcbiAgdmVydGV4Q291bnQsXG4gIG9mZnNldCA9IDAsXG4gIGlzSW5kZXhlZCA9IGZhbHNlLFxuICBpbmRleFR5cGUgPSBnbC5VTlNJR05FRF9TSE9SVCxcbiAgaXNJbnN0YW5jZWQgPSBmYWxzZSxcbiAgaW5zdGFuY2VDb3VudCA9IDBcbn0pIHtcbiAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICBkcmF3TW9kZSA9IGdsR2V0KGdsLCBkcmF3TW9kZSk7XG4gIGluZGV4VHlwZSA9IGdsR2V0KGdsLCBpbmRleFR5cGUpO1xuXG4gIGFzc2VydERyYXdNb2RlKGRyYXdNb2RlLCAnaW4gZHJhdycpO1xuICBpZiAoaXNJbmRleGVkKSB7XG4gICAgYXNzZXJ0SW5kZXhUeXBlKGluZGV4VHlwZSwgJ2luIGRyYXcnKTtcbiAgfVxuXG4gIC8vIFRPRE8gLSBVc2UgcG9seWZpbGxlZCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0IGluc3RlYWQgb2YgQU5HTEUgZXh0ZW5zaW9uXG4gIGlmIChpc0luc3RhbmNlZCkge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbignQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgIGlmIChpc0luZGV4ZWQpIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3RWxlbWVudHNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzSW5kZXhlZCkge1xuICAgIGdsLmRyYXdFbGVtZW50cyhkcmF3TW9kZSwgdmVydGV4Q291bnQsIGluZGV4VHlwZSwgb2Zmc2V0KTtcbiAgfSBlbHNlIHtcbiAgICBnbC5kcmF3QXJyYXlzKGRyYXdNb2RlLCBvZmZzZXQsIHZlcnRleENvdW50KTtcbiAgfVxufVxuIl19