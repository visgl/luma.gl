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
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref$radius = _ref.radius;
    var radius = _ref$radius === undefined ? 1 : _ref$radius;

    var opts = _objectWithoutProperties(_ref, ['radius']);

    _classCallCheck(this, CylinderGeometry);

    return _possibleConstructorReturn(this, (CylinderGeometry.__proto__ || Object.getPrototypeOf(CylinderGeometry)).call(this, _extends({}, opts, {
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

    return _possibleConstructorReturn(this, (Cylinder.__proto__ || Object.getPrototypeOf(Cylinder)).call(this, _extends({}, opts, {
      geometry: new CylinderGeometry(opts)
    })));
  }

  return Cylinder;
}(_model2.default);

exports.default = Cylinder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9jeWxpbmRlci5qcyJdLCJuYW1lcyI6WyJDeWxpbmRlckdlb21ldHJ5IiwicmFkaXVzIiwib3B0cyIsImJvdHRvbVJhZGl1cyIsInRvcFJhZGl1cyIsIkN5bGluZGVyIiwiZ2VvbWV0cnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7Ozs7Ozs7OztJQUVhQSxnQixXQUFBQSxnQjs7O0FBQ1gsOEJBQXdDO0FBQUEsbUZBQUosRUFBSTs7QUFBQSwyQkFBM0JDLE1BQTJCO0FBQUEsUUFBM0JBLE1BQTJCLCtCQUFsQixDQUFrQjs7QUFBQSxRQUFaQyxJQUFZOztBQUFBOztBQUFBLDRJQUVqQ0EsSUFGaUM7QUFHcENDLG9CQUFjRixNQUhzQjtBQUlwQ0csaUJBQVdIO0FBSnlCO0FBTXZDOzs7OztJQUdrQkksUTs7O0FBQ25CLG9CQUFZSCxJQUFaLEVBQWtCO0FBQUE7O0FBQUEsNEhBRVhBLElBRlc7QUFHZEksZ0JBQVUsSUFBSU4sZ0JBQUosQ0FBcUJFLElBQXJCO0FBSEk7QUFLakI7Ozs7O2tCQU5rQkcsUSIsImZpbGUiOiJjeWxpbmRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VHJ1bmNhdGVkQ29uZUdlb21ldHJ5fSBmcm9tICcuL3RydW5jYXRlZC1jb25lJztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9jb3JlL21vZGVsJztcblxuZXhwb3J0IGNsYXNzIEN5bGluZGVyR2VvbWV0cnkgZXh0ZW5kcyBUcnVuY2F0ZWRDb25lR2VvbWV0cnkge1xuICBjb25zdHJ1Y3Rvcih7cmFkaXVzID0gMSwgLi4ub3B0c30gPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBib3R0b21SYWRpdXM6IHJhZGl1cyxcbiAgICAgIHRvcFJhZGl1czogcmFkaXVzXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3lsaW5kZXIgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBDeWxpbmRlckdlb21ldHJ5KG9wdHMpXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==