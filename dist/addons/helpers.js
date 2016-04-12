'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeProgramFromShaderURIs = undefined;


// Load shaders using XHR
// @deprecated - Use glslify instead

var makeProgramFromShaderURIs = exports.makeProgramFromShaderURIs = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(gl, vs, fs, opts) {
    var vertexShaderURI, fragmentShaderURI, responses;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            opts = (0, _utils.merge)({
              path: '/',
              noCache: false
            }, opts);

            vertexShaderURI = opts.path + vs;
            fragmentShaderURI = opts.path + fs;
            _context.next = 5;
            return new _io.XHRGroup({
              urls: [vertexShaderURI, fragmentShaderURI],
              noCache: opts.noCache
            }).sendAsync();

          case 5:
            responses = _context.sent;
            return _context.abrupt('return', new _program2.default(gl, { vs: responses[0], fs: responses[1] }));

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function makeProgramFromShaderURIs(_x, _x2, _x3, _x4) {
    return ref.apply(this, arguments);
  };
}();

exports.makeProgramfromDefaultShaders = makeProgramfromDefaultShaders;
exports.makeProgramFromHTMLTemplates = makeProgramFromHTMLTemplates;

var _program = require('../webgl/program');

var _program2 = _interopRequireDefault(_program);

var _shaders = require('../shaders');

var _shaders2 = _interopRequireDefault(_shaders);

var _io = require('../io');

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

/* global document */

// Alternate constructor
// Build program from default shaders (requires Shaders)
function makeProgramfromDefaultShaders(gl, id) {
  return new _program2.default(gl, {
    vs: _shaders2.default.Vertex.Default,
    fs: _shaders2.default.Fragment.Default,
    id: id
  });
}

// Create a program from vertex and fragment shader node ids
// @deprecated - Use glslify instead
function makeProgramFromHTMLTemplates(gl, vsId, fsId, id) {
  var vs = document.getElementById(vsId).innerHTML;
  var fs = document.getElementById(fsId).innerHTML;
  return new _program2.default(gl, { vs: vs, fs: fs, id: id });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hZGRvbnMvaGVscGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7c0RBMEJPLGlCQUF5QyxFQUF6QyxFQUE2QyxFQUE3QyxFQUFpRCxFQUFqRCxFQUFxRCxJQUFyRDtRQU1DLGlCQUNBLG1CQUVBOzs7OztBQVJOLG1CQUFPLGtCQUFNO0FBQ1gsb0JBQU0sR0FBTjtBQUNBLHVCQUFTLEtBQVQ7YUFGSyxFQUdKLElBSEksQ0FBUDs7QUFLTSw4QkFBa0IsS0FBSyxJQUFMLEdBQVksRUFBWjtBQUNsQixnQ0FBb0IsS0FBSyxJQUFMLEdBQVksRUFBWjs7bUJBRUYsaUJBQWE7QUFDbkMsb0JBQU0sQ0FBQyxlQUFELEVBQWtCLGlCQUFsQixDQUFOO0FBQ0EsdUJBQVMsS0FBSyxPQUFMO2FBRmEsRUFHckIsU0FIcUI7OztBQUFsQjs2Q0FLQyxzQkFBWSxFQUFaLEVBQWdCLEVBQUMsSUFBSSxVQUFVLENBQVYsQ0FBSixFQUFrQixJQUFJLFVBQVUsQ0FBVixDQUFKLEVBQW5DOzs7Ozs7OztHQWRGOztrQkFBZTs7Ozs7UUFsQk47UUFVQTs7QUFsQmhCOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQUtPLFNBQVMsNkJBQVQsQ0FBdUMsRUFBdkMsRUFBMkMsRUFBM0MsRUFBK0M7QUFDcEQsU0FBTyxzQkFBWSxFQUFaLEVBQWdCO0FBQ3JCLFFBQUksa0JBQVEsTUFBUixDQUFlLE9BQWY7QUFDSixRQUFJLGtCQUFRLFFBQVIsQ0FBaUIsT0FBakI7QUFDSixVQUhxQjtHQUFoQixDQUFQLENBRG9EO0NBQS9DOzs7O0FBVUEsU0FBUyw0QkFBVCxDQUFzQyxFQUF0QyxFQUEwQyxJQUExQyxFQUFnRCxJQUFoRCxFQUFzRCxFQUF0RCxFQUEwRDtBQUMvRCxNQUFNLEtBQUssU0FBUyxjQUFULENBQXdCLElBQXhCLEVBQThCLFNBQTlCLENBRG9EO0FBRS9ELE1BQU0sS0FBSyxTQUFTLGNBQVQsQ0FBd0IsSUFBeEIsRUFBOEIsU0FBOUIsQ0FGb0Q7QUFHL0QsU0FBTyxzQkFBWSxFQUFaLEVBQWdCLEVBQUMsTUFBRCxFQUFLLE1BQUwsRUFBUyxNQUFULEVBQWhCLENBQVAsQ0FIK0Q7Q0FBMUQiLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBQcm9ncmFtIGZyb20gJy4uL3dlYmdsL3Byb2dyYW0nO1xuaW1wb3J0IFNoYWRlcnMgZnJvbSAnLi4vc2hhZGVycyc7XG5pbXBvcnQge1hIUkdyb3VwfSBmcm9tICcuLi9pbyc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuLy8gQWx0ZXJuYXRlIGNvbnN0cnVjdG9yXG4vLyBCdWlsZCBwcm9ncmFtIGZyb20gZGVmYXVsdCBzaGFkZXJzIChyZXF1aXJlcyBTaGFkZXJzKVxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtZnJvbURlZmF1bHRTaGFkZXJzKGdsLCBpZCkge1xuICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHtcbiAgICB2czogU2hhZGVycy5WZXJ0ZXguRGVmYXVsdCxcbiAgICBmczogU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0LFxuICAgIGlkXG4gIH0pO1xufVxuXG4vLyBDcmVhdGUgYSBwcm9ncmFtIGZyb20gdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgbm9kZSBpZHNcbi8vIEBkZXByZWNhdGVkIC0gVXNlIGdsc2xpZnkgaW5zdGVhZFxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcm9ncmFtRnJvbUhUTUxUZW1wbGF0ZXMoZ2wsIHZzSWQsIGZzSWQsIGlkKSB7XG4gIGNvbnN0IHZzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodnNJZCkuaW5uZXJIVE1MO1xuICBjb25zdCBmcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGZzSWQpLmlubmVySFRNTDtcbiAgcmV0dXJuIG5ldyBQcm9ncmFtKGdsLCB7dnMsIGZzLCBpZH0pO1xufVxuXG4vLyBMb2FkIHNoYWRlcnMgdXNpbmcgWEhSXG4vLyBAZGVwcmVjYXRlZCAtIFVzZSBnbHNsaWZ5IGluc3RlYWRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWtlUHJvZ3JhbUZyb21TaGFkZXJVUklzKGdsLCB2cywgZnMsIG9wdHMpIHtcbiAgb3B0cyA9IG1lcmdlKHtcbiAgICBwYXRoOiAnLycsXG4gICAgbm9DYWNoZTogZmFsc2VcbiAgfSwgb3B0cyk7XG5cbiAgY29uc3QgdmVydGV4U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgdnM7XG4gIGNvbnN0IGZyYWdtZW50U2hhZGVyVVJJID0gb3B0cy5wYXRoICsgZnM7XG5cbiAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgbmV3IFhIUkdyb3VwKHtcbiAgICB1cmxzOiBbdmVydGV4U2hhZGVyVVJJLCBmcmFnbWVudFNoYWRlclVSSV0sXG4gICAgbm9DYWNoZTogb3B0cy5ub0NhY2hlXG4gIH0pLnNlbmRBc3luYygpO1xuXG4gIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzOiByZXNwb25zZXNbMF0sIGZzOiByZXNwb25zZXNbMV19KTtcbn1cbiJdfQ==