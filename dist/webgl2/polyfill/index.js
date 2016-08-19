'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initPolyfill;

require('instanced-arrays');

require('vertex-array-object');

var _drawBuffers = require('draw-buffers');

var _drawBuffers2 = _interopRequireDefault(_drawBuffers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initPolyfill(gl) {
  (0, _drawBuffers2.default)(gl);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbDIvcG9seWZpbGwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBSXdCLFk7O0FBSnhCOztBQUNBOztBQUNBOzs7Ozs7QUFFZSxTQUFTLFlBQVQsQ0FBc0IsRUFBdEIsRUFBMEI7QUFDdkMsNkJBQXNCLEVBQXRCO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ2luc3RhbmNlZC1hcnJheXMnO1xuaW1wb3J0ICd2ZXJ0ZXgtYXJyYXktb2JqZWN0JztcbmltcG9ydCBpbml0aWFsaXplRHJhd0J1ZmZlcnMgZnJvbSAnZHJhdy1idWZmZXJzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdFBvbHlmaWxsKGdsKSB7XG4gIGluaXRpYWxpemVEcmF3QnVmZmVycyhnbCk7XG59XG4iXX0=