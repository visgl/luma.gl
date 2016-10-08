'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Probe = undefined;

var _errorUtils = require('./error-utils');

Object.keys(_errorUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _errorUtils[key];
    }
  });
});

var _probe = require('./probe');

var _probe2 = _interopRequireDefault(_probe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Probe = _probe2.default;
exports.default = new _probe2.default();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS9zcmMvaW5kZXguanMiXSwibmFtZXMiOlsiUHJvYmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUVBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFGQTs7Ozs7O1FBQ2lCQSxLO2tCQUVGLHFCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFByb2JlIGZyb20gJy4vcHJvYmUnO1xuZXhwb3J0IHtQcm9iZSBhcyBQcm9iZX07XG5leHBvcnQgKiBmcm9tICcuL2Vycm9yLXV0aWxzJztcbmV4cG9ydCBkZWZhdWx0IG5ldyBQcm9iZSgpO1xuIl19