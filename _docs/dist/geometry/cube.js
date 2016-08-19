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
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)('cube-geometry') : _ref$id;

    var opts = _objectWithoutProperties(_ref, ['id']);

    _classCallCheck(this, CubeGeometry);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(CubeGeometry).call(this, _extends({}, opts, {
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
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2$id = _ref2.id;
    var id = _ref2$id === undefined ? (0, _utils.uid)('cube') : _ref2$id;

    var opts = _objectWithoutProperties(_ref2, ['id']);

    _classCallCheck(this, Cube);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Cube).call(this, _extends({}, opts, {
      id: id,
      geometry: new CubeGeometry(opts)
    })));
  }

  return Cube;
}(_model2.default);

exports.default = Cube;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9jdWJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBRUE7QUFDQSxJQUFNLGVBQWUsQ0FDbkIsQ0FEbUIsRUFDaEIsQ0FEZ0IsRUFDYixDQURhLEVBQ1YsQ0FEVSxFQUNQLENBRE8sRUFDSixDQURJLEVBRW5CLENBRm1CLEVBRWhCLENBRmdCLEVBRWIsQ0FGYSxFQUVWLENBRlUsRUFFUCxDQUZPLEVBRUosQ0FGSSxFQUduQixDQUhtQixFQUdoQixDQUhnQixFQUdiLEVBSGEsRUFHVCxDQUhTLEVBR04sRUFITSxFQUdGLEVBSEUsRUFJbkIsRUFKbUIsRUFJZixFQUplLEVBSVgsRUFKVyxFQUlQLEVBSk8sRUFJSCxFQUpHLEVBSUMsRUFKRCxFQUtuQixFQUxtQixFQUtmLEVBTGUsRUFLWCxFQUxXLEVBS1AsRUFMTyxFQUtILEVBTEcsRUFLQyxFQUxELEVBTW5CLEVBTm1CLEVBTWYsRUFOZSxFQU1YLEVBTlcsRUFNUCxFQU5PLEVBTUgsRUFORyxFQU1DLEVBTkQsQ0FBckI7O0FBU0EsSUFBTSxpQkFBaUIsQ0FDckIsQ0FBQyxDQURvQixFQUNqQixDQUFDLENBRGdCLEVBQ1osQ0FEWSxFQUVwQixDQUZvQixFQUVqQixDQUFDLENBRmdCLEVBRVosQ0FGWSxFQUdwQixDQUhvQixFQUdoQixDQUhnQixFQUdaLENBSFksRUFJckIsQ0FBQyxDQUpvQixFQUloQixDQUpnQixFQUlaLENBSlksRUFNckIsQ0FBQyxDQU5vQixFQU1qQixDQUFDLENBTmdCLEVBTWIsQ0FBQyxDQU5ZLEVBT3JCLENBQUMsQ0FQb0IsRUFPaEIsQ0FQZ0IsRUFPYixDQUFDLENBUFksRUFRcEIsQ0FSb0IsRUFRaEIsQ0FSZ0IsRUFRYixDQUFDLENBUlksRUFTcEIsQ0FUb0IsRUFTakIsQ0FBQyxDQVRnQixFQVNiLENBQUMsQ0FUWSxFQVdyQixDQUFDLENBWG9CLEVBV2hCLENBWGdC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QUpEO0FBSnVDO0FBV3REOzs7OztJQUdrQixJOzs7QUFDbkIsa0JBQThDO0FBQUEsc0VBQUosRUFBSTs7QUFBQSx5QkFBakMsRUFBaUM7QUFBQSxRQUFqQyxFQUFpQyw0QkFBNUIsZ0JBQUksTUFBSixDQUE0Qjs7QUFBQSxRQUFaLElBQVk7O0FBQUE7O0FBQUEsZ0dBRXZDLElBRnVDO0FBRzFDLFlBSDBDO0FBSTFDLGdCQUFVLElBQUksWUFBSixDQUFpQixJQUFqQjtBQUpnQztBQU03Qzs7Ozs7a0JBUGtCLEkiLCJmaWxlIjoiY3ViZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW9tZXRyeSBmcm9tICcuLi9jb3JlL2dlb21ldHJ5JztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9jb3JlL21vZGVsJztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLW11bHRpLXNwYWNlcywgaW5kZW50ICovXG5jb25zdCBDVUJFX0lORElDRVMgPSBbXG4gIDAsIDEsIDIsIDAsIDIsIDMsXG4gIDQsIDUsIDYsIDQsIDYsIDcsXG4gIDgsIDksIDEwLCA4LCAxMCwgMTEsXG4gIDEyLCAxMywgMTQsIDEyLCAxNCwgMTUsXG4gIDE2LCAxNywgMTgsIDE2LCAxOCwgMTksXG4gIDIwLCAyMSwgMjIsIDIwLCAyMiwgMjNcbl07XG5cbmNvbnN0IENVQkVfUE9TSVRJT05TID0gW1xuICAtMSwgLTEsICAxLFxuICAgMSwgLTEsICAxLFxuICAgMSwgIDEsICAxLFxuICAtMSwgIDEsICAxLFxuXG4gIC0xLCAtMSwgLTEsXG4gIC0xLCAgMSwgLTEsXG4gICAxLCAgMSwgLTEsXG4gICAxLCAtMSwgLTEsXG5cbiAgLTEsICAxLCAtMSxcbiAgLTEsICAxLCAgMSxcbiAgIDEsICAxLCAgMSxcbiAgIDEsICAxLCAtMSxcblxuICAtMSwgLTEsIC0xLFxuICAgMSwgLTEsIC0xLFxuICAgMSwgLTEsICAxLFxuICAtMSwgLTEsICAxLFxuXG4gICAxLCAtMSwgLTEsXG4gICAxLCAgMSwgLTEsXG4gICAxLCAgMSwgIDEsXG4gICAxLCAtMSwgIDEsXG5cbiAgLTEsIC0xLCAtMSxcbiAgLTEsIC0xLCAgMSxcbiAgLTEsICAxLCAgMSxcbiAgLTEsICAxLCAtMVxuXTtcblxuY29uc3QgQ1VCRV9OT1JNQUxTID0gW1xuICAvLyBGcm9udCBmYWNlXG4gIDAuMCwgIDAuMCwgIDEuMCxcbiAgMC4wLCAgMC4wLCAgMS4wLFxuICAwLjAsICAwLjAsICAxLjAsXG4gIDAuMCwgIDAuMCwgIDEuMCxcblxuICAvLyBCYWNrIGZhY2VcbiAgMC4wLCAgMC4wLCAtMS4wLFxuICAwLjAsICAwLjAsIC0xLjAsXG4gIDAuMCwgIDAuMCwgLTEuMCxcbiAgMC4wLCAgMC4wLCAtMS4wLFxuXG4gIC8vIFRvcCBmYWNlXG4gIDAuMCwgIDEuMCwgIDAuMCxcbiAgMC4wLCAgMS4wLCAgMC4wLFxuICAwLjAsICAxLjAsICAwLjAsXG4gIDAuMCwgIDEuMCwgIDAuMCxcblxuICAvLyBCb3R0b20gZmFjZVxuICAwLjAsIC0xLjAsICAwLjAsXG4gIDAuMCwgLTEuMCwgIDAuMCxcbiAgMC4wLCAtMS4wLCAgMC4wLFxuICAwLjAsIC0xLjAsICAwLjAsXG5cbiAgLy8gUmlnaHQgZmFjZVxuICAxLjAsICAwLjAsICAwLjAsXG4gIDEuMCwgIDAuMCwgIDAuMCxcbiAgMS4wLCAgMC4wLCAgMC4wLFxuICAxLjAsICAwLjAsICAwLjAsXG5cbiAgLy8gTGVmdCBmYWNlXG4gIC0xLjAsICAwLjAsICAwLjAsXG4gIC0xLjAsICAwLjAsICAwLjAsXG4gIC0xLjAsICAwLjAsICAwLjAsXG4gIC0xLjAsICAwLjAsICAwLjBcbl07XG5cbmNvbnN0IENVQkVfVEVYX0NPT1JEUyA9IFtcbiAgLy8gRnJvbnQgZmFjZVxuICAwLjAsIDAuMCxcbiAgMS4wLCAwLjAsXG4gIDEuMCwgMS4wLFxuICAwLjAsIDEuMCxcblxuICAvLyBCYWNrIGZhY2VcbiAgMS4wLCAwLjAsXG4gIDEuMCwgMS4wLFxuICAwLjAsIDEuMCxcbiAgMC4wLCAwLjAsXG5cbiAgLy8gVG9wIGZhY2VcbiAgMC4wLCAxLjAsXG4gIDAuMCwgMC4wLFxuICAxLjAsIDAuMCxcbiAgMS4wLCAxLjAsXG5cbiAgLy8gQm90dG9tIGZhY2VcbiAgMS4wLCAxLjAsXG4gIDAuMCwgMS4wLFxuICAwLjAsIDAuMCxcbiAgMS4wLCAwLjAsXG5cbiAgLy8gUmlnaHQgZmFjZVxuICAxLjAsIDAuMCxcbiAgMS4wLCAxLjAsXG4gIDAuMCwgMS4wLFxuICAwLjAsIDAuMCxcblxuICAvLyBMZWZ0IGZhY2VcbiAgMC4wLCAwLjAsXG4gIDEuMCwgMC4wLFxuICAxLjAsIDEuMCxcbiAgMC4wLCAxLjBcbl07XG4vKiBlc2xpbnQtZW5hYmxlIG5vLW11bHRpLXNwYWNlcywgaW5kZW50ICovXG5cbmV4cG9ydCBjbGFzcyBDdWJlR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG4gIGNvbnN0cnVjdG9yKHtpZCA9IHVpZCgnY3ViZS1nZW9tZXRyeScpLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGlkLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBpbmRpY2VzOiBuZXcgVWludDE2QXJyYXkoQ1VCRV9JTkRJQ0VTKSxcbiAgICAgICAgcG9zaXRpb25zOiBuZXcgRmxvYXQzMkFycmF5KENVQkVfUE9TSVRJT05TKSxcbiAgICAgICAgbm9ybWFsczogbmV3IEZsb2F0MzJBcnJheShDVUJFX05PUk1BTFMpLFxuICAgICAgICB0ZXhDb29yZHM6IG5ldyBGbG9hdDMyQXJyYXkoQ1VCRV9URVhfQ09PUkRTKVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEN1YmUgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKHtpZCA9IHVpZCgnY3ViZScpLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGlkLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBDdWJlR2VvbWV0cnkob3B0cylcbiAgICB9KTtcbiAgfVxufVxuIl19