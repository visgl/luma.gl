'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.browserFs = undefined;

var _nodeImageIo = require('./node-image-io');

Object.keys(_nodeImageIo).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _nodeImageIo[key];
    }
  });
});

var _fs = require('fs');

var browserFs = { readFile: _fs.readFile, writeFile: _fs.writeFile }; // Export node functions matched by browser-fs

exports.browserFs = browserFs;

// Export node implementation of image io
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9ub2RlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU1BO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFMQTs7QUFDQSxJQUFNLFlBQVksRUFBQyxzQkFBRCxFQUFXLHdCQUFYLEVBQWxCLEM7O1FBQ1EsUyxHQUFBLFMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBFeHBvcnQgbm9kZSBmdW5jdGlvbnMgbWF0Y2hlZCBieSBicm93c2VyLWZzXG5pbXBvcnQge3JlYWRGaWxlLCB3cml0ZUZpbGV9IGZyb20gJ2ZzJztcbmNvbnN0IGJyb3dzZXJGcyA9IHtyZWFkRmlsZSwgd3JpdGVGaWxlfTtcbmV4cG9ydCB7YnJvd3NlckZzfTtcblxuLy8gRXhwb3J0IG5vZGUgaW1wbGVtZW50YXRpb24gb2YgaW1hZ2UgaW9cbmV4cG9ydCAqIGZyb20gJy4vbm9kZS1pbWFnZS1pbyc7XG4iXX0=