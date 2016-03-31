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

    for (var z = 0; z < subdivisions2; z++) {
      for (var x = 0; x < subdivisions1; x++) {
        var index = (z * subdivisions1 + x) * 6;
        // Make triangle 1 of quad.
        indices[index + 0] = (z + 0) * numVertsAcross + x;
        indices[index + 1] = (z + 1) * numVertsAcross + x;
        indices[index + 2] = (z + 0) * numVertsAcross + x + 1;

        // Make triangle 2 of quad.
        indices[index + 3] = (z + 1) * numVertsAcross + x;
        indices[index + 4] = (z + 1) * numVertsAcross + x + 1;
        indices[index + 5] = (z + 0) * numVertsAcross + x + 1;
      }
    }

    // Optionally, unpack indexed geometry
    if (unpack) {
      var vertices2 = new Float32Array(indices.length * 3);
      var normals2 = new Float32Array(indices.length * 3);
      var texCoords2 = new Float32Array(indices.length * 2);

      for (var x = 0; x < indices.length; ++x) {
        var index = indices[x];
        vertices2[x * 3 + 0] = vertices[index * 3 + 0];
        vertices2[x * 3 + 1] = vertices[index * 3 + 1];
        vertices2[x * 3 + 2] = vertices[index * 3 + 2];
        normals2[x * 3 + 0] = normals[index * 3 + 0];
        normals2[x * 3 + 1] = normals[index * 3 + 1];
        normals2[x * 3 + 2] = normals[index * 3 + 2];
        texCoords2[x * 2 + 0] = texCoords[index * 2 + 0];
        texCoords2[x * 2 + 1] = texCoords[index * 2 + 1];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3BsYW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdhOzs7Ozs7Ozs7QUFPWCxXQVBXLGFBT1gsR0FFUTtxRUFBSixrQkFBSTs7eUJBRE4sS0FDTTtRQUROLGlDQUFPLGtCQUNEOzJCQURRLE9BQ1I7UUFEUSxxQ0FBUyxnQkFDakI7NkJBRG9CLFNBQ3BCO1FBRG9CLHlDQUFXLHNCQUMvQjsyQkFEc0MsT0FDdEM7UUFEc0MscUNBQVMsb0JBQy9DOztRQUR5RCxnRkFDekQ7OzBCQVRHLGVBU0g7O0FBQ04sUUFBTSxTQUFTLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBVDs7QUFEQSxRQUdGLFFBQVEsS0FBSyxPQUFPLENBQVAsSUFBWSxLQUFaLENBQWIsQ0FIRTtBQUlOLFFBQU0sUUFBUSxLQUFLLE9BQU8sQ0FBUCxJQUFZLEtBQVosQ0FBYjs7QUFKQSxRQU1BLGdCQUFnQixLQUFLLE1BQU0sT0FBTyxDQUFQLENBQU4sQ0FBTCxJQUF5QixDQUF6QixDQU5oQjtBQU9OLFFBQU0sZ0JBQWdCLEtBQUssTUFBTSxPQUFPLENBQVAsQ0FBTixDQUFMLElBQXlCLENBQXpCLENBUGhCO0FBUU4sUUFBTSxjQUFjLENBQUMsZ0JBQWdCLENBQWhCLENBQUQsSUFBdUIsZ0JBQWdCLENBQWhCLENBQXZCLENBUmQ7O0FBVU4sUUFBSSxXQUFXLElBQUksWUFBSixDQUFpQixjQUFjLENBQWQsQ0FBNUIsQ0FWRTtBQVdOLFFBQUksVUFBVSxJQUFJLFlBQUosQ0FBaUIsY0FBYyxDQUFkLENBQTNCLENBWEU7QUFZTixRQUFJLFlBQVksSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBZCxDQUE3QixDQVpFOztBQWNOLFFBQUksUUFBSixFQUFjO0FBQ1osY0FBUSxDQUFDLEtBQUQsQ0FESTtLQUFkOztBQUlBLFFBQUksS0FBSyxDQUFMLENBbEJFO0FBbUJOLFFBQUksS0FBSyxDQUFMLENBbkJFO0FBb0JO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b20gJy4uL2dlb21ldHJ5JztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9tb2RlbCc7XG5cbmV4cG9ydCBjbGFzcyBQbGFuZUdlb21ldHJ5IGV4dGVuZHMgR2VvbWV0cnkge1xuXG4gIC8vIFByaW1pdGl2ZXMgaW5zcGlyZWQgYnkgVERMIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC93ZWJnbHNhbXBsZXMvLFxuICAvLyBjb3B5cmlnaHQgMjAxMSBHb29nbGUgSW5jLiBuZXcgQlNEIExpY2Vuc2VcbiAgLy8gKGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvYnNkLWxpY2Vuc2UucGhwKS5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIGNvbXBsZXhpdHkgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSwgbWF4LXN0YXRlbWVudHMgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIHR5cGUgPSAneCx5Jywgb2Zmc2V0ID0gMCwgZmxpcEN1bGwgPSBmYWxzZSwgdW5wYWNrID0gZmFsc2UsIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgY29uc3QgY29vcmRzID0gdHlwZS5zcGxpdCgnLCcpO1xuICAgIC8vIHdpZHRoLCBoZWlnaHRcbiAgICBsZXQgYzFsZW4gPSBvcHRzW2Nvb3Jkc1swXSArICdsZW4nXTtcbiAgICBjb25zdCBjMmxlbiA9IG9wdHNbY29vcmRzWzFdICsgJ2xlbiddO1xuICAgIC8vIHN1YmRpdmlzaW9uc1dpZHRoLCBzdWJkaXZpc2lvbnNEZXB0aFxuICAgIGNvbnN0IHN1YmRpdmlzaW9uczEgPSBvcHRzWyduJyArIGNvb3Jkc1swXV0gfHwgMTtcbiAgICBjb25zdCBzdWJkaXZpc2lvbnMyID0gb3B0c1snbicgKyBjb29yZHNbMV1dIHx8IDE7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSAoc3ViZGl2aXNpb25zMSArIDEpICogKHN1YmRpdmlzaW9uczIgKyAxKTtcblxuICAgIGxldCB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBsZXQgbm9ybWFscyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBsZXQgdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDIpO1xuXG4gICAgaWYgKGZsaXBDdWxsKSB7XG4gICAgICBjMWxlbiA9IC1jMWxlbjtcbiAgICB9XG5cbiAgICBsZXQgaTIgPSAwO1xuICAgIGxldCBpMyA9IDA7XG4gICAgZm9yIChsZXQgeiA9IDA7IHogPD0gc3ViZGl2aXNpb25zMjsgeisrKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8PSBzdWJkaXZpc2lvbnMxOyB4KyspIHtcbiAgICAgICAgY29uc3QgdSA9IHggLyBzdWJkaXZpc2lvbnMxO1xuICAgICAgICBjb25zdCB2ID0geiAvIHN1YmRpdmlzaW9uczI7XG4gICAgICAgIHRleENvb3Jkc1tpMiArIDBdID0gZmxpcEN1bGwgPyAxIC0gdSA6IHU7XG4gICAgICAgIHRleENvb3Jkc1tpMiArIDFdID0gdjtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAneCx5JzpcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDBdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgdmVydGljZXNbaTMgKyAxXSA9IGMybGVuICogdiAtIGMybGVuICogMC41O1xuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMl0gPSBvZmZzZXQ7XG5cbiAgICAgICAgICBub3JtYWxzW2kzICsgMF0gPSAwO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gZmxpcEN1bGwgPyAxIDogLTE7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAneCx6JzpcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDBdID0gYzFsZW4gKiB1IC0gYzFsZW4gKiAwLjU7XG4gICAgICAgICAgdmVydGljZXNbaTMgKyAxXSA9IG9mZnNldDtcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDJdID0gYzJsZW4gKiB2IC0gYzJsZW4gKiAwLjU7XG5cbiAgICAgICAgICBub3JtYWxzW2kzICsgMF0gPSAwO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IGZsaXBDdWxsID8gMSA6IC0xO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IDA7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAneSx6JzpcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDBdID0gb2Zmc2V0O1xuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMV0gPSBjMWxlbiAqIHUgLSBjMWxlbiAqIDAuNTtcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDJdID0gYzJsZW4gKiB2IC0gYzJsZW4gKiAwLjU7XG5cbiAgICAgICAgICBub3JtYWxzW2kzICsgMF0gPSBmbGlwQ3VsbCA/IDEgOiAtMTtcbiAgICAgICAgICBub3JtYWxzW2kzICsgMV0gPSAwO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IDA7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGkyICs9IDI7XG4gICAgICAgIGkzICs9IDM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbnVtVmVydHNBY3Jvc3MgPSBzdWJkaXZpc2lvbnMxICsgMTtcbiAgICBsZXQgaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheShzdWJkaXZpc2lvbnMxICogc3ViZGl2aXNpb25zMiAqIDYpO1xuXG4gICAgZm9yIChsZXQgeiA9IDA7IHogPCBzdWJkaXZpc2lvbnMyOyB6KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgc3ViZGl2aXNpb25zMTsgeCsrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gKHogKiBzdWJkaXZpc2lvbnMxICsgeCkgKiA2O1xuICAgICAgICAvLyBNYWtlIHRyaWFuZ2xlIDEgb2YgcXVhZC5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDBdID0gKHogKyAwKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDFdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDJdID0gKHogKyAwKSAqIG51bVZlcnRzQWNyb3NzICsgeCArIDE7XG5cbiAgICAgICAgLy8gTWFrZSB0cmlhbmdsZSAyIG9mIHF1YWQuXG4gICAgICAgIGluZGljZXNbaW5kZXggKyAzXSA9ICh6ICsgMSkgKiBudW1WZXJ0c0Fjcm9zcyArIHg7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA0XSA9ICh6ICsgMSkgKiBudW1WZXJ0c0Fjcm9zcyArIHggKyAxO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNV0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4ICsgMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPcHRpb25hbGx5LCB1bnBhY2sgaW5kZXhlZCBnZW9tZXRyeVxuICAgIGlmICh1bnBhY2spIHtcbiAgICAgIGNvbnN0IHZlcnRpY2VzMiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAzKTtcbiAgICAgIGNvbnN0IG5vcm1hbHMyID0gbmV3IEZsb2F0MzJBcnJheShpbmRpY2VzLmxlbmd0aCAqIDMpO1xuICAgICAgY29uc3QgdGV4Q29vcmRzMiA9IG5ldyBGbG9hdDMyQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAyKTtcblxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbmRpY2VzLmxlbmd0aDsgKyt4KSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW5kaWNlc1t4XTtcbiAgICAgICAgdmVydGljZXMyW3ggKiAzICsgMF0gPSB2ZXJ0aWNlc1tpbmRleCAqIDMgKyAwXTtcbiAgICAgICAgdmVydGljZXMyW3ggKiAzICsgMV0gPSB2ZXJ0aWNlc1tpbmRleCAqIDMgKyAxXTtcbiAgICAgICAgdmVydGljZXMyW3ggKiAzICsgMl0gPSB2ZXJ0aWNlc1tpbmRleCAqIDMgKyAyXTtcbiAgICAgICAgbm9ybWFsczJbeCAqIDMgKyAwXSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMF07XG4gICAgICAgIG5vcm1hbHMyW3ggKiAzICsgMV0gPSBub3JtYWxzW2luZGV4ICogMyArIDFdO1xuICAgICAgICBub3JtYWxzMlt4ICogMyArIDJdID0gbm9ybWFsc1tpbmRleCAqIDMgKyAyXTtcbiAgICAgICAgdGV4Q29vcmRzMlt4ICogMiArIDBdID0gdGV4Q29vcmRzW2luZGV4ICogMiArIDBdO1xuICAgICAgICB0ZXhDb29yZHMyW3ggKiAyICsgMV0gPSB0ZXhDb29yZHNbaW5kZXggKiAyICsgMV07XG4gICAgICB9XG5cbiAgICAgIHZlcnRpY2VzID0gdmVydGljZXMyO1xuICAgICAgbm9ybWFscyA9IG5vcm1hbHMyO1xuICAgICAgdGV4Q29vcmRzID0gdGV4Q29vcmRzMjtcbiAgICAgIGluZGljZXMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgdmVydGljZXMsXG4gICAgICAgIG5vcm1hbHMsXG4gICAgICAgIHRleENvb3JkcyxcbiAgICAgICAgLi4uKGluZGljZXMgPyB7aW5kaWNlc30gOiB7fSlcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQbGFuZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHN1cGVyKHtnZW9tZXRyeTogbmV3IFBsYW5lR2VvbWV0cnkob3B0cyksIC4uLm9wdHN9KTtcbiAgfVxufVxuIl19