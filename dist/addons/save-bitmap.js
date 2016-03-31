'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveBitmap = saveBitmap;

var _filesaver = require('filesaver.js');

var _canvasToBlob = require('canvas-to-blob');

var _canvasToBlob2 = _interopRequireDefault(_canvasToBlob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function saveBitmap(canvas, filename) {
  var blob = (0, _canvasToBlob2.default)(canvas.toDataURL());
  (0, _filesaver.saveAs)(blob, filename);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvc2F2ZS1iaXRtYXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFHZ0I7Ozs7Ozs7Ozs7QUFBVCxTQUFTLFVBQVQsQ0FBb0IsTUFBcEIsRUFBNEIsUUFBNUIsRUFBc0M7QUFDM0MsTUFBTSxPQUFPLDRCQUFPLE9BQU8sU0FBUCxFQUFQLENBQVAsQ0FEcUM7QUFFM0MseUJBQU8sSUFBUCxFQUFhLFFBQWIsRUFGMkM7Q0FBdEMiLCJmaWxlIjoic2F2ZS1iaXRtYXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3NhdmVBc30gZnJvbSAnZmlsZXNhdmVyLmpzJztcbmltcG9ydCB7ZGVmYXVsdCBhcyB0b0Jsb2J9IGZyb20gJ2NhbnZhcy10by1ibG9iJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVCaXRtYXAoY2FudmFzLCBmaWxlbmFtZSkge1xuICBjb25zdCBibG9iID0gdG9CbG9iKGNhbnZhcy50b0RhdGFVUkwoKSk7XG4gIHNhdmVBcyhibG9iLCBmaWxlbmFtZSk7XG59XG4iXX0=