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

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Cone).call(this, _extends({
      geometry: new ConeGeometry(opts)
    }, opts)));
  }

  return Cone;
}(_model2.default);

exports.default = Cone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9jb25lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7Ozs7Ozs7OztJQUVhLFksV0FBQSxZOzs7QUFDWCwwQkFBb0Q7QUFBQSxxRUFBSixFQUFJOztBQUFBLDJCQUF2QyxNQUF1QztBQUFBLFFBQXZDLE1BQXVDLCtCQUE5QixDQUE4QjtBQUFBLHdCQUEzQixHQUEyQjtBQUFBLFFBQTNCLEdBQTJCLDRCQUFyQixJQUFxQjs7QUFBQSxRQUFaLElBQVk7O0FBQUE7O0FBQUEsd0dBRTdDLElBRjZDO0FBR2hELGlCQUFXLENBSHFDO0FBSWhELGNBQVEsUUFBUSxHQUFSLENBSndDO0FBS2hELGlCQUFXLFFBQVEsR0FBUixDQUxxQztBQU1oRCxvQkFBYztBQU5rQztBQVFuRDs7Ozs7SUFHa0IsSTs7O0FBQ25CLGtCQUF1QjtBQUFBLFFBQVgsSUFBVyx5REFBSixFQUFJOztBQUFBOztBQUFBO0FBRW5CLGdCQUFVLElBQUksWUFBSixDQUFpQixJQUFqQjtBQUZTLE9BR2hCLElBSGdCO0FBS3RCOzs7OztrQkFOa0IsSSIsImZpbGUiOiJjb25lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtUcnVuY2F0ZWRDb25lR2VvbWV0cnl9IGZyb20gJy4vdHJ1bmNhdGVkLWNvbmUnO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL2NvcmUvbW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgQ29uZUdlb21ldHJ5IGV4dGVuZHMgVHJ1bmNhdGVkQ29uZUdlb21ldHJ5IHtcbiAgY29uc3RydWN0b3Ioe3JhZGl1cyA9IDEsIGNhcCA9IHRydWUsIC4uLm9wdHN9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgdG9wUmFkaXVzOiAwLFxuICAgICAgdG9wQ2FwOiBCb29sZWFuKGNhcCksXG4gICAgICBib3R0b21DYXA6IEJvb2xlYW4oY2FwKSxcbiAgICAgIGJvdHRvbVJhZGl1czogcmFkaXVzXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgZ2VvbWV0cnk6IG5ldyBDb25lR2VvbWV0cnkob3B0cyksXG4gICAgICAuLi5vcHRzXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==