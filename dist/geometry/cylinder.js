'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CylinderGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _truncatedCone = require('./truncated-cone');

var _model = require('../core/model');

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9jeWxpbmRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7SUFFYSxnQixXQUFBLGdCOzs7QUFDWCw4QkFBd0M7QUFBQSxxRUFBSixFQUFJOztBQUFBLDJCQUEzQixNQUEyQjtBQUFBLFFBQTNCLE1BQTJCLCtCQUFsQixDQUFrQjs7QUFBQSxRQUFaLElBQVk7O0FBQUE7O0FBQUEsNEdBRWpDLElBRmlDO0FBR3BDLG9CQUFjLE1BSHNCO0FBSXBDLGlCQUFXO0FBSnlCO0FBTXZDOzs7OztJQUdrQixROzs7QUFDbkIsb0JBQVksSUFBWixFQUFrQjtBQUFBOztBQUFBLG9HQUVYLElBRlc7QUFHZCxnQkFBVSxJQUFJLGdCQUFKLENBQXFCLElBQXJCO0FBSEk7QUFLakI7Ozs7O2tCQU5rQixRIiwiZmlsZSI6ImN5bGluZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUcnVuY2F0ZWRDb25lR2VvbWV0cnl9IGZyb20gJy4vdHJ1bmNhdGVkLWNvbmUnO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL2NvcmUvbW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgQ3lsaW5kZXJHZW9tZXRyeSBleHRlbmRzIFRydW5jYXRlZENvbmVHZW9tZXRyeSB7XG4gIGNvbnN0cnVjdG9yKHtyYWRpdXMgPSAxLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGJvdHRvbVJhZGl1czogcmFkaXVzLFxuICAgICAgdG9wUmFkaXVzOiByYWRpdXNcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDeWxpbmRlciBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBnZW9tZXRyeTogbmV3IEN5bGluZGVyR2VvbWV0cnkob3B0cylcbiAgICB9KTtcbiAgfVxufVxuIl19