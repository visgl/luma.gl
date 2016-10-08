'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timestamp = exports.logger = exports.IS_NODE = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS9zcmMvZW52LmpzIl0sIm5hbWVzIjpbIklTX05PREUiLCJwcm9jZXNzIiwidW5kZWZpbmVkIiwidG9TdHJpbmciLCJkZWJ1ZyIsImxvZyIsIm5hdGl2ZSIsImJpbmQiLCJ3YXJuIiwiZXJyb3IiLCJsb2dnZXIiLCJ0aW1lc3RhbXAiLCJocnRpbWUiLCJzZWNvbmRzIiwibmFub3NlY29uZHMiLCJwZXJmb3JtYW5jZSIsIm5vdyIsIkRhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs4UUFBQTs7O0FBR0E7QUFDQTs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUE7QUFDTyxJQUFNQSw0QkFBVSxRQUFPQyxPQUFQLHlDQUFPQSxPQUFQLE9BQW1CQyxTQUFuQixJQUNyQkQsUUFBUUUsUUFBUixPQUF1QixrQkFEbEI7O0FBR1A7O0FBRUE7QUFDQTtBQUNBLGtCQUFRQyxLQUFSLEdBQWdCLGtCQUFRQSxLQUFSLElBQWlCLGtCQUFRQyxHQUF6Qzs7QUFFQTtBQUNBLGtCQUFRQyxNQUFSLEdBQWlCO0FBQ2ZGLFNBQU8sa0JBQVFBLEtBQVIsQ0FBY0csSUFBZCxtQkFEUTtBQUVmRixPQUFLLGtCQUFRQSxHQUFSLENBQVlFLElBQVosbUJBRlU7QUFHZkMsUUFBTSxrQkFBUUEsSUFBUixDQUFhRCxJQUFiLG1CQUhTO0FBSWZFLFNBQU8sa0JBQVFBLEtBQVIsQ0FBY0YsSUFBZDtBQUpRLENBQWpCOztRQU9tQkcsTTs7QUFFbkI7O0FBQ0EsSUFBSUMsa0JBQUo7QUFDQSxJQUFJWCxPQUFKLEVBQWE7QUFDWCxVQVVtQlcsU0FWbkIsZUFBWSxxQkFBTTtBQUFBLDBCQUNlVixRQUFRVyxNQUFSLEVBRGY7O0FBQUE7O0FBQUEsUUFDVEMsT0FEUztBQUFBLFFBQ0FDLFdBREE7O0FBRWhCLFdBQU9ELFVBQVVDLGNBQWMsR0FBL0I7QUFDRCxHQUhEO0FBSUQsQ0FMRCxNQUtPLElBQUksaUJBQU9DLFdBQVgsRUFBd0I7QUFDN0IsVUFLbUJKLFNBTG5CLGVBQVk7QUFBQSxXQUFNLGlCQUFPSSxXQUFQLENBQW1CQyxHQUFuQixFQUFOO0FBQUEsR0FBWjtBQUNELENBRk0sTUFFQTtBQUNMLFVBR21CTCxTQUhuQixlQUFZO0FBQUEsV0FBTU0sS0FBS0QsR0FBTCxFQUFOO0FBQUEsR0FBWjtBQUNEOztRQUVvQkwsUyxHQUFiQSxTIiwiZmlsZSI6ImVudi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29tbW9uIGVudmlyb25tZW50IHNldHVwXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbi8qIGdsb2JhbCBwcm9jZXNzICovXG5pbXBvcnQgY29uc29sZSBmcm9tICdnbG9iYWwvY29uc29sZSc7XG5pbXBvcnQgd2luZG93IGZyb20gJ2dsb2JhbC93aW5kb3cnO1xuXG4vLyBEdWNrLXR5cGUgTm9kZSBjb250ZXh0XG5leHBvcnQgY29uc3QgSVNfTk9ERSA9IHR5cGVvZiBwcm9jZXNzICE9PSB1bmRlZmluZWQgJiZcbiAgcHJvY2Vzcy50b1N0cmluZygpID09PSAnW29iamVjdCBwcm9jZXNzXSc7XG5cbi8vIENvbmZpZ3VyZSBjb25zb2xlXG5cbi8vIENvbnNvbGUuZGVidWcgaXMgdXNlZnVsIGluIGNocm9tZSBhcyBpdCBnaXZlcyBibHVlIHN0eWxpbmcsIGJ1dCBpcyBub3Rcbi8vIGF2YWlsYWJsZSBpbiBub2RlXG5jb25zb2xlLmRlYnVnID0gY29uc29sZS5kZWJ1ZyB8fCBjb25zb2xlLmxvZztcblxuLy8gU29tZSBpbnN0cnVtZW50YXRpb24gbWF5IG92ZXJyaWRlIGNvbnNvbGUgbWV0aG9kcywgc28gcHJlc2VydmUgdGhlbSBoZXJlXG5jb25zb2xlLm5hdGl2ZSA9IHtcbiAgZGVidWc6IGNvbnNvbGUuZGVidWcuYmluZChjb25zb2xlKSxcbiAgbG9nOiBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpLFxuICB3YXJuOiBjb25zb2xlLndhcm4uYmluZChjb25zb2xlKSxcbiAgZXJyb3I6IGNvbnNvbGUuZXJyb3IuYmluZChjb25zb2xlKVxufTtcblxuZXhwb3J0IHtjb25zb2xlIGFzIGxvZ2dlcn07XG5cbi8vIFNldCB1cCBoaWdoIHJlc29sdXRpb24gdGltZXJcbmxldCB0aW1lc3RhbXA7XG5pZiAoSVNfTk9ERSkge1xuICB0aW1lc3RhbXAgPSAoKSA9PiB7XG4gICAgY29uc3QgW3NlY29uZHMsIG5hbm9zZWNvbmRzXSA9IHByb2Nlc3MuaHJ0aW1lKCk7XG4gICAgcmV0dXJuIHNlY29uZHMgKyBuYW5vc2Vjb25kcyAvIDFlNjtcbiAgfTtcbn0gZWxzZSBpZiAod2luZG93LnBlcmZvcm1hbmNlKSB7XG4gIHRpbWVzdGFtcCA9ICgpID0+IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbn0gZWxzZSB7XG4gIHRpbWVzdGFtcCA9ICgpID0+IERhdGUubm93KCk7XG59XG5cbmV4cG9ydCB7dGltZXN0YW1wIGFzIHRpbWVzdGFtcH07XG4iXX0=