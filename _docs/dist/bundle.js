'use strict';

require('babel-polyfill');

var _index = require('./index');

var LumaGL = _interopRequireWildcard(_index);

var _addons = require('./addons');

var addons = _interopRequireWildcard(_addons);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

LumaGL.addons = addons;

// Export all LumaGL objects as members of global LumaGL variable
/* Generate script that can be used in browser without browserify */

/* global window */
if (typeof window !== 'undefined') {
  window.LumaGL = LumaGL;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9idW5kbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7QUFDQTs7SUFBWSxNOztBQUNaOztJQUFZLE07Ozs7QUFFWixPQUFPLE1BQVAsR0FBZ0IsTUFBaEI7Ozs7OztBQUdBLElBQUksT0FBTyxNQUFQLEtBQWtCLFdBQXRCLEVBQW1DO0FBQ2pDLFNBQU8sTUFBUCxHQUFnQixNQUFoQjtBQUNEIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEdlbmVyYXRlIHNjcmlwdCB0aGF0IGNhbiBiZSB1c2VkIGluIGJyb3dzZXIgd2l0aG91dCBicm93c2VyaWZ5ICovXG5cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbmltcG9ydCAnYmFiZWwtcG9seWZpbGwnO1xuaW1wb3J0ICogYXMgTHVtYUdMIGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0ICogYXMgYWRkb25zIGZyb20gJy4vYWRkb25zJztcblxuTHVtYUdMLmFkZG9ucyA9IGFkZG9ucztcblxuLy8gRXhwb3J0IGFsbCBMdW1hR0wgb2JqZWN0cyBhcyBtZW1iZXJzIG9mIGdsb2JhbCBMdW1hR0wgdmFyaWFibGVcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICB3aW5kb3cuTHVtYUdMID0gTHVtYUdMO1xufVxuIl19