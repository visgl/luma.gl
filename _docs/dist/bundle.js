'use strict';

require('babel-polyfill');

require('./index');

var _addons = require('./addons');

var addons = _interopRequireWildcard(_addons);

var _globals = require('./globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* Generate pre-bundled script that can be used in browser without browserify */
/* global window */
_globals2.default.addons = addons;

// Export all LumaGL objects as members of global lumagl variable
if (typeof window !== 'undefined') {
  window.LumaGL = _globals2.default;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9idW5kbGUuanMiXSwibmFtZXMiOlsiYWRkb25zIiwid2luZG93IiwiTHVtYUdMIl0sIm1hcHBpbmdzIjoiOztBQUVBOztBQUNBOztBQUNBOztJQUFZQSxNOztBQUNaOzs7Ozs7OztBQUxBO0FBQ0E7QUFLQSxrQkFBS0EsTUFBTCxHQUFjQSxNQUFkOztBQUVBO0FBQ0EsSUFBSSxPQUFPQyxNQUFQLEtBQWtCLFdBQXRCLEVBQW1DO0FBQ2pDQSxTQUFPQyxNQUFQO0FBQ0QiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogR2VuZXJhdGUgcHJlLWJ1bmRsZWQgc2NyaXB0IHRoYXQgY2FuIGJlIHVzZWQgaW4gYnJvd3NlciB3aXRob3V0IGJyb3dzZXJpZnkgKi9cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbmltcG9ydCAnYmFiZWwtcG9seWZpbGwnO1xuaW1wb3J0ICcuL2luZGV4JztcbmltcG9ydCAqIGFzIGFkZG9ucyBmcm9tICcuL2FkZG9ucyc7XG5pbXBvcnQgbHVtYSBmcm9tICcuL2dsb2JhbHMnO1xubHVtYS5hZGRvbnMgPSBhZGRvbnM7XG5cbi8vIEV4cG9ydCBhbGwgTHVtYUdMIG9iamVjdHMgYXMgbWVtYmVycyBvZiBnbG9iYWwgbHVtYWdsIHZhcmlhYmxlXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgd2luZG93Lkx1bWFHTCA9IGx1bWE7XG59XG4iXX0=