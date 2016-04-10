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

    var opts = _objectWithoutProperties(_ref, ['type', 'offset', 'flipCull', 'unpack']);

    _classCallCheck(this, PlaneGeometry);

    var coords = type.split(',');
    // width, height
    var c1len = opts[coords[0] + 'len'];
    var c2len = opts[coords[1] + 'len'];
    // subdivisionsWidth, subdivisionsDepth
    var subdivisions1 = opts['n' + coords[0]] || 1;
    var subdivisions2 = opts['n' + coords[1]] || 1;
    var numVertices = (subdivisions1 + 1) * (subdivisions2 + 1);

    var vertices = new Float32Array(numVertices * 3);
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
            vertices[i3 + 0] = c1len * u - c1len * 0.5;
            vertices[i3 + 1] = c2len * v - c2len * 0.5;
            vertices[i3 + 2] = offset;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 0;
            normals[i3 + 2] = flipCull ? 1 : -1;
            break;

          case 'x,z':
            vertices[i3 + 0] = c1len * u - c1len * 0.5;
            vertices[i3 + 1] = offset;
            vertices[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = flipCull ? 1 : -1;
            normals[i3 + 2] = 0;
            break;

          case 'y,z':
            vertices[i3 + 0] = offset;
            vertices[i3 + 1] = c1len * u - c1len * 0.5;
            vertices[i3 + 2] = c2len * v - c2len * 0.5;

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
      var vertices2 = new Float32Array(indices.length * 3);
      var normals2 = new Float32Array(indices.length * 3);
      var texCoords2 = new Float32Array(indices.length * 2);

      for (var _x3 = 0; _x3 < indices.length; ++_x3) {
        var _index = indices[_x3];
        vertices2[_x3 * 3 + 0] = vertices[_index * 3 + 0];
        vertices2[_x3 * 3 + 1] = vertices[_index * 3 + 1];
        vertices2[_x3 * 3 + 2] = vertices[_index * 3 + 2];
        normals2[_x3 * 3 + 0] = normals[_index * 3 + 0];
        normals2[_x3 * 3 + 1] = normals[_index * 3 + 1];
        normals2[_x3 * 3 + 2] = normals[_index * 3 + 2];
        texCoords2[_x3 * 2 + 0] = texCoords[_index * 2 + 0];
        texCoords2[_x3 * 2 + 1] = texCoords[_index * 2 + 1];
      }

      vertices = vertices2;
      normals = normals2;
      texCoords = texCoords2;
      indices = undefined;
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(PlaneGeometry).call(this, _extends({}, opts, {
      attributes: _extends({
        vertices: vertices,
        normals: normals,
        texCoords: texCoords
      }, indices ? { indices: indices } : {})
    })));
  }

  return PlaneGeometry;
}(_geometry2.default);

var Plane = function (_Model) {
  _inherits(Plane, _Model);

  function Plane(opts) {
    _classCallCheck(this, Plane);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Plane).call(this, _extends({ geometry: new PlaneGeometry(opts) }, opts)));
  }

  return Plane;
}(_model2.default);

exports.default = Plane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3BsYW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0lBRWE7Ozs7Ozs7OztBQU9YLFdBUFcsYUFPWCxHQUVRO3FFQUFKLGtCQUFJOzt5QkFETixLQUNNO1FBRE4saUNBQU8sa0JBQ0Q7MkJBRFEsT0FDUjtRQURRLHFDQUFTLGdCQUNqQjs2QkFEb0IsU0FDcEI7UUFEb0IseUNBQVcsc0JBQy9COzJCQURzQyxPQUN0QztRQURzQyxxQ0FBUyxvQkFDL0M7O1FBRHlELGdGQUN6RDs7MEJBVEcsZUFTSDs7QUFDTixRQUFNLFNBQVMsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFUOztBQURBLFFBR0YsUUFBUSxLQUFLLE9BQU8sQ0FBUCxJQUFZLEtBQVosQ0FBYixDQUhFO0FBSU4sUUFBTSxRQUFRLEtBQUssT0FBTyxDQUFQLElBQVksS0FBWixDQUFiOztBQUpBLFFBTUEsZ0JBQWdCLEtBQUssTUFBTSxPQUFPLENBQVAsQ0FBTixDQUFMLElBQXlCLENBQXpCLENBTmhCO0FBT04sUUFBTSxnQkFBZ0IsS0FBSyxNQUFNLE9BQU8sQ0FBUCxDQUFOLENBQUwsSUFBeUIsQ0FBekIsQ0FQaEI7QUFRTixRQUFNLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBaEIsQ0FBRCxJQUF1QixnQkFBZ0IsQ0FBaEIsQ0FBdkIsQ0FSZDs7QUFVTixRQUFJLFdBQVcsSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBZCxDQUE1QixDQVZFO0FBV04sUUFBSSxVQUFVLElBQUksWUFBSixDQUFpQixjQUFjLENBQWQsQ0FBM0IsQ0FYRTtBQVlOLFFBQUksWUFBWSxJQUFJLFlBQUosQ0FBaUIsY0FBYyxDQUFkLENBQTdCLENBWkU7O0FBY04sUUFBSSxRQUFKLEVBQWM7QUFDWixjQUFRLENBQUMsS0FBRCxDQURJO0tBQWQ7O0FBSUEsUUFBSSxLQUFLLENBQUwsQ0FsQkU7QUFtQk4sUUFBSSxLQUFLLENBQUwsQ0Fu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bWV0cnkgZnJvbSAnLi4vZ2VvbWV0cnknO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL21vZGVsJztcblxuZXhwb3J0IGNsYXNzIFBsYW5lR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgdHlwZSA9ICd4LHknLCBvZmZzZXQgPSAwLCBmbGlwQ3VsbCA9IGZhbHNlLCB1bnBhY2sgPSBmYWxzZSwgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICBjb25zdCBjb29yZHMgPSB0eXBlLnNwbGl0KCcsJyk7XG4gICAgLy8gd2lkdGgsIGhlaWdodFxuICAgIGxldCBjMWxlbiA9IG9wdHNbY29vcmRzWzBdICsgJ2xlbiddO1xuICAgIGNvbnN0IGMybGVuID0gb3B0c1tjb29yZHNbMV0gKyAnbGVuJ107XG4gICAgLy8gc3ViZGl2aXNpb25zV2lkdGgsIHN1YmRpdmlzaW9uc0RlcHRoXG4gICAgY29uc3Qgc3ViZGl2aXNpb25zMSA9IG9wdHNbJ24nICsgY29vcmRzWzBdXSB8fCAxO1xuICAgIGNvbnN0IHN1YmRpdmlzaW9uczIgPSBvcHRzWyduJyArIGNvb3Jkc1sxXV0gfHwgMTtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IChzdWJkaXZpc2lvbnMxICsgMSkgKiAoc3ViZGl2aXNpb25zMiArIDEpO1xuXG4gICAgbGV0IHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCB0ZXhDb29yZHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMik7XG5cbiAgICBpZiAoZmxpcEN1bGwpIHtcbiAgICAgIGMxbGVuID0gLWMxbGVuO1xuICAgIH1cblxuICAgIGxldCBpMiA9IDA7XG4gICAgbGV0IGkzID0gMDtcbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8PSBzdWJkaXZpc2lvbnMyOyB6KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDw9IHN1YmRpdmlzaW9uczE7IHgrKykge1xuICAgICAgICBjb25zdCB1ID0geCAvIHN1YmRpdmlzaW9uczE7XG4gICAgICAgIGNvbnN0IHYgPSB6IC8gc3ViZGl2aXNpb25zMjtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSBmbGlwQ3VsbCA/IDEgLSB1IDogdTtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICd4LHknOlxuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBjMWxlbiAqIHUgLSBjMWxlbiAqIDAuNTtcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDFdID0gYzJsZW4gKiB2IC0gYzJsZW4gKiAwLjU7XG4gICAgICAgICAgdmVydGljZXNbaTMgKyAyXSA9IG9mZnNldDtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gMDtcbiAgICAgICAgICBub3JtYWxzW2kzICsgMl0gPSBmbGlwQ3VsbCA/IDEgOiAtMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd4LHonOlxuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBjMWxlbiAqIHUgLSBjMWxlbiAqIDAuNTtcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDFdID0gb2Zmc2V0O1xuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gZmxpcEN1bGwgPyAxIDogLTE7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd5LHonOlxuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBvZmZzZXQ7XG4gICAgICAgICAgdmVydGljZXNbaTMgKyAxXSA9IGMxbGVuICogdSAtIGMxbGVuICogMC41O1xuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IGZsaXBDdWxsID8gMSA6IC0xO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaTIgKz0gMjtcbiAgICAgICAgaTMgKz0gMztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBudW1WZXJ0c0Fjcm9zcyA9IHN1YmRpdmlzaW9uczEgKyAxO1xuICAgIGxldCBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KHN1YmRpdmlzaW9uczEgKiBzdWJkaXZpc2lvbnMyICogNik7XG5cbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8IHN1YmRpdmlzaW9uczI7IHorKykge1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzdWJkaXZpc2lvbnMxOyB4KyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoeiAqIHN1YmRpdmlzaW9uczEgKyB4KSAqIDY7XG4gICAgICAgIC8vIE1ha2UgdHJpYW5nbGUgMSBvZiBxdWFkLlxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMF0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSAoeiArIDEpICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4ICsgMTtcblxuICAgICAgICAvLyBNYWtlIHRyaWFuZ2xlIDIgb2YgcXVhZC5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDRdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeCArIDE7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9ICh6ICsgMCkgKiBudW1WZXJ0c0Fjcm9zcyArIHggKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE9wdGlvbmFsbHksIHVucGFjayBpbmRleGVkIGdlb21ldHJ5XG4gICAgaWYgKHVucGFjaykge1xuICAgICAgY29uc3QgdmVydGljZXMyID0gbmV3IEZsb2F0MzJBcnJheShpbmRpY2VzLmxlbmd0aCAqIDMpO1xuICAgICAgY29uc3Qgbm9ybWFsczIgPSBuZXcgRmxvYXQzMkFycmF5KGluZGljZXMubGVuZ3RoICogMyk7XG4gICAgICBjb25zdCB0ZXhDb29yZHMyID0gbmV3IEZsb2F0MzJBcnJheShpbmRpY2VzLmxlbmd0aCAqIDIpO1xuXG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGluZGljZXMubGVuZ3RoOyArK3gpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbmRpY2VzW3hdO1xuICAgICAgICB2ZXJ0aWNlczJbeCAqIDMgKyAwXSA9IHZlcnRpY2VzW2luZGV4ICogMyArIDBdO1xuICAgICAgICB2ZXJ0aWNlczJbeCAqIDMgKyAxXSA9IHZlcnRpY2VzW2luZGV4ICogMyArIDFdO1xuICAgICAgICB2ZXJ0aWNlczJbeCAqIDMgKyAyXSA9IHZlcnRpY2VzW2luZGV4ICogMyArIDJdO1xuICAgICAgICBub3JtYWxzMlt4ICogMyArIDBdID0gbm9ybWFsc1tpbmRleCAqIDMgKyAwXTtcbiAgICAgICAgbm9ybWFsczJbeCAqIDMgKyAxXSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMV07XG4gICAgICAgIG5vcm1hbHMyW3ggKiAzICsgMl0gPSBub3JtYWxzW2luZGV4ICogMyArIDJdO1xuICAgICAgICB0ZXhDb29yZHMyW3ggKiAyICsgMF0gPSB0ZXhDb29yZHNbaW5kZXggKiAyICsgMF07XG4gICAgICAgIHRleENvb3JkczJbeCAqIDIgKyAxXSA9IHRleENvb3Jkc1tpbmRleCAqIDIgKyAxXTtcbiAgICAgIH1cblxuICAgICAgdmVydGljZXMgPSB2ZXJ0aWNlczI7XG4gICAgICBub3JtYWxzID0gbm9ybWFsczI7XG4gICAgICB0ZXhDb29yZHMgPSB0ZXhDb29yZHMyO1xuICAgICAgaW5kaWNlcyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICB2ZXJ0aWNlcyxcbiAgICAgICAgbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzLFxuICAgICAgICAuLi4oaW5kaWNlcyA/IHtpbmRpY2VzfSA6IHt9KVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBsYW5lIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgc3VwZXIoe2dlb21ldHJ5OiBuZXcgUGxhbmVHZW9tZXRyeShvcHRzKSwgLi4ub3B0c30pO1xuICB9XG59XG4iXX0=