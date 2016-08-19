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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBSUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUpBOzs7Ozt1Q0FLUSxPOzs7O0FBSlI7Ozs7OzRDQUtRLE87Ozs7QUFKUjs7QUFLQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7Ozs7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7Ozs7OztJQU5ZLE87Ozs7OztBQVFaO0FBQ0EsSUFBSSxPQUFPLE1BQVAsS0FBa0IsV0FBbEIsSUFBaUMsT0FBTyxNQUE1QyxFQUFvRDtBQUNsRCxTQUFPLE1BQVAsQ0FBYyxNQUFkLEdBQXVCO0FBQ3JCLG9CQURxQjtBQUVyQjtBQUZxQixHQUF2QjtBQUlBLFNBQU8sTUFBUCxDQUFjLE9BQU8sTUFBUCxDQUFjLE1BQTVCLEVBQW9DLE9BQXBDO0FBQ0QiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2RlZmF1bHQgYXMgRnh9IGZyb20gJy4vZngnO1xuaW1wb3J0IHtkZWZhdWx0IGFzIFdvcmtlckdyb3VwfSBmcm9tICcuL3dvcmtlcnMnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuL2hlbHBlcnMnO1xuXG5leHBvcnQgKiBmcm9tICcuL21lZGlhJztcbmV4cG9ydCB7ZGVmYXVsdCBhcyBGeH0gZnJvbSAnLi9meCc7XG5leHBvcnQge2RlZmF1bHQgYXMgV29ya2VyR3JvdXB9IGZyb20gJy4vd29ya2Vycyc7XG5leHBvcnQgKiBmcm9tICcuL2hlbHBlcnMnO1xuZXhwb3J0ICogZnJvbSAnLi9mcmFtZSc7XG5cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuTHVtYUdMKSB7XG4gIHdpbmRvdy5MdW1hR0wuYWRkb25zID0ge1xuICAgIEZ4OiBGeCxcbiAgICBXb3JrZXJHcm91cDogV29ya2VyR3JvdXBcbiAgfTtcbiAgT2JqZWN0LmFzc2lnbih3aW5kb3cuTHVtYUdMLmFkZG9ucywgaGVscGVycyk7XG59XG4iXX0=