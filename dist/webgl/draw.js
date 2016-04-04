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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9kcmF3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBV2dCOztBQVJoQjs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQU1PLFNBQVMsSUFBVCxDQUFjLEVBQWQsUUFJSjsyQkFIRCxTQUdDO01BSEQseUNBQVcscUJBR1Y7TUFIZ0IsK0JBR2hCO3lCQUg2QixPQUc3QjtNQUg2QixxQ0FBUyxnQkFHdEM7TUFGRCx1QkFFQzs0QkFGUSxVQUVSO01BRlEsMkNBQVksc0JBRXBCOzRCQURELFVBQ0M7TUFERCwyQ0FBWSx1QkFDWDtnQ0FEa0IsY0FDbEI7TUFEa0IsbURBQWdCLHVCQUNsQzs7QUFDRCxhQUFXLFdBQVcsR0FBRyxHQUFILENBQU8sUUFBUCxDQUFYLEdBQThCLEdBQUcsU0FBSCxDQUR4QztBQUVELGNBQVksWUFBWSxHQUFHLEdBQUgsQ0FBTyxTQUFQLENBQVosR0FBZ0MsR0FBRyxjQUFILENBRjNDOztBQUlELHdCQUFPLDBCQUFjLEVBQWQsRUFBa0IsT0FBbEIsQ0FBMEIsUUFBMUIsSUFBc0MsQ0FBQyxDQUFELEVBQUksbUJBQWpELEVBSkM7QUFLRCx3QkFBTywyQkFBZSxFQUFmLEVBQW1CLE9BQW5CLENBQTJCLFNBQTNCLElBQXdDLENBQUMsQ0FBRCxFQUFJLG9CQUFuRDs7O0FBTEMsTUFRRyxTQUFKLEVBQWU7QUFDYixRQUFNLFlBQVksR0FBRyxZQUFILENBQWdCLHdCQUFoQixDQUFaLENBRE87QUFFYixRQUFJLE9BQUosRUFBYTtBQUNYLGdCQUFVLDBCQUFWLENBQ0UsUUFERixFQUNZLFdBRFosRUFDeUIsU0FEekIsRUFDb0MsTUFEcEMsRUFDNEMsYUFENUMsRUFEVztLQUFiLE1BSU87QUFDTCxnQkFBVSx3QkFBVixDQUNFLFFBREYsRUFDWSxNQURaLEVBQ29CLFdBRHBCLEVBQ2lDLGFBRGpDLEVBREs7S0FKUDtHQUZGLE1BV08sSUFBSSxPQUFKLEVBQWE7QUFDbEIsT0FBRyxZQUFILENBQWdCLFFBQWhCLEVBQTBCLFdBQTFCLEVBQXVDLFNBQXZDLEVBQWtELE1BQWxELEVBRGtCO0dBQWIsTUFFQTtBQUNMLE9BQUcsVUFBSCxDQUFjLFFBQWQsRUFBd0IsTUFBeEIsRUFBZ0MsV0FBaEMsRUFESztHQUZBO0NBdkJGIiwiZmlsZSI6ImRyYXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gVE9ETyAtIGdlbmVyaWMgZHJhdyBjYWxsXG4vLyBPbmUgb2YgdGhlIGdvb2QgdGhpbmdzIGFib3V0IEdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5nc1xuaW1wb3J0IHtnZXRFeHRlbnNpb259IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge0dMX0lOREVYX1RZUEVTLCBHTF9EUkFXX01PREVTfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQSBnb29kIHRoaW5nIGFib3V0IHdlYkdMIGlzIHRoYXQgdGhlcmUgYXJlIHNvIG1hbnkgd2F5cyB0byBkcmF3IHRoaW5ncyxcbi8vIGRlcGVuZGluZyBvbiB3aGV0aGVyIGRhdGEgaXMgaW5kZXhlZCBhbmQvb3IgaW5zdGFuY2VkLlxuLy8gVGhpcyBmdW5jdGlvbiB1bmlmaWVzIHRob3NlIGludG8gYSBzaW5nbGUgY2FsbCB3aXRoIHNpbXBsZSBwYXJhbWV0ZXJzXG4vLyB0aGF0IGhhdmUgc2FuZSBkZWZhdWx0cy5cbmV4cG9ydCBmdW5jdGlvbiBkcmF3KGdsLCB7XG4gIGRyYXdNb2RlID0gbnVsbCwgdmVydGV4Q291bnQsIG9mZnNldCA9IDAsXG4gIGluZGV4ZWQsIGluZGV4VHlwZSA9IG51bGwsXG4gIGluc3RhbmNlZCA9IGZhbHNlLCBpbnN0YW5jZUNvdW50ID0gMFxufSkge1xuICBkcmF3TW9kZSA9IGRyYXdNb2RlID8gZ2wuZ2V0KGRyYXdNb2RlKSA6IGdsLlRSSUFOR0xFUztcbiAgaW5kZXhUeXBlID0gaW5kZXhUeXBlID8gZ2wuZ2V0KGluZGV4VHlwZSkgOiBnbC5VTlNJR05FRF9TSE9SVDtcblxuICBhc3NlcnQoR0xfRFJBV19NT0RFUyhnbCkuaW5kZXhPZihkcmF3TW9kZSkgPiAtMSwgJ0ludmFsaWQgZHJhdyBtb2RlJyk7XG4gIGFzc2VydChHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihpbmRleFR5cGUpID4gLTEsICdJbnZhbGlkIGluZGV4IHR5cGUnKTtcblxuICAvLyBUT0RPIC0gVXNlIHBvbHlmaWxsZWQgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCBpbnN0ZWFkIG9mIEFOR0xFIGV4dGVuc2lvblxuICBpZiAoaW5zdGFuY2VkKSB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKCdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgaWYgKGluZGV4ZWQpIHtcbiAgICAgIGV4dGVuc2lvbi5kcmF3RWxlbWVudHNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCwgaW5zdGFuY2VDb3VudFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5zaW9uLmRyYXdBcnJheXNJbnN0YW5jZWRBTkdMRShcbiAgICAgICAgZHJhd01vZGUsIG9mZnNldCwgdmVydGV4Q291bnQsIGluc3RhbmNlQ291bnRcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGluZGV4ZWQpIHtcbiAgICBnbC5kcmF3RWxlbWVudHMoZHJhd01vZGUsIHZlcnRleENvdW50LCBpbmRleFR5cGUsIG9mZnNldCk7XG4gIH0gZWxzZSB7XG4gICAgZ2wuZHJhd0FycmF5cyhkcmF3TW9kZSwgb2Zmc2V0LCB2ZXJ0ZXhDb3VudCk7XG4gIH1cbn1cbiJdfQ==