'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arrayImpl = require('./array-impl');

Object.keys(_arrayImpl).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _arrayImpl[key];
    }
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRoL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBR0EiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHBvcnQge2RlZmF1bHQgYXMgVmVjM30gZnJvbSAnLi92ZWMzJztcbi8vIGV4cG9ydCB7ZGVmYXVsdCBhcyBNYXQ0fSBmcm9tICcuL21hdDQnO1xuLy8gZXhwb3J0IHtkZWZhdWx0IGFzIFF1YXR9IGZyb20gJy4vcXVhdCc7XG5leHBvcnQgKiBmcm9tICcuL2FycmF5LWltcGwnO1xuIl19