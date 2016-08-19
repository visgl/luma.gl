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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9wbGFuZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztJQUVhLGEsV0FBQSxhOzs7QUFFWDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBT1E7QUFBQSxxRUFBSixFQUFJOztBQUFBLHlCQU5OLElBTU07QUFBQSxRQU5OLElBTU0sNkJBTkMsS0FNRDtBQUFBLDJCQUxOLE1BS007QUFBQSxRQUxOLE1BS00sK0JBTEcsQ0FLSDtBQUFBLDZCQUpOLFFBSU07QUFBQSxRQUpOLFFBSU0saUNBSkssS0FJTDtBQUFBLDJCQUhOLE1BR007QUFBQSxRQUhOLE1BR00sK0JBSEcsS0FHSDtBQUFBLHVCQUZOLEVBRU07QUFBQSxRQUZOLEVBRU0sMkJBRkQsZ0JBQUksZ0JBQUosQ0FFQzs7QUFBQSxRQURILElBQ0c7O0FBQUE7O0FBQ04sUUFBTSxTQUFTLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZjtBQUNBO0FBQ0EsUUFBSSxRQUFRLEtBQUssT0FBTyxDQUFQLElBQVksS0FBakIsQ0FBWjtBQUNBLFFBQU0sUUFBUSxLQUFLLE9BQU8sQ0FBUCxJQUFZLEtBQWpCLENBQWQ7QUFDQTtBQUNBLFFBQU0sZ0JBQWdCLEtBQUssTUFBTSxPQUFPLENBQVAsQ0FBWCxLQUF5QixDQUEvQztBQUNBLFFBQU0sZ0JBQWdCLEtBQUssTUFBTSxPQUFPLENBQVAsQ0FBWCxLQUF5QixDQUEvQztBQUNBLFFBQU0sY0FBYyxDQUFDLGdCQUFnQixDQUFqQixLQUF1QixnQkFBZ0IsQ0FBdkMsQ0FBcEI7O0FBRUEsUUFBSSxZQUFZLElBQUksWUFBSixDQUFpQixjQUFjLENBQS9CLENBQWhCO0FBQ0EsUUFBSSxVQUFVLElBQUksWUFBSixDQUFpQixjQUFjLENBQS9CLENBQWQ7QUFDQSxRQUFJLFlBQVksSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBL0IsQ0FBaEI7O0FBRUEsUUFBSSxRQUFK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QUksQ0FBSixHQUFRLENBQW5CLElBQXdCLFVBQVUsU0FBUSxDQUFSLEdBQVksQ0FBdEIsQ0FBeEI7QUFDQSxtQkFBVyxNQUFJLENBQUosR0FBUSxDQUFuQixJQUF3QixVQUFVLFNBQVEsQ0FBUixHQUFZLENBQXRCLENBQXhCO0FBQ0Q7O0FBRUQsa0JBQVksVUFBWjtBQUNBLGdCQUFVLFFBQVY7QUFDQSxrQkFBWSxVQUFaO0FBQ0EsZ0JBQVUsU0FBVjtBQUNEOztBQTNHSyx5R0E4R0QsSUE5R0M7QUErR0osWUEvR0k7QUFnSEo7QUFDRSw0QkFERjtBQUVFLHdCQUZGO0FBR0U7QUFIRixTQUlNLFVBQVUsRUFBQyxnQkFBRCxFQUFWLEdBQXNCLEVBSjVCO0FBaEhJO0FBdUhQOzs7OztJQUdrQixLOzs7QUFDbkIsd0JBQTBDO0FBQUEseUJBQTdCLEVBQTZCO0FBQUEsUUFBN0IsRUFBNkIsNEJBQXhCLGdCQUFJLE9BQUosQ0FBd0I7O0FBQUEsUUFBUCxJQUFPOztBQUFBOztBQUFBLGlHQUVuQyxJQUZtQztBQUd0QyxZQUhzQztBQUl0QyxnQkFBVSxJQUFJLGFBQUosQ0FBa0IsSUFBbEI7QUFKNEI7QUFNekM7Ozs7O2tCQVBrQixLIiwiZmlsZSI6InBsYW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4uL2NvcmUvZ2VvbWV0cnknO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL2NvcmUvbW9kZWwnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGNsYXNzIFBsYW5lR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgdHlwZSA9ICd4LHknLFxuICAgIG9mZnNldCA9IDAsXG4gICAgZmxpcEN1bGwgPSBmYWxzZSxcbiAgICB1bnBhY2sgPSBmYWxzZSxcbiAgICBpZCA9IHVpZCgncGxhbmUtZ2VvbWV0cnknKSxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IGNvb3JkcyA9IHR5cGUuc3BsaXQoJywnKTtcbiAgICAvLyB3aWR0aCwgaGVpZ2h0XG4gICAgbGV0IGMxbGVuID0gb3B0c1tjb29yZHNbMF0gKyAnbGVuJ107XG4gICAgY29uc3QgYzJsZW4gPSBvcHRzW2Nvb3Jkc1sxXSArICdsZW4nXTtcbiAgICAvLyBzdWJkaXZpc2lvbnNXaWR0aCwgc3ViZGl2aXNpb25zRGVwdGhcbiAgICBjb25zdCBzdWJkaXZpc2lvbnMxID0gb3B0c1snbicgKyBjb29yZHNbMF1dIHx8IDE7XG4gICAgY29uc3Qgc3ViZGl2aXNpb25zMiA9IG9wdHNbJ24nICsgY29vcmRzWzFdXSB8fCAxO1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gKHN1YmRpdmlzaW9uczEgKyAxKSAqIChzdWJkaXZpc2lvbnMyICsgMSk7XG5cbiAgICBsZXQgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCB0ZXhDb29yZHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMik7XG5cbiAgICBpZiAoZmxpcEN1bGwpIHtcbiAgICAgIGMxbGVuID0gLWMxbGVuO1xuICAgIH1cblxuICAgIGxldCBpMiA9IDA7XG4gICAgbGV0IGkzID0gMDtcbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8PSBzdWJkaXZpc2lvbnMyOyB6KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDw9IHN1YmRpdmlzaW9uczE7IHgrKykge1xuICAgICAgICBjb25zdCB1ID0geCAvIHN1YmRpdmlzaW9uczE7XG4gICAgICAgIGNvbnN0IHYgPSB6IC8gc3ViZGl2aXNpb25zMjtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSBmbGlwQ3VsbCA/IDEgLSB1IDogdTtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICd4LHknOlxuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDBdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMV0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcbiAgICAgICAgICBwb3NpdGlvbnNbaTMgKyAyXSA9IG9mZnNldDtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gMDtcbiAgICAgICAgICBub3JtYWxzW2kzICsgMl0gPSBmbGlwQ3VsbCA/IDEgOiAtMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd4LHonOlxuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDBdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMV0gPSBvZmZzZXQ7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gZmxpcEN1bGwgPyAxIDogLTE7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd5LHonOlxuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDBdID0gb2Zmc2V0O1xuICAgICAgICAgIHBvc2l0aW9uc1tpMyArIDFdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgcG9zaXRpb25zW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IGZsaXBDdWxsID8gMSA6IC0xO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaTIgKz0gMjtcbiAgICAgICAgaTMgKz0gMztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBudW1WZXJ0c0Fjcm9zcyA9IHN1YmRpdmlzaW9uczEgKyAxO1xuICAgIGxldCBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KHN1YmRpdmlzaW9uczEgKiBzdWJkaXZpc2lvbnMyICogNik7XG5cbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8IHN1YmRpdmlzaW9uczI7IHorKykge1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzdWJkaXZpc2lvbnMxOyB4KyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoeiAqIHN1YmRpdmlzaW9uczEgKyB4KSAqIDY7XG4gICAgICAgIC8vIE1ha2UgdHJpYW5nbGUgMSBvZiBxdWFkLlxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMF0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSAoeiArIDEpICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4ICsgMTtcblxuICAgICAgICAvLyBNYWtlIHRyaWFuZ2xlIDIgb2YgcXVhZC5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDRdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeCArIDE7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9ICh6ICsgMCkgKiBudW1WZXJ0c0Fjcm9zcyArIHggKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE9wdGlvbmFsbHksIHVucGFjayBpbmRleGVkIGdlb21ldHJ5XG4gICAgaWYgKHVucGFjaykge1xuICAgICAgY29uc3QgcG9zaXRpb25zMiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAzKTtcbiAgICAgIGNvbnN0IG5vcm1hbHMyID0gbmV3IEZsb2F0MzJBcnJheShpbmRpY2VzLmxlbmd0aCAqIDMpO1xuICAgICAgY29uc3QgdGV4Q29vcmRzMiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAyKTtcblxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbmRpY2VzLmxlbmd0aDsgKyt4KSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW5kaWNlc1t4XTtcbiAgICAgICAgcG9zaXRpb25zMlt4ICogMyArIDBdID0gcG9zaXRpb25zW2luZGV4ICogMyArIDBdO1xuICAgICAgICBwb3NpdGlvbnMyW3ggKiAzICsgMV0gPSBwb3NpdGlvbnNbaW5kZXggKiAzICsgMV07XG4gICAgICAgIHBvc2l0aW9uczJbeCAqIDMgKyAyXSA9IHBvc2l0aW9uc1tpbmRleCAqIDMgKyAyXTtcbiAgICAgICAgbm9ybWFsczJbeCAqIDMgKyAwXSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMF07XG4gICAgICAgIG5vcm1hbHMyW3ggKiAzICsgMV0gPSBub3JtYWxzW2luZGV4ICogMyArIDFdO1xuICAgICAgICBub3JtYWxzMlt4ICogMyArIDJdID0gbm9ybWFsc1tpbmRleCAqIDMgKyAyXTtcbiAgICAgICAgdGV4Q29vcmRzMlt4ICogMiArIDBdID0gdGV4Q29vcmRzW2luZGV4ICogMiArIDBdO1xuICAgICAgICB0ZXhDb29yZHMyW3ggKiAyICsgMV0gPSB0ZXhDb29yZHNbaW5kZXggKiAyICsgMV07XG4gICAgICB9XG5cbiAgICAgIHBvc2l0aW9ucyA9IHBvc2l0aW9uczI7XG4gICAgICBub3JtYWxzID0gbm9ybWFsczI7XG4gICAgICB0ZXhDb29yZHMgPSB0ZXhDb29yZHMyO1xuICAgICAgaW5kaWNlcyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgaWQsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIHBvc2l0aW9ucyxcbiAgICAgICAgbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzLFxuICAgICAgICAuLi4oaW5kaWNlcyA/IHtpbmRpY2VzfSA6IHt9KVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBsYW5lIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3Rvcih7aWQgPSB1aWQoJ3BsYW5lJyksIC4uLm9wdHN9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGlkLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBQbGFuZUdlb21ldHJ5KG9wdHMpXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==