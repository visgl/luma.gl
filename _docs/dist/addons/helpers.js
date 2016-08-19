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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvaGVscGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQUlnQixpQixHQUFBLGlCO1FBUUEsaUIsR0FBQSxpQjtRQUlBLGtCLEdBQUEsa0I7O0FBaEJoQjs7OztBQUNBOzs7Ozs7QUFDQTs7QUFFTyxTQUFTLGlCQUFULE9BQWlDO0FBQUEsTUFBTCxFQUFLLFFBQUwsRUFBSzs7QUFDdEMsU0FBTztBQUNMLFFBQUksb0JBQVEsTUFBUixDQUFlLE9BRGQ7QUFFTCxRQUFJLG9CQUFRLFFBQVIsQ0FBaUIsT0FGaEI7QUFHTDtBQUhLLEdBQVA7QUFLRDs7QUFFTSxTQUFTLGlCQUFULENBQTJCLEVBQTNCLEVBQStCO0FBQ3BDLFNBQU8sU0FBUyxjQUFULENBQXdCLEVBQXhCLEVBQTRCLFNBQW5DO0FBQ0Q7O0FBRU0sU0FBUyxrQkFBVCxRQUEwQztBQUFBLE1BQWIsRUFBYSxTQUFiLEVBQWE7QUFBQSxNQUFULEVBQVMsU0FBVCxFQUFTO0FBQUEsTUFBTCxFQUFLLFNBQUwsRUFBSzs7QUFDL0Msd0JBQU8sRUFBUDtBQUNBLHdCQUFPLEVBQVA7QUFDQSxTQUFPO0FBQ0wsUUFBSSxTQUFTLGNBQVQsQ0FBd0IsRUFBeEIsRUFBNEIsU0FEM0I7QUFFTCxRQUFJLFNBQVMsY0FBVCxDQUF3QixFQUF4QixFQUE0QixTQUYzQjtBQUdMO0FBSEssR0FBUDtBQUtEIiwiZmlsZSI6ImhlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgU2hhZGVycyBmcm9tICcuLi8uLi9zaGFkZXJsaWInO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0U2hhZGVycyh7aWR9KSB7XG4gIHJldHVybiB7XG4gICAgdnM6IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQsXG4gICAgZnM6IFNoYWRlcnMuRnJhZ21lbnQuRGVmYXVsdCxcbiAgICBpZFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RyaW5nRnJvbUhUTUwoaWQpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKS5pbm5lckhUTUw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTaGFkZXJzRnJvbUhUTUwoe3ZzLCBmcywgaWR9KSB7XG4gIGFzc2VydCh2cyk7XG4gIGFzc2VydChmcyk7XG4gIHJldHVybiB7XG4gICAgdnM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZzKS5pbm5lckhUTUwsXG4gICAgZnM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZzKS5pbm5lckhUTUwsXG4gICAgaWRcbiAgfTtcbn1cbiJdfQ==