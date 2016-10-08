'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatValue = formatValue;

var _globals = require('../globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-console */
/* global console */

var _log = {
  priority: 0,
  table: function table(priority, _table) {
    if (priority <= _log.priority && _table) {
      console.table(_table);
    }
  },
  log: function log(priority) {
    if (priority <= _log.priority) {
      var _console;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      (_console = console).debug.apply(_console, args);
    }
  },
  info: function info(priority) {
    if (priority <= _log.priority) {
      var _console2;

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      (_console2 = console).log.apply(_console2, args);
    }
  },
  warn: function warn(priority) {
    if (priority <= _log.priority) {
      var _console3;

      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      (_console3 = console).warn.apply(_console3, args);
    }
  }
};

function formatArrayValue(v, opts) {
  var _opts$maxElts = opts.maxElts;
  var maxElts = _opts$maxElts === undefined ? 16 : _opts$maxElts;
  var _opts$size = opts.size;
  var size = _opts$size === undefined ? 1 : _opts$size;

  var string = '[';
  for (var i = 0; i < v.length && i < maxElts; ++i) {
    if (i > 0) {
      string += ',' + (i % size === 0 ? ' ' : '');
    }
    string += formatValue(v[i], opts);
  }
  var terminator = v.length > maxElts ? '...' : ']';
  return '' + string + terminator;
}

function formatValue(v) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _opts$isInteger = opts.isInteger;
  var isInteger = _opts$isInteger === undefined ? false : _opts$isInteger;

  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    return formatArrayValue(v, opts);
  }
  if (!Number.isFinite(v)) {
    return String(v);
  }
  if (isInteger) {
    return v.toFixed(0);
  }
  if (Math.abs(v) > 100 && Math.abs(v) < 10000) {
    return v.toFixed(0);
  }
  var string = v.toPrecision(2);
  var decimal = string.indexOf('.0');
  return decimal === string.length - 2 ? string.slice(0, -1) : string;
}

// Make available in browser console
_globals2.default.log = _log;

exports.default = _log;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9sb2cuanMiXSwibmFtZXMiOlsiZm9ybWF0VmFsdWUiLCJsb2ciLCJwcmlvcml0eSIsInRhYmxlIiwiY29uc29sZSIsImFyZ3MiLCJkZWJ1ZyIsImluZm8iLCJ3YXJuIiwiZm9ybWF0QXJyYXlWYWx1ZSIsInYiLCJvcHRzIiwibWF4RWx0cyIsInNpemUiLCJzdHJpbmciLCJpIiwibGVuZ3RoIiwidGVybWluYXRvciIsImlzSW50ZWdlciIsIkFycmF5IiwiaXNBcnJheSIsIkFycmF5QnVmZmVyIiwiaXNWaWV3IiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJTdHJpbmciLCJ0b0ZpeGVkIiwiTWF0aCIsImFicyIsInRvUHJlY2lzaW9uIiwiZGVjaW1hbCIsImluZGV4T2YiLCJzbGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUF5Q2dCQSxXLEdBQUFBLFc7O0FBekNoQjs7Ozs7O0FBQ0E7QUFDQTs7QUFFQSxJQUFNQyxPQUFNO0FBQ1ZDLFlBQVUsQ0FEQTtBQUVWQyxPQUZVLGlCQUVKRCxRQUZJLEVBRU1DLE1BRk4sRUFFYTtBQUNyQixRQUFJRCxZQUFZRCxLQUFJQyxRQUFoQixJQUE0QkMsTUFBaEMsRUFBdUM7QUFDckNDLGNBQVFELEtBQVIsQ0FBY0EsTUFBZDtBQUNEO0FBQ0YsR0FOUztBQU9WRixLQVBVLGVBT05DLFFBUE0sRUFPYTtBQUNyQixRQUFJQSxZQUFZRCxLQUFJQyxRQUFwQixFQUE4QjtBQUFBOztBQUFBLHdDQURmRyxJQUNlO0FBRGZBLFlBQ2U7QUFBQTs7QUFDNUIsMkJBQVFDLEtBQVIsaUJBQWlCRCxJQUFqQjtBQUNEO0FBQ0YsR0FYUztBQVlWRSxNQVpVLGdCQVlMTCxRQVpLLEVBWWM7QUFDdEIsUUFBSUEsWUFBWUQsS0FBSUMsUUFBcEIsRUFBOEI7QUFBQTs7QUFBQSx5Q0FEZEcsSUFDYztBQURkQSxZQUNjO0FBQUE7O0FBQzVCLDRCQUFRSixHQUFSLGtCQUFlSSxJQUFmO0FBQ0Q7QUFDRixHQWhCUztBQWlCVkcsTUFqQlUsZ0JBaUJMTixRQWpCSyxFQWlCYztBQUN0QixRQUFJQSxZQUFZRCxLQUFJQyxRQUFwQixFQUE4QjtBQUFBOztBQUFBLHlDQURkRyxJQUNjO0FBRGRBLFlBQ2M7QUFBQTs7QUFDNUIsNEJBQVFHLElBQVIsa0JBQWdCSCxJQUFoQjtBQUNEO0FBQ0Y7QUFyQlMsQ0FBWjs7QUF3QkEsU0FBU0ksZ0JBQVQsQ0FBMEJDLENBQTFCLEVBQTZCQyxJQUE3QixFQUFtQztBQUFBLHNCQUNBQSxJQURBLENBQzFCQyxPQUQwQjtBQUFBLE1BQzFCQSxPQUQwQixpQ0FDaEIsRUFEZ0I7QUFBQSxtQkFDQUQsSUFEQSxDQUNaRSxJQURZO0FBQUEsTUFDWkEsSUFEWSw4QkFDTCxDQURLOztBQUVqQyxNQUFJQyxTQUFTLEdBQWI7QUFDQSxPQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUwsRUFBRU0sTUFBTixJQUFnQkQsSUFBSUgsT0FBcEMsRUFBNkMsRUFBRUcsQ0FBL0MsRUFBa0Q7QUFDaEQsUUFBSUEsSUFBSSxDQUFSLEVBQVc7QUFDVEQsdUJBQWVDLElBQUlGLElBQUosS0FBYSxDQUFkLEdBQW1CLEdBQW5CLEdBQXlCLEVBQXZDO0FBQ0Q7QUFDREMsY0FBVWQsWUFBWVUsRUFBRUssQ0FBRixDQUFaLEVBQWtCSixJQUFsQixDQUFWO0FBQ0Q7QUFDRCxNQUFNTSxhQUFhUCxFQUFFTSxNQUFGLEdBQVdKLE9BQVgsR0FBcUIsS0FBckIsR0FBNkIsR0FBaEQ7QUFDQSxjQUFVRSxNQUFWLEdBQW1CRyxVQUFuQjtBQUNEOztBQUVNLFNBQVNqQixXQUFULENBQXFCVSxDQUFyQixFQUFtQztBQUFBLE1BQVhDLElBQVcsdUVBQUosRUFBSTtBQUFBLHdCQUNaQSxJQURZLENBQ2pDTyxTQURpQztBQUFBLE1BQ2pDQSxTQURpQyxtQ0FDckIsS0FEcUI7O0FBRXhDLE1BQUlDLE1BQU1DLE9BQU4sQ0FBY1YsQ0FBZCxLQUFvQlcsWUFBWUMsTUFBWixDQUFtQlosQ0FBbkIsQ0FBeEIsRUFBK0M7QUFDN0MsV0FBT0QsaUJBQWlCQyxDQUFqQixFQUFvQkMsSUFBcEIsQ0FBUDtBQUNEO0FBQ0QsTUFBSSxDQUFDWSxPQUFPQyxRQUFQLENBQWdCZCxDQUFoQixDQUFMLEVBQXlCO0FBQ3ZCLFdBQU9lLE9BQU9mLENBQVAsQ0FBUDtBQUNEO0FBQ0QsTUFBSVEsU0FBSixFQUFlO0FBQ2IsV0FBT1IsRUFBRWdCLE9BQUYsQ0FBVSxDQUFWLENBQVA7QUFDRDtBQUNELE1BQUlDLEtBQUtDLEdBQUwsQ0FBU2xCLENBQVQsSUFBYyxHQUFkLElBQXFCaUIsS0FBS0MsR0FBTCxDQUFTbEIsQ0FBVCxJQUFjLEtBQXZDLEVBQThDO0FBQzVDLFdBQU9BLEVBQUVnQixPQUFGLENBQVUsQ0FBVixDQUFQO0FBQ0Q7QUFDRCxNQUFNWixTQUFTSixFQUFFbUIsV0FBRixDQUFjLENBQWQsQ0FBZjtBQUNBLE1BQU1DLFVBQVVoQixPQUFPaUIsT0FBUCxDQUFlLElBQWYsQ0FBaEI7QUFDQSxTQUFPRCxZQUFZaEIsT0FBT0UsTUFBUCxHQUFnQixDQUE1QixHQUFnQ0YsT0FBT2tCLEtBQVAsQ0FBYSxDQUFiLEVBQWdCLENBQUMsQ0FBakIsQ0FBaEMsR0FBc0RsQixNQUE3RDtBQUNEOztBQUVEO0FBQ0Esa0JBQUtiLEdBQUwsR0FBV0EsSUFBWDs7a0JBRWVBLEkiLCJmaWxlIjoibG9nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGx1bWEgZnJvbSAnLi4vZ2xvYmFscyc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4vKiBnbG9iYWwgY29uc29sZSAqL1xuXG5jb25zdCBsb2cgPSB7XG4gIHByaW9yaXR5OiAwLFxuICB0YWJsZShwcmlvcml0eSwgdGFibGUpIHtcbiAgICBpZiAocHJpb3JpdHkgPD0gbG9nLnByaW9yaXR5ICYmIHRhYmxlKSB7XG4gICAgICBjb25zb2xlLnRhYmxlKHRhYmxlKTtcbiAgICB9XG4gIH0sXG4gIGxvZyhwcmlvcml0eSwgLi4uYXJncykge1xuICAgIGlmIChwcmlvcml0eSA8PSBsb2cucHJpb3JpdHkpIHtcbiAgICAgIGNvbnNvbGUuZGVidWcoLi4uYXJncyk7XG4gICAgfVxuICB9LFxuICBpbmZvKHByaW9yaXR5LCAuLi5hcmdzKSB7XG4gICAgaWYgKHByaW9yaXR5IDw9IGxvZy5wcmlvcml0eSkge1xuICAgICAgY29uc29sZS5sb2coLi4uYXJncyk7XG4gICAgfVxuICB9LFxuICB3YXJuKHByaW9yaXR5LCAuLi5hcmdzKSB7XG4gICAgaWYgKHByaW9yaXR5IDw9IGxvZy5wcmlvcml0eSkge1xuICAgICAgY29uc29sZS53YXJuKC4uLmFyZ3MpO1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gZm9ybWF0QXJyYXlWYWx1ZSh2LCBvcHRzKSB7XG4gIGNvbnN0IHttYXhFbHRzID0gMTYsIHNpemUgPSAxfSA9IG9wdHM7XG4gIGxldCBzdHJpbmcgPSAnWyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdi5sZW5ndGggJiYgaSA8IG1heEVsdHM7ICsraSkge1xuICAgIGlmIChpID4gMCkge1xuICAgICAgc3RyaW5nICs9IGAsJHsoaSAlIHNpemUgPT09IDApID8gJyAnIDogJyd9YDtcbiAgICB9XG4gICAgc3RyaW5nICs9IGZvcm1hdFZhbHVlKHZbaV0sIG9wdHMpO1xuICB9XG4gIGNvbnN0IHRlcm1pbmF0b3IgPSB2Lmxlbmd0aCA+IG1heEVsdHMgPyAnLi4uJyA6ICddJztcbiAgcmV0dXJuIGAke3N0cmluZ30ke3Rlcm1pbmF0b3J9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFZhbHVlKHYsIG9wdHMgPSB7fSkge1xuICBjb25zdCB7aXNJbnRlZ2VyID0gZmFsc2V9ID0gb3B0cztcbiAgaWYgKEFycmF5LmlzQXJyYXkodikgfHwgQXJyYXlCdWZmZXIuaXNWaWV3KHYpKSB7XG4gICAgcmV0dXJuIGZvcm1hdEFycmF5VmFsdWUodiwgb3B0cyk7XG4gIH1cbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUodikpIHtcbiAgICByZXR1cm4gU3RyaW5nKHYpO1xuICB9XG4gIGlmIChpc0ludGVnZXIpIHtcbiAgICByZXR1cm4gdi50b0ZpeGVkKDApO1xuICB9XG4gIGlmIChNYXRoLmFicyh2KSA+IDEwMCAmJiBNYXRoLmFicyh2KSA8IDEwMDAwKSB7XG4gICAgcmV0dXJuIHYudG9GaXhlZCgwKTtcbiAgfVxuICBjb25zdCBzdHJpbmcgPSB2LnRvUHJlY2lzaW9uKDIpO1xuICBjb25zdCBkZWNpbWFsID0gc3RyaW5nLmluZGV4T2YoJy4wJyk7XG4gIHJldHVybiBkZWNpbWFsID09PSBzdHJpbmcubGVuZ3RoIC0gMiA/IHN0cmluZy5zbGljZSgwLCAtMSkgOiBzdHJpbmc7XG59XG5cbi8vIE1ha2UgYXZhaWxhYmxlIGluIGJyb3dzZXIgY29uc29sZVxubHVtYS5sb2cgPSBsb2c7XG5cbmV4cG9ydCBkZWZhdWx0IGxvZztcbiJdfQ==