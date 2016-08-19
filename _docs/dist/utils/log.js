'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint-disable no-console */
/* global console */
/* global window */

var lumaLog = {
  priority: 0,
  table: function table(priority, _table) {
    if (priority <= lumaLog.priority && _table) {
      console.table(_table);
    }
  },
  log: function log(priority) {
    if (priority <= lumaLog.priority) {
      var _console;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      (_console = console).debug.apply(_console, args);
    }
  },
  info: function info(priority) {
    if (priority <= lumaLog.priority) {
      var _console2;

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      (_console2 = console).log.apply(_console2, args);
    }
  },
  warn: function warn(priority) {
    if (priority <= lumaLog.priority) {
      var _console3;

      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      (_console3 = console).warn.apply(_console3, args);
    }
  }
};

if (typeof window !== 'undefined') {
  window.lumaLog = lumaLog;
}

exports.default = lumaLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9sb2cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBSUEsSUFBTSxVQUFVO0FBQ2QsWUFBVSxDQURJO0FBRWQsT0FGYyxpQkFFUixRQUZRLEVBRUUsTUFGRixFQUVTO0FBQ3JCLFFBQUksWUFBWSxRQUFRLFFBQXBCLElBQWdDLE1BQXBDLEVBQTJDO0FBQ3pDLGNBQVEsS0FBUixDQUFjLE1BQWQ7QUFDRDtBQUNGLEdBTmE7QUFPZCxLQVBjLGVBT1YsUUFQVSxFQU9TO0FBQ3JCLFFBQUksWUFBWSxRQUFRLFFBQXhCLEVBQWtDO0FBQUE7O0FBQUEsd0NBRG5CLElBQ21CO0FBRG5CLFlBQ21CO0FBQUE7O0FBQ2hDLDJCQUFRLEtBQVIsaUJBQWlCLElBQWpCO0FBQ0Q7QUFDRixHQVhhO0FBWWQsTUFaYyxnQkFZVCxRQVpTLEVBWVU7QUFDdEIsUUFBSSxZQUFZLFFBQVEsUUFBeEIsRUFBa0M7QUFBQTs7QUFBQSx5Q0FEbEIsSUFDa0I7QUFEbEIsWUFDa0I7QUFBQTs7QUFDaEMsNEJBQVEsR0FBUixrQkFBZSxJQUFmO0FBQ0Q7QUFDRixHQWhCYTtBQWlCZCxNQWpCYyxnQkFpQlQsUUFqQlMsRUFpQlU7QUFDdEIsUUFBSSxZQUFZLFFBQVEsUUFBeEIsRUFBa0M7QUFBQTs7QUFBQSx5Q0FEbEIsSUFDa0I7QUFEbEIsWUFDa0I7QUFBQTs7QUFDaEMsNEJBQVEsSUFBUixrQkFBZ0IsSUFBaEI7QUFDRDtBQUNGO0FBckJhLENBQWhCOztBQXdCQSxJQUFJLE9BQU8sTUFBUCxLQUFrQixXQUF0QixFQUFtQztBQUNqQyxTQUFPLE9BQVAsR0FBaUIsT0FBakI7QUFDRDs7a0JBRWMsTyIsImZpbGUiOiJsb2cuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4vKiBnbG9iYWwgY29uc29sZSAqL1xuLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5jb25zdCBsdW1hTG9nID0ge1xuICBwcmlvcml0eTogMCxcbiAgdGFibGUocHJpb3JpdHksIHRhYmxlKSB7XG4gICAgaWYgKHByaW9yaXR5IDw9IGx1bWFMb2cucHJpb3JpdHkgJiYgdGFibGUpIHtcbiAgICAgIGNvbnNvbGUudGFibGUodGFibGUpO1xuICAgIH1cbiAgfSxcbiAgbG9nKHByaW9yaXR5LCAuLi5hcmdzKSB7XG4gICAgaWYgKHByaW9yaXR5IDw9IGx1bWFMb2cucHJpb3JpdHkpIHtcbiAgICAgIGNvbnNvbGUuZGVidWcoLi4uYXJncyk7XG4gICAgfVxuICB9LFxuICBpbmZvKHByaW9yaXR5LCAuLi5hcmdzKSB7XG4gICAgaWYgKHByaW9yaXR5IDw9IGx1bWFMb2cucHJpb3JpdHkpIHtcbiAgICAgIGNvbnNvbGUubG9nKC4uLmFyZ3MpO1xuICAgIH1cbiAgfSxcbiAgd2Fybihwcmlvcml0eSwgLi4uYXJncykge1xuICAgIGlmIChwcmlvcml0eSA8PSBsdW1hTG9nLnByaW9yaXR5KSB7XG4gICAgICBjb25zb2xlLndhcm4oLi4uYXJncyk7XG4gICAgfVxuICB9XG59O1xuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgd2luZG93Lmx1bWFMb2cgPSBsdW1hTG9nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBsdW1hTG9nO1xuIl19