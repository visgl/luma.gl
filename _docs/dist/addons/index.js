'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WorkerGroup = exports.Fx = undefined;

var _media = require('./media');

Object.keys(_media).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _media[key];
    }
  });
});

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

Object.keys(_helpers).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _helpers[key];
    }
  });
});

var _frame = require('./frame');

Object.keys(_frame).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _frame[key];
    }
  });
});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvaW5kZXguanMiXSwibmFtZXMiOlsiZGVmYXVsdCIsImhlbHBlcnMiLCJ3aW5kb3ciLCJMdW1hR0wiLCJhZGRvbnMiLCJGeCIsIldvcmtlckdyb3VwIiwiT2JqZWN0IiwiYXNzaWduIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFJQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBSkE7Ozs7O3VDQUtRQSxPOzs7O0FBSlI7Ozs7OzRDQUtRQSxPOzs7O0FBSlI7O0FBS0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7O0FBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7Ozs7SUFOWUMsTzs7Ozs7O0FBUVo7QUFDQSxJQUFJLE9BQU9DLE1BQVAsS0FBa0IsV0FBbEIsSUFBaUNBLE9BQU9DLE1BQTVDLEVBQW9EO0FBQ2xERCxTQUFPQyxNQUFQLENBQWNDLE1BQWQsR0FBdUI7QUFDckJDLG9CQURxQjtBQUVyQkM7QUFGcUIsR0FBdkI7QUFJQUMsU0FBT0MsTUFBUCxDQUFjTixPQUFPQyxNQUFQLENBQWNDLE1BQTVCLEVBQW9DSCxPQUFwQztBQUNEIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtkZWZhdWx0IGFzIEZ4fSBmcm9tICcuL2Z4JztcbmltcG9ydCB7ZGVmYXVsdCBhcyBXb3JrZXJHcm91cH0gZnJvbSAnLi93b3JrZXJzJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi9oZWxwZXJzJztcblxuZXhwb3J0ICogZnJvbSAnLi9tZWRpYSc7XG5leHBvcnQge2RlZmF1bHQgYXMgRnh9IGZyb20gJy4vZngnO1xuZXhwb3J0IHtkZWZhdWx0IGFzIFdvcmtlckdyb3VwfSBmcm9tICcuL3dvcmtlcnMnO1xuZXhwb3J0ICogZnJvbSAnLi9oZWxwZXJzJztcbmV4cG9ydCAqIGZyb20gJy4vZnJhbWUnO1xuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lkx1bWFHTCkge1xuICB3aW5kb3cuTHVtYUdMLmFkZG9ucyA9IHtcbiAgICBGeCxcbiAgICBXb3JrZXJHcm91cFxuICB9O1xuICBPYmplY3QuYXNzaWduKHdpbmRvdy5MdW1hR0wuYWRkb25zLCBoZWxwZXJzKTtcbn1cbiJdfQ==