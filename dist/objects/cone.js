'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConeGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _truncatedCone = require('./truncated-cone');

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConeGeometry = exports.ConeGeometry = function (_TruncatedConeGeometr) {
  _inherits(ConeGeometry, _TruncatedConeGeometr);

  function ConeGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$radius = _ref.radius;
    var radius = _ref$radius === undefined ? 1 : _ref$radius;
    var _ref$cap = _ref.cap;
    var cap = _ref$cap === undefined ? true : _ref$cap;

    var opts = _objectWithoutProperties(_ref, ['radius', 'cap']);

    _classCallCheck(this, ConeGeometry);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ConeGeometry).call(this, _extends({}, opts, {
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
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Cone);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Cone).call(this, _extends({ geometry: new ConeGeometry(opts) }, opts)));
  }

  return Cone;
}(_model2.default);

exports.default = Cone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL2NvbmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0lBRWE7OztBQUNYLFdBRFcsWUFDWCxHQUFvRDtxRUFBSixrQkFBSTs7MkJBQXZDLE9BQXVDO1FBQXZDLHFDQUFTLGdCQUE4Qjt3QkFBM0IsSUFBMkI7UUFBM0IsK0JBQU0sZ0JBQXFCOztRQUFaLHlEQUFZOzswQkFEekMsY0FDeUM7O2tFQUR6QyxzQ0FHSjtBQUNILGlCQUFXLENBQVg7QUFDQSxjQUFRLFFBQVEsR0FBUixDQUFSO0FBQ0EsaUJBQVcsUUFBUSxHQUFSLENBQVg7QUFDQSxvQkFBYyxNQUFkO1NBTmdEO0dBQXBEOztTQURXOzs7SUFZUTs7O0FBQ25CLFdBRG1CLElBQ25CLEdBQXVCO1FBQVgsNkRBQU8sa0JBQUk7OzBCQURKLE1BQ0k7O2tFQURKLDRCQUVWLFVBQVUsSUFBSSxZQUFKLENBQWlCLElBQWpCLENBQVYsSUFBcUMsUUFEdkI7R0FBdkI7O1NBRG1CIiwiZmlsZSI6ImNvbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1RydW5jYXRlZENvbmVHZW9tZXRyeX0gZnJvbSAnLi90cnVuY2F0ZWQtY29uZSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vbW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgQ29uZUdlb21ldHJ5IGV4dGVuZHMgVHJ1bmNhdGVkQ29uZUdlb21ldHJ5IHtcbiAgY29uc3RydWN0b3Ioe3JhZGl1cyA9IDEsIGNhcCA9IHRydWUsIC4uLm9wdHN9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgdG9wUmFkaXVzOiAwLFxuICAgICAgdG9wQ2FwOiBCb29sZWFuKGNhcCksXG4gICAgICBib3R0b21DYXA6IEJvb2xlYW4oY2FwKSxcbiAgICAgIGJvdHRvbVJhZGl1czogcmFkaXVzXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIoe2dlb21ldHJ5OiBuZXcgQ29uZUdlb21ldHJ5KG9wdHMpLCAuLi5vcHRzfSk7XG4gIH1cbn1cbiJdfQ==