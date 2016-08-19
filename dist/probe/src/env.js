'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timestamp = exports.logger = exports.IS_NODE = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                   * Common environment setup
                                                                                                                                                                                                                                                   */
/* eslint-disable no-console */
/* global process */


var _console = require('global/console');

var _console2 = _interopRequireDefault(_console);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Duck-type Node context
var IS_NODE = exports.IS_NODE = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) !== undefined && process.toString() === '[object process]';

// Configure console

// Console.debug is useful in chrome as it gives blue styling, but is not
// available in node
_console2.default.debug = _console2.default.debug || _console2.default.log;

// Some instrumentation may override console methods, so preserve them here
_console2.default.native = {
  debug: _console2.default.debug.bind(_console2.default),
  log: _console2.default.log.bind(_console2.default),
  warn: _console2.default.warn.bind(_console2.default),
  error: _console2.default.error.bind(_console2.default)
};

exports.logger = _console2.default;

// Set up high resolution timer

var timestamp = void 0;
if (IS_NODE) {
  exports.timestamp = timestamp = function timestamp() {
    var _process$hrtime = process.hrtime();

    var _process$hrtime2 = _slicedToArray(_process$hrtime, 2);

    var seconds = _process$hrtime2[0];
    var nanoseconds = _process$hrtime2[1];

    return seconds + nanoseconds / 1e6;
  };
} else if (_window2.default.performance) {
  exports.timestamp = timestamp = function timestamp() {
    return _window2.default.performance.now();
  };
} else {
  exports.timestamp = timestamp = function timestamp() {
    return Date.now();
  };
}

exports.timestamp = timestamp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS9zcmMvZW52LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLQTs7OztBQUNBOzs7Ozs7O0FBR08sSUFBTSw0QkFBVSxRQUFPLE9BQVAseUNBQU8sT0FBUCxPQUFtQixTQUFuQixJQUNyQixRQUFRLFFBQVIsT0FBdUIsa0JBRGxCOzs7Ozs7QUFPUCxrQkFBUSxLQUFSLEdBQWdCLGtCQUFRLEtBQVIsSUFBaUIsa0JBQVEsR0FBekM7OztBQUdBLGtCQUFRLE1BQVIsR0FBaUI7QUFDZixTQUFPLGtCQUFRLEtBQVIsQ0FBYyxJQUFkLG1CQURRO0FBRWYsT0FBSyxrQkFBUSxHQUFSLENBQVksSUFBWixtQkFGVTtBQUdmLFFBQU0sa0JBQVEsSUFBUixDQUFhLElBQWIsbUJBSFM7QUFJZixTQUFPLGtCQUFRLEtBQVIsQ0FBYyxJQUFkO0FBSlEsQ0FBakI7O1FBT21CLE07Ozs7QUFHbkIsSUFBSSxrQkFBSjtBQUNBLElBQUksT0FBSixFQUFhO0FBQ1gsVUFVbUIsU0FWbkIsZUFBWSxxQkFBTTtBQUFBLDBCQUNlLFFBQVEsTUFBUixFQURmOztBQUFBOztBQUFBLFFBQ1QsT0FEUztBQUFBLFFBQ0EsV0FEQTs7QUFFaEIsV0FBTyxVQUFVLGNBQWMsR0FBL0I7QUFDRCxHQUhEO0FBSUQsQ0FMRCxNQUtPLElBQUksaUJBQU8sV0FBWCxFQUF3QjtBQUM3QixVQUttQixTQUxuQixlQUFZO0FBQUEsV0FBTSxpQkFBTyxXQUFQLENBQW1CLEdBQW5CLEVBQU47QUFBQSxHQUFaO0FBQ0QsQ0FGTSxNQUVBO0FBQ0wsVUFHbUIsU0FIbkIsZUFBWTtBQUFBLFdBQU0sS0FBSyxHQUFMLEVBQU47QUFBQSxHQUFaO0FBQ0Q7O1FBRW9CLFMsR0FBYixTIiwiZmlsZSI6ImVudi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29tbW9uIGVudmlyb25tZW50IHNldHVwXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbi8qIGdsb2JhbCBwcm9jZXNzICovXG5pbXBvcnQgY29uc29sZSBmcm9tICdnbG9iYWwvY29uc29sZSc7XG5pbXBvcnQgd2luZG93IGZyb20gJ2dsb2JhbC93aW5kb3cnO1xuXG4vLyBEdWNrLXR5cGUgTm9kZSBjb250ZXh0XG5leHBvcnQgY29uc3QgSVNfTk9ERSA9IHR5cGVvZiBwcm9jZXNzICE9PSB1bmRlZmluZWQgJiZcbiAgcHJvY2Vzcy50b1N0cmluZygpID09PSAnW29iamVjdCBwcm9jZXNzXSc7XG5cbi8vIENvbmZpZ3VyZSBjb25zb2xlXG5cbi8vIENvbnNvbGUuZGVidWcgaXMgdXNlZnVsIGluIGNocm9tZSBhcyBpdCBnaXZlcyBibHVlIHN0eWxpbmcsIGJ1dCBpcyBub3Rcbi8vIGF2YWlsYWJsZSBpbiBub2RlXG5jb25zb2xlLmRlYnVnID0gY29uc29sZS5kZWJ1ZyB8fCBjb25zb2xlLmxvZztcblxuLy8gU29tZSBpbnN0cnVtZW50YXRpb24gbWF5IG92ZXJyaWRlIGNvbnNvbGUgbWV0aG9kcywgc28gcHJlc2VydmUgdGhlbSBoZXJlXG5jb25zb2xlLm5hdGl2ZSA9IHtcbiAgZGVidWc6IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlKSxcbiAgbG9nOiBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpLFxuICB3YXJuOiBjb25zb2xlLndhcm4uYmluZChjb25zb2xlKSxcbiAgZXJyb3I6IGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKVxufTtcblxuZXhwb3J0IHtjb25zb2xlIGFzIGxvZ2dlcn07XG5cbi8vIFNldCB1cCBoaWdoIHJlc29sdXRpb24gdGltZXJcbmxldCB0aW1lc3RhbXA7XG5pZiAoSVNfTk9ERSkge1xuICB0aW1lc3RhbXAgPSAoKSA9PiB7XG4gICAgY29uc3QgW3NlY29uZHMsIG5hbm9zZWNvbmRzXSA9IHByb2Nlc3MuaHJ0aW1lKCk7XG4gICAgcmV0dXJuIHNlY29uZHMgKyBuYW5vc2Vjb25kcyAvIDFlNjtcbiAgfTtcbn0gZWxzZSBpZiAod2luZG93LnBlcmZvcm1hbmNlKSB7XG4gIHRpbWVzdGFtcCA9ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbn0gZWxzZSB7XG4gIHRpbWVzdGFtcCA9ICgpID0+IERhdGUubm93KCk7XG59XG5cbmV4cG9ydCB7dGltZXN0YW1wIGFzIHRpbWVzdGFtcH07XG4iXX0=