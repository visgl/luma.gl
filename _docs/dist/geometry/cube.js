'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.CubeGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../core/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../core/model');

var _model2 = _interopRequireDefault(_model);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable no-multi-spaces, indent */
var CUBE_INDICES = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23];

var CUBE_POSITIONS = [-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1];

var CUBE_NORMALS = [
// Front face
0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

// Back face
0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

// Top face
0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

// Bottom face
0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

// Right face
1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

// Left face
-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0];

var CUBE_TEX_COORDS = [
// Front face
0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

// Back face
1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

// Top face
0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,

// Bottom face
1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

// Right face
1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

// Left face
0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
/* eslint-enable no-multi-spaces, indent */

var CubeGeometry = exports.CubeGeometry = function (_Geometry) {
  _inherits(CubeGeometry, _Geometry);

  function CubeGeometry() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)('cube-geometry') : _ref$id;

    var opts = _objectWithoutProperties(_ref, ['id']);

    _classCallCheck(this, CubeGeometry);

    return _possibleConstructorReturn(this, (CubeGeometry.__proto__ || Object.getPrototypeOf(CubeGeometry)).call(this, _extends({}, opts, {
      id: id,
      attributes: {
        indices: new Uint16Array(CUBE_INDICES),
        positions: new Float32Array(CUBE_POSITIONS),
        normals: new Float32Array(CUBE_NORMALS),
        texCoords: new Float32Array(CUBE_TEX_COORDS)
      }
    })));
  }

  return CubeGeometry;
}(_geometry2.default);

var Cube = function (_Model) {
  _inherits(Cube, _Model);

  function Cube() {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref2$id = _ref2.id;
    var id = _ref2$id === undefined ? (0, _utils.uid)('cube') : _ref2$id;

    var opts = _objectWithoutProperties(_ref2, ['id']);

    _classCallCheck(this, Cube);

    return _possibleConstructorReturn(this, (Cube.__proto__ || Object.getPrototypeOf(Cube)).call(this, _extends({}, opts, {
      id: id,
      geometry: new CubeGeometry(opts)
    })));
  }

  return Cube;
}(_model2.default);

exports.default = Cube;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9jdWJlLmpzIl0sIm5hbWVzIjpbIkNVQkVfSU5ESUNFUyIsIkNVQkVfUE9TSVRJT05TIiwiQ1VCRV9OT1JNQUxTIiwiQ1VCRV9URVhfQ09PUkRTIiwiQ3ViZUdlb21ldHJ5IiwiaWQiLCJvcHRzIiwiYXR0cmlidXRlcyIsImluZGljZXMiLCJVaW50MTZBcnJheSIsInBvc2l0aW9ucyIsIkZsb2F0MzJBcnJheSIsIm5vcm1hbHMiLCJ0ZXhDb29yZHMiLCJDdWJlIiwiZ2VvbWV0cnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBRUE7QUFDQSxJQUFNQSxlQUFlLENBQ25CLENBRG1CLEVBQ2hCLENBRGdCLEVBQ2IsQ0FEYSxFQUNWLENBRFUsRUFDUCxDQURPLEVBQ0osQ0FESSxFQUVuQixDQUZtQixFQUVoQixDQUZnQixFQUViLENBRmEsRUFFVixDQUZVLEVBRVAsQ0FGTyxFQUVKLENBRkksRUFHbkIsQ0FIbUIsRUFHaEIsQ0FIZ0IsRUFHYixFQUhhLEVBR1QsQ0FIUyxFQUdOLEVBSE0sRUFHRixFQUhFLEVBSW5CLEVBSm1CLEVBSWYsRUFKZSxFQUlYLEVBSlcsRUFJUCxFQUpPLEVBSUgsRUFKRyxFQUlDLEVBSkQsRUFLbkIsRUFMbUIsRUFLZixFQUxlLEVBS1gsRUFMVyxFQUtQLEVBTE8sRUFLSCxFQUxHLEVBS0MsRUFMRCxFQU1uQixFQU5tQixFQU1mLEVBTmUsRUFNWCxFQU5XLEVBTVAsRUFOTyxFQU1ILEVBTkcsRUFNQyxFQU5ELENBQXJCOztBQVNBLElBQU1DLGlCQUFpQixDQUNyQixDQUFDLENBRG9CLEVBQ2pCLENBQUMsQ0FEZ0IsRUFDWixDQURZLEVBRXBCLENBRm9CLEVBRWpCLENBQUMsQ0FGZ0IsRUFFWixDQUZZLEVBR3BCLENBSG9CLEVBR2hCLENBSGdCLEVBR1osQ0FIWSxFQUlyQixDQUFDLENBSm9CLEVBSWhCLENBSmdCLEVBSVosQ0FKWSxFQU1yQixD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QyxJQUFZOztBQUFBOztBQUFBLG9JQUVoREEsSUFGZ0Q7QUFHbkRELFlBSG1EO0FBSW5ERSxrQkFBWTtBQUNWQyxpQkFBUyxJQUFJQyxXQUFKLENBQWdCVCxZQUFoQixDQURDO0FBRVZVLG1CQUFXLElBQUlDLFlBQUosQ0FBaUJWLGNBQWpCLENBRkQ7QUFHVlcsaUJBQVMsSUFBSUQsWUFBSixDQUFpQlQsWUFBakIsQ0FIQztBQUlWVyxtQkFBVyxJQUFJRixZQUFKLENBQWlCUixlQUFqQjtBQUpEO0FBSnVDO0FBV3REOzs7OztJQUdrQlcsSTs7O0FBQ25CLGtCQUE4QztBQUFBLG9GQUFKLEVBQUk7O0FBQUEseUJBQWpDVCxFQUFpQztBQUFBLFFBQWpDQSxFQUFpQyw0QkFBNUIsZ0JBQUksTUFBSixDQUE0Qjs7QUFBQSxRQUFaQyxJQUFZOztBQUFBOztBQUFBLG9IQUV2Q0EsSUFGdUM7QUFHMUNELFlBSDBDO0FBSTFDVSxnQkFBVSxJQUFJWCxZQUFKLENBQWlCRSxJQUFqQjtBQUpnQztBQU03Qzs7Ozs7a0JBUGtCUSxJIiwiZmlsZSI6ImN1YmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vY29yZS9nZW9tZXRyeSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vY29yZS9tb2RlbCc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi4vdXRpbHMnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1tdWx0aS1zcGFjZXMsIGluZGVudCAqL1xuY29uc3QgQ1VCRV9JTkRJQ0VTID0gW1xuICAwLCAxLCAyLCAwLCAyLCAzLFxuICA0LCA1LCA2LCA0LCA2LCA3LFxuICA4LCA5LCAxMCwgOCwgMTAsIDExLFxuICAxMiwgMTMsIDE0LCAxMiwgMTQsIDE1LFxuICAxNiwgMTcsIDE4LCAxNiwgMTgsIDE5LFxuICAyMCwgMjEsIDIyLCAyMCwgMjIsIDIzXG5dO1xuXG5jb25zdCBDVUJFX1BPU0lUSU9OUyA9IFtcbiAgLTEsIC0xLCAgMSxcbiAgIDEsIC0xLCAgMSxcbiAgIDEsICAxLCAgMSxcbiAgLTEsICAxLCAgMSxcblxuICAtMSwgLTEsIC0xLFxuICAtMSwgIDEsIC0xLFxuICAgMSwgIDEsIC0xLFxuICAgMSwgLTEsIC0xLFxuXG4gIC0xLCAgMSwgLTEsXG4gIC0xLCAgMSwgIDEsXG4gICAxLCAgMSwgIDEsXG4gICAxLCAgMSwgLTEsXG5cbiAgLTEsIC0xLCAtMSxcbiAgIDEsIC0xLCAtMSxcbiAgIDEsIC0xLCAgMSxcbiAgLTEsIC0xLCAgMSxcblxuICAgMSwgLTEsIC0xLFxuICAgMSwgIDEsIC0xLFxuICAgMSwgIDEsICAxLFxuICAgMSwgLTEsICAxLFxuXG4gIC0xLCAtMSwgLTEsXG4gIC0xLCAtMSwgIDEsXG4gIC0xLCAgMSwgIDEsXG4gIC0xLCAgMSwgLTFcbl07XG5cbmNvbnN0IENVQkVfTk9STUFMUyA9IFtcbiAgLy8gRnJvbnQgZmFjZVxuICAwLjAsICAwLjAsICAxLjAsXG4gIDAuMCwgIDAuMCwgIDEuMCxcbiAgMC4wLCAgMC4wLCAgMS4wLFxuICAwLjAsICAwLjAsICAxLjAsXG5cbiAgLy8gQmFjayBmYWNlXG4gIDAuMCwgIDAuMCwgLTEuMCxcbiAgMC4wLCAgMC4wLCAtMS4wLFxuICAwLjAsICAwLjAsIC0xLjAsXG4gIDAuMCwgIDAuMCwgLTEuMCxcblxuICAvLyBUb3AgZmFjZVxuICAwLjAsICAxLjAsICAwLjAsXG4gIDAuMCwgIDEuMCwgIDAuMCxcbiAgMC4wLCAgMS4wLCAgMC4wLFxuICAwLjAsICAxLjAsICAwLjAsXG5cbiAgLy8gQm90dG9tIGZhY2VcbiAgMC4wLCAtMS4wLCAgMC4wLFxuICAwLjAsIC0xLjAsICAwLjAsXG4gIDAuMCwgLTEuMCwgIDAuMCxcbiAgMC4wLCAtMS4wLCAgMC4wLFxuXG4gIC8vIFJpZ2h0IGZhY2VcbiAgMS4wLCAgMC4wLCAgMC4wLFxuICAxLjAsICAwLjAsICAwLjAsXG4gIDEuMCwgIDAuMCwgIDAuMCxcbiAgMS4wLCAgMC4wLCAgMC4wLFxuXG4gIC8vIExlZnQgZmFjZVxuICAtMS4wLCAgMC4wLCAgMC4wLFxuICAtMS4wLCAgMC4wLCAgMC4wLFxuICAtMS4wLCAgMC4wLCAgMC4wLFxuICAtMS4wLCAgMC4wLCAgMC4wXG5dO1xuXG5jb25zdCBDVUJFX1RFWF9DT09SRFMgPSBbXG4gIC8vIEZyb250IGZhY2VcbiAgMC4wLCAwLjAsXG4gIDEuMCwgMC4wLFxuICAxLjAsIDEuMCxcbiAgMC4wLCAxLjAsXG5cbiAgLy8gQmFjayBmYWNlXG4gIDEuMCwgMC4wLFxuICAxLjAsIDEuMCxcbiAgMC4wLCAxLjAsXG4gIDAuMCwgMC4wLFxuXG4gIC8vIFRvcCBmYWNlXG4gIDAuMCwgMS4wLFxuICAwLjAsIDAuMCxcbiAgMS4wLCAwLjAsXG4gIDEuMCwgMS4wLFxuXG4gIC8vIEJvdHRvbSBmYWNlXG4gIDEuMCwgMS4wLFxuICAwLjAsIDEuMCxcbiAgMC4wLCAwLjAsXG4gIDEuMCwgMC4wLFxuXG4gIC8vIFJpZ2h0IGZhY2VcbiAgMS4wLCAwLjAsXG4gIDEuMCwgMS4wLFxuICAwLjAsIDEuMCxcbiAgMC4wLCAwLjAsXG5cbiAgLy8gTGVmdCBmYWNlXG4gIDAuMCwgMC4wLFxuICAxLjAsIDAuMCxcbiAgMS4wLCAxLjAsXG4gIDAuMCwgMS4wXG5dO1xuLyogZXNsaW50LWVuYWJsZSBuby1tdWx0aS1zcGFjZXMsIGluZGVudCAqL1xuXG5leHBvcnQgY2xhc3MgQ3ViZUdlb21ldHJ5IGV4dGVuZHMgR2VvbWV0cnkge1xuICBjb25zdHJ1Y3Rvcih7aWQgPSB1aWQoJ2N1YmUtZ2VvbWV0cnknKSwgLi4ub3B0c30gPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBpZCxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgaW5kaWNlczogbmV3IFVpbnQxNkFycmF5KENVQkVfSU5ESUNFUyksXG4gICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShDVUJFX1BPU0lUSU9OUyksXG4gICAgICAgIG5vcm1hbHM6IG5ldyBGbG9hdDMyQXJyYXkoQ1VCRV9OT1JNQUxTKSxcbiAgICAgICAgdGV4Q29vcmRzOiBuZXcgRmxvYXQzMkFycmF5KENVQkVfVEVYX0NPT1JEUylcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDdWJlIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3Rvcih7aWQgPSB1aWQoJ2N1YmUnKSwgLi4ub3B0c30gPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBpZCxcbiAgICAgIGdlb21ldHJ5OiBuZXcgQ3ViZUdlb21ldHJ5KG9wdHMpXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==