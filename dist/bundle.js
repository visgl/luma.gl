'use strict';

require('babel-polyfill');

var _index = require('./index');

var LumaGL = _interopRequireWildcard(_index);

var _addons = require('./addons');

var addons = _interopRequireWildcard(_addons);

var _utils = require('./utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* global window */

// Export all LumaGL objects as members of global lumagl variable
/* Generate pre-bundled script that can be used in browser without browserify */
if (typeof window !== 'undefined') {
  Object.assign(_utils.lumagl, LumaGL);
  _utils.lumagl.addons = addons;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9idW5kbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQTs7QUFDQTs7SUFBWSxNOztBQUNaOztJQUFZLE07O0FBQ1o7Ozs7QUFDQTs7QUFFQTtBQVBBO0FBUUEsSUFBSSxPQUFPLE1BQVAsS0FBa0IsV0FBdEIsRUFBbUM7QUFDakMsU0FBTyxNQUFQLGdCQUFzQixNQUF0QjtBQUNBLGdCQUFPLE1BQVAsR0FBZ0IsTUFBaEI7QUFDRCIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBHZW5lcmF0ZSBwcmUtYnVuZGxlZCBzY3JpcHQgdGhhdCBjYW4gYmUgdXNlZCBpbiBicm93c2VyIHdpdGhvdXQgYnJvd3NlcmlmeSAqL1xuaW1wb3J0ICdiYWJlbC1wb2x5ZmlsbCc7XG5pbXBvcnQgKiBhcyBMdW1hR0wgZnJvbSAnLi9pbmRleCc7XG5pbXBvcnQgKiBhcyBhZGRvbnMgZnJvbSAnLi9hZGRvbnMnO1xuaW1wb3J0IHtsdW1hZ2x9IGZyb20gJy4vdXRpbHMnO1xuLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG4vLyBFeHBvcnQgYWxsIEx1bWFHTCBvYmplY3RzIGFzIG1lbWJlcnMgb2YgZ2xvYmFsIGx1bWFnbCB2YXJpYWJsZVxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIE9iamVjdC5hc3NpZ24obHVtYWdsLCBMdW1hR0wpO1xuICBsdW1hZ2wuYWRkb25zID0gYWRkb25zO1xufVxuIl19