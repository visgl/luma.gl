'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.PlaneGeometry = undefined;

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

var PlaneGeometry = exports.PlaneGeometry = function (_Geometry) {
  _inherits(PlaneGeometry, _Geometry);

  // Primitives inspired by TDL http://code.google.com/p/webglsamples/,
  // copyright 2011 Google Inc. new BSD License
  // (http://www.opensource.org/licenses/bsd-license.php).
  /* eslint-disable max-statements, complexity */
  /* eslint-disable complexity, max-statements */
  function PlaneGeometry() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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

    return _possibleConstructorReturn(this, (PlaneGeometry.__proto__ || Object.getPrototypeOf(PlaneGeometry)).call(this, _extends({}, opts, {
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

    return _possibleConstructorReturn(this, (Plane.__proto__ || Object.getPrototypeOf(Plane)).call(this, _extends({}, opts, {
      id: id,
      geometry: new PlaneGeometry(opts)
    })));
  }

  return Plane;
}(_model2.default);

exports.default = Plane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9wbGFuZS5qcyJdLCJuYW1lcyI6WyJQbGFuZUdlb21ldHJ5IiwidHlwZSIsIm9mZnNldCIsImZsaXBDdWxsIiwidW5wYWNrIiwiaWQiLCJvcHRzIiwiY29vcmRzIiwic3BsaXQiLCJjMWxlbiIsImMybGVuIiwic3ViZGl2aXNpb25zMSIsInN1YmRpdmlzaW9uczIiLCJudW1WZXJ0aWNlcyIsInBvc2l0aW9ucyIsIkZsb2F0MzJBcnJheSIsIm5vcm1hbHMiLCJ0ZXhDb29yZHMiLCJpMiIsImkzIiwieiIsIngiLCJ1IiwidiIsIm51bVZlcnRzQWNyb3NzIiwiaW5kaWNlcyIsIlVpbnQxNkFycmF5IiwiaW5kZXgiLCJwb3NpdGlvbnMyIiwibGVuZ3RoIiwibm9ybWFsczIiLCJ0ZXhDb29yZHMyIiwidW5kZWZpbmVkIiwiYXR0cmlidXRlcyIsIlBsYW5lIiwiZ2VvbWV0cnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0lBRWFBLGEsV0FBQUEsYTs7O0FBRVg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQU9RO0FBQUEsbUZBQUosRUFBSTs7QUFBQSx5QkFOTkMsSUFNTTtBQUFBLFFBTk5BLElBTU0sNkJBTkMsS0FNRDtBQUFBLDJCQUxOQyxNQUtNO0FBQUEsUUFMTkEsTUFLTSwrQkFMRyxDQUtIO0FBQUEsNkJBSk5DLFFBSU07QUFBQSxRQUpOQSxRQUlNLGlDQUpLLEtBSUw7QUFBQSwyQkFITkMsTUFHTTtBQUFBLFFBSE5BLE1BR00sK0JBSEcsS0FHSDtBQUFBLHVCQUZOQyxFQUVNO0FBQUEsUUFGTkEsRUFFTSwyQkFGRCxnQkFBSSxnQkFBSixDQUVDOztBQUFBLFFBREhDLElBQ0c7O0FBQUE7O0FBQ04sUUFBTUMsU0FBU04sS0FBS08sS0FBTCxDQUFXLEdBQVgsQ0FBZjtBQUNBO0FBQ0EsUUFBSUMsUUFBUUgsS0FBUUMsT0FBTyxDQUFQLENBQVIsU0FBWjtBQUNBLFFB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QUo1QjtBQWhISTtBQXVIUDs7Ozs7SUFHa0JTLEs7OztBQUNuQix3QkFBMEM7QUFBQSx5QkFBN0I3QixFQUE2QjtBQUFBLFFBQTdCQSxFQUE2Qiw0QkFBeEIsZ0JBQUksT0FBSixDQUF3Qjs7QUFBQSxRQUFQQyxJQUFPOztBQUFBOztBQUFBLHNIQUVuQ0EsSUFGbUM7QUFHdENELFlBSHNDO0FBSXRDOEIsZ0JBQVUsSUFBSW5DLGFBQUosQ0FBa0JNLElBQWxCO0FBSjRCO0FBTXpDOzs7OztrQkFQa0I0QixLIiwiZmlsZSI6InBsYW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4uL2NvcmUvZ2VvbWV0cnknO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL2NvcmUvbW9kZWwnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGNsYXNzIFBsYW5lR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgdHlwZSA9ICd4LHknLFxuICAgIG9mZnNldCA9IDAsXG4gICAgZmxpcEN1bGwgPSBmYWxzZSxcbiAgICB1bnBhY2sgPSBmYWxzZSxcbiAgICBpZCA9IHVpZCgncGxhbmUtZ2VvbWV0cnknKSxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IGNvb3JkcyA9IHR5cGUuc3BsaXQoJywnKTtcbiAgICAvLyB3aWR0aCwgaGVpZ2h0XG4gICAgbGV0IGMxbGVuID0gb3B0c1tgJHtjb29yZHNbMF19bGVuYF07XG4gICAgY29uc3QgYzJsZW4gPSBvcHRzW2Ake2Nvb3Jkc1sxXX1sZW5gXTtcbiAgICAvLyBzdWJkaXZpc2lvbnNXaWR0aCwgc3ViZGl2aXNpb25zRGVwdGhcbiAgICBjb25zdCBzdWJkaXZpc2lvbnMxID0gb3B0c1tgbiR7Y29vcmRzWzBdfWBdIHx8IDE7XG4gICAgY29uc3Qgc3ViZGl2aXNpb25zMiA9IG9wdHNbYG4ke2Nvb3Jkc1sxXX1gXSB8fCAxO1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gKHN1YmRpdmlzaW9uczEgKyAxKSAqIChzdWJkaXZpc2lvbnMyICsgMSk7XG5cbiAgICBsZXQgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCB0ZXhDb29yZHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMik7XG5cbiAgICBpZiAoZmxpcEN1bGwpIHtcbiAgICAgIGMxbGVuID0gLWMxbGVuO1xuICAgIH1cblxuICAgIGxldCBpMiA9IDA7XG4gICAgbGV0IGkzID0gMDtcbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8PSBzdWJkaXZpc2lvbnMyOyB6KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDw9IHN1YmRpdmlzaW9uczE7IHgrKykge1xuICAgICAgICBjb25zdCB1ID0geCAvIHN1YmRpdmlzaW9uczE7XG4gICAgICAgIGNvbnN0IHYgPSB6IC8gc3ViZGl2aXNpb25zMjtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSBmbGlwQ3VsbCA/IDEgLSB1IDogdTtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICd4LHknOlxuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDBdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMV0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcbiAgICAgICAgICBwb3NpdGlvbnNbaTMgKyAyXSA9IG9mZnNldDtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gMDtcbiAgICAgICAgICBub3JtYWxzW2kzICsgMl0gPSBmbGlwQ3VsbCA/IDEgOiAtMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd4LHonOlxuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDBdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMV0gPSBvZmZzZXQ7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gZmxpcEN1bGwgPyAxIDogLTE7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd5LHonOlxuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDBdID0gb2Zmc2V0O1xuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDFdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IGZsaXBDdWxsID8gMSA6IC0xO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaTIgKz0gMjtcbiAgICAgICAgaTMgKz0gMztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBudW1WZXJ0c0Fjcm9zcyA9IHN1YmRpdmlzaW9uczEgKyAxO1xuICAgIGxldCBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KHN1YmRpdmlzaW9uczEgKiBzdWJkaXZpc2lvbnMyICogNik7XG5cbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8IHN1YmRpdmlzaW9uczI7IHorKykge1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzdWJkaXZpc2lvbnMxOyB4KyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoeiAqIHN1YmRpdmlzaW9uczEgKyB4KSAqIDY7XG4gICAgICAgIC8vIE1ha2UgdHJpYW5nbGUgMSBvZiBxdWFkLlxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMF0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSAoeiArIDEpICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4ICsgMTtcblxuICAgICAgICAvLyBNYWtlIHRyaWFuZ2xlIDIgb2YgcXVhZC5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDRdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeCArIDE7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9ICh6ICsgMCkgKiBudW1WZXJ0c0Fjcm9zcyArIHggKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE9wdGlvbmFsbHksIHVucGFjayBpbmRleGVkIGdlb21ldHJ5XG4gICAgaWYgKHVucGFjaykge1xuICAgICAgY29uc3QgcG9zaXRpb25zMiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAzKTtcbiAgICAgIGNvbnN0IG5vcm1hbHMyID0gbmV3IEZsb2F0MzJBcnJheShpbmRpY2VzLmxlbmd0aCAqIDMpO1xuICAgICAgY29uc3QgdGV4Q29vcmRzMiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAyKTtcblxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbmRpY2VzLmxlbmd0aDsgKyt4KSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW5kaWNlc1t4XTtcbiAgICAgICAgcG9zaXRpb25zMlt4ICogMyArIDBdID0gcG9zaXRpb25zW2luZGV4ICogMyArIDBdO1xuICAgICAgICBwb3NpdGlvbnMyW3ggKiAzICsgMV0gPSBwb3NpdGlvbnNbaW5kZXggKiAzICsgMV07XG4gICAgICAgIHBvc2l0aW9uczJbeCAqIDMgKyAyXSA9IHBvc2l0aW9uc1tpbmRleCAqIDMgKyAyXTtcbiAgICAgICAgbm9ybWFsczJbeCAqIDMgKyAwXSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMF07XG4gICAgICAgIG5vcm1hbHMyW3ggKiAzICsgMV0gPSBub3JtYWxzW2luZGV4ICogMyArIDFdO1xuICAgICAgICBub3JtYWxzMlt4ICogMyArIDJdID0gbm9ybWFsc1tpbmRleCAqIDMgKyAyXTtcbiAgICAgICAgdGV4Q29vcmRzMlt4ICogMiArIDBdID0gdGV4Q29vcmRzW2luZGV4ICogMiArIDBdO1xuICAgICAgICB0ZXhDb29yZHMyW3ggKiAyICsgMV0gPSB0ZXhDb29yZHNbaW5kZXggKiAyICsgMV07XG4gICAgICB9XG5cbiAgICAgIHBvc2l0aW9ucyA9IHBvc2l0aW9uczI7XG4gICAgICBub3JtYWxzID0gbm9ybWFsczI7XG4gICAgICB0ZXhDb29yZHMgPSB0ZXhDb29yZHMyO1xuICAgICAgaW5kaWNlcyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgaWQsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIHBvc2l0aW9ucyxcbiAgICAgICAgbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzLFxuICAgICAgICAuLi4oaW5kaWNlcyA/IHtpbmRpY2VzfSA6IHt9KVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBsYW5lIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3Rvcih7aWQgPSB1aWQoJ3BsYW5lJyksIC4uLm9wdHN9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGlkLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBQbGFuZUdlb21ldHJ5KG9wdHMpXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==