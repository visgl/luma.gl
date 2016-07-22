'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CubeGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../model');

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL2N1YmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7O0FBR0EsSUFBTSxlQUFlLENBQ25CLENBRG1CLEVBQ2hCLENBRGdCLEVBQ2IsQ0FEYSxFQUNWLENBRFUsRUFDUCxDQURPLEVBQ0osQ0FESSxFQUVuQixDQUZtQixFQUVoQixDQUZnQixFQUViLENBRmEsRUFFVixDQUZVLEVBRVAsQ0FGTyxFQUVKLENBRkksRUFHbkIsQ0FIbUIsRUFHaEIsQ0FIZ0IsRUFHYixFQUhhLEVBR1QsQ0FIUyxFQUdOLEVBSE0sRUFHRixFQUhFLEVBSW5CLEVBSm1CLEVBSWYsRUFKZSxFQUlYLEVBSlcsRUFJUCxFQUpPLEVBSUgsRUFKRyxFQUlDLEVBSkQsRUFLbkIsRUFMbUIsRUFLZixFQUxlLEVBS1gsRUFMVyxFQUtQLEVBTE8sRUFLSCxFQUxHLEVBS0MsRUFMRCxFQU1uQixFQU5tQixFQU1mLEVBTmUsRUFNWCxFQU5XLEVBTVAsRUFOTyxFQU1ILEVBTkcsRUFNQyxFQU5ELENBQXJCOztBQVNBLElBQU0saUJBQWlCLENBQ3JCLENBQUMsQ0FEb0IsRUFDakIsQ0FBQyxDQURnQixFQUNaLENBRFksRUFFcEIsQ0FGb0IsRUFFakIsQ0FBQyxDQUZnQixFQUVaLENBRlksRUFHcEIsQ0FIb0IsRUFHaEIsQ0FIZ0IsRUFHWixDQUhZLEVBSXJCLENBQUMsQ0FKb0IsRUFJaEIsQ0FKZ0IsRUFJWixDQUpZLEVBTXJCLENBQUMsQ0FOb0IsRUFNakIsQ0FBQyxDQU5nQixFQU1iLENBQUMsQ0FOWSxFQU9yQixDQUFDLENBUG9CLEVBT2hCLENBUGdCLEVBT2IsQ0FBQyxDQVBZLEVBUXBCLENBUm9CLEVBUWhCLENBUmdCLEVBUWIsQ0FBQyxDQVJZLEVBU3BCLENBVG9CLEVBU2pCLENBQUMsQ0FUZ0IsRUFTYixDQUFDLENBVFksRUFXckIsQ0FBQyxDQVhvQixFQVdoQixDQVhnQixFQVdi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STs7QUFBQSx5QkFBakMsRUFBaUM7QUFBQSxRQUFqQyxFQUFpQyw0QkFBNUIsZ0JBQUksTUFBSixDQUE0Qjs7QUFBQSxRQUFaLElBQVk7O0FBQUE7O0FBQUEsZ0dBRXZDLElBRnVDO0FBRzFDLFlBSDBDO0FBSTFDLGdCQUFVLElBQUksWUFBSixDQUFpQixJQUFqQjtBQUpnQztBQU03Qzs7Ozs7a0JBUGtCLEkiLCJmaWxlIjoiY3ViZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW9tZXRyeSBmcm9tICcuLi9nZW9tZXRyeSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vbW9kZWwnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcblxuLyogZXNsaW50LWRpc2FibGUgbm8tbXVsdGktc3BhY2VzLCBpbmRlbnQgKi9cbmNvbnN0IENVQkVfSU5ESUNFUyA9IFtcbiAgMCwgMSwgMiwgMCwgMiwgMyxcbiAgNCwgNSwgNiwgNCwgNiwgNyxcbiAgOCwgOSwgMTAsIDgsIDEwLCAxMSxcbiAgMTIsIDEzLCAxNCwgMTIsIDE0LCAxNSxcbiAgMTYsIDE3LCAxOCwgMTYsIDE4LCAxOSxcbiAgMjAsIDIxLCAyMiwgMjAsIDIyLCAyM1xuXTtcblxuY29uc3QgQ1VCRV9QT1NJVElPTlMgPSBbXG4gIC0xLCAtMSwgIDEsXG4gICAxLCAtMSwgIDEsXG4gICAxLCAgMSwgIDEsXG4gIC0xLCAgMSwgIDEsXG5cbiAgLTEsIC0xLCAtMSxcbiAgLTEsICAxLCAtMSxcbiAgIDEsICAxLCAtMSxcbiAgIDEsIC0xLCAtMSxcblxuICAtMSwgIDEsIC0xLFxuICAtMSwgIDEsICAxLFxuICAgMSwgIDEsICAxLFxuICAgMSwgIDEsIC0xLFxuXG4gIC0xLCAtMSwgLTEsXG4gICAxLCAtMSwgLTEsXG4gICAxLCAtMSwgIDEsXG4gIC0xLCAtMSwgIDEsXG5cbiAgIDEsIC0xLCAtMSxcbiAgIDEsICAxLCAtMSxcbiAgIDEsICAxLCAgMSxcbiAgIDEsIC0xLCAgMSxcblxuICAtMSwgLTEsIC0xLFxuICAtMSwgLTEsICAxLFxuICAtMSwgIDEsICAxLFxuICAtMSwgIDEsIC0xXG5dO1xuXG5jb25zdCBDVUJFX05PUk1BTFMgPSBbXG4gIC8vIEZyb250IGZhY2VcbiAgMC4wLCAgMC4wLCAgMS4wLFxuICAwLjAsICAwLjAsICAxLjAsXG4gIDAuMCwgIDAuMCwgIDEuMCxcbiAgMC4wLCAgMC4wLCAgMS4wLFxuXG4gIC8vIEJhY2sgZmFjZVxuICAwLjAsICAwLjAsIC0xLjAsXG4gIDAuMCwgIDAuMCwgLTEuMCxcbiAgMC4wLCAgMC4wLCAtMS4wLFxuICAwLjAsICAwLjAsIC0xLjAsXG5cbiAgLy8gVG9wIGZhY2VcbiAgMC4wLCAgMS4wLCAgMC4wLFxuICAwLjAsICAxLjAsICAwLjAsXG4gIDAuMCwgIDEuMCwgIDAuMCxcbiAgMC4wLCAgMS4wLCAgMC4wLFxuXG4gIC8vIEJvdHRvbSBmYWNlXG4gIDAuMCwgLTEuMCwgIDAuMCxcbiAgMC4wLCAtMS4wLCAgMC4wLFxuICAwLjAsIC0xLjAsICAwLjAsXG4gIDAuMCwgLTEuMCwgIDAuMCxcblxuICAvLyBSaWdodCBmYWNlXG4gIDEuMCwgIDAuMCwgIDAuMCxcbiAgMS4wLCAgMC4wLCAgMC4wLFxuICAxLjAsICAwLjAsICAwLjAsXG4gIDEuMCwgIDAuMCwgIDAuMCxcblxuICAvLyBMZWZ0IGZhY2VcbiAgLTEuMCwgIDAuMCwgIDAuMCxcbiAgLTEuMCwgIDAuMCwgIDAuMCxcbiAgLTEuMCwgIDAuMCwgIDAuMCxcbiAgLTEuMCwgIDAuMCwgIDAuMFxuXTtcblxuY29uc3QgQ1VCRV9URVhfQ09PUkRTID0gW1xuICAvLyBGcm9udCBmYWNlXG4gIDAuMCwgMC4wLFxuICAxLjAsIDAuMCxcbiAgMS4wLCAxLjAsXG4gIDAuMCwgMS4wLFxuXG4gIC8vIEJhY2sgZmFjZVxuICAxLjAsIDAuMCxcbiAgMS4wLCAxLjAsXG4gIDAuMCwgMS4wLFxuICAwLjAsIDAuMCxcblxuICAvLyBUb3AgZmFjZVxuICAwLjAsIDEuMCxcbiAgMC4wLCAwLjAsXG4gIDEuMCwgMC4wLFxuICAxLjAsIDEuMCxcblxuICAvLyBCb3R0b20gZmFjZVxuICAxLjAsIDEuMCxcbiAgMC4wLCAxLjAsXG4gIDAuMCwgMC4wLFxuICAxLjAsIDAuMCxcblxuICAvLyBSaWdodCBmYWNlXG4gIDEuMCwgMC4wLFxuICAxLjAsIDEuMCxcbiAgMC4wLCAxLjAsXG4gIDAuMCwgMC4wLFxuXG4gIC8vIExlZnQgZmFjZVxuICAwLjAsIDAuMCxcbiAgMS4wLCAwLjAsXG4gIDEuMCwgMS4wLFxuICAwLjAsIDEuMFxuXTtcbi8qIGVzbGludC1lbmFibGUgbm8tbXVsdGktc3BhY2VzLCBpbmRlbnQgKi9cblxuZXhwb3J0IGNsYXNzIEN1YmVHZW9tZXRyeSBleHRlbmRzIEdlb21ldHJ5IHtcbiAgY29uc3RydWN0b3Ioe2lkID0gdWlkKCdjdWJlLWdlb21ldHJ5JyksIC4uLm9wdHN9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgaWQsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIGluZGljZXM6IG5ldyBVaW50MTZBcnJheShDVUJFX0lORElDRVMpLFxuICAgICAgICBwb3NpdGlvbnM6IG5ldyBGbG9hdDMyQXJyYXkoQ1VCRV9QT1NJVElPTlMpLFxuICAgICAgICBub3JtYWxzOiBuZXcgRmxvYXQzMkFycmF5KENVQkVfTk9STUFMUyksXG4gICAgICAgIHRleENvb3JkczogbmV3IEZsb2F0MzJBcnJheShDVUJFX1RFWF9DT09SRFMpXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3ViZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Ioe2lkID0gdWlkKCdjdWJlJyksIC4uLm9wdHN9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgaWQsXG4gICAgICBnZW9tZXRyeTogbmV3IEN1YmVHZW9tZXRyeShvcHRzKVxuICAgIH0pO1xuICB9XG59XG4iXX0=