'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _platform = require('./platform');

Object.keys(_platform).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _platform[key];
    }
  });
});

var _loadFiles = require('./load-files');

Object.keys(_loadFiles).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _loadFiles[key];
    }
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pby9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7OztBQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENhbGwgYSByZXF1aXJlIGJhc2VkIGhlbHBlciB0byBzZWxlY3QgcGxhdGZvcm0gdG8gZXhwb3J0XG5leHBvcnQgKiBmcm9tICcuL3BsYXRmb3JtJztcbmV4cG9ydCAqIGZyb20gJy4vbG9hZC1maWxlcyc7XG4iXX0=