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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL2dyb3VwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7SUFFcUI7OztBQUNuQixXQURtQixLQUNuQixPQUFzQzs2QkFBekIsU0FBeUI7UUFBekIseUNBQVcsbUJBQWM7O1FBQVAsb0RBQU87OzBCQURuQixPQUNtQjs7QUFDcEMsYUFBUyxLQUFULENBQWU7YUFBUyxzQkFBTyxtQ0FBUDtLQUFULENBQWYsQ0FEb0M7O3VFQURuQixrQkFHWCxPQUY4Qjs7QUFHcEMsVUFBSyxRQUFMLEdBQWdCLFFBQWhCLENBSG9DOztHQUF0Qzs7ZUFEbUI7OzBCQU9GO3dDQUFWOztPQUFVOzs7Ozs7O0FBQ2YsNkJBQW9CLGtDQUFwQixvR0FBOEI7Y0FBbkIsb0JBQW1COzs7QUFFNUIsZ0JBQU0sRUFBTixHQUFXLE1BQU0sRUFBTixJQUFZLGlCQUFaLENBRmlCO0FBRzVCLGVBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsS0FBbkI7O0FBSDRCLGNBSzVCLENBQUssYUFBTCxDQUFtQixLQUFuQixFQUw0QjtTQUE5Qjs7Ozs7Ozs7Ozs7Ozs7T0FEZTs7QUFRZixhQUFPLElBQVAsQ0FSZTs7OzsyQkFXVixPQUFPO0FBQ1osVUFBTSxXQUFXLEtBQUssUUFBTCxDQURMO0FBRVosVUFBTSxVQUFVLFNBQVMsT0FBVCxDQUFpQixLQUFqQixDQUFWLENBRk07QUFHWixVQUFJLFVBQVUsQ0FBQyxDQUFELEVBQUk7QUFDaEIsaUJBQVMsTUFBVCxDQUFnQixPQUFoQixFQUF5QixDQUF6QixFQURnQjtPQUFsQjtBQUdBLGFBQU8sSUFBUCxDQU5ZOzs7O2dDQVNGO0FBQ1YsV0FBSyxRQUFMLEdBQWdCLEVBQWhCLENBRFU7QUFFVixhQUFPLElBQVAsQ0FGVTs7Ozs7VUFLRDs7K0ZBQ0UsT0FDRixRQUNEOzs7Ozs7Ozs7OzJCQUZZLEtBQUssUUFBTDs7Ozs7Ozs7QUFBVDtBQUNGLHVCQUFVLE1BQVY7QUFDRCw0QkFBYyxXQUFXLE9BQVgsQ0FBbUIsTUFBbkI7O29CQUNoQixpQkFBaUIsS0FBakI7Ozs7OzRDQUNLLE1BQU0sUUFBTixDQUFlLEVBQUMsY0FBRCxFQUFTLHdCQUFULEVBQWY7Ozs7Ozs7QUFFUCxrQkFBSSxNQUFNLE9BQU4sRUFBZTtBQUNqQixzQkFBTSxPQUFOLENBQWMsR0FBZCxHQURpQjtBQUVqQixzQkFBTSxPQUFOLENBQWMsV0FBZCxDQUEwQixFQUFDLHdCQUFELEVBQTFCLEVBRmlCO2VBQW5COztxQkFJTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBS007VUFDUCxHQUNELE9BQ0MsUUFDRDs7Ozs7QUFIQyxrQkFBSSxLQUFLLFFBQUwsQ0FBYyxNQUFkLEdBQXVCLENBQXZCOzs7b0JBQTBCLEtBQUssQ0FBTDs7Ozs7QUFDL0Isc0JBQVEsS0FBSyxRQUFMLENBQWMsQ0FBZDtBQUNQLHVCQUFVLE1BQVY7QUFDRCw0QkFBYyxXQUFXLE9BQVgsQ0FBbUIsTUFBbkI7O29CQUNoQixpQkFBaUIsS0FBakI7Ozs7OzZDQUNLLE1BQU0sZUFBTixDQUFzQixFQUFDLGNBQUQsRUFBUyx3QkFBVCxFQUF0Qjs7Ozs7OztBQUVQLGtCQUFJLE1BQU0sT0FBTixFQUFlO0FBQ2pCLHNCQUFNLE9BQU4sQ0FBYyxHQUFkLEdBRGlCO0FBRWpCLHNCQUFNLE9BQU4sQ0FBYyxXQUFkLENBQTBCLEVBQUMsd0JBQUQsRUFBMUIsRUFGaUI7ZUFBbkI7O3FCQUlNOzs7QUFYcUMsZ0JBQUUsQ0FBRjs7Ozs7Ozs7Ozs7OztTQWpEOUIiLCJmaWxlIjoiZ3JvdXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT2JqZWN0M0QgZnJvbSAnLi9vYmplY3QtM2QnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3JvdXAgZXh0ZW5kcyBPYmplY3QzRCB7XG4gIGNvbnN0cnVjdG9yKHtjaGlsZHJlbiA9IFtdLCAuLi5vcHRzfSkge1xuICAgIGNoaWxkcmVuLmV2ZXJ5KGNoaWxkID0+IGFzc2VydChjaGlsZCBpbnN0YW5jZW9mIE9iamVjdDNEKSk7XG4gICAgc3VwZXIob3B0cyk7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9XG5cbiAgYWRkKC4uLmNoaWxkcmVuKSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgLy8gR2VuZXJhdGUgdW5pcXVlIGlkIGZvciBjaGlsZFxuICAgICAgY2hpbGQuaWQgPSBjaGlsZC5pZCB8fCB1aWQoKTtcbiAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAvLyBDcmVhdGUgYW5kIGxvYWQgQnVmZmVyc1xuICAgICAgdGhpcy5kZWZpbmVCdWZmZXJzKGNoaWxkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmUoY2hpbGQpIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgY29uc3QgaW5kZXhPZiA9IGNoaWxkcmVuLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChpbmRleE9mID4gLTEpIHtcbiAgICAgIGNoaWxkcmVuLnNwbGljZShpbmRleE9mLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVBbGwoKSB7XG4gICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgKnRyYXZlcnNlKHt2aWV3TWF0cml4fSkge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY29uc3Qge21hdHJpeH0gPSBjaGlsZDtcbiAgICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICB5aWVsZCogY2hpbGQudHJhdmVyc2Uoe21hdHJpeCwgd29ybGRNYXRyaXh9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjaGlsZC5wcm9ncmFtKSB7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS51c2UoKTtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnNldFVuaWZvcm1zKHt3b3JsZE1hdHJpeH0pO1xuICAgICAgICB9XG4gICAgICAgIHlpZWxkIGNoaWxkO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICp0cmF2ZXJzZVJldmVyc2Uoe3ZpZXdNYXRyaXh9KSB7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIGNvbnN0IGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgIGNvbnN0IHttYXRyaXh9ID0gY2hpbGQ7XG4gICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IHZpZXdNYXRyaXgubXVsTWF0NChtYXRyaXgpO1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgR3JvdXApIHtcbiAgICAgICAgeWllbGQqIGNoaWxkLnRyYXZlcnNlUmV2ZXJzZSh7bWF0cml4LCB3b3JsZE1hdHJpeH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNoaWxkLnByb2dyYW0pIHtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnVzZSgpO1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0uc2V0VW5pZm9ybXMoe3dvcmxkTWF0cml4fSk7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgY2hpbGQ7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=