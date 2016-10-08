'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.browserFs = exports.loadFile = undefined;

var _browserRequest = require('./browser-request');

Object.defineProperty(exports, 'loadFile', {
  enumerable: true,
  get: function get() {
    return _browserRequest.loadFile;
  }
});

var _browserImageIo = require('./browser-image-io');

Object.keys(_browserImageIo).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _browserImageIo[key];
    }
  });
});

var _browserFs = require('./browser-fs');

var browserFs = _interopRequireWildcard(_browserFs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.browserFs = browserFs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2luZGV4LmpzIl0sIm5hbWVzIjpbImxvYWRGaWxlIiwiYnJvd3NlckZzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7MkJBQVFBLFE7Ozs7OztBQUtSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFIQTs7SUFBWUMsUzs7OztRQUNKQSxTLEdBQUFBLFMiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQge2xvYWRGaWxlfSBmcm9tICcuL2Jyb3dzZXItcmVxdWVzdCc7XG5cbmltcG9ydCAqIGFzIGJyb3dzZXJGcyBmcm9tICcuL2Jyb3dzZXItZnMnO1xuZXhwb3J0IHticm93c2VyRnN9O1xuXG5leHBvcnQgKiBmcm9tICcuL2Jyb3dzZXItaW1hZ2UtaW8nO1xuIl19