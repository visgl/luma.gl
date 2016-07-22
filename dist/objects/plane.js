'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PlaneGeometry = undefined;

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

var PlaneGeometry = exports.PlaneGeometry = function (_Geometry) {
  _inherits(PlaneGeometry, _Geometry);

  // Primitives inspired by TDL http://code.google.com/p/webglsamples/,
  // copyright 2011 Google Inc. new BSD License
  // (http://www.opensource.org/licenses/bsd-license.php).
  /* eslint-disable max-statements, complexity */
  /* eslint-disable complexity, max-statements */

  function PlaneGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$type = _ref.type;
    var type = _ref$type === undefined ? 'x,y' : _ref$type;
    var _ref$offset = _ref.offset;
    var offset = _ref$offset === undefined ? 0 : _ref$offset;
    var _ref$flipCull = _ref.flipCull;
    var flipCull = _ref$flipCull === undefined ? false : _ref$flipCull;
    var _ref$unpack = _ref.unpack;
    var unpack = _ref$unpack === undefined ? false : _ref$unpack;
    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)('plane-geometry') : _ref$id;

    var opts = _objectWithoutProperties(_ref, ['type', 'offset', 'flipCull', 'unpack', 'id']);

    _classCallCheck(this, PlaneGeometry);

    var coords = type.split(',');
    // width, height
    var c1len = opts[coords[0] + 'len'];
    var c2len = opts[coords[1] + 'len'];
    // subdivisionsWidth, subdivisionsDepth
    var subdivisions1 = opts['n' + coords[0]] || 1;
    var subdivisions2 = opts['n' + coords[1]] || 1;
    var numVertices = (subdivisions1 + 1) * (subdivisions2 + 1);

    var positions = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);

    if (flipCull) {
      c1len = -c1len;
    }

    var i2 = 0;
    var i3 = 0;
    for (var z = 0; z <= subdivisions2; z++) {
      for (var x = 0; x <= subdivisions1; x++) {
        var u = x / subdivisions1;
        var v = z / subdivisions2;
        texCoords[i2 + 0] = flipCull ? 1 - u : u;
        texCoords[i2 + 1] = v;

        switch (type) {
          case 'x,y':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = c2len * v - c2len * 0.5;
            positions[i3 + 2] = offset;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 0;
            normals[i3 + 2] = flipCull ? 1 : -1;
            break;

          case 'x,z':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = offset;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = flipCull ? 1 : -1;
            normals[i3 + 2] = 0;
            break;

          case 'y,z':
            positions[i3 + 0] = offset;
            positions[i3 + 1] = c1len * u - c1len * 0.5;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = flipCull ? 1 : -1;
            normals[i3 + 1] = 0;
            normals[i3 + 2] = 0;
            break;

          default:
            break;
        }

        i2 += 2;
        i3 += 3;
      }
    }

    var numVertsAcross = subdivisions1 + 1;
    var indices = new Uint16Array(subdivisions1 * subdivisions2 * 6);

    for (var _z = 0; _z < subdivisions2; _z++) {
      for (var _x2 = 0; _x2 < subdivisions1; _x2++) {
        var index = (_z * subdivisions1 + _x2) * 6;
        // Make triangle 1 of quad.
        indices[index + 0] = (_z + 0) * numVertsAcross + _x2;
        indices[index + 1] = (_z + 1) * numVertsAcross + _x2;
        indices[index + 2] = (_z + 0) * numVertsAcross + _x2 + 1;

        // Make triangle 2 of quad.
        indices[index + 3] = (_z + 1) * numVertsAcross + _x2;
        indices[index + 4] = (_z + 1) * numVertsAcross + _x2 + 1;
        indices[index + 5] = (_z + 0) * numVertsAcross + _x2 + 1;
      }
    }

    // Optionally, unpack indexed geometry
    if (unpack) {
      var positions2 = new Float32Array(indices.length * 3);
      var normals2 = new Float32Array(indices.length * 3);
      var texCoords2 = new Float32Array(indices.length * 2);

      for (var _x3 = 0; _x3 < indices.length; ++_x3) {
        var _index = indices[_x3];
        positions2[_x3 * 3 + 0] = positions[_index * 3 + 0];
        positions2[_x3 * 3 + 1] = positions[_index * 3 + 1];
        positions2[_x3 * 3 + 2] = positions[_index * 3 + 2];
        normals2[_x3 * 3 + 0] = normals[_index * 3 + 0];
        normals2[_x3 * 3 + 1] = normals[_index * 3 + 1];
        normals2[_x3 * 3 + 2] = normals[_index * 3 + 2];
        texCoords2[_x3 * 2 + 0] = texCoords[_index * 2 + 0];
        texCoords2[_x3 * 2 + 1] = texCoords[_index * 2 + 1];
      }

      positions = positions2;
      normals = normals2;
      texCoords = texCoords2;
      indices = undefined;
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(PlaneGeometry).call(this, _extends({}, opts, {
      id: id,
      attributes: _extends({
        positions: positions,
        normals: normals,
        texCoords: texCoords
      }, indices ? { indices: indices } : {})
    })));
  }

  return PlaneGeometry;
}(_geometry2.default);

var Plane = function (_Model) {
  _inherits(Plane, _Model);

  function Plane(_ref2) {
    var _ref2$id = _ref2.id;
    var id = _ref2$id === undefined ? (0, _utils.uid)('plane') : _ref2$id;

    var opts = _objectWithoutProperties(_ref2, ['id']);

    _classCallCheck(this, Plane);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Plane).call(this, _extends({}, opts, {
      id: id,
      geometry: new PlaneGeometry(opts)
    })));
  }

  return Plane;
}(_model2.default);

exports.default = Plane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3BsYW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0lBRWEsYSxXQUFBLGE7Ozs7Ozs7OztBQU9YLDJCQU9RO0FBQUEscUVBQUosRUFBSTs7QUFBQSx5QkFOTixJQU1NO0FBQUEsUUFOTixJQU1NLDZCQU5DLEtBTUQ7QUFBQSwyQkFMTixNQUtNO0FBQUEsUUFMTixNQUtNLCtCQUxHLENBS0g7QUFBQSw2QkFKTixRQUlNO0FBQUEsUUFKTixRQUlNLGlDQUpLLEtBSUw7QUFBQSwyQkFITixNQUdNO0FBQUEsUUFITixNQUdNLCtCQUhHLEtBR0g7QUFBQSx1QkFGTixFQUVNO0FBQUEsUUFGTixFQUVNLDJCQUZELGdCQUFJLGdCQUFKLENBRUM7O0FBQUEsUUFESCxJQUNHOztBQUFBOztBQUNOLFFBQU0sU0FBUyxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWY7O0FBRUEsUUFBSSxRQUFRLEtBQUssT0FBTyxDQUFQLElBQVksS0FBakIsQ0FBWjtBQUNBLFFBQU0sUUFBUSxLQUFLLE9BQU8sQ0FBUCxJQUFZLEtBQWpCLENBQWQ7O0FBRUEsUUFBTSxnQkFBZ0IsS0FBSyxNQUFNLE9BQU8sQ0FBUCxDQUFYLEtBQXlCLENBQS9DO0FBQ0EsUUFBTSxnQkFBZ0IsS0FBSyxNQUFNLE9BQU8sQ0FBUCxDQUFYLEtBQXlCLENBQS9DO0FBQ0EsUUFBTSxjQUFjLENBQUMsZ0JBQWdCLENBQWpCLEtBQXVCLGdCQUFnQixDQUF2QyxDQUFwQjs7QUFFQSxRQUFJLFlBQVksSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBL0IsQ0FBaEI7QUFDQSxRQUFJLFVBQVUsSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBL0IsQ0FBZDtBQUNBLFFBQUksWUFBWSxJQUFJLFlBQUosQ0FBaUIsY0FBYyxDQUEvQixDQUFoQjs7QUFFQSxRQUFJLFFBQUosRUFBYztBQUNaLGNBQVEsQ0FBQyxLQUFUO0FB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R0FBWSxDQUF0QixDQUF4QjtBQUNBLG1CQUFXLE1BQUksQ0FBSixHQUFRLENBQW5CLElBQXdCLFVBQVUsU0FBUSxDQUFSLEdBQVksQ0FBdEIsQ0FBeEI7QUFDRDs7QUFFRCxrQkFBWSxVQUFaO0FBQ0EsZ0JBQVUsUUFBVjtBQUNBLGtCQUFZLFVBQVo7QUFDQSxnQkFBVSxTQUFWO0FBQ0Q7O0FBM0dLLHlHQThHRCxJQTlHQztBQStHSixZQS9HSTtBQWdISjtBQUNFLDRCQURGO0FBRUUsd0JBRkY7QUFHRTtBQUhGLFNBSU0sVUFBVSxFQUFDLGdCQUFELEVBQVYsR0FBc0IsRUFKNUI7QUFoSEk7QUF1SFA7Ozs7O0lBR2tCLEs7OztBQUNuQix3QkFBMEM7QUFBQSx5QkFBN0IsRUFBNkI7QUFBQSxRQUE3QixFQUE2Qiw0QkFBeEIsZ0JBQUksT0FBSixDQUF3Qjs7QUFBQSxRQUFQLElBQU87O0FBQUE7O0FBQUEsaUdBRW5DLElBRm1DO0FBR3RDLFlBSHNDO0FBSXRDLGdCQUFVLElBQUksYUFBSixDQUFrQixJQUFsQjtBQUo0QjtBQU16Qzs7Ozs7a0JBUGtCLEsiLCJmaWxlIjoicGxhbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vZ2VvbWV0cnknO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL21vZGVsJztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBQbGFuZUdlb21ldHJ5IGV4dGVuZHMgR2VvbWV0cnkge1xuXG4gIC8vIFByaW1pdGl2ZXMgaW5zcGlyZWQgYnkgVERMIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC93ZWJnbHNhbXBsZXMvLFxuICAvLyBjb3B5cmlnaHQgMjAxMSBHb29nbGUgSW5jLiBuZXcgQlNEIExpY2Vuc2VcbiAgLy8gKGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvYnNkLWxpY2Vuc2UucGhwKS5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIGNvbXBsZXhpdHkgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSwgbWF4LXN0YXRlbWVudHMgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIHR5cGUgPSAneCx5JyxcbiAgICBvZmZzZXQgPSAwLFxuICAgIGZsaXBDdWxsID0gZmFsc2UsXG4gICAgdW5wYWNrID0gZmFsc2UsXG4gICAgaWQgPSB1aWQoJ3BsYW5lLWdlb21ldHJ5JyksXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICBjb25zdCBjb29yZHMgPSB0eXBlLnNwbGl0KCcsJyk7XG4gICAgLy8gd2lkdGgsIGhlaWdodFxuICAgIGxldCBjMWxlbiA9IG9wdHNbY29vcmRzWzBdICsgJ2xlbiddO1xuICAgIGNvbnN0IGMybGVuID0gb3B0c1tjb29yZHNbMV0gKyAnbGVuJ107XG4gICAgLy8gc3ViZGl2aXNpb25zV2lkdGgsIHN1YmRpdmlzaW9uc0RlcHRoXG4gICAgY29uc3Qgc3ViZGl2aXNpb25zMSA9IG9wdHNbJ24nICsgY29vcmRzWzBdXSB8fCAxO1xuICAgIGNvbnN0IHN1YmRpdmlzaW9uczIgPSBvcHRzWyduJyArIGNvb3Jkc1sxXV0gfHwgMTtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IChzdWJkaXZpc2lvbnMxICsgMSkgKiAoc3ViZGl2aXNpb25zMiArIDEpO1xuXG4gICAgbGV0IHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBsZXQgbm9ybWFscyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBsZXQgdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDIpO1xuXG4gICAgaWYgKGZsaXBDdWxsKSB7XG4gICAgICBjMWxlbiA9IC1jMWxlbjtcbiAgICB9XG5cbiAgICBsZXQgaTIgPSAwO1xuICAgIGxldCBpMyA9IDA7XG4gICAgZm9yIChsZXQgeiA9IDA7IHogPD0gc3ViZGl2aXNpb25zMjsgeisrKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8PSBzdWJkaXZpc2lvbnMxOyB4KyspIHtcbiAgICAgICAgY29uc3QgdSA9IHggLyBzdWJkaXZpc2lvbnMxO1xuICAgICAgICBjb25zdCB2ID0geiAvIHN1YmRpdmlzaW9uczI7XG4gICAgICAgIHRleENvb3Jkc1tpMiArIDBdID0gZmxpcEN1bGwgPyAxIC0gdSA6IHU7XG4gICAgICAgIHRleENvb3Jkc1tpMiArIDFdID0gdjtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAneCx5JzpcbiAgICAgICAgICBwb3NpdGlvbnNbaTMgKyAwXSA9IGMxbGVuICogdSAtIGMxbGVuICogMC41O1xuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDFdID0gYzJsZW4gKiB2IC0gYzJsZW4gKiAwLjU7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMl0gPSBvZmZzZXQ7XG5cbiAgICAgICAgICBub3JtYWxzW2kzICsgMF0gPSAwO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gZmxpcEN1bGwgPyAxIDogLTE7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAneCx6JzpcbiAgICAgICAgICBwb3NpdGlvbnNbaTMgKyAwXSA9IGMxbGVuICogdSAtIGMxbGVuICogMC41O1xuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDFdID0gb2Zmc2V0O1xuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDJdID0gYzJsZW4gKiB2IC0gYzJsZW4gKiAwLjU7XG5cbiAgICAgICAgICBub3JtYWxzW2kzICsgMF0gPSAwO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IGZsaXBDdWxsID8gMSA6IC0xO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IDA7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAneSx6JzpcbiAgICAgICAgICBwb3NpdGlvbnNbaTMgKyAwXSA9IG9mZnNldDtcbiAgICAgICAgICBwb3NpdGlvbnNbaTMgKyAxXSA9IGMxbGVuICogdSAtIGMxbGVuICogMC41O1xuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDJdID0gYzJsZW4gKiB2IC0gYzJsZW4gKiAwLjU7XG5cbiAgICAgICAgICBub3JtYWxzW2kzICsgMF0gPSBmbGlwQ3VsbCA/IDEgOiAtMTtcbiAgICAgICAgICBub3JtYWxzW2kzICsgMV0gPSAwO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IDA7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGkyICs9IDI7XG4gICAgICAgIGkzICs9IDM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbnVtVmVydHNBY3Jvc3MgPSBzdWJkaXZpc2lvbnMxICsgMTtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheShzdWJkaXZpc2lvbnMxICogc3ViZGl2aXNpb25zMiAqIDYpO1xuXG4gICAgZm9yIChsZXQgeiA9IDA7IHogPCBzdWJkaXZpc2lvbnMyOyB6KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgc3ViZGl2aXNpb25zMTsgeCsrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gKHogKiBzdWJkaXZpc2lvbnMxICsgeCkgKiA2O1xuICAgICAgICAvLyBNYWtlIHRyaWFuZ2xlIDEgb2YgcXVhZC5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDBdID0gKHogKyAwKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDFdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDJdID0gKHogKyAwKSAqIG51bVZlcnRzQWNyb3NzICsgeCArIDE7XG5cbiAgICAgICAgLy8gTWFrZSB0cmlhbmdsZSAyIG9mIHF1YWQuXG4gICAgICAgIGluZGljZXNbaW5kZXggKyAzXSA9ICh6ICsgMSkgKiBudW1WZXJ0c0Fjcm9zcyArIHg7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA0XSA9ICh6ICsgMSkgKiBudW1WZXJ0c0Fjcm9zcyArIHggKyAxO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNV0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4ICsgMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPcHRpb25hbGx5LCB1bnBhY2sgaW5kZXhlZCBnZW9tZXRyeVxuICAgIGlmICh1bnBhY2spIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uczIgPSBuZXcgRmxvYXQzMkFycmF5KGluZGljZXMubGVuZ3RoICogMyk7XG4gICAgICBjb25zdCBub3JtYWxzMiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAzKTtcbiAgICAgIGNvbnN0IHRleENvb3JkczIgPSBuZXcgRmxvYXQzMkFycmF5KGluZGljZXMubGVuZ3RoICogMik7XG5cbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgaW5kaWNlcy5sZW5ndGg7ICsreCkge1xuICAgICAgICBjb25zdCBpbmRleCA9IGluZGljZXNbeF07XG4gICAgICAgIHBvc2l0aW9uczJbeCAqIDMgKyAwXSA9IHBvc2l0aW9uc1tpbmRleCAqIDMgKyAwXTtcbiAgICAgICAgcG9zaXRpb25zMlt4ICogMyArIDFdID0gcG9zaXRpb25zW2luZGV4ICogMyArIDFdO1xuICAgICAgICBwb3NpdGlvbnMyW3ggKiAzICsgMl0gPSBwb3NpdGlvbnNbaW5kZXggKiAzICsgMl07XG4gICAgICAgIG5vcm1hbHMyW3ggKiAzICsgMF0gPSBub3JtYWxzW2luZGV4ICogMyArIDBdO1xuICAgICAgICBub3JtYWxzMlt4ICogMyArIDFdID0gbm9ybWFsc1tpbmRleCAqIDMgKyAxXTtcbiAgICAgICAgbm9ybWFsczJbeCAqIDMgKyAyXSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMl07XG4gICAgICAgIHRleENvb3JkczJbeCAqIDIgKyAwXSA9IHRleENvb3Jkc1tpbmRleCAqIDIgKyAwXTtcbiAgICAgICAgdGV4Q29vcmRzMlt4ICogMiArIDFdID0gdGV4Q29vcmRzW2luZGV4ICogMiArIDFdO1xuICAgICAgfVxuXG4gICAgICBwb3NpdGlvbnMgPSBwb3NpdGlvbnMyO1xuICAgICAgbm9ybWFscyA9IG5vcm1hbHMyO1xuICAgICAgdGV4Q29vcmRzID0gdGV4Q29vcmRzMjtcbiAgICAgIGluZGljZXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGlkLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBwb3NpdGlvbnMsXG4gICAgICAgIG5vcm1hbHMsXG4gICAgICAgIHRleENvb3JkcyxcbiAgICAgICAgLi4uKGluZGljZXMgPyB7aW5kaWNlc30gOiB7fSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQbGFuZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Ioe2lkID0gdWlkKCdwbGFuZScpLCAuLi5vcHRzfSkge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBpZCxcbiAgICAgIGdlb21ldHJ5OiBuZXcgUGxhbmVHZW9tZXRyeShvcHRzKVxuICAgIH0pO1xuICB9XG59XG4iXX0=