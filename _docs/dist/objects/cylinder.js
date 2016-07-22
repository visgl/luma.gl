'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CylinderGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _truncatedCone = require('./truncated-cone');

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CylinderGeometry = exports.CylinderGeometry = function (_TruncatedConeGeometr) {
  _inherits(CylinderGeometry, _TruncatedConeGeometr);

  function CylinderGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$radius = _ref.radius;
    var radius = _ref$radius === undefined ? 1 : _ref$radius;

    var opts = _objectWithoutProperties(_ref, ['radius']);

    _classCallCheck(this, CylinderGeometry);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(CylinderGeometry).call(this, _extends({}, opts, {
      bottomRadius: radius,
      topRadius: radius
    })));
  }

  return CylinderGeometry;
}(_truncatedCone.TruncatedConeGeometry);

var Cylinder = function (_Model) {
  _inherits(Cylinder, _Model);

  function Cylinder(opts) {
    _classCallCheck(this, Cylinder);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Cylinder).call(this, _extends({}, opts, {
      geometry: new CylinderGeometry(opts)
    })));
  }

  return Cylinder;
}(_model2.default);

exports.default = Cylinder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL2N5bGluZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7Ozs7Ozs7OztJQUVhLGdCLFdBQUEsZ0I7OztBQUNYLDhCQUF3QztBQUFBLHFFQUFKLEVBQUk7O0FBQUEsMkJBQTNCLE1BQTJCO0FBQUEsUUFBM0IsTUFBMkIsK0JBQWxCLENBQWtCOztBQUFBLFFBQVosSUFBWTs7QUFBQTs7QUFBQSw0R0FFakMsSUFGaUM7QUFHcEMsb0JBQWMsTUFIc0I7QUFJcEMsaUJBQVc7QUFKeUI7QUFNdkM7Ozs7O0lBR2tCLFE7OztBQUNuQixvQkFBWSxJQUFaLEVBQWtCO0FBQUE7O0FBQUEsb0dBRVgsSUFGVztBQUdkLGdCQUFVLElBQUksZ0JBQUosQ0FBcUIsSUFBckI7QUFISTtBQUtqQjs7Ozs7a0JBTmtCLFEiLCJmaWxlIjoiY3lsaW5kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1RydW5jYXRlZENvbmVHZW9tZXRyeX0gZnJvbSAnLi90cnVuY2F0ZWQtY29uZSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vbW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgQ3lsaW5kZXJHZW9tZXRyeSBleHRlbmRzIFRydW5jYXRlZENvbmVHZW9tZXRyeSB7XG4gIGNvbnN0cnVjdG9yKHtyYWRpdXMgPSAxLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGJvdHRvbVJhZGl1czogcmFkaXVzLFxuICAgICAgdG9wUmFkaXVzOiByYWRpdXNcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDeWxpbmRlciBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBnZW9tZXRyeTogbmV3IEN5bGluZGVyR2VvbWV0cnkob3B0cylcbiAgICB9KTtcbiAgfVxufVxuIl19