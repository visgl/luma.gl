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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zYXZlLWJpdG1hcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQUdnQjs7Ozs7Ozs7OztBQUFULFNBQVMsVUFBVCxDQUFvQixNQUFwQixFQUE0QixRQUE1QixFQUFzQztBQUMzQyxNQUFNLE9BQU8sNEJBQU8sT0FBTyxTQUFQLEVBQVAsQ0FBUCxDQURxQztBQUUzQyx5QkFBTyxJQUFQLEVBQWEsUUFBYixFQUYyQztDQUF0QyIsImZpbGUiOiJzYXZlLWJpdG1hcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7c2F2ZUFzfSBmcm9tICdmaWxlc2F2ZXIuanMnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIHRvQmxvYn0gZnJvbSAnY2FudmFzLXRvLWJsb2InO1xuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZUJpdG1hcChjYW52YXMsIGZpbGVuYW1lKSB7XG4gIGNvbnN0IGJsb2IgPSB0b0Jsb2IoY2FudmFzLnRvRGF0YVVSTCgpKTtcbiAgc2F2ZUFzKGJsb2IsIGZpbGVuYW1lKTtcbn1cbiJdfQ==