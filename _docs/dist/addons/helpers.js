'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultShaders = getDefaultShaders;
exports.getStringFromHTML = getStringFromHTML;
exports.getShadersFromHTML = getShadersFromHTML;

var _shaderlib = require('../../shaderlib');

var _shaderlib2 = _interopRequireDefault(_shaderlib);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global document */

function getDefaultShaders(_ref) {
  var id = _ref.id;

  return {
    vs: _shaderlib2.default.Vertex.Default,
    fs: _shaderlib2.default.Fragment.Default,
    id: id
  };
}

function getStringFromHTML(id) {
  return document.getElementById(id).innerHTML;
}

function getShadersFromHTML(_ref2) {
  var vs = _ref2.vs;
  var fs = _ref2.fs;
  var id = _ref2.id;

  (0, _assert2.default)(vs);
  (0, _assert2.default)(fs);
  return {
    vs: document.getElementById(vs).innerHTML,
    fs: document.getElementById(fs).innerHTML,
    id: id
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvaGVscGVycy5qcyJdLCJuYW1lcyI6WyJnZXREZWZhdWx0U2hhZGVycyIsImdldFN0cmluZ0Zyb21IVE1MIiwiZ2V0U2hhZGVyc0Zyb21IVE1MIiwiaWQiLCJ2cyIsIlZlcnRleCIsIkRlZmF1bHQiLCJmcyIsIkZyYWdtZW50IiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImlubmVySFRNTCJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFJZ0JBLGlCLEdBQUFBLGlCO1FBUUFDLGlCLEdBQUFBLGlCO1FBSUFDLGtCLEdBQUFBLGtCOztBQWhCaEI7Ozs7QUFDQTs7Ozs7O0FBQ0E7O0FBRU8sU0FBU0YsaUJBQVQsT0FBaUM7QUFBQSxNQUFMRyxFQUFLLFFBQUxBLEVBQUs7O0FBQ3RDLFNBQU87QUFDTEMsUUFBSSxvQkFBUUMsTUFBUixDQUFlQyxPQURkO0FBRUxDLFFBQUksb0JBQVFDLFFBQVIsQ0FBaUJGLE9BRmhCO0FBR0xIO0FBSEssR0FBUDtBQUtEOztBQUVNLFNBQVNGLGlCQUFULENBQTJCRSxFQUEzQixFQUErQjtBQUNwQyxTQUFPTSxTQUFTQyxjQUFULENBQXdCUCxFQUF4QixFQUE0QlEsU0FBbkM7QUFDRDs7QUFFTSxTQUFTVCxrQkFBVCxRQUEwQztBQUFBLE1BQWJFLEVBQWEsU0FBYkEsRUFBYTtBQUFBLE1BQVRHLEVBQVMsU0FBVEEsRUFBUztBQUFBLE1BQUxKLEVBQUssU0FBTEEsRUFBSzs7QUFDL0Msd0JBQU9DLEVBQVA7QUFDQSx3QkFBT0csRUFBUDtBQUNBLFNBQU87QUFDTEgsUUFBSUssU0FBU0MsY0FBVCxDQUF3Qk4sRUFBeEIsRUFBNEJPLFNBRDNCO0FBRUxKLFFBQUlFLFNBQVNDLGNBQVQsQ0FBd0JILEVBQXhCLEVBQTRCSSxTQUYzQjtBQUdMUjtBQUhLLEdBQVA7QUFLRCIsImZpbGUiOiJoZWxwZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vLi4vc2hhZGVybGliJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0Jztcbi8qIGdsb2JhbCBkb2N1bWVudCAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFNoYWRlcnMoe2lkfSkge1xuICByZXR1cm4ge1xuICAgIHZzOiBTaGFkZXJzLlZlcnRleC5EZWZhdWx0LFxuICAgIGZzOiBTaGFkZXJzLkZyYWdtZW50LkRlZmF1bHQsXG4gICAgaWRcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0cmluZ0Zyb21IVE1MKGlkKSB7XG4gIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuaW5uZXJIVE1MO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2hhZGVyc0Zyb21IVE1MKHt2cywgZnMsIGlkfSkge1xuICBhc3NlcnQodnMpO1xuICBhc3NlcnQoZnMpO1xuICByZXR1cm4ge1xuICAgIHZzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh2cykuaW5uZXJIVE1MLFxuICAgIGZzOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChmcykuaW5uZXJIVE1MLFxuICAgIGlkXG4gIH07XG59XG4iXX0=