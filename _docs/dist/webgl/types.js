'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GL_BUFFER_USAGE = exports.BUFFER_USAGE = exports.GL_TARGETS = exports.TARGETS = exports.GL_DRAW_MODES = exports.DRAW_MODES = exports.GL_INDEX_TYPES = exports.INDEX_TYPES = undefined;

var _webglTypes = require('./webgl-types');

Object.keys(_webglTypes).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _webglTypes[key];
    }
  });
});
exports.isIndexType = isIndexType;
exports.isGLIndexType = isGLIndexType;
exports.assertIndexType = assertIndexType;
exports.isDrawMode = isDrawMode;
exports.isGLDrawMode = isGLDrawMode;
exports.assertDrawMode = assertDrawMode;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// INDEX TYPES

// For drawElements, size of indices
// Helper definitions for validation of webgl parameters
/* eslint-disable no-inline-comments, max-len */
var INDEX_TYPES = exports.INDEX_TYPES = ['UNSIGNED_BYTE', 'UNSIGNED_SHORT'];
var GL_INDEX_TYPES = exports.GL_INDEX_TYPES = function GL_INDEX_TYPES(gl) {
  return INDEX_TYPES.map(function (constant) {
    return gl[constant];
  });
};

function isIndexType(type) {
  return INDEX_TYPES.indexOf(type) !== -1;
}
function isGLIndexType(gl, glType) {
  return GL_INDEX_TYPES(gl).indexOf(glType) !== -1;
}

function assertIndexType(gl, glType, source) {
  (0, _assert2.default)(isGLIndexType(gl, glType), 'Bad index type gl.' + getKey(gl, glType) + ' ' + source);
}

// DRAW MODES

var DRAW_MODES = exports.DRAW_MODES = ['POINTS', 'LINE_STRIP', 'LINE_LOOP', 'LINES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN', 'TRIANGLES'];
var GL_DRAW_MODES = exports.GL_DRAW_MODES = function GL_DRAW_MODES(gl) {
  return DRAW_MODES.map(function (constant) {
    return gl[constant];
  });
};

function isDrawMode(mode) {
  return DRAW_MODES.indexOf(mode) !== -1;
}
function isGLDrawMode(gl, glMode) {
  return GL_DRAW_MODES(gl).indexOf(glMode) !== -1;
}

function assertDrawMode(gl, glType, source) {
  (0, _assert2.default)(isGLDrawMode(gl, glType), 'Bad draw mode gl.' + getKey(gl, glType) + ' ' + source);
}

// TARGET TYPES

var TARGETS = exports.TARGETS = ['ARRAY_BUFFER', // vertex attributes (e.g. vertex/texture coords or color)
'ELEMENT_ARRAY_BUFFER', // Buffer used for element indices.
// For WebGL 2 contexts
'COPY_READ_BUFFER', // Buffer for copying from one buffer object to another
'COPY_WRITE_BUFFER', // Buffer for copying from one buffer object to another
'TRANSFORM_FEEDBACK_BUFFER', // Buffer for transform feedback operations
'UNIFORM_BUFFER', // Buffer used for storing uniform blocks
'PIXEL_PACK_BUFFER', // Buffer used for pixel transfer operations
'PIXEL_UNPACK_BUFFER' // Buffer used for pixel transfer operations
];

var GL_TARGETS = exports.GL_TARGETS = function GL_TARGETS(gl) {
  return TARGETS.map(function (constant) {
    return gl[constant];
  }).filter(function (constant) {
    return constant;
  });
};

// USAGE TYPES

var BUFFER_USAGE = exports.BUFFER_USAGE = ['STATIC_DRAW', // Buffer used often and not change often. Contents are written to the buffer, but not read.
'DYNAMIC_DRAW', // Buffer used often and change often. Contents are written to the buffer, but not read.
'STREAM_DRAW', // Buffer not used often. Contents are written to the buffer, but not read.
// For WebGL 2 contexts
'STATIC_READ', // Buffer used often and not change often. Contents are read from the buffer, but not written.
'DYNAMIC_READ', // Buffer used often and change often. Contents are read from the buffer, but not written.
'STREAM_READ', // Contents of the buffer are likely to not be used often. Contents are read from the buffer, but not written.
'STATIC_COPY', // Buffer used often and not change often. Contents are neither written or read by the user.
'DYNAMIC_COPY', // Buffer used often and change often. Contents are neither written or read by the user.
'STREAM_COPY' // Buffer used often and not change often. Contents are neither written or read by the user.
];

var GL_BUFFER_USAGE = exports.GL_BUFFER_USAGE = function GL_BUFFER_USAGE(gl) {
  return BUFFER_USAGE.map(function (constant) {
    return gl[constant];
  }).filter(function (constant) {
    return constant;
  });
};

function getKey(gl, value) {
  for (var key in gl) {
    if (gl[key] === value) {
      return key;
    }
  }
  return String(value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC90eXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFHQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7UUFRZ0IsVyxHQUFBLFc7UUFHQSxhLEdBQUEsYTtRQUlBLGUsR0FBQSxlO1FBYUEsVSxHQUFBLFU7UUFHQSxZLEdBQUEsWTtRQUlBLGMsR0FBQSxjOztBQXBDaEI7Ozs7Ozs7Ozs7O0FBTU8sSUFBTSxvQ0FBYyxDQUFDLGVBQUQsRUFBa0IsZ0JBQWxCLENBQXBCO0FBQ0EsSUFBTSwwQ0FBaUIsU0FBakIsY0FBaUI7QUFBQSxTQUFNLFlBQVksR0FBWixDQUFnQjtBQUFBLFdBQVksR0FBRyxRQUFILENBQVo7QUFBQSxHQUFoQixDQUFOO0FBQUEsQ0FBdkI7O0FBRUEsU0FBUyxXQUFULENBQXFCLElBQXJCLEVBQTJCO0FBQ2hDLFNBQU8sWUFBWSxPQUFaLENBQW9CLElBQXBCLE1BQThCLENBQUMsQ0FBdEM7QUFDRDtBQUNNLFNBQVMsYUFBVCxDQUF1QixFQUF2QixFQUEyQixNQUEzQixFQUFtQztBQUN4QyxTQUFPLGVBQWUsRUFBZixFQUFtQixPQUFuQixDQUEyQixNQUEzQixNQUF1QyxDQUFDLENBQS9DO0FBQ0Q7O0FBRU0sU0FBUyxlQUFULENBQXlCLEVBQXpCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDLEVBQTZDO0FBQ2xELHdCQUFPLGNBQWMsRUFBZCxFQUFrQixNQUFsQixDQUFQLHlCQUN1QixPQUFPLEVBQVAsRUFBVyxNQUFYLENBRHZCLFNBQzZDLE1BRDdDO0FBRUQ7Ozs7QUFJTSxJQUFNLGtDQUFhLENBQ3hCLFFBRHdCLEVBQ2QsWUFEYyxFQUNBLFdBREEsRUFDYSxPQURiLEVBRXhCLGdCQUZ3QixFQUVOLGNBRk0sRUFFVSxXQUZWLENBQW5CO0FBSUEsSUFBTSx3Q0FBZ0IsU0FBaEIsYUFBZ0I7QUFBQSxTQUFNLFdBQVcsR0FBWCxDQUFlO0FBQUEsV0FBWSxHQUFHLFFBQUgsQ0FBWjtBQUFBLEdBQWYsQ0FBTjtBQUFBLENBQXRCOztBQUVBLFNBQVMsVUFBVCxDQUFvQixJQUFwQixFQUEwQjtBQUMvQixTQUFPLFdBQVcsT0FBWCxDQUFtQixJQUFuQixNQUE2QixDQUFDLENBQXJDO0FBQ0Q7QUFDTSxTQUFTLFlBQVQsQ0FBc0IsRUFBdEIsRUFBMEIsTUFBMUIsRUFBa0M7QUFDdkMsU0FBTyxjQUFjLEVBQWQsRUFBa0IsT0FBbEIsQ0FBMEIsTUFBMUIsTUFBc0MsQ0FBQyxDQUE5QztBQUNEOztBQUVNLFNBQVMsY0FBVCxDQUF3QixFQUF4QixFQUE0QixNQUE1QixFQUFvQyxNQUFwQyxFQUE0QztBQUNqRCx3QkFBTyxhQUFhLEVBQWIsRUFBaUIsTUFBakIsQ0FBUCx3QkFDc0IsT0FBTyxFQUFQLEVBQVcsTUFBWCxDQUR0QixTQUM0QyxNQUQ1QztBQUVEOzs7O0FBSU0sSUFBTSw0QkFBVSxDQUNyQixjQURxQixFO0FBRXJCLHNCQUZxQixFOztBQUlyQixrQkFKcUIsRTtBQUtyQixtQkFMcUIsRTtBQU1yQiwyQkFOcUIsRTtBQU9yQixnQkFQcUIsRTtBQVFyQixtQkFScUIsRTtBQVNyQixxQjtBQVRxQixDQUFoQjs7QUFZQSxJQUFNLGtDQUNYLFNBRFcsVUFDWDtBQUFBLFNBQU0sUUFBUSxHQUFSLENBQVk7QUFBQSxXQUFZLEdBQUcsUUFBSCxDQUFaO0FBQUEsR0FBWixFQUFzQyxNQUF0QyxDQUE2QztBQUFBLFdBQVksUUFBWjtBQUFBLEdBQTdDLENBQU47QUFBQSxDQURLOzs7O0FBS0EsSUFBTSxzQ0FBZSxDQUMxQixhQUQwQixFO0FBRTFCLGNBRjBCLEU7QUFHMUIsYUFIMEIsRTs7QUFLMUIsYUFMMEIsRTtBQU0xQixjQU4wQixFO0FBTzFCLGFBUDBCLEU7QUFRMUIsYUFSMEIsRTtBQVMxQixjQVQwQixFO0FBVTFCLGE7QUFWMEIsQ0FBckI7O0FBYUEsSUFBTSw0Q0FDWCxTQURXLGVBQ1g7QUFBQSxTQUFNLGFBQWEsR0FBYixDQUFpQjtBQUFBLFdBQVksR0FBRyxRQUFILENBQVo7QUFBQSxHQUFqQixFQUEyQyxNQUEzQyxDQUFrRDtBQUFBLFdBQVksUUFBWjtBQUFBLEdBQWxELENBQU47QUFBQSxDQURLOztBQUdQLFNBQVMsTUFBVCxDQUFnQixFQUFoQixFQUFvQixLQUFwQixFQUEyQjtBQUN6QixPQUFLLElBQU0sR0FBWCxJQUFrQixFQUFsQixFQUFzQjtBQUNwQixRQUFJLEdBQUcsR0FBSCxNQUFZLEtBQWhCLEVBQXVCO0FBQ3JCLGFBQU8sR0FBUDtBQUNEO0FBQ0Y7QUFDRCxTQUFPLE9BQU8sS0FBUCxDQUFQO0FBQ0QiLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBIZWxwZXIgZGVmaW5pdGlvbnMgZm9yIHZhbGlkYXRpb24gb2Ygd2ViZ2wgcGFyYW1ldGVyc1xuLyogZXNsaW50LWRpc2FibGUgbm8taW5saW5lLWNvbW1lbnRzLCBtYXgtbGVuICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5leHBvcnQgKiBmcm9tICcuL3dlYmdsLXR5cGVzJztcblxuLy8gSU5ERVggVFlQRVNcblxuLy8gRm9yIGRyYXdFbGVtZW50cywgc2l6ZSBvZiBpbmRpY2VzXG5leHBvcnQgY29uc3QgSU5ERVhfVFlQRVMgPSBbJ1VOU0lHTkVEX0JZVEUnLCAnVU5TSUdORURfU0hPUlQnXTtcbmV4cG9ydCBjb25zdCBHTF9JTkRFWF9UWVBFUyA9IGdsID0+IElOREVYX1RZUEVTLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNJbmRleFR5cGUodHlwZSkge1xuICByZXR1cm4gSU5ERVhfVFlQRVMuaW5kZXhPZih0eXBlKSAhPT0gLTE7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNHTEluZGV4VHlwZShnbCwgZ2xUeXBlKSB7XG4gIHJldHVybiBHTF9JTkRFWF9UWVBFUyhnbCkuaW5kZXhPZihnbFR5cGUpICE9PSAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEluZGV4VHlwZShnbCwgZ2xUeXBlLCBzb3VyY2UpIHtcbiAgYXNzZXJ0KGlzR0xJbmRleFR5cGUoZ2wsIGdsVHlwZSksXG4gICAgYEJhZCBpbmRleCB0eXBlIGdsLiR7Z2V0S2V5KGdsLCBnbFR5cGUpfSAke3NvdXJjZX1gKTtcbn1cblxuLy8gRFJBVyBNT0RFU1xuXG5leHBvcnQgY29uc3QgRFJBV19NT0RFUyA9IFtcbiAgJ1BPSU5UUycsICdMSU5FX1NUUklQJywgJ0xJTkVfTE9PUCcsICdMSU5FUycsXG4gICdUUklBTkdMRV9TVFJJUCcsICdUUklBTkdMRV9GQU4nLCAnVFJJQU5HTEVTJ1xuXTtcbmV4cG9ydCBjb25zdCBHTF9EUkFXX01PREVTID0gZ2wgPT4gRFJBV19NT0RFUy5tYXAoY29uc3RhbnQgPT4gZ2xbY29uc3RhbnRdKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRHJhd01vZGUobW9kZSkge1xuICByZXR1cm4gRFJBV19NT0RFUy5pbmRleE9mKG1vZGUpICE9PSAtMTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0dMRHJhd01vZGUoZ2wsIGdsTW9kZSkge1xuICByZXR1cm4gR0xfRFJBV19NT0RFUyhnbCkuaW5kZXhPZihnbE1vZGUpICE9PSAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydERyYXdNb2RlKGdsLCBnbFR5cGUsIHNvdXJjZSkge1xuICBhc3NlcnQoaXNHTERyYXdNb2RlKGdsLCBnbFR5cGUpLFxuICAgIGBCYWQgZHJhdyBtb2RlIGdsLiR7Z2V0S2V5KGdsLCBnbFR5cGUpfSAke3NvdXJjZX1gKTtcbn1cblxuLy8gVEFSR0VUIFRZUEVTXG5cbmV4cG9ydCBjb25zdCBUQVJHRVRTID0gW1xuICAnQVJSQVlfQlVGRkVSJywgLy8gdmVydGV4IGF0dHJpYnV0ZXMgKGUuZy4gdmVydGV4L3RleHR1cmUgY29vcmRzIG9yIGNvbG9yKVxuICAnRUxFTUVOVF9BUlJBWV9CVUZGRVInLCAvLyBCdWZmZXIgdXNlZCBmb3IgZWxlbWVudCBpbmRpY2VzLlxuICAvLyBGb3IgV2ViR0wgMiBjb250ZXh0c1xuICAnQ09QWV9SRUFEX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgY29weWluZyBmcm9tIG9uZSBidWZmZXIgb2JqZWN0IHRvIGFub3RoZXJcbiAgJ0NPUFlfV1JJVEVfQlVGRkVSJywgLy8gQnVmZmVyIGZvciBjb3B5aW5nIGZyb20gb25lIGJ1ZmZlciBvYmplY3QgdG8gYW5vdGhlclxuICAnVFJBTlNGT1JNX0ZFRURCQUNLX0JVRkZFUicsIC8vIEJ1ZmZlciBmb3IgdHJhbnNmb3JtIGZlZWRiYWNrIG9wZXJhdGlvbnNcbiAgJ1VOSUZPUk1fQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHN0b3JpbmcgdW5pZm9ybSBibG9ja3NcbiAgJ1BJWEVMX1BBQ0tfQlVGRkVSJywgLy8gQnVmZmVyIHVzZWQgZm9yIHBpeGVsIHRyYW5zZmVyIG9wZXJhdGlvbnNcbiAgJ1BJWEVMX1VOUEFDS19CVUZGRVInIC8vIEJ1ZmZlciB1c2VkIGZvciBwaXhlbCB0cmFuc2ZlciBvcGVyYXRpb25zXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfVEFSR0VUUyA9XG4gIGdsID0+IFRBUkdFVFMubWFwKGNvbnN0YW50ID0+IGdsW2NvbnN0YW50XSkuZmlsdGVyKGNvbnN0YW50ID0+IGNvbnN0YW50KTtcblxuLy8gVVNBR0UgVFlQRVNcblxuZXhwb3J0IGNvbnN0IEJVRkZFUl9VU0FHRSA9IFtcbiAgJ1NUQVRJQ19EUkFXJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIG5vdCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ0RZTkFNSUNfRFJBVycsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSB3cml0dGVuIHRvIHRoZSBidWZmZXIsIGJ1dCBub3QgcmVhZC5cbiAgJ1NUUkVBTV9EUkFXJywgLy8gQnVmZmVyIG5vdCB1c2VkIG9mdGVuLiBDb250ZW50cyBhcmUgd3JpdHRlbiB0byB0aGUgYnVmZmVyLCBidXQgbm90IHJlYWQuXG4gIC8vIEZvciBXZWJHTCAyIGNvbnRleHRzXG4gICdTVEFUSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgcmVhZCBmcm9tIHRoZSBidWZmZXIsIGJ1dCBub3Qgd3JpdHRlbi5cbiAgJ0RZTkFNSUNfUkVBRCcsIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBjaGFuZ2Ugb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RSRUFNX1JFQUQnLCAvLyBDb250ZW50cyBvZiB0aGUgYnVmZmVyIGFyZSBsaWtlbHkgdG8gbm90IGJlIHVzZWQgb2Z0ZW4uIENvbnRlbnRzIGFyZSByZWFkIGZyb20gdGhlIGJ1ZmZlciwgYnV0IG5vdCB3cml0dGVuLlxuICAnU1RBVElDX0NPUFknLCAvLyBCdWZmZXIgdXNlZCBvZnRlbiBhbmQgbm90IGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnRFlOQU1JQ19DT1BZJywgLy8gQnVmZmVyIHVzZWQgb2Z0ZW4gYW5kIGNoYW5nZSBvZnRlbi4gQ29udGVudHMgYXJlIG5laXRoZXIgd3JpdHRlbiBvciByZWFkIGJ5IHRoZSB1c2VyLlxuICAnU1RSRUFNX0NPUFknIC8vIEJ1ZmZlciB1c2VkIG9mdGVuIGFuZCBub3QgY2hhbmdlIG9mdGVuLiBDb250ZW50cyBhcmUgbmVpdGhlciB3cml0dGVuIG9yIHJlYWQgYnkgdGhlIHVzZXIuXG5dO1xuXG5leHBvcnQgY29uc3QgR0xfQlVGRkVSX1VTQUdFID1cbiAgZ2wgPT4gQlVGRkVSX1VTQUdFLm1hcChjb25zdGFudCA9PiBnbFtjb25zdGFudF0pLmZpbHRlcihjb25zdGFudCA9PiBjb25zdGFudCk7XG5cbmZ1bmN0aW9uIGdldEtleShnbCwgdmFsdWUpIHtcbiAgZm9yIChjb25zdCBrZXkgaW4gZ2wpIHtcbiAgICBpZiAoZ2xba2V5XSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICB9XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufVxuIl19