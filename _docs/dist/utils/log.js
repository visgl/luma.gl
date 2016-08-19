'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isBrowser = require('./is-browser');

/* eslint-disable no-console */
/* global console */
/* global window */

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

// Make available in browser console
_isBrowser.lumagl.log = _log;

exports.default = _log;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9sb2cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQU0sT0FBTTtBQUNWLFlBQVUsQ0FEQTtBQUVWLE9BRlUsaUJBRUosUUFGSSxFQUVNLE1BRk4sRUFFYTtBQUNyQixRQUFJLFlBQVksS0FBSSxRQUFoQixJQUE0QixNQUFoQyxFQUF1QztBQUNyQyxjQUFRLEtBQVIsQ0FBYyxNQUFkO0FBQ0Q7QUFDRixHQU5TO0FBT1YsS0FQVSxlQU9OLFFBUE0sRUFPYTtBQUNyQixRQUFJLFlBQVksS0FBSSxRQUFwQixFQUE4QjtBQUFBOztBQUFBLHdDQURmLElBQ2U7QUFEZixZQUNlO0FBQUE7O0FBQzVCLDJCQUFRLEtBQVIsaUJBQWlCLElBQWpCO0FBQ0Q7QUFDRixHQVhTO0FBWVYsTUFaVSxnQkFZTCxRQVpLLEVBWWM7QUFDdEIsUUFBSSxZQUFZLEtBQUksUUFBcEIsRUFBOEI7QUFBQTs7QUFBQSx5Q0FEZCxJQUNjO0FBRGQsWUFDYztBQUFBOztBQUM1Qiw0QkFBUSxHQUFSLGtCQUFlLElBQWY7QUFDRDtBQUNGLEdBaEJTO0FBaUJWLE1BakJVLGdCQWlCTCxRQWpCSyxFQWlCYztBQUN0QixRQUFJLFlBQVksS0FBSSxRQUFwQixFQUE4QjtBQUFBOztBQUFBLHlDQURkLElBQ2M7QUFEZCxZQUNjO0FBQUE7O0FBQzVCLDRCQUFRLElBQVIsa0JBQWdCLElBQWhCO0FBQ0Q7QUFDRjtBQXJCUyxDQUFaOztBQXdCQTtBQUNBLGtCQUFPLEdBQVAsR0FBYSxJQUFiOztrQkFFZSxJIiwiZmlsZSI6ImxvZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7bHVtYWdsfSBmcm9tICcuL2lzLWJyb3dzZXInO1xuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuLyogZ2xvYmFsIGNvbnNvbGUgKi9cbi8qIGdsb2JhbCB3aW5kb3cgKi9cblxuY29uc3QgbG9nID0ge1xuICBwcmlvcml0eTogMCxcbiAgdGFibGUocHJpb3JpdHksIHRhYmxlKSB7XG4gICAgaWYgKHByaW9yaXR5IDw9IGxvZy5wcmlvcml0eSAmJiB0YWJsZSkge1xuICAgICAgY29uc29sZS50YWJsZSh0YWJsZSk7XG4gICAgfVxuICB9LFxuICBsb2cocHJpb3JpdHksIC4uLmFyZ3MpIHtcbiAgICBpZiAocHJpb3JpdHkgPD0gbG9nLnByaW9yaXR5KSB7XG4gICAgICBjb25zb2xlLmRlYnVnKC4uLmFyZ3MpO1xuICAgIH1cbiAgfSxcbiAgaW5mbyhwcmlvcml0eSwgLi4uYXJncykge1xuICAgIGlmIChwcmlvcml0eSA8PSBsb2cucHJpb3JpdHkpIHtcbiAgICAgIGNvbnNvbGUubG9nKC4uLmFyZ3MpO1xuICAgIH1cbiAgfSxcbiAgd2Fybihwcmlvcml0eSwgLi4uYXJncykge1xuICAgIGlmIChwcmlvcml0eSA8PSBsb2cucHJpb3JpdHkpIHtcbiAgICAgIGNvbnNvbGUud2FybiguLi5hcmdzKTtcbiAgICB9XG4gIH1cbn07XG5cbi8vIE1ha2UgYXZhaWxhYmxlIGluIGJyb3dzZXIgY29uc29sZVxubHVtYWdsLmxvZyA9IGxvZztcblxuZXhwb3J0IGRlZmF1bHQgbG9nO1xuIl19