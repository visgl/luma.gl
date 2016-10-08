'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.breakOnConsoleWarnings = breakOnConsoleWarnings;
exports.throwOnConsoleWarnings = throwOnConsoleWarnings;
exports.interceptRejectedPromises = interceptRejectedPromises;

var _env = require('./env');

/**
 * Ensure that your debugger stops when code issues warnings so that
 * you can see what is going on in othercomponents when they decide
 * to issue warnings.
 *
 * @param {Array} consoleBlacklist - array of strings to match against
 */
function breakOnConsoleWarnings() {
  var consoleBlacklist = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [/.*/];

  function breakOnConsole(log, msg, param1) {
    for (var _len = arguments.length, params = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      params[_key - 3] = arguments[_key];
    }

    if (typeof msg === 'string' && msg.indexOf('Unhandled promise rejection') === 0) {
      log.apply(undefined, [msg, param1].concat(params));
      throw new Error(param1);
    } else if (consoleBlacklist.some(function (pattern) {
      return pattern.test(msg);
    })) {
      log.apply(undefined, [msg, param1].concat(params));
    } else {
      log.apply(undefined, [msg, param1].concat(params));
    }
  }
  _env.logger.warn = breakOnConsole.bind(null, _env.logger.native.warn);
  _env.logger.error = breakOnConsole.bind(null, _env.logger.native.error);

  window.onerror = function (message, url, line, column, error) {
    if (error) {
      _env.logger.native.error(error + ' ' + url + ':' + line + ':' + (column || 0));
    } else {
      _env.logger.native.error(message + ' ' + url + ':' + line + ':' + (column || 0));
    }
    debugger;
  };
}

/**
 * Throw exceptions when code issues warnings so that
 * you can access them in your normal exception handling setup, perhaps
 * displaying them in the UI or logging them in a different way.
 *
 * @param {Array} consoleBlacklist - array of strings to match against
 */
/**
 * Utilities for dev-mode error handling
 */
/* eslint-disable no-console, no-debugger */
/* global window */
function throwOnConsoleWarnings() {
  var consoleBlacklist = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [/.*/];

  _env.logger.warn = function throwOnWarning(msg) {
    var _console$native;

    if (consoleBlacklist.some(function (patt) {
      return patt.test(msg);
    })) {
      throw new Error('Unacceptable warning: ' + msg);
    }
    (_console$native = _env.logger.native).warn.apply(_console$native, arguments);
  };
}

// Chrome has yet to implement onRejectedPromise, so trigger onerror instead
function interceptRejectedPromises() {
  var _arguments = arguments;

  _env.logger.error = function (msg, error) {
    for (var _len2 = arguments.length, params = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      params[_key2 - 2] = arguments[_key2];
    }

    var _console$native3;

    if (typeof msg === 'string' && msg.indexOf('Unhandled promise rejection') === 0) {
      var _console$native2;

      error.unhandledPromise = true;
      // Use different message to avoid triggering again
      (_console$native2 = _env.logger.native).error.apply(_console$native2, ['Rejected promise', error].concat(params));
      throw error;
    }
    (_console$native3 = _env.logger.native).error.apply(_console$native3, _arguments);
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS9zcmMvZXJyb3ItdXRpbHMuanMiXSwibmFtZXMiOlsiYnJlYWtPbkNvbnNvbGVXYXJuaW5ncyIsInRocm93T25Db25zb2xlV2FybmluZ3MiLCJpbnRlcmNlcHRSZWplY3RlZFByb21pc2VzIiwiY29uc29sZUJsYWNrbGlzdCIsImJyZWFrT25Db25zb2xlIiwibG9nIiwibXNnIiwicGFyYW0xIiwicGFyYW1zIiwiaW5kZXhPZiIsIkVycm9yIiwic29tZSIsInBhdHRlcm4iLCJ0ZXN0Iiwid2FybiIsImJpbmQiLCJuYXRpdmUiLCJlcnJvciIsIndpbmRvdyIsIm9uZXJyb3IiLCJtZXNzYWdlIiwidXJsIiwibGluZSIsImNvbHVtbiIsInRocm93T25XYXJuaW5nIiwicGF0dCIsImFyZ3VtZW50cyIsInVuaGFuZGxlZFByb21pc2UiXSwibWFwcGluZ3MiOiI7Ozs7O1FBY2dCQSxzQixHQUFBQSxzQjtRQWdDQUMsc0IsR0FBQUEsc0I7UUFVQUMseUIsR0FBQUEseUI7O0FBbkRoQjs7QUFFQTs7Ozs7OztBQU9PLFNBQVNGLHNCQUFULEdBQTJEO0FBQUEsTUFBM0JHLGdCQUEyQix1RUFBUixDQUFDLElBQUQsQ0FBUTs7QUFDaEUsV0FBU0MsY0FBVCxDQUF3QkMsR0FBeEIsRUFBNkJDLEdBQTdCLEVBQWtDQyxNQUFsQyxFQUFxRDtBQUFBLHNDQUFSQyxNQUFRO0FBQVJBLFlBQVE7QUFBQTs7QUFDbkQsUUFBSSxPQUFPRixHQUFQLEtBQWUsUUFBZixJQUNGQSxJQUFJRyxPQUFKLENBQVksNkJBQVosTUFBK0MsQ0FEakQsRUFDb0Q7QUFDbERKLDRCQUFJQyxHQUFKLEVBQVNDLE1BQVQsU0FBb0JDLE1BQXBCO0FBQ0EsWUFBTSxJQUFJRSxLQUFKLENBQVVILE1BQVYsQ0FBTjtBQUNELEtBSkQsTUFJTyxJQUFJSixpQkFBaUJRLElBQWpCLENBQXNCO0FBQUEsYUFBV0MsUUFBUUMsSUFBUixDQUFhUCxHQUFiLENBQVg7QUFBQSxLQUF0QixDQUFKLEVBQXlEO0FBQzlERCw0QkFBSUMsR0FBSixFQUFTQyxNQUFULFNBQW9CQyxNQUFwQjtBQUNELEtBRk0sTUFFQTtBQUNMSCw0QkFBSUMsR0FBSixFQUFTQyxNQUFULFNBQW9CQyxNQUFwQjtBQUNEO0FBQ0Y7QUFDRCxjQUFRTSxJQUFSLEdBQWVWLGVBQWVXLElBQWYsQ0FBb0IsSUFBcEIsRUFBMEIsWUFBUUMsTUFBUixDQUFlRixJQUF6QyxDQUFmO0FBQ0EsY0FBUUcsS0FBUixHQUFnQmIsZUFBZVcsSUFBZixDQUFvQixJQUFwQixFQUEwQixZQUFRQyxNQUFSLENBQWVDLEtBQXpDLENBQWhCOztBQUVBQyxTQUFPQyxPQUFQLEdBQWlCLFVBQUNDLE9BQUQsRUFBVUMsR0FBVixFQUFlQyxJQUFmLEVBQXFCQyxNQUFyQixFQUE2Qk4sS0FBN0IsRUFBdUM7QUFDdEQsUUFBSUEsS0FBSixFQUFXO0FBQ1Qsa0JBQVFELE1BQVIsQ0FBZUMsS0FBZixDQUF3QkEsS0FBeEIsU0FBaUNJLEdBQWpDLFNBQXdDQyxJQUF4QyxVQUFnREMsVUFBVSxDQUExRDtBQUNELEtBRkQsTUFFTztBQUNMLGtCQUFRUCxNQUFSLENBQWVDLEtBQWYsQ0FBd0JHLE9BQXhCLFNBQW1DQyxHQUFuQyxTQUEwQ0MsSUFBMUMsVUFBa0RDLFVBQVUsQ0FBNUQ7QUFDRDtBQUNEO0FBQ0QsR0FQRDtBQVFEOztBQUVEOzs7Ozs7O0FBdkNBOzs7QUFHQTtBQUNBO0FBMENPLFNBQVN0QixzQkFBVCxHQUEyRDtBQUFBLE1BQTNCRSxnQkFBMkIsdUVBQVIsQ0FBQyxJQUFELENBQVE7O0FBQ2hFLGNBQVFXLElBQVIsR0FBZSxTQUFTVSxjQUFULENBQXdCbEIsR0FBeEIsRUFBNkI7QUFBQTs7QUFDMUMsUUFBSUgsaUJBQWlCUSxJQUFqQixDQUFzQjtBQUFBLGFBQVFjLEtBQUtaLElBQUwsQ0FBVVAsR0FBVixDQUFSO0FBQUEsS0FBdEIsQ0FBSixFQUFtRDtBQUNqRCxZQUFNLElBQUlJLEtBQUosNEJBQW1DSixHQUFuQyxDQUFOO0FBQ0Q7QUFDRCxtQ0FBUVUsTUFBUixFQUFlRixJQUFmLHdCQUF1QlksU0FBdkI7QUFDRCxHQUxEO0FBTUQ7O0FBRUQ7QUFDTyxTQUFTeEIseUJBQVQsR0FBcUM7QUFBQTs7QUFDMUMsY0FBUWUsS0FBUixHQUFnQixVQUFDWCxHQUFELEVBQU1XLEtBQU4sRUFBMkI7QUFBQSx1Q0FBWFQsTUFBVztBQUFYQSxZQUFXO0FBQUE7O0FBQUE7O0FBQ3pDLFFBQUksT0FBT0YsR0FBUCxLQUFlLFFBQWYsSUFDRkEsSUFBSUcsT0FBSixDQUFZLDZCQUFaLE1BQStDLENBRGpELEVBQ29EO0FBQUE7O0FBQ2xEUSxZQUFNVSxnQkFBTixHQUF5QixJQUF6QjtBQUNBO0FBQ0Esc0NBQVFYLE1BQVIsRUFBZUMsS0FBZiwwQkFBcUIsa0JBQXJCLEVBQXlDQSxLQUF6QyxTQUFtRFQsTUFBbkQ7QUFDQSxZQUFNUyxLQUFOO0FBQ0Q7QUFDRCxvQ0FBUUQsTUFBUixFQUFlQyxLQUFmO0FBQ0QsR0FURDtBQVVEIiwiZmlsZSI6ImVycm9yLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVdGlsaXRpZXMgZm9yIGRldi1tb2RlIGVycm9yIGhhbmRsaW5nXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIG5vLWRlYnVnZ2VyICovXG4vKiBnbG9iYWwgd2luZG93ICovXG5pbXBvcnQge2xvZ2dlciBhcyBjb25zb2xlfSBmcm9tICcuL2Vudic7XG5cbi8qKlxuICogRW5zdXJlIHRoYXQgeW91ciBkZWJ1Z2dlciBzdG9wcyB3aGVuIGNvZGUgaXNzdWVzIHdhcm5pbmdzIHNvIHRoYXRcbiAqIHlvdSBjYW4gc2VlIHdoYXQgaXMgZ29pbmcgb24gaW4gb3RoZXJjb21wb25lbnRzIHdoZW4gdGhleSBkZWNpZGVcbiAqIHRvIGlzc3VlIHdhcm5pbmdzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGNvbnNvbGVCbGFja2xpc3QgLSBhcnJheSBvZiBzdHJpbmdzIHRvIG1hdGNoIGFnYWluc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJyZWFrT25Db25zb2xlV2FybmluZ3MoY29uc29sZUJsYWNrbGlzdCA9IFsvLiovXSkge1xuICBmdW5jdGlvbiBicmVha09uQ29uc29sZShsb2csIG1zZywgcGFyYW0xLCAuLi5wYXJhbXMpIHtcbiAgICBpZiAodHlwZW9mIG1zZyA9PT0gJ3N0cmluZycgJiZcbiAgICAgIG1zZy5pbmRleE9mKCdVbmhhbmRsZWQgcHJvbWlzZSByZWplY3Rpb24nKSA9PT0gMCkge1xuICAgICAgbG9nKG1zZywgcGFyYW0xLCAuLi5wYXJhbXMpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHBhcmFtMSk7XG4gICAgfSBlbHNlIGlmIChjb25zb2xlQmxhY2tsaXN0LnNvbWUocGF0dGVybiA9PiBwYXR0ZXJuLnRlc3QobXNnKSkpIHtcbiAgICAgIGxvZyhtc2csIHBhcmFtMSwgLi4ucGFyYW1zKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nKG1zZywgcGFyYW0xLCAuLi5wYXJhbXMpO1xuICAgIH1cbiAgfVxuICBjb25zb2xlLndhcm4gPSBicmVha09uQ29uc29sZS5iaW5kKG51bGwsIGNvbnNvbGUubmF0aXZlLndhcm4pO1xuICBjb25zb2xlLmVycm9yID0gYnJlYWtPbkNvbnNvbGUuYmluZChudWxsLCBjb25zb2xlLm5hdGl2ZS5lcnJvcik7XG5cbiAgd2luZG93Lm9uZXJyb3IgPSAobWVzc2FnZSwgdXJsLCBsaW5lLCBjb2x1bW4sIGVycm9yKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBjb25zb2xlLm5hdGl2ZS5lcnJvcihgJHtlcnJvcn0gJHt1cmx9OiR7bGluZX06JHtjb2x1bW4gfHwgMH1gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5uYXRpdmUuZXJyb3IoYCR7bWVzc2FnZX0gJHt1cmx9OiR7bGluZX06JHtjb2x1bW4gfHwgMH1gKTtcbiAgICB9XG4gICAgZGVidWdnZXI7XG4gIH07XG59XG5cbi8qKlxuICogVGhyb3cgZXhjZXB0aW9ucyB3aGVuIGNvZGUgaXNzdWVzIHdhcm5pbmdzIHNvIHRoYXRcbiAqIHlvdSBjYW4gYWNjZXNzIHRoZW0gaW4geW91ciBub3JtYWwgZXhjZXB0aW9uIGhhbmRsaW5nIHNldHVwLCBwZXJoYXBzXG4gKiBkaXNwbGF5aW5nIHRoZW0gaW4gdGhlIFVJIG9yIGxvZ2dpbmcgdGhlbSBpbiBhIGRpZmZlcmVudCB3YXkuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gY29uc29sZUJsYWNrbGlzdCAtIGFycmF5IG9mIHN0cmluZ3MgdG8gbWF0Y2ggYWdhaW5zdFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dPbkNvbnNvbGVXYXJuaW5ncyhjb25zb2xlQmxhY2tsaXN0ID0gWy8uKi9dKSB7XG4gIGNvbnNvbGUud2FybiA9IGZ1bmN0aW9uIHRocm93T25XYXJuaW5nKG1zZykge1xuICAgIGlmIChjb25zb2xlQmxhY2tsaXN0LnNvbWUocGF0dCA9PiBwYXR0LnRlc3QobXNnKSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hY2NlcHRhYmxlIHdhcm5pbmc6ICR7bXNnfWApO1xuICAgIH1cbiAgICBjb25zb2xlLm5hdGl2ZS53YXJuKC4uLmFyZ3VtZW50cyk7XG4gIH07XG59XG5cbi8vIENocm9tZSBoYXMgeWV0IHRvIGltcGxlbWVudCBvblJlamVjdGVkUHJvbWlzZSwgc28gdHJpZ2dlciBvbmVycm9yIGluc3RlYWRcbmV4cG9ydCBmdW5jdGlvbiBpbnRlcmNlcHRSZWplY3RlZFByb21pc2VzKCkge1xuICBjb25zb2xlLmVycm9yID0gKG1zZywgZXJyb3IsIC4uLnBhcmFtcykgPT4ge1xuICAgIGlmICh0eXBlb2YgbXNnID09PSAnc3RyaW5nJyAmJlxuICAgICAgbXNnLmluZGV4T2YoJ1VuaGFuZGxlZCBwcm9taXNlIHJlamVjdGlvbicpID09PSAwKSB7XG4gICAgICBlcnJvci51bmhhbmRsZWRQcm9taXNlID0gdHJ1ZTtcbiAgICAgIC8vIFVzZSBkaWZmZXJlbnQgbWVzc2FnZSB0byBhdm9pZCB0cmlnZ2VyaW5nIGFnYWluXG4gICAgICBjb25zb2xlLm5hdGl2ZS5lcnJvcignUmVqZWN0ZWQgcHJvbWlzZScsIGVycm9yLCAuLi5wYXJhbXMpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIGNvbnNvbGUubmF0aXZlLmVycm9yKC4uLmFyZ3VtZW50cyk7XG4gIH07XG59XG4iXX0=