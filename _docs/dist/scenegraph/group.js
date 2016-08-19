'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object3d = require('./object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _math = require('../math');

var _utils = require('../utils');

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

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Group).call(this, opts));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL2dyb3VwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFcUIsSzs7O0FBQ25CLHVCQUFzQztBQUFBLDZCQUF6QixRQUF5QjtBQUFBLFFBQXpCLFFBQXlCLGlDQUFkLEVBQWM7O0FBQUEsUUFBUCxJQUFPOztBQUFBOztBQUNwQyxhQUFTLEtBQVQsQ0FBZTtBQUFBLGFBQVMsc0JBQU8sbUNBQVAsQ0FBVDtBQUFBLEtBQWY7O0FBRG9DLHlGQUU5QixJQUY4Qjs7QUFHcEMsVUFBSyxRQUFMLEdBQWdCLFFBQWhCO0FBSG9DO0FBSXJDOztBQUVEOzs7OzswQkFDaUI7QUFBQSx3Q0FBVixRQUFVO0FBQVYsZ0JBQVU7QUFBQTs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDZiw2QkFBb0IsUUFBcEIsOEhBQThCO0FBQUEsY0FBbkIsS0FBbUI7O0FBQzVCLGNBQUksTUFBTSxPQUFOLENBQWMsS0FBZCxDQUFKLEVBQTBCO0FBQ3hCLGlCQUFLLEdBQUwsZ0NBQVksS0FBWjtBQUNELFdBRkQsTUFFTztBQUNMLGlCQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLEtBQW5CO0FBQ0Q7QUFDRjtBQVBjO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBUWYsYUFBTyxJQUFQO0FBQ0Q7OzsyQkFFTSxLLEVBQU87QUFDWixVQUFNLFdBQVcsS0FBSyxRQUF0QjtBQUNBLFVBQU0sVUFBVSxTQUFTLE9BQVQsQ0FBaUIsS0FBakIsQ0FBaEI7QUFDQSxVQUFJLFVBQVUsQ0FBQyxDQUFmLEVBQWtCO0FBQ2hCLGlCQUFTLE1BQVQsQ0FBZ0IsT0FBaEIsRUFBeUIsQ0FBekI7QUFDRDtBQUNELGFBQU8sSUFBUDtBQUNEOzs7Z0NBRVc7QUFDVixXQUFLLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozt3RUFFc0MsRTs7bUNBQTNCLFU7VUFBQSxVLG9DQUFhLGdCOzs7Ozs7Ozs7Ozs7MkJBQ0gsS0FBSyxROzs7Ozs7OztBQUFkLG1CO0FBQ0Ysb0IsR0FBVSxLLENBQVYsTTtBQUNELHlCLEdBQWMsV0FBVyxPQUFYLENBQW1CLE1BQW5CLEM7O29CQUNoQixpQkFBaUIsSzs7Ozs7NENBQ1osTUFBTSxRQUFOLENBQWUsRUFBQyxjQUFELEVBQVMsd0JBQVQsRUFBZixDOzs7Ozs7O0FBRVAsa0JBQUksTUFBTSxPQUFWLEVBQW1CO0FBQ2pCLHNCQUFNLE9BQU4sQ0FBYyxHQUFkO0FBQ0Esc0JBQU0sT0FBTixDQUFjLFdBQWQsQ0FBMEIsRUFBQyx3QkFBRCxFQUExQjtBQUNEOztxQkFDSyxLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFLTyxVLFNBQUEsVTs7Ozs7O0FBQ1IsZSxHQUFJLEtBQUssUUFBTCxDQUFjLE1BQWQsR0FBdUIsQzs7O29CQUFHLEtBQUssQzs7Ozs7QUFDcEMsbUIsR0FBUSxLQUFLLFFBQUwsQ0FBYyxDQUFkLEM7QUFDUCxvQixHQUFVLEssQ0FBVixNO0FBQ0QseUIsR0FBYyxXQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQzs7b0JBQ2hCLGlCQUFpQixLOzs7Ozs2Q0FDWixNQUFNLGVBQU4sQ0FBc0IsRUFBQyxjQUFELEVBQVMsd0JBQVQsRUFBdEIsQzs7Ozs7OztBQUVQLGtCQUFJLE1BQU0sT0FBVixFQUFtQjtBQUNqQixzQkFBTSxPQUFOLENBQWMsR0FBZDtBQUNBLHNCQUFNLE9BQU4sQ0FBYyxXQUFkLENBQTBCLEVBQUMsd0JBQUQsRUFBMUI7QUFDRDs7cUJBQ0ssSzs7O0FBWHFDLGdCQUFFLEM7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBbERoQyxLIiwiZmlsZSI6Imdyb3VwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9iamVjdDNEIGZyb20gJy4vb2JqZWN0LTNkJztcbmltcG9ydCB7TWF0NH0gZnJvbSAnLi4vbWF0aCc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cCBleHRlbmRzIE9iamVjdDNEIHtcbiAgY29uc3RydWN0b3Ioe2NoaWxkcmVuID0gW10sIC4uLm9wdHN9KSB7XG4gICAgY2hpbGRyZW4uZXZlcnkoY2hpbGQgPT4gYXNzZXJ0KGNoaWxkIGluc3RhbmNlb2YgT2JqZWN0M0QpKTtcbiAgICBzdXBlcihvcHRzKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICAvLyBVbnBhY2tzIGFycmF5cyBhbmQgbmVzdGVkIGFycmF5cyBvZiBjaGlsZHJlblxuICBhZGQoLi4uY2hpbGRyZW4pIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShjaGlsZCkpIHtcbiAgICAgICAgdGhpcy5hZGQoLi4uY2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmUoY2hpbGQpIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgY29uc3QgaW5kZXhPZiA9IGNoaWxkcmVuLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChpbmRleE9mID4gLTEpIHtcbiAgICAgIGNoaWxkcmVuLnNwbGljZShpbmRleE9mLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVBbGwoKSB7XG4gICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgKiB0cmF2ZXJzZSh7dmlld01hdHJpeCA9IG5ldyBNYXQ0KCl9ID0ge30pIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IHttYXRyaXh9ID0gY2hpbGQ7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IHZpZXdNYXRyaXgubXVsTWF0NChtYXRyaXgpO1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgeWllbGQqIGNoaWxkLnRyYXZlcnNlKHttYXRyaXgsIHdvcmxkTWF0cml4fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2hpbGQucHJvZ3JhbSkge1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0udXNlKCk7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS5zZXRVbmlmb3Jtcyh7d29ybGRNYXRyaXh9KTtcbiAgICAgICAgfVxuICAgICAgICB5aWVsZCBjaGlsZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAqIHRyYXZlcnNlUmV2ZXJzZSh7dmlld01hdHJpeH0pIHtcbiAgICBmb3IgKGxldCBpID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgY29uc3Qge21hdHJpeH0gPSBjaGlsZDtcbiAgICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICB5aWVsZCogY2hpbGQudHJhdmVyc2VSZXZlcnNlKHttYXRyaXgsIHdvcmxkTWF0cml4fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2hpbGQucHJvZ3JhbSkge1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0udXNlKCk7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS5zZXRVbmlmb3Jtcyh7d29ybGRNYXRyaXh9KTtcbiAgICAgICAgfVxuICAgICAgICB5aWVsZCBjaGlsZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==