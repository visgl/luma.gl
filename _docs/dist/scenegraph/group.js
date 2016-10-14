'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object3d = require('./object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _deprecated = require('../deprecated');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

    var _this = _possibleConstructorReturn(this, (Group.__proto__ || Object.getPrototypeOf(Group)).call(this, opts));

    _this.children = children;
    return _this;
  }

  // Unpacks arrays and nested arrays of children


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

          if (Array.isArray(child)) {
            this.add.apply(this, _toConsumableArray(child));
          } else {
            this.children.push(child);
          }
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

      return this;
    }
  }, {
    key: 'remove',
    value: function remove(child) {
      var children = this.children;
      var indexOf = children.indexOf(child);
      if (indexOf > -1) {
        children.splice(indexOf, 1);
      }
      return this;
    }
  }, {
    key: 'removeAll',
    value: function removeAll() {
      this.children = [];
      return this;
    }
  }, {
    key: 'traverse',
    value: regeneratorRuntime.mark(function traverse() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref2$viewMatrix = _ref2.viewMatrix;
      var viewMatrix = _ref2$viewMatrix === undefined ? new _deprecated.Mat4() : _ref2$viewMatrix;

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
      var i, child, matrix, worldMatrix;
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

              child = this.children[i];
              matrix = child.matrix;
              worldMatrix = viewMatrix.mulMat4(matrix);

              if (!(child instanceof Group)) {
                _context2.next = 9;
                break;
              }

              return _context2.delegateYield(child.traverseReverse({ matrix: matrix, worldMatrix: worldMatrix }), 't0', 7);

            case 7:
              _context2.next = 12;
              break;

            case 9:
              if (child.program) {
                child.program.use();
                child.program.setUniforms({ worldMatrix: worldMatrix });
              }
              _context2.next = 12;
              return child;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL2dyb3VwLmpzIl0sIm5hbWVzIjpbIkdyb3VwIiwiY2hpbGRyZW4iLCJvcHRzIiwiZXZlcnkiLCJjaGlsZCIsIkFycmF5IiwiaXNBcnJheSIsImFkZCIsInB1c2giLCJpbmRleE9mIiwic3BsaWNlIiwidmlld01hdHJpeCIsIm1hdHJpeCIsIndvcmxkTWF0cml4IiwibXVsTWF0NCIsInRyYXZlcnNlIiwicHJvZ3JhbSIsInVzZSIsInNldFVuaWZvcm1zIiwiaSIsImxlbmd0aCIsInRyYXZlcnNlUmV2ZXJzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztJQUVxQkEsSzs7O0FBQ25CLHVCQUFzQztBQUFBLDZCQUF6QkMsUUFBeUI7QUFBQSxRQUF6QkEsUUFBeUIsaUNBQWQsRUFBYzs7QUFBQSxRQUFQQyxJQUFPOztBQUFBOztBQUNwQ0QsYUFBU0UsS0FBVCxDQUFlO0FBQUEsYUFBUyxzQkFBT0MsbUNBQVAsQ0FBVDtBQUFBLEtBQWY7O0FBRG9DLDhHQUU5QkYsSUFGOEI7O0FBR3BDLFVBQUtELFFBQUwsR0FBZ0JBLFFBQWhCO0FBSG9DO0FBSXJDOztBQUVEOzs7OzswQkFDaUI7QUFBQSx3Q0FBVkEsUUFBVTtBQUFWQSxnQkFBVTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNmLDZCQUFvQkEsUUFBcEIsOEhBQThCO0FBQUEsY0FBbkJHLEtBQW1COztBQUM1QixjQUFJQyxNQUFNQyxPQUFOLENBQWNGLEtBQWQsQ0FBSixFQUEwQjtBQUN4QixpQkFBS0csR0FBTCxnQ0FBWUgsS0FBWjtBQUNELFdBRkQsTUFFTztBQUNMLGlCQUFLSCxRQUFMLENBQWNPLElBQWQsQ0FBbUJKLEtBQW5CO0FBQ0Q7QUFDRjtBQVBjO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBUWYsYUFBTyxJQUFQO0FBQ0Q7OzsyQkFFTUEsSyxFQUFPO0FBQ1osVUFBTUgsV0FBVyxLQUFLQSxRQUF0QjtBQUNBLFVBQU1RLFVBQVVSLFNBQVNRLE9BQVQsQ0FBaUJMLEtBQWpCLENBQWhCO0FBQ0EsVUFBSUssVUFBVSxDQUFDLENBQWYsRUFBa0I7QUFDaEJSLGlCQUFTUyxNQUFULENBQWdCRCxPQUFoQixFQUF5QixDQUF6QjtBQUNEO0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7OztnQ0FFVztBQUNWLFdBQUtSLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQSxhQUFPLElBQVA7QUFDRDs7OztzRkFFc0MsRTs7bUNBQTNCVSxVO1VBQUFBLFUsb0NBQWEsc0I7Ozs7Ozs7Ozs7OzsyQkFDSCxLQUFLVixROzs7Ozs7OztBQUFkRyxtQjtBQUNGUSxvQixHQUFVUixLLENBQVZRLE07QUFDREMseUIsR0FBY0YsV0FBV0csT0FBWCxDQUFtQkYsTUFBbkIsQzs7b0JBQ2hCUixpQkFBaUJKLEs7Ozs7OzRDQUNaSSxNQUFNVyxRQUFOLENBQWUsRUFBQ0gsY0FBRCxFQUFTQyx3QkFBVCxFQUFmLEM7Ozs7Ozs7QUFFUCxrQkFBSVQsTUFBTVksT0FBVixFQUFtQjtBQUNqQlosc0JBQU1ZLE9BQU4sQ0FBY0MsR0FBZDtBQUNBYixzQkFBTVksT0FBTixDQUFjRSxXQUFkLENBQTBCLEVBQUNMLHdCQUFELEVBQTFCO0FBQ0Q7O3FCQUNLVCxLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFLT08sVSxTQUFBQSxVOzs7Ozs7QUFDUlEsZSxHQUFJLEtBQUtsQixRQUFMLENBQWNtQixNQUFkLEdBQXVCLEM7OztvQkFBR0QsS0FBSyxDOzs7OztBQUNwQ2YsbUIsR0FBUSxLQUFLSCxRQUFMLENBQWNrQixDQUFkLEM7QUFDUFAsb0IsR0FBVVIsSyxDQUFWUSxNO0FBQ0RDLHlCLEdBQWNGLFdBQVdHLE9BQVgsQ0FBbUJGLE1BQW5CLEM7O29CQUNoQlIsaUJBQWlCSixLOzs7Ozs2Q0FDWkksTUFBTWlCLGVBQU4sQ0FBc0IsRUFBQ1QsY0FBRCxFQUFTQyx3QkFBVCxFQUF0QixDOzs7Ozs7O0FBRVAsa0JBQUlULE1BQU1ZLE9BQVYsRUFBbUI7QUFDakJaLHNCQUFNWSxPQUFOLENBQWNDLEdBQWQ7QUFDQWIsc0JBQU1ZLE9BQU4sQ0FBY0UsV0FBZCxDQUEwQixFQUFDTCx3QkFBRCxFQUExQjtBQUNEOztxQkFDS1QsSzs7O0FBWHFDLGdCQUFFZSxDOzs7Ozs7Ozs7Ozs7Ozs7O2tCQWxEaENuQixLIiwiZmlsZSI6Imdyb3VwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9iamVjdDNEIGZyb20gJy4vb2JqZWN0LTNkJztcbmltcG9ydCB7TWF0NH0gZnJvbSAnLi4vZGVwcmVjYXRlZCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdyb3VwIGV4dGVuZHMgT2JqZWN0M0Qge1xuICBjb25zdHJ1Y3Rvcih7Y2hpbGRyZW4gPSBbXSwgLi4ub3B0c30pIHtcbiAgICBjaGlsZHJlbi5ldmVyeShjaGlsZCA9PiBhc3NlcnQoY2hpbGQgaW5zdGFuY2VvZiBPYmplY3QzRCkpO1xuICAgIHN1cGVyKG9wdHMpO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfVxuXG4gIC8vIFVucGFja3MgYXJyYXlzIGFuZCBuZXN0ZWQgYXJyYXlzIG9mIGNoaWxkcmVuXG4gIGFkZCguLi5jaGlsZHJlbikge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGNoaWxkKSkge1xuICAgICAgICB0aGlzLmFkZCguLi5jaGlsZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZShjaGlsZCkge1xuICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBjb25zdCBpbmRleE9mID0gY2hpbGRyZW4uaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKGluZGV4T2YgPiAtMSkge1xuICAgICAgY2hpbGRyZW4uc3BsaWNlKGluZGV4T2YsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUFsbCgpIHtcbiAgICB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAqIHRyYXZlcnNlKHt2aWV3TWF0cml4ID0gbmV3IE1hdDQoKX0gPSB7fSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY29uc3Qge21hdHJpeH0gPSBjaGlsZDtcbiAgICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICB5aWVsZCogY2hpbGQudHJhdmVyc2Uoe21hdHJpeCwgd29ybGRNYXRyaXh9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjaGlsZC5wcm9ncmFtKSB7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS51c2UoKTtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnNldFVuaWZvcm1zKHt3b3JsZE1hdHJpeH0pO1xuICAgICAgICB9XG4gICAgICAgIHlpZWxkIGNoaWxkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICogdHJhdmVyc2VSZXZlcnNlKHt2aWV3TWF0cml4fSkge1xuICAgIGZvciAobGV0IGkgPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICBjb25zdCBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XG4gICAgICBjb25zdCB7bWF0cml4fSA9IGNoaWxkO1xuICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSB2aWV3TWF0cml4Lm11bE1hdDQobWF0cml4KTtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEdyb3VwKSB7XG4gICAgICAgIHlpZWxkKiBjaGlsZC50cmF2ZXJzZVJldmVyc2Uoe21hdHJpeCwgd29ybGRNYXRyaXh9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjaGlsZC5wcm9ncmFtKSB7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS51c2UoKTtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnNldFVuaWZvcm1zKHt3b3JsZE1hdHJpeH0pO1xuICAgICAgICB9XG4gICAgICAgIHlpZWxkIGNoaWxkO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19