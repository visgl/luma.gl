'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _common = require('./common');

Object.keys(_common).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _common[key];
    }
  });
});

var _vector = require('./vector2');

Object.defineProperty(exports, 'Vector2', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_vector).default;
  }
});

var _vector2 = require('./vector3');

Object.defineProperty(exports, 'Vector3', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_vector2).default;
  }
});

var _vector3 = require('./vector4');

Object.defineProperty(exports, 'Vector4', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_vector3).default;
  }
});

var _quaternion = require('./quaternion');

Object.defineProperty(exports, 'Quaternion', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_quaternion).default;
  }
});

var _matrix = require('./matrix4');

Object.defineProperty(exports, 'Matrix4', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_matrix).default;
  }
});
exports.tapeEquals = tapeEquals;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// FOR TAPE TESTING
// Use tape assert to compares using a.equals(b)
// Usage test(..., t => { tapeEquals(t, a, b, ...); });
function tapeEquals(t, a, b, msg, extra) {
  /* eslint-disable no-invalid-this */
  t._assert(a.equals(b), {
    message: msg || 'should be equal',
    operator: 'equal',
    actual: a,
    expected: b,
    extra: extra
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRoL2luZGV4LmpzIl0sIm5hbWVzIjpbImRlZmF1bHQiLCJ0YXBlRXF1YWxzIiwidCIsImEiLCJiIiwibXNnIiwiZXh0cmEiLCJfYXNzZXJ0IiwiZXF1YWxzIiwibWVzc2FnZSIsIm9wZXJhdG9yIiwiYWN0dWFsIiwiZXhwZWN0ZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7Ozs7OzJDQUNRQSxPOzs7Ozs7Ozs7NENBQ0FBLE87Ozs7Ozs7Ozs0Q0FDQUEsTzs7Ozs7Ozs7OytDQUNBQSxPOzs7Ozs7Ozs7MkNBQ0FBLE87OztRQUtRQyxVLEdBQUFBLFU7Ozs7QUFIaEI7QUFDQTtBQUNBO0FBQ08sU0FBU0EsVUFBVCxDQUFvQkMsQ0FBcEIsRUFBdUJDLENBQXZCLEVBQTBCQyxDQUExQixFQUE2QkMsR0FBN0IsRUFBa0NDLEtBQWxDLEVBQXlDO0FBQzlDO0FBQ0FKLElBQUVLLE9BQUYsQ0FBVUosRUFBRUssTUFBRixDQUFTSixDQUFULENBQVYsRUFBdUI7QUFDckJLLGFBQVNKLE9BQU8saUJBREs7QUFFckJLLGNBQVUsT0FGVztBQUdyQkMsWUFBUVIsQ0FIYTtBQUlyQlMsY0FBVVIsQ0FKVztBQUtyQkU7QUFMcUIsR0FBdkI7QUFPRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gJy4vY29tbW9uJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBWZWN0b3IyfSBmcm9tICcuL3ZlY3RvcjInO1xuZXhwb3J0IHtkZWZhdWx0IGFzIFZlY3RvcjN9IGZyb20gJy4vdmVjdG9yMyc7XG5leHBvcnQge2RlZmF1bHQgYXMgVmVjdG9yNH0gZnJvbSAnLi92ZWN0b3I0JztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBRdWF0ZXJuaW9ufSBmcm9tICcuL3F1YXRlcm5pb24nO1xuZXhwb3J0IHtkZWZhdWx0IGFzIE1hdHJpeDR9IGZyb20gJy4vbWF0cml4NCc7XG5cbi8vIEZPUiBUQVBFIFRFU1RJTkdcbi8vIFVzZSB0YXBlIGFzc2VydCB0byBjb21wYXJlcyB1c2luZyBhLmVxdWFscyhiKVxuLy8gVXNhZ2UgdGVzdCguLi4sIHQgPT4geyB0YXBlRXF1YWxzKHQsIGEsIGIsIC4uLik7IH0pO1xuZXhwb3J0IGZ1bmN0aW9uIHRhcGVFcXVhbHModCwgYSwgYiwgbXNnLCBleHRyYSkge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cbiAgdC5fYXNzZXJ0KGEuZXF1YWxzKGIpLCB7XG4gICAgbWVzc2FnZTogbXNnIHx8ICdzaG91bGQgYmUgZXF1YWwnLFxuICAgIG9wZXJhdG9yOiAnZXF1YWwnLFxuICAgIGFjdHVhbDogYSxcbiAgICBleHBlY3RlZDogYixcbiAgICBleHRyYVxuICB9KTtcbn1cbiJdfQ==