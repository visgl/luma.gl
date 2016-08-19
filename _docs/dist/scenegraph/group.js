'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object3d = require('./object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _math = require('../math');

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
      var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref2$viewMatrix = _ref2.viewMatrix;
      var viewMatrix = _ref2$viewMatrix === undefined ? new _math.Mat4() : _ref2$viewMatrix;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL2dyb3VwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7SUFFcUIsSzs7O0FBQ25CLHVCQUFzQztBQUFBLDZCQUF6QixRQUF5QjtBQUFBLFFBQXpCLFFBQXlCLGlDQUFkLEVBQWM7O0FBQUEsUUFBUCxJQUFPOztBQUFBOztBQUNwQyxhQUFTLEtBQVQsQ0FBZTtBQUFBLGFBQVMsc0JBQU8sbUNBQVAsQ0FBVDtBQUFBLEtBQWY7O0FBRG9DLHlGQUU5QixJQUY4Qjs7QUFHcEMsVUFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBSG9DO0FBSXJDOzs7OzBCQUVnQjtBQUFBLHdDQUFWLFFBQVU7QUFBVixnQkFBVTtBQUFBOztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNmLDZCQUFvQixRQUFwQiw4SEFBOEI7QUFBQSxjQUFuQixLQUFtQjs7O0FBRTVCLGdCQUFNLEVBQU4sR0FBVyxNQUFNLEVBQU4sSUFBWSxpQkFBdkI7QUFDQSxlQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLEtBQW5CO0FBQ0Q7QUFMYztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQU1mLGFBQU8sSUFBUDtBQUNEOzs7MkJBRU0sSyxFQUFPO0FBQ1osVUFBTSxXQUFXLEtBQUssUUFBdEI7QUFDQSxVQUFNLFVBQVUsU0FBUyxPQUFULENBQWlCLEtBQWpCLENBQWhCO0FBQ0EsVUFBSSxVQUFVLENBQUMsQ0FBZixFQUFrQjtBQUNoQixpQkFBUyxNQUFULENBQWdCLE9BQWhCLEVBQXlCLENBQXpCO0FBQ0Q7QUFDRCxhQUFPLElBQVA7QUFDRDs7O2dDQUVXO0FBQ1YsV0FBSyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs7d0VBRXNDLEU7O21DQUEzQixVO1VBQUEsVSxvQ0FBYSxnQjs7K0ZBQ1osSyxFQUNGLE0sRUFDRCxXOzs7Ozs7Ozs7OzJCQUZZLEtBQUssUTs7Ozs7Ozs7QUFBZCxtQjtBQUNGLG9CLEdBQVUsSyxDQUFWLE07QUFDRCx5QixHQUFjLFdBQVcsT0FBWCxDQUFtQixNQUFuQixDOztvQkFDaEIsaUJBQWlCLEs7Ozs7OzRDQUNaLE1BQU0sUUFBTixDQUFlLEVBQUMsY0FBRCxFQUFTLHdCQUFULEVBQWYsQzs7Ozs7OztBQUVQLGtCQUFJLE1BQU0sT0FBVixFQUFtQjtBQUNqQixzQkFBTSxPQUFOLENBQWMsR0FBZDtBQUNBLHNCQUFNLE9BQU4sQ0FBYyxXQUFkLENBQTBCLEVBQUMsd0JBQUQsRUFBMUI7QUFDRDs7cUJBQ0ssSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBS08sVSxTQUFBLFU7VUFDUixDLEVBQ0QsSyxFQUNDLE0sRUFDRCxXOzs7OztBQUhDLGUsR0FBSSxLQUFLLFFBQUwsQ0FBYyxNQUFkLEdBQXVCLEM7OztvQkFBRyxLQUFLLEM7Ozs7O0FBQ3BDLG1CLEdBQVEsS0FBSyxRQUFMLENBQWMsQ0FBZCxDO0FBQ1Asb0IsR0FBVSxLLENBQVYsTTtBQUNELHlCLEdBQWMsV0FBVyxPQUFYLENBQW1CLE1BQW5CLEM7O29CQUNoQixpQkFBaUIsSzs7Ozs7NkNBQ1osTUFBTSxlQUFOLENBQXNCLEVBQUMsY0FBRCxFQUFTLHdCQUFULEVBQXRCLEM7Ozs7Ozs7QUFFUCxrQkFBSSxNQUFNLE9BQVYsRUFBbUI7QUFDakIsc0JBQU0sT0FBTixDQUFjLEdBQWQ7QUFDQSxzQkFBTSxPQUFOLENBQWMsV0FBZCxDQUEwQixFQUFDLHdCQUFELEVBQTFCO0FBQ0Q7O3FCQUNLLEs7OztBQVhxQyxnQkFBRSxDOzs7Ozs7Ozs7Ozs7Ozs7O2tCQS9DaEMsSyIsImZpbGUiOiJncm91cC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPYmplY3QzRCBmcm9tICcuL29iamVjdC0zZCc7XG5pbXBvcnQge01hdDR9IGZyb20gJy4uL21hdGgnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3JvdXAgZXh0ZW5kcyBPYmplY3QzRCB7XG4gIGNvbnN0cnVjdG9yKHtjaGlsZHJlbiA9IFtdLCAuLi5vcHRzfSkge1xuICAgIGNoaWxkcmVuLmV2ZXJ5KGNoaWxkID0+IGFzc2VydChjaGlsZCBpbnN0YW5jZW9mIE9iamVjdDNEKSk7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9XG5cbiAgYWRkKC4uLmNoaWxkcmVuKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgLy8gR2VuZXJhdGUgdW5pcXVlIGlkIGZvciBjaGlsZFxuICAgICAgY2hpbGQuaWQgPSBjaGlsZC5pZCB8fCB1aWQoKTtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlKGNoaWxkKSB7XG4gICAgY29uc3QgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuICAgIGNvbnN0IGluZGV4T2YgPSBjaGlsZHJlbi5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoaW5kZXhPZiA+IC0xKSB7XG4gICAgICBjaGlsZHJlbi5zcGxpY2UoaW5kZXhPZiwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlQWxsKCkge1xuICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gICogdHJhdmVyc2Uoe3ZpZXdNYXRyaXggPSBuZXcgTWF0NCgpfSA9IHt9KSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCB7bWF0cml4fSA9IGNoaWxkO1xuICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSB2aWV3TWF0cml4Lm11bE1hdDQobWF0cml4KTtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEdyb3VwKSB7XG4gICAgICAgIHlpZWxkKiBjaGlsZC50cmF2ZXJzZSh7bWF0cml4LCB3b3JsZE1hdHJpeH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNoaWxkLnByb2dyYW0pIHtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnVzZSgpO1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0uc2V0VW5pZm9ybXMoe3dvcmxkTWF0cml4fSk7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgY2hpbGQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgKiB0cmF2ZXJzZVJldmVyc2Uoe3ZpZXdNYXRyaXh9KSB7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgIGNvbnN0IHttYXRyaXh9ID0gY2hpbGQ7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IHZpZXdNYXRyaXgubXVsTWF0NChtYXRyaXgpO1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgeWllbGQqIGNoaWxkLnRyYXZlcnNlUmV2ZXJzZSh7bWF0cml4LCB3b3JsZE1hdHJpeH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNoaWxkLnByb2dyYW0pIHtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnVzZSgpO1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0uc2V0VW5pZm9ybXMoe3dvcmxkTWF0cml4fSk7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgY2hpbGQ7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=