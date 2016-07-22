'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultShaders = getDefaultShaders;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvaGVscGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQUlnQixpQixHQUFBLGlCO1FBUUEsa0IsR0FBQSxrQjs7QUFaaEI7Ozs7QUFDQTs7Ozs7Ozs7QUFHTyxTQUFTLGlCQUFULE9BQWlDO0FBQUEsTUFBTCxFQUFLLFFBQUwsRUFBSzs7QUFDdEMsU0FBTztBQUNMLFFBQUksb0JBQVEsTUFBUixDQUFlLE9BRGQ7QUFFTCxRQUFJLG9CQUFRLFFBQVIsQ0FBaUIsT0FGaEI7QUFHTDtBQUhLLEdBQVA7QUFLRDs7QUFFTSxTQUFTLGtCQUFULFFBQTBDO0FBQUEsTUFBYixFQUFhLFNBQWIsRUFBYTtBQUFBLE1BQVQsRUFBUyxTQUFULEVBQVM7QUFBQSxNQUFMLEVBQUssU0FBTCxFQUFLOztBQUMvQyx3QkFBTyxFQUFQO0FBQ0Esd0JBQU8sRUFBUDtBQUNBLFNBQU87QUFDTCxRQUFJLFNBQVMsY0FBVCxDQUF3QixFQUF4QixFQUE0QixTQUQzQjtBQUVMLFFBQUksU0FBUyxjQUFULENBQXdCLEVBQXhCLEVBQTRCLFNBRjNCO0FBR0w7QUFISyxHQUFQO0FBS0QiLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTaGFkZXJzIGZyb20gJy4uLy4uL3NoYWRlcmxpYic7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRTaGFkZXJzKHtpZH0pIHtcbiAgcmV0dXJuIHtcbiAgICB2czogU2hhZGVycy5WZXJ0ZXguRGVmYXVsdCxcbiAgICBmczogU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0LFxuICAgIGlkXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTaGFkZXJzRnJvbUhUTUwoe3ZzLCBmcywgaWR9KSB7XG4gIGFzc2VydCh2cyk7XG4gIGFzc2VydChmcyk7XG4gIHJldHVybiB7XG4gICAgdnM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZzKS5pbm5lckhUTUwsXG4gICAgZnM6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZzKS5pbm5lckhUTUwsXG4gICAgaWRcbiAgfTtcbn1cbiJdfQ==