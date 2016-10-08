'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _withoutIo = require('./without-io');

Object.keys(_withoutIo).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _withoutIo[key];
    }
  });
});

var _io = require('./io');

Object.keys(_io).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _io[key];
    }
  });
});

var _globals = require('./globals');

var _globals2 = _interopRequireDefault(_globals);

var io = _interopRequireWildcard(_io);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Object.assign(_globals2.default, io);

// Assign global luma variable to help debugging


// Export all symbols for LumaGL
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJpbyIsIk9iamVjdCIsImFzc2lnbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFHQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7Ozs7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBSkE7Ozs7SUFPWUEsRTs7Ozs7O0FBQ1pDLE9BQU9DLE1BQVAsb0JBQW9CRixFQUFwQjs7QUFGQTs7O0FBSkEiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbHVtYSBmcm9tICcuL2dsb2JhbHMnO1xuXG4vLyBFeHBvcnQgYWxsIHN5bWJvbHMgZm9yIEx1bWFHTFxuZXhwb3J0ICogZnJvbSAnLi93aXRob3V0LWlvJztcbmV4cG9ydCAqIGZyb20gJy4vaW8nO1xuXG4vLyBBc3NpZ24gZ2xvYmFsIGx1bWEgdmFyaWFibGUgdG8gaGVscCBkZWJ1Z2dpbmdcbmltcG9ydCAqIGFzIGlvIGZyb20gJy4vaW8nO1xuT2JqZWN0LmFzc2lnbihsdW1hLCBpbyk7XG4iXX0=