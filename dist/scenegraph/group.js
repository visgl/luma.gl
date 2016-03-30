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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL2dyb3VwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFJcUI7OztBQUNuQixXQURtQixLQUNuQixPQUFzQzs2QkFBekIsU0FBeUI7UUFBekIseUNBQVcsbUJBQWM7O1FBQVAsb0RBQU87OzBCQURuQixPQUNtQjs7QUFDcEMsYUFBUyxLQUFULENBQWU7YUFBUyxzQkFBTyxtQ0FBUDtLQUFULENBQWYsQ0FEb0M7O3VFQURuQixrQkFHWCxPQUY4Qjs7QUFHcEMsVUFBSyxRQUFMLEdBQWdCLFFBQWhCLENBSG9DOztHQUF0Qzs7ZUFEbUI7OzBCQU9GO3dDQUFWOztPQUFVOzs7Ozs7O0FBQ2YsNkJBQW9CLGtDQUFwQixvR0FBOEI7Y0FBbkIsb0JBQW1COzs7QUFFNUIsZ0JBQU0sRUFBTixHQUFXLE1BQU0sRUFBTixJQUFZLGlCQUFaLENBRmlCO0FBRzVCLGVBQUssUUFBTCxDQUFjLElBQWQsQ0FBbUIsS0FBbkI7O0FBSDRCLGNBSzVCLENBQUssYUFBTCxDQUFtQixLQUFuQixFQUw0QjtTQUE5Qjs7Ozs7Ozs7Ozs7Ozs7T0FEZTs7QUFRZixhQUFPLElBQVAsQ0FSZTs7OzsyQkFXVixPQUFPO0FBQ1osVUFBTSxXQUFXLEtBQUssUUFBTCxDQURMO0FBRVosVUFBTSxVQUFVLFNBQVMsT0FBVCxDQUFpQixLQUFqQixDQUFWLENBRk07QUFHWixVQUFJLFVBQVUsQ0FBQyxDQUFELEVBQUk7QUFDaEIsaUJBQVMsTUFBVCxDQUFnQixPQUFoQixFQUF5QixDQUF6QixFQURnQjtPQUFsQjtBQUdBLGFBQU8sSUFBUCxDQU5ZOzs7O2dDQVNGO0FBQ1YsV0FBSyxRQUFMLEdBQWdCLEVBQWhCLENBRFU7QUFFVixhQUFPLElBQVAsQ0FGVTs7Ozs7VUFLRDs7K0ZBQ0UsT0FDRixRQUNEOzs7Ozs7Ozs7OzJCQUZZLEtBQUssUUFBTDs7Ozs7Ozs7QUFBVDtBQUNGLHVCQUFVLE1BQVY7QUFDRCw0QkFBYyxXQUFXLE9BQVgsQ0FBbUIsTUFBbkI7O29CQUNoQixpQkFBaUIsS0FBakI7Ozs7OzRDQUNLLE1BQU0sUUFBTixDQUFlLEVBQUMsY0FBRCxFQUFTLHdCQUFULEVBQWY7Ozs7Ozs7QUFFUCxrQkFBSSxNQUFNLE9BQU4sRUFBZTtBQUNqQixzQkFBTSxPQUFOLENBQWMsR0FBZCxHQURpQjtBQUVqQixzQkFBTSxPQUFOLENBQWMsV0FBZCxDQUEwQixFQUFDLHdCQUFELEVBQTFCLEVBRmlCO2VBQW5COztxQkFJTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBS007O1VBQ1AsR0FDRCxRQUNDLFNBQ0Q7Ozs7OztBQUhDLGtCQUFJLEtBQUssUUFBTCxDQUFjLE1BQWQsR0FBdUIsQ0FBdkI7OztvQkFBMEIsS0FBSyxDQUFMOzs7OztBQUMvQix1QkFBUSxLQUFLLFFBQUwsQ0FBYyxDQUFkO0FBQ1Asd0JBQVUsT0FBVjtBQUNELDZCQUFjLFdBQVcsT0FBWCxDQUFtQixPQUFuQjs7b0JBQ2hCLGtCQUFpQixLQUFqQjs7Ozs7NkNBQ0ssT0FBTSxlQUFOLENBQXNCLEVBQUMsZUFBRCxFQUFTLHlCQUFULEVBQXRCOzs7Ozs7O0FBRVAsa0JBQUksT0FBTSxPQUFOLEVBQWU7QUFDakIsdUJBQU0sT0FBTixDQUFjLEdBQWQsR0FEaUI7QUFFakIsdUJBQU0sT0FBTixDQUFjLFdBQWQsQ0FBMEIsRUFBQyx5QkFBRCxFQUExQixFQUZpQjtlQUFuQjs7cUJBSU07OztBQVhxQyxnQkFBRSxDQUFGOzs7Ozs7Ozs7Ozs7O1NBakQ5QiIsImZpbGUiOiJncm91cC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPYmplY3QzRCBmcm9tICcuL29iamVjdC0zZCc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcm91cCBleHRlbmRzIE9iamVjdDNEIHtcbiAgY29uc3RydWN0b3Ioe2NoaWxkcmVuID0gW10sIC4uLm9wdHN9KSB7XG4gICAgY2hpbGRyZW4uZXZlcnkoY2hpbGQgPT4gYXNzZXJ0KGNoaWxkIGluc3RhbmNlb2YgT2JqZWN0M0QpKTtcbiAgICBzdXBlcihvcHRzKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBhZGQoLi4uY2hpbGRyZW4pIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAvLyBHZW5lcmF0ZSB1bmlxdWUgaWQgZm9yIGNoaWxkXG4gICAgICBjaGlsZC5pZCA9IGNoaWxkLmlkIHx8IHVpZCgpO1xuICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgIC8vIENyZWF0ZSBhbmQgbG9hZCBCdWZmZXJzXG4gICAgICB0aGlzLmRlZmluZUJ1ZmZlcnMoY2hpbGQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZShjaGlsZCkge1xuICAgIGNvbnN0IGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBjb25zdCBpbmRleE9mID0gY2hpbGRyZW4uaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKGluZGV4T2YgPiAtMSkge1xuICAgICAgY2hpbGRyZW4uc3BsaWNlKGluZGV4T2YsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUFsbCgpIHtcbiAgICB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAqdHJhdmVyc2Uoe3ZpZXdNYXRyaXh9KSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCB7bWF0cml4fSA9IGNoaWxkO1xuICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSB2aWV3TWF0cml4Lm11bE1hdDQobWF0cml4KTtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEdyb3VwKSB7XG4gICAgICAgIHlpZWxkKiBjaGlsZC50cmF2ZXJzZSh7bWF0cml4LCB3b3JsZE1hdHJpeH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNoaWxkLnByb2dyYW0pIHtcbiAgICAgICAgICBjaGlsZC5wcm9ncmFtLnVzZSgpO1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0uc2V0VW5pZm9ybXMoe3dvcmxkTWF0cml4fSk7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgY2hpbGQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgKnRyYXZlcnNlUmV2ZXJzZSh7dmlld01hdHJpeH0pIHtcbiAgICBmb3IgKGxldCBpID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgY29uc3Qge21hdHJpeH0gPSBjaGlsZDtcbiAgICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBHcm91cCkge1xuICAgICAgICB5aWVsZCogY2hpbGQudHJhdmVyc2VSZXZlcnNlKHttYXRyaXgsIHdvcmxkTWF0cml4fSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2hpbGQucHJvZ3JhbSkge1xuICAgICAgICAgIGNoaWxkLnByb2dyYW0udXNlKCk7XG4gICAgICAgICAgY2hpbGQucHJvZ3JhbS5zZXRVbmlmb3Jtcyh7d29ybGRNYXRyaXh9KTtcbiAgICAgICAgfVxuICAgICAgICB5aWVsZCBjaGlsZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==