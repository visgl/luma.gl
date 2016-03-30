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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy93ZWJnbC93ZWJnbDIvcG9seWZpbGwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBSXdCOzs7Ozs7Ozs7Ozs7QUFBVCxTQUFTLFlBQVQsQ0FBc0IsRUFBdEIsRUFBMEI7QUFDdkMsNkJBQXNCLEVBQXRCLEVBRHVDO0NBQTFCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICdpbnN0YW5jZWQtYXJyYXlzJztcbmltcG9ydCAndmVydGV4LWFycmF5LW9iamVjdCc7XG5pbXBvcnQgaW5pdGlhbGl6ZURyYXdCdWZmZXJzIGZyb20gJ2RyYXctYnVmZmVycyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGluaXRQb2x5ZmlsbChnbCkge1xuICBpbml0aWFsaXplRHJhd0J1ZmZlcnMoZ2wpO1xufVxuIl19