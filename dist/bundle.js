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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9idW5kbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBSVk7Ozs7Ozs7Ozs7OztBQU1aLElBQUksT0FBTyxNQUFQLEtBQWtCLFdBQWxCLEVBQStCO0FBQ2pDLFNBQU8sTUFBUCxHQUFnQixNQUFoQixDQURpQztDQUFuQyIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBHZW5lcmF0ZSBzY3JpcHQgdGhhdCBjYW4gYmUgdXNlZCBpbiBicm93c2VyIHdpdGhvdXQgYnJvd3NlcmlmeSAqL1xuXG4vKiBnbG9iYWwgd2luZG93ICovXG5pbXBvcnQgJ2JhYmVsLXBvbHlmaWxsJztcbmltcG9ydCAqIGFzIEx1bWFHTCBmcm9tICcuL2luZGV4Jztcbi8vIGltcG9ydCBGeCBmcm9tICcuL2FkZG9ucy9meCc7XG4vLyBpbXBvcnQgV29ya2VyR3JvdXAgZnJvbSAnLi9hZGRvbnMvd29ya2Vycyc7XG4vLyBpbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vYWRkb25zL2hlbHBlcnMnO1xuXG4vLyBFeHBvcnQgYWxsIEx1bWFHTCBvYmplY3RzIGFzIG1lbWJlcnMgb2YgZ2xvYmFsIEx1bWFHTCB2YXJpYWJsZVxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy5MdW1hR0wgPSBMdW1hR0w7XG59XG4iXX0=