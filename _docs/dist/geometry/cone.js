'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ConeGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _truncatedCone = require('./truncated-cone');

var _model = require('../core/model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConeGeometry = exports.ConeGeometry = function (_TruncatedConeGeometr) {
  _inherits(ConeGeometry, _TruncatedConeGeometr);

  function ConeGeometry() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref$radius = _ref.radius;
    var radius = _ref$radius === undefined ? 1 : _ref$radius;
    var _ref$cap = _ref.cap;
    var cap = _ref$cap === undefined ? true : _ref$cap;

    var opts = _objectWithoutProperties(_ref, ['radius', 'cap']);

    _classCallCheck(this, ConeGeometry);

    return _possibleConstructorReturn(this, (ConeGeometry.__proto__ || Object.getPrototypeOf(ConeGeometry)).call(this, _extends({}, opts, {
      topRadius: 0,
      topCap: Boolean(cap),
      bottomCap: Boolean(cap),
      bottomRadius: radius
    })));
  }

  return ConeGeometry;
}(_truncatedCone.TruncatedConeGeometry);

var Cone = function (_Model) {
  _inherits(Cone, _Model);

  function Cone() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Cone);

    return _possibleConstructorReturn(this, (Cone.__proto__ || Object.getPrototypeOf(Cone)).call(this, _extends({
      geometry: new ConeGeometry(opts)
    }, opts)));
  }

  return Cone;
}(_model2.default);

exports.default = Cone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9jb25lLmpzIl0sIm5hbWVzIjpbIkNvbmVHZW9tZXRyeSIsInJhZGl1cyIsImNhcCIsIm9wdHMiLCJ0b3BSYWRpdXMiLCJ0b3BDYXAiLCJCb29sZWFuIiwiYm90dG9tQ2FwIiwiYm90dG9tUmFkaXVzIiwiQ29uZSIsImdlb21ldHJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7SUFFYUEsWSxXQUFBQSxZOzs7QUFDWCwwQkFBb0Q7QUFBQSxtRkFBSixFQUFJOztBQUFBLDJCQUF2Q0MsTUFBdUM7QUFBQSxRQUF2Q0EsTUFBdUMsK0JBQTlCLENBQThCO0FBQUEsd0JBQTNCQyxHQUEyQjtBQUFBLFFBQTNCQSxHQUEyQiw0QkFBckIsSUFBcUI7O0FBQUEsUUFBWkMsSUFBWTs7QUFBQTs7QUFBQSxvSUFFN0NBLElBRjZDO0FBR2hEQyxpQkFBVyxDQUhxQztBQUloREMsY0FBUUMsUUFBUUosR0FBUixDQUp3QztBQUtoREssaUJBQVdELFFBQVFKLEdBQVIsQ0FMcUM7QUFNaERNLG9CQUFjUDtBQU5rQztBQVFuRDs7Ozs7SUFHa0JRLEk7OztBQUNuQixrQkFBdUI7QUFBQSxRQUFYTixJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQUE7QUFFbkJPLGdCQUFVLElBQUlWLFlBQUosQ0FBaUJHLElBQWpCO0FBRlMsT0FHaEJBLElBSGdCO0FBS3RCOzs7OztrQkFOa0JNLEkiLCJmaWxlIjoiY29uZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VHJ1bmNhdGVkQ29uZUdlb21ldHJ5fSBmcm9tICcuL3RydW5jYXRlZC1jb25lJztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9jb3JlL21vZGVsJztcblxuZXhwb3J0IGNsYXNzIENvbmVHZW9tZXRyeSBleHRlbmRzIFRydW5jYXRlZENvbmVHZW9tZXRyeSB7XG4gIGNvbnN0cnVjdG9yKHtyYWRpdXMgPSAxLCBjYXAgPSB0cnVlLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIHRvcFJhZGl1czogMCxcbiAgICAgIHRvcENhcDogQm9vbGVhbihjYXApLFxuICAgICAgYm90dG9tQ2FwOiBCb29sZWFuKGNhcCksXG4gICAgICBib3R0b21SYWRpdXM6IHJhZGl1c1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbmUgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIGdlb21ldHJ5OiBuZXcgQ29uZUdlb21ldHJ5KG9wdHMpLFxuICAgICAgLi4ub3B0c1xuICAgIH0pO1xuICB9XG59XG4iXX0=