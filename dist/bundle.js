'use strict';

require('babel-polyfill');

var _index = require('./index');

var LumaGL = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// import Fx from './addons/fx';
// import WorkerGroup from './addons/workers';
// import * as helpers from './addons/helpers';

// Export all LumaGL objects as members of global LumaGL variable
/* Generate script that can be used in browser without browserify */

/* global window */
if (typeof window !== 'undefined') {
  window.LumaGL = LumaGL;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9idW5kbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTs7QUFDQTs7SUFBWTs7Ozs7Ozs7Ozs7O0FBTVosSUFBSSxPQUFPLE1BQVAsS0FBa0IsV0FBbEIsRUFBK0I7QUFDakMsU0FBTyxNQUFQLEdBQWdCLE1BQWhCLENBRGlDO0NBQW5DIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEdlbmVyYXRlIHNjcmlwdCB0aGF0IGNhbiBiZSB1c2VkIGluIGJyb3dzZXIgd2l0aG91dCBicm93c2VyaWZ5ICovXG5cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbmltcG9ydCAnYmFiZWwtcG9seWZpbGwnO1xuaW1wb3J0ICogYXMgTHVtYUdMIGZyb20gJy4vaW5kZXgnO1xuLy8gaW1wb3J0IEZ4IGZyb20gJy4vYWRkb25zL2Z4Jztcbi8vIGltcG9ydCBXb3JrZXJHcm91cCBmcm9tICcuL2FkZG9ucy93b3JrZXJzJztcbi8vIGltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi9hZGRvbnMvaGVscGVycyc7XG5cbi8vIEV4cG9ydCBhbGwgTHVtYUdMIG9iamVjdHMgYXMgbWVtYmVycyBvZiBnbG9iYWwgTHVtYUdMIHZhcmlhYmxlXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgd2luZG93Lkx1bWFHTCA9IEx1bWFHTDtcbn1cbiJdfQ==