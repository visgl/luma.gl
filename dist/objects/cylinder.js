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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL2N5bGluZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7Ozs7Ozs7OztJQUVhOzs7QUFDWCxXQURXLGdCQUNYLEdBQXdDO3FFQUFKLGtCQUFJOzsyQkFBM0IsT0FBMkI7UUFBM0IscUNBQVMsZ0JBQWtCOztRQUFaLGtEQUFZOzswQkFEN0Isa0JBQzZCOztrRUFEN0IsMENBR0o7QUFDSCxvQkFBYyxNQUFkO0FBQ0EsaUJBQVcsTUFBWDtTQUpvQztHQUF4Qzs7U0FEVzs7O0lBVVE7OztBQUNuQixXQURtQixRQUNuQixDQUFZLElBQVosRUFBa0I7MEJBREMsVUFDRDs7a0VBREMsZ0NBRVYsVUFBVSxJQUFJLGdCQUFKLENBQXFCLElBQXJCLENBQVYsSUFBeUMsUUFEaEM7R0FBbEI7O1NBRG1CIiwiZmlsZSI6ImN5bGluZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUcnVuY2F0ZWRDb25lR2VvbWV0cnl9IGZyb20gJy4vdHJ1bmNhdGVkLWNvbmUnO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL21vZGVsJztcblxuZXhwb3J0IGNsYXNzIEN5bGluZGVyR2VvbWV0cnkgZXh0ZW5kcyBUcnVuY2F0ZWRDb25lR2VvbWV0cnkge1xuICBjb25zdHJ1Y3Rvcih7cmFkaXVzID0gMSwgLi4ub3B0c30gPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBib3R0b21SYWRpdXM6IHJhZGl1cyxcbiAgICAgIHRvcFJhZGl1czogcmFkaXVzXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3lsaW5kZXIgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICBzdXBlcih7Z2VvbWV0cnk6IG5ldyBDeWxpbmRlckdlb21ldHJ5KG9wdHMpLCAuLi5vcHRzfSk7XG4gIH1cbn1cbiJdfQ==