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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS9zcmMvZW52LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztrUEFBQTs7O0FBR0E7QUFDQTs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUE7QUFDTyxJQUFNLDRCQUFVLFFBQU8sT0FBUCx5Q0FBTyxPQUFQLE9BQW1CLFNBQW5CLElBQ3JCLFFBQVEsUUFBUixPQUF1QixrQkFEbEI7O0FBR1A7O0FBRUE7QUFDQTtBQUNBLGtCQUFRLEtBQVIsR0FBZ0Isa0JBQVEsS0FBUixJQUFpQixrQkFBUSxHQUF6Qzs7QUFFQTtBQUNBLGtCQUFRLE1BQVIsR0FBaUI7QUFDZixTQUFPLGtCQUFRLEtBQVIsQ0FBYyxJQUFkLG1CQURRO0FBRWYsT0FBSyxrQkFBUSxHQUFSLENBQVksSUFBWixtQkFGVTtBQUdmLFFBQU0sa0JBQVEsSUFBUixDQUFhLElBQWIsbUJBSFM7QUFJZixTQUFPLGtCQUFRLEtBQVIsQ0FBYyxJQUFkO0FBSlEsQ0FBakI7O1FBT21CLE07O0FBRW5COztBQUNBLElBQUksa0JBQUo7QUFDQSxJQUFJLE9BQUosRUFBYTtBQUNYLFVBVW1CLFNBVm5CLGVBQVkscUJBQU07QUFBQSwwQkFDZSxRQUFRLE1BQVIsRUFEZjs7QUFBQTs7QUFBQSxRQUNULE9BRFM7QUFBQSxRQUNBLFdBREE7O0FBRWhCLFdBQU8sVUFBVSxjQUFjLEdBQS9CO0FBQ0QsR0FIRDtBQUlELENBTEQsTUFLTyxJQUFJLGlCQUFPLFdBQVgsRUFBd0I7QUFDN0IsVUFLbUIsU0FMbkIsZUFBWTtBQUFBLFdBQU0saUJBQU8sV0FBUCxDQUFtQixHQUFuQixFQUFOO0FBQUEsR0FBWjtBQUNELENBRk0sTUFFQTtBQUNMLFVBR21CLFNBSG5CLGVBQVk7QUFBQSxXQUFNLEtBQUssR0FBTCxFQUFOO0FBQUEsR0FBWjtBQUNEOztRQUVvQixTLEdBQWIsUyIsImZpbGUiOiJlbnYuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbW1vbiBlbnZpcm9ubWVudCBzZXR1cFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4vKiBnbG9iYWwgcHJvY2VzcyAqL1xuaW1wb3J0IGNvbnNvbGUgZnJvbSAnZ2xvYmFsL2NvbnNvbGUnO1xuaW1wb3J0IHdpbmRvdyBmcm9tICdnbG9iYWwvd2luZG93JztcblxuLy8gRHVjay10eXBlIE5vZGUgY29udGV4dFxuZXhwb3J0IGNvbnN0IElTX05PREUgPSB0eXBlb2YgcHJvY2VzcyAhPT0gdW5kZWZpbmVkICYmXG4gIHByb2Nlc3MudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuXG4vLyBDb25maWd1cmUgY29uc29sZVxuXG4vLyBDb25zb2xlLmRlYnVnIGlzIHVzZWZ1bCBpbiBjaHJvbWUgYXMgaXQgZ2l2ZXMgYmx1ZSBzdHlsaW5nLCBidXQgaXMgbm90XG4vLyBhdmFpbGFibGUgaW4gbm9kZVxuY29uc29sZS5kZWJ1ZyA9IGNvbnNvbGUuZGVidWcgfHwgY29uc29sZS5sb2c7XG5cbi8vIFNvbWUgaW5zdHJ1bWVudGF0aW9uIG1heSBvdmVycmlkZSBjb25zb2xlIG1ldGhvZHMsIHNvIHByZXNlcnZlIHRoZW0gaGVyZVxuY29uc29sZS5uYXRpdmUgPSB7XG4gIGRlYnVnOiBjb25zb2xlLmRlYnVnLmJpbmQoY29uc29sZSksXG4gIGxvZzogY29uc29sZS5sb2cuYmluZChjb25zb2xlKSxcbiAgd2FybjogY29uc29sZS53YXJuLmJpbmQoY29uc29sZSksXG4gIGVycm9yOiBjb25zb2xlLmVycm9yLmJpbmQoY29uc29sZSlcbn07XG5cbmV4cG9ydCB7Y29uc29sZSBhcyBsb2dnZXJ9O1xuXG4vLyBTZXQgdXAgaGlnaCByZXNvbHV0aW9uIHRpbWVyXG5sZXQgdGltZXN0YW1wO1xuaWYgKElTX05PREUpIHtcbiAgdGltZXN0YW1wID0gKCkgPT4ge1xuICAgIGNvbnN0IFtzZWNvbmRzLCBuYW5vc2Vjb25kc10gPSBwcm9jZXNzLmhydGltZSgpO1xuICAgIHJldHVybiBzZWNvbmRzICsgbmFub3NlY29uZHMgLyAxZTY7XG4gIH07XG59IGVsc2UgaWYgKHdpbmRvdy5wZXJmb3JtYW5jZSkge1xuICB0aW1lc3RhbXAgPSAoKSA9PiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG59IGVsc2Uge1xuICB0aW1lc3RhbXAgPSAoKSA9PiBEYXRlLm5vdygpO1xufVxuXG5leHBvcnQge3RpbWVzdGFtcCBhcyB0aW1lc3RhbXB9O1xuIl19