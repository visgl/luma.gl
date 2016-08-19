'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.browserFs = exports.loadFile = undefined;

var _browserRequest = require('./browser-request');

Object.defineProperty(exports, 'loadFile', {
  enumerable: true,
  get: function get() {
    return _browserRequest.loadFile;
  }
});

var _browserImageIo = require('./browser-image-io');

Object.keys(_browserImageIo).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _browserImageIo[key];
    }
  });
});

var _browserFs = require('./browser-fs');

var browserFs = _interopRequireWildcard(_browserFs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.browserFs = browserFs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OzsyQkFBUSxROzs7Ozs7QUFLUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBSEE7O0lBQVksUzs7OztRQUNKLFMsR0FBQSxTIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHtsb2FkRmlsZX0gZnJvbSAnLi9icm93c2VyLXJlcXVlc3QnO1xuXG5pbXBvcnQgKiBhcyBicm93c2VyRnMgZnJvbSAnLi9icm93c2VyLWZzJztcbmV4cG9ydCB7YnJvd3NlckZzfTtcblxuZXhwb3J0ICogZnJvbSAnLi9icm93c2VyLWltYWdlLWlvJztcbiJdfQ==