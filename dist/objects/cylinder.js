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

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Cylinder).call(this, _extends({ geometry: new CylinderGeometry(opts) }, opts)));
  }

  return Cylinder;
}(_model2.default);

exports.default = Cylinder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL2N5bGluZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHYTs7O0FBQ1gsV0FEVyxnQkFDWCxHQUF3QztxRUFBSixrQkFBSTs7MkJBQTNCLE9BQTJCO1FBQTNCLHFDQUFTLGdCQUFrQjs7UUFBWixrREFBWTs7MEJBRDdCLGtCQUM2Qjs7a0VBRDdCLDBDQUdKO0FBQ0gsb0JBQWMsTUFBZDtBQUNBLGlCQUFXLE1BQVg7U0FKb0M7R0FBeEM7O1NBRFc7OztJQVVROzs7QUFDbkIsV0FEbUIsUUFDbkIsQ0FBWSxJQUFaLEVBQWtCOzBCQURDLFVBQ0Q7O2tFQURDLGdDQUVWLFVBQVUsSUFBSSxnQkFBSixDQUFxQixJQUFyQixDQUFWLElBQXlDLFFBRGhDO0dBQWxCOztTQURtQiIsImZpbGUiOiJjeWxpbmRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VHJ1bmNhdGVkQ29uZUdlb21ldHJ5fSBmcm9tICcuL3RydW5jYXRlZC1jb25lJztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9tb2RlbCc7XG5cbmV4cG9ydCBjbGFzcyBDeWxpbmRlckdlb21ldHJ5IGV4dGVuZHMgVHJ1bmNhdGVkQ29uZUdlb21ldHJ5IHtcbiAgY29uc3RydWN0b3Ioe3JhZGl1cyA9IDEsIC4uLm9wdHN9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgYm90dG9tUmFkaXVzOiByYWRpdXMsXG4gICAgICB0b3BSYWRpdXM6IHJhZGl1c1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEN5bGluZGVyIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgc3VwZXIoe2dlb21ldHJ5OiBuZXcgQ3lsaW5kZXJHZW9tZXRyeShvcHRzKSwgLi4ub3B0c30pO1xuICB9XG59XG4iXX0=