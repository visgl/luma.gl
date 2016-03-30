'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WorkerGroup = exports.Fx = undefined;

var _fx = require('./fx');

Object.defineProperty(exports, 'Fx', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_fx).default;
  }
});

var _workers = require('./workers');

Object.defineProperty(exports, 'WorkerGroup', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_workers).default;
  }
});

var _helpers = require('./helpers');

var _loop = function _loop(_key2) {
  if (_key2 === "default") return 'continue';
  Object.defineProperty(exports, _key2, {
    enumerable: true,
    get: function get() {
      return _helpers[_key2];
    }
  });
};

for (var _key2 in _helpers) {
  var _ret = _loop(_key2);

  if (_ret === 'continue') continue;
}

var _fx2 = _interopRequireDefault(_fx);

var _workers2 = _interopRequireDefault(_workers);

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global window */
if (typeof window !== 'undefined' && window.LumaGL) {
  window.LumaGL.addons = {
    Fx: _fx2.default,
    WorkerGroup: _workers2.default
  };
  Object.assign(window.LumaGL.addons, helpers);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O3VDQUlROzs7Ozs7Ozs7NENBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSEk7Ozs7Ozs7QUFPWixJQUFJLE9BQU8sTUFBUCxLQUFrQixXQUFsQixJQUFpQyxPQUFPLE1BQVAsRUFBZTtBQUNsRCxTQUFPLE1BQVAsQ0FBYyxNQUFkLEdBQXVCO0FBQ3JCLG9CQURxQjtBQUVyQixrQ0FGcUI7R0FBdkIsQ0FEa0Q7QUFLbEQsU0FBTyxNQUFQLENBQWMsT0FBTyxNQUFQLENBQWMsTUFBZCxFQUFzQixPQUFwQyxFQUxrRDtDQUFwRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5pbXBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vaGVscGVycyc7XG5cbmV4cG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5leHBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5leHBvcnQgKiBmcm9tICcuL2hlbHBlcnMnO1xuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lkx1bWFHTCkge1xuICB3aW5kb3cuTHVtYUdMLmFkZG9ucyA9IHtcbiAgICBGeDogRngsXG4gICAgV29ya2VyR3JvdXA6IFdvcmtlckdyb3VwXG4gIH07XG4gIE9iamVjdC5hc3NpZ24od2luZG93Lkx1bWFHTC5hZGRvbnMsIGhlbHBlcnMpO1xufVxuIl19