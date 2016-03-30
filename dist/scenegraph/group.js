'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object3d = require('./object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _utils = require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Group = function (_Object3D) {
  _inherits(Group, _Object3D);

  function Group(_ref) {
    var _ref$children = _ref.children;
    var children = _ref$children === undefined ? [] : _ref$children;

    var opts = _objectWithoutProperties(_ref, ['children']);

    _classCallCheck(this, Group);

    children.every(function (child) {
      return (0, _assert2.default)(child instanceof _object3d2.default);
    });

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Group).call(this, opts));

    _this.children = children;
    return _this;
  }

  _createClass(Group, [{
    key: 'add',
    value: function add() {
      for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
        children[_key] = arguments[_key];
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var child = _step.value;

          // Generate unique id for child
          child.id = child.id || (0, _utils.uid)();
          this.children.push(child);
          // Create and load Buffers
          this.defineBuffers(child);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'remove',
    value: function remove(child) {
      var children = this.children;
      var indexOf = children.indexOf(child);
      if (indexOf > -1) {
        children.splice(indexOf, 1);
      }
    }
  }, {
    key: 'removeAll',
    value: function removeAll() {
      this.children = [];
    }
  }, {
    key: 'traverse',
    value: regeneratorRuntime.mark(function traverse(_ref2) {
      var viewMatrix = _ref2.viewMatrix;

      var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, child, matrix, worldMatrix;

      return regeneratorRuntime.wrap(function traverse$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _iteratorNormalCompletion2 = true;
              _didIteratorError2 = false;
              _iteratorError2 = undefined;
              _context.prev = 3;
              _iterator2 = this.children[Symbol.iterator]();

            case 5:
              if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                _context.next = 19;
                break;
              }

              child = _step2.value;
              matrix = child.matrix;
              worldMatrix = viewMatrix.mulMat4(matrix);

              if (!(child instanceof Group)) {
                _context.next = 13;
                break;
              }

              return _context.delegateYield(child.traverse({ matrix: matrix, worldMatrix: worldMatrix }), 't0', 11);

            case 11:
              _context.next = 16;
              break;

            case 13:
              if (child.program) {
                child.program.use();
                child.program.setUniforms({ worldMatrix: worldMatrix });
              }
              _context.next = 16;
              return child;

            case 16:
              _iteratorNormalCompletion2 = true;
              _context.next = 5;
              break;

            case 19:
              _context.next = 25;
              break;

            case 21:
              _context.prev = 21;
              _context.t1 = _context['catch'](3);
              _didIteratorError2 = true;
              _iteratorError2 = _context.t1;

            case 25:
              _context.prev = 25;
              _context.prev = 26;

              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }

            case 28:
              _context.prev = 28;

              if (!_didIteratorError2) {
                _context.next = 31;
                break;
              }

              throw _iteratorError2;

            case 31:
              return _context.finish(28);

            case 32:
              return _context.finish(25);

            case 33:
            case 'end':
              return _context.stop();
          }
        }
      }, traverse, this, [[3, 21, 25, 33], [26,, 28, 32]]);
    })
  }, {
    key: 'traverseReverse',
    value: regeneratorRuntime.mark(function traverseReverse(_ref3) {
      var viewMatrix = _ref3.viewMatrix;

      var i, _child, _matrix, _worldMatrix;

      return regeneratorRuntime.wrap(function traverseReverse$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              i = this.children.length - 1;

            case 1:
              if (!(i >= 0)) {
                _context2.next = 15;
                break;
              }

              _child = this.children[i];
              _matrix = _child.matrix;
              _worldMatrix = viewMatrix.mulMat4(_matrix);

              if (!(_child instanceof Group)) {
                _context2.next = 9;
                break;
              }

              return _context2.delegateYield(_child.traverseReverse({ matrix: _matrix, worldMatrix: _worldMatrix }), 't0', 7);

            case 7:
              _context2.next = 12;
              break;

            case 9:
              if (_child.program) {
                _child.program.use();
                _child.program.setUniforms({ worldMatrix: _worldMatrix });
              }
              _context2.next = 12;
              return _child;

            case 12:
              --i;
              _context2.next = 1;
              break;

            case 15:
            case 'end':
              return _context2.stop();
          }
        }
      }, traverseReverse, this);
    })
  }]);

  return Group;
}(_object3d2.default);

exports.default = Group;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL2dyb3VwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJcUI7OztBQUNuQixXQURtQixLQUNuQixPQUFzQzs2QkFBekIsU0FBeUI7UUFBekIseUNBQVcsbUJBQWM7O1FBQVAsb0RBQU87OzBCQURuQixPQUNtQjs7QUFDcEMsYUFBUyxLQUFULENBQWU7YUFBUyxzQkFBTyxtQ0FBUDtLQUFULENBQWYsQ0FEb0M7O3VFQURuQixrQkFHWCxPQUY4Qjs7QUFHcEMsVUFBSyxRQUFMLEdBQWdCLFFBQWhCLENBSG9DOztHQUF0Qzs7ZUFEbUI7OzBCQU9GO3dDQUFWOztPQUFVOzs7Ozs7O0FBQ2YsNkJBQW9CLGtDQUFwQixvR0FBOEI7Y0FBbkIsb0JBQW1COzs7QUFFNUIsZ0JBQU0sRUFBTixHQUFXLE1BQU0sRUFBTixJQUFZLGlCQUFaLENBRmlCO0FBRzVCLGVBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsS0FBbkI7O0FBSDRCLGNBSzVCLENBQUssYUFBTCxDQUFtQixLQUFuQixFQUw0QjtTQUE5Qjs7Ozs7Ozs7Ozs7Ozs7T0FEZTs7OzsyQkFVVixPQUFPO0FBQ1osVUFBTSxXQUFXLEtBQUssUUFBTCxDQURMO0FBRVosVUFBTSxVQUFVLFNBQVMsT0FBVCxDQUFpQixLQUFqQixDQUFWLENBRk07QUFHWixVQUFJLFVBQVUsQ0FBQyxDQUFELEVBQUk7QUFDaEIsaUJBQVMsTUFBVCxDQUFnQixPQUFoQixFQUF5QixDQUF6QixFQURnQjtPQUFsQjs7OztnQ0FLVTtBQUNWLFdBQUssUUFBTCxHQUFnQixFQUFoQixDQURVOzs7OztVQUlEOzsrRkFDRSxPQUNGLFFBQ0Q7Ozs7Ozs7Ozs7MkJBRlksS0FBSyxRQUFMOzs7Ozs7OztBQUFUO0FBQ0YsdUJBQVUsTUFBVjtBQUNELDRCQUFjLFdBQVcsT0FBWCxDQUFtQixNQUFuQjs7b0JBQ2hCLGlCQUFpQixLQUFqQjs7Ozs7NENBQ0ssTUFBTSxRQUFOLENBQWUsRUFBQyxjQUFELEVBQVMsd0JBQVQsRUFBZjs7Ozs7OztBQUVQLGtCQUFJLE1BQU0sT0FBTixFQUFlO0FBQ2pCLHNCQUFNLE9BQU4sQ0FBYyxHQUFkLEdBRGlCO0FBRWpCLHNCQUFNLE9BQU4sQ0FBYyxXQUFkLENBQTBCLEVBQUMsd0JBQUQsRUFBMUIsRUFGaUI7ZUFBbkI7O3FCQUlNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFLTTs7VUFDUCxHQUNELFFBQ0MsU0FDRDs7Ozs7O0FBSEMsa0JBQUksS0FBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixDQUF2Qjs7O29CQUEwQixLQUFLLENBQUw7Ozs7O0FBQy9CLHVCQUFRLEtBQUssUUFBTCxDQUFjLENBQWQ7QUFDUCx3QkFBVSxPQUFWO0FBQ0QsNkJBQWMsV0FBVyxPQUFYLENBQW1CLE9BQW5COztvQkFDaEIsa0JBQWlCLEtBQWpCOzs7Ozs2Q0FDSyxPQUFNLGVBQU4sQ0FBc0IsRUFBQyxlQUFELEVBQVMseUJBQVQsRUFBdEI7Ozs7Ozs7QUFFUCxrQkFBSSxPQUFNLE9BQU4sRUFBZTtBQUNqQix1QkFBTSxPQUFOLENBQWMsR0FBZCxHQURpQjtBQUVqQix1QkFBTSxPQUFOLENBQWMsV0FBZCxDQUEwQixFQUFDLHlCQUFELEVBQTFCLEVBRmlCO2VBQW5COztxQkFJTTs7O0FBWHFDLGdCQUFFLENBQUY7Ozs7Ozs7Ozs7Ozs7U0E5QzlCIiwiZmlsZSI6Imdyb3VwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9iamVjdDNEIGZyb20gJy4vb2JqZWN0LTNkJztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyb3VwIGV4dGVuZHMgT2JqZWN0M0Qge1xuICBjb25zdHJ1Y3Rvcih7Y2hpbGRyZW4gPSBbXSwgLi4ub3B0c30pIHtcbiAgICBjaGlsZHJlbi5ldmVyeShjaGlsZCA9PiBhc3NlcnQoY2hpbGQgaW5zdGFuY2VvZiBPYmplY3QzRCkpO1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfVxuXG4gIGFkZCguLi5jaGlsZHJlbikge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgIC8vIEdlbmVyYXRlIHVuaXF1ZSBpZCBmb3IgY2hpbGRcbiAgICAgIGNoaWxkLmlkID0gY2hpbGQuaWQgfHwgdWlkKCk7XG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgLy8gQ3JlYXRlIGFuZCBsb2FkIEJ1ZmZlcnNcbiAgICAgIHRoaXMuZGVmaW5lQnVmZmVycyhjaGlsZCk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKGNoaWxkKSB7XG4gICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuICAgIGNvbnN0IGluZGV4T2YgPSBjaGlsZHJlbi5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoaW5kZXhPZiA+IC0xKSB7XG4gICAgICBjaGlsZHJlbi5zcGxpY2UoaW5kZXhPZiwgMSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQWxsKCkge1xuICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcbiAgfVxuXG4gICp0cmF2ZXJzZSh7dmlld01hdHJpeH0pIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IHttYXRyaXh9ID0gY2hpbGQ7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IHZpZXdNYXRyaXgubXVsTWF0NChtYXRyaXgpO1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgeWllbGQqIGNoaWxkLnRyYXZlcnNlKHttYXRyaXgsIHdvcmxkTWF0cml4fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2hpbGQucHJvZ3JhbSkge1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0udXNlKCk7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS5zZXRVbmlmb3Jtcyh7d29ybGRNYXRyaXh9KTtcbiAgICAgICAgfVxuICAgICAgICB5aWVsZCBjaGlsZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAqdHJhdmVyc2VSZXZlcnNlKHt2aWV3TWF0cml4fSkge1xuICAgIGZvciAobGV0IGkgPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICBjb25zdCBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XG4gICAgICBjb25zdCB7bWF0cml4fSA9IGNoaWxkO1xuICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSB2aWV3TWF0cml4Lm11bE1hdDQobWF0cml4KTtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEdyb3VwKSB7XG4gICAgICAgIHlpZWxkKiBjaGlsZC50cmF2ZXJzZVJldmVyc2Uoe21hdHJpeCwgd29ybGRNYXRyaXh9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjaGlsZC5wcm9ncmFtKSB7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS51c2UoKTtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnNldFVuaWZvcm1zKHt3b3JsZE1hdHJpeH0pO1xuICAgICAgICB9XG4gICAgICAgIHlpZWxkIGNoaWxkO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19