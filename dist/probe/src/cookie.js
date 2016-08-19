'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (doc) {
  if (!doc) doc = {};
  if (typeof doc === 'string') doc = { cookie: doc };
  if (doc.cookie === undefined) doc.cookie = '';

  return {
    get: function get(key) {
      var splat = doc.cookie.split(/;\s*/);
      for (var i = 0; i < splat.length; i++) {
        var ps = splat[i].split('=');
        var k = unescape(ps[0]);
        if (k === key) {
          return unescape(ps[1]);
        }
      }
      return undefined;
    },
    set: function set(key, value) {
      var _ref = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var expires = _ref.expires;
      var path = _ref.path;
      var domain = _ref.domain;
      var secure = _ref.secure;

      var s = escape(key) + '=' + escape(value);
      if (expires) {
        s += '; expires=' + expires;
      }
      if (path) {
        s += '; path=' + escape(path);
      }
      if (domain) {
        s += '; domain=' + escape(domain);
      }
      if (secure) {
        s += '; secure';
      }
      doc.cookie = s;
      return s;
    }
  };
};

; // Adapted from https://github.com/substack/cookie-cutter (under MIT license)


if (typeof document !== 'undefined') {
  var cookie = exports(document);
  exports.get = cookie.get;
  exports.set = cookie.set;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm9iZS9zcmMvY29va2llLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztrQkFDZSxVQUFVLEdBQVYsRUFBZTtBQUM1QixNQUFJLENBQUMsR0FBTCxFQUFVLE1BQU0sRUFBTjtBQUNWLE1BQUksT0FBTyxHQUFQLEtBQWUsUUFBbkIsRUFBNkIsTUFBTSxFQUFFLFFBQVEsR0FBVixFQUFOO0FBQzdCLE1BQUksSUFBSSxNQUFKLEtBQWUsU0FBbkIsRUFBOEIsSUFBSSxNQUFKLEdBQWEsRUFBYjs7QUFFOUIsU0FBTztBQUNMLE9BREssZUFDRCxHQURDLEVBQ0k7QUFDUCxVQUFNLFFBQVEsSUFBSSxNQUFKLENBQVcsS0FBWCxDQUFpQixNQUFqQixDQUFkO0FBQ0EsV0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE1BQU0sTUFBMUIsRUFBa0MsR0FBbEMsRUFBdUM7QUFDckMsWUFBTSxLQUFLLE1BQU0sQ0FBTixFQUFTLEtBQVQsQ0FBZSxHQUFmLENBQVg7QUFDQSxZQUFNLElBQUksU0FBUyxHQUFHLENBQUgsQ0FBVCxDQUFWO0FBQ0EsWUFBSSxNQUFNLEdBQVYsRUFBZTtBQUNiLGlCQUFPLFNBQVMsR0FBRyxDQUFILENBQVQsQ0FBUDtBQUNEO0FBQ0Y7QUFDRCxhQUFPLFNBQVA7QUFDRCxLQVhJO0FBYUwsT0FiSyxlQWFELEdBYkMsRUFhSSxLQWJKLEVBYWlEO0FBQUEsdUVBQUosRUFBSTs7QUFBQSxVQUFyQyxPQUFxQyxRQUFyQyxPQUFxQztBQUFBLFVBQTVCLElBQTRCLFFBQTVCLElBQTRCO0FBQUEsVUFBdEIsTUFBc0IsUUFBdEIsTUFBc0I7QUFBQSxVQUFkLE1BQWMsUUFBZCxNQUFjOztBQUNwRCxVQUFJLElBQUksT0FBTyxHQUFQLElBQWMsR0FBZCxHQUFvQixPQUFPLEtBQVAsQ0FBNUI7QUFDQSxVQUFJLE9BQUosRUFBYTtBQUNYLDRCQUFrQixPQUFsQjtBQUNEO0FBQ0QsVUFBSSxJQUFKLEVBQVU7QUFDUix5QkFBZSxPQUFPLElBQVAsQ0FBZjtBQUNEO0FBQ0QsVUFBSSxNQUFKLEVBQVk7QUFDViwyQkFBaUIsT0FBTyxNQUFQLENBQWpCO0FBQ0Q7QUFDRCxVQUFJLE1BQUosRUFBWTtBQUNWLGFBQUssVUFBTDtBQUNEO0FBQ0QsVUFBSSxNQUFKLEdBQWEsQ0FBYjtBQUNBLGFBQU8sQ0FBUDtBQUNEO0FBN0JJLEdBQVA7QUErQkQsQzs7QUFBQSxDLENBckNEOzs7QUF1Q0EsSUFBSSxPQUFPLFFBQVAsS0FBb0IsV0FBeEIsRUFBcUM7QUFDbkMsTUFBTSxTQUFTLFFBQVEsUUFBUixDQUFmO0FBQ0EsVUFBUSxHQUFSLEdBQWMsT0FBTyxHQUFyQjtBQUNBLFVBQVEsR0FBUixHQUFjLE9BQU8sR0FBckI7QUFDRCIsImZpbGUiOiJjb29raWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBZGFwdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3N1YnN0YWNrL2Nvb2tpZS1jdXR0ZXIgKHVuZGVyIE1JVCBsaWNlbnNlKVxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKGRvYykge1xuICBpZiAoIWRvYykgZG9jID0ge307XG4gIGlmICh0eXBlb2YgZG9jID09PSAnc3RyaW5nJykgZG9jID0geyBjb29raWU6IGRvYyB9O1xuICBpZiAoZG9jLmNvb2tpZSA9PT0gdW5kZWZpbmVkKSBkb2MuY29va2llID0gJyc7XG5cbiAgcmV0dXJuIHtcbiAgICBnZXQoa2V5KSB7XG4gICAgICBjb25zdCBzcGxhdCA9IGRvYy5jb29raWUuc3BsaXQoLztcXHMqLyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNwbGF0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBzID0gc3BsYXRbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgY29uc3QgayA9IHVuZXNjYXBlKHBzWzBdKTtcbiAgICAgICAgaWYgKGsgPT09IGtleSkge1xuICAgICAgICAgIHJldHVybiB1bmVzY2FwZShwc1sxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSxcblxuICAgIHNldChrZXksIHZhbHVlLCB7ZXhwaXJlcywgcGF0aCwgZG9tYWluLCBzZWN1cmV9ID0ge30pIHtcbiAgICAgIGxldCBzID0gZXNjYXBlKGtleSkgKyAnPScgKyBlc2NhcGUodmFsdWUpO1xuICAgICAgaWYgKGV4cGlyZXMpIHtcbiAgICAgICAgcyArPSBgOyBleHBpcmVzPSR7ZXhwaXJlc31gO1xuICAgICAgfVxuICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgcyArPSBgOyBwYXRoPSR7ZXNjYXBlKHBhdGgpfWA7XG4gICAgICB9XG4gICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgIHMgKz0gYDsgZG9tYWluPSR7ZXNjYXBlKGRvbWFpbil9YDtcbiAgICAgIH1cbiAgICAgIGlmIChzZWN1cmUpIHtcbiAgICAgICAgcyArPSAnOyBzZWN1cmUnO1xuICAgICAgfVxuICAgICAgZG9jLmNvb2tpZSA9IHM7XG4gICAgICByZXR1cm4gcztcbiAgICB9XG4gIH07XG59O1xuXG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICBjb25zdCBjb29raWUgPSBleHBvcnRzKGRvY3VtZW50KTtcbiAgZXhwb3J0cy5nZXQgPSBjb29raWUuZ2V0O1xuICBleHBvcnRzLnNldCA9IGNvb2tpZS5zZXQ7XG59Il19