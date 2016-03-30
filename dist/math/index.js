'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arrayImpl = require('./array-impl');

var _loop = function _loop(_key2) {
  if (_key2 === "default") return 'continue';
  Object.defineProperty(exports, _key2, {
    enumerable: true,
    get: function get() {
      return _arrayImpl[_key2];
    }
  });
};

for (var _key2 in _arrayImpl) {
  var _ret = _loop(_key2);

  if (_ret === 'continue') continue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbXX0=