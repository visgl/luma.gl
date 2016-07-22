'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IcoSphereGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _math = require('../math');

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable comma-spacing, max-statements, complexity */

function noop() {}

var ICO_POSITIONS = [-1, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, 0];
var ICO_INDICES = [3, 4, 5, 3, 5, 1, 3, 1, 0, 3, 0, 4, 4, 0, 2, 4, 2, 5, 2, 0, 1, 5, 2, 1];

var IcoSphereGeometry = exports.IcoSphereGeometry = function (_Geometry) {
  _inherits(IcoSphereGeometry, _Geometry);

  function IcoSphereGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$iterations = _ref.iterations;
    var iterations = _ref$iterations === undefined ? 0 : _ref$iterations;
    var _ref$onAddVertex = _ref.onAddVertex;
    var onAddVertex = _ref$onAddVertex === undefined ? noop : _ref$onAddVertex;

    var opts = _objectWithoutProperties(_ref, ['iterations', 'onAddVertex']);

    _classCallCheck(this, IcoSphereGeometry);

    var PI = Math.PI;
    var PI2 = PI * 2;

    var positions = [].concat(ICO_POSITIONS);
    var indices = [].concat(ICO_INDICES);

    positions.push();
    indices.push();

    var getMiddlePoint = function () {
      var pointMemo = {};

      return function (i1, i2) {
        i1 *= 3;
        i2 *= 3;
        var mini = i1 < i2 ? i1 : i2;
        var maxi = i1 > i2 ? i1 : i2;
        var key = mini + '|' + maxi;

        if (key in pointMemo) {
          return pointMemo[key];
        }

        var x1 = positions[i1];
        var y1 = positions[i1 + 1];
        var z1 = positions[i1 + 2];
        var x2 = positions[i2];
        var y2 = positions[i2 + 1];
        var z2 = positions[i2 + 2];
        var xm = (x1 + x2) / 2;
        var ym = (y1 + y2) / 2;
        var zm = (z1 + z2) / 2;
        var len = Math.sqrt(xm * xm + ym * ym + zm * zm);

        xm /= len;
        ym /= len;
        zm /= len;

        positions.push(xm, ym, zm);

        return pointMemo[key] = positions.length / 3 - 1;
      };
    }();

    for (var i = 0; i < iterations; i++) {
      var indices2 = [];
      for (var j = 0; j < indices.length; j += 3) {
        var a = getMiddlePoint(indices[j + 0], indices[j + 1]);
        var b = getMiddlePoint(indices[j + 1], indices[j + 2]);
        var c = getMiddlePoint(indices[j + 2], indices[j + 0]);

        indices2.push(c, indices[j + 0], a, a, indices[j + 1], b, b, indices[j + 2], c, a, b, c);
      }
      indices = indices2;
    }

    // Calculate texCoords and normals
    var normals = new Array(indices.length * 3);
    var texCoords = new Array(indices.length * 2);

    var l = indices.length;
    for (var _i = l - 3; _i >= 0; _i -= 3) {
      var i1 = indices[_i + 0];
      var i2 = indices[_i + 1];
      var i3 = indices[_i + 2];
      var in1 = i1 * 3;
      var in2 = i2 * 3;
      var in3 = i3 * 3;
      var iu1 = i1 * 2;
      var iu2 = i2 * 2;
      var iu3 = i3 * 2;
      var x1 = positions[in1 + 0];
      var y1 = positions[in1 + 1];
      var z1 = positions[in1 + 2];
      var theta1 = Math.acos(z1 / Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1));
      var phi1 = Math.atan2(y1, x1) + PI;
      var v1 = theta1 / PI;
      var u1 = 1 - phi1 / PI2;
      var x2 = positions[in2 + 0];
      var y2 = positions[in2 + 1];
      var z2 = positions[in2 + 2];
      var theta2 = Math.acos(z2 / Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2));
      var phi2 = Math.atan2(y2, x2) + PI;
      var v2 = theta2 / PI;
      var u2 = 1 - phi2 / PI2;
      var x3 = positions[in3 + 0];
      var y3 = positions[in3 + 1];
      var z3 = positions[in3 + 2];
      var theta3 = Math.acos(z3 / Math.sqrt(x3 * x3 + y3 * y3 + z3 * z3));
      var phi3 = Math.atan2(y3, x3) + PI;
      var v3 = theta3 / PI;
      var u3 = 1 - phi3 / PI2;
      var vec1 = [x3 - x2, y3 - y2, z3 - z2];
      var vec2 = [x1 - x2, y1 - y2, z1 - z2];
      var normal = _math.Vec3.cross(vec1, vec2).$unit();
      var newIndex = void 0;

      if ((u1 === 0 || u2 === 0 || u3 === 0) && (u1 === 0 || u1 > 0.5) && (u2 === 0 || u2 > 0.5) && (u3 === 0 || u3 > 0.5)) {

        positions.push(positions[in1 + 0], positions[in1 + 1], positions[in1 + 2]);
        newIndex = positions.length / 3 - 1;
        indices.push(newIndex);
        texCoords[newIndex * 2 + 0] = 1;
        texCoords[newIndex * 2 + 1] = v1;
        normals[newIndex * 3 + 0] = normal.x;
        normals[newIndex * 3 + 1] = normal.y;
        normals[newIndex * 3 + 2] = normal.z;

        positions.push(positions[in2 + 0], positions[in2 + 1], positions[in2 + 2]);
        newIndex = positions.length / 3 - 1;
        indices.push(newIndex);
        texCoords[newIndex * 2 + 0] = 1;
        texCoords[newIndex * 2 + 1] = v2;
        normals[newIndex * 3 + 0] = normal.x;
        normals[newIndex * 3 + 1] = normal.y;
        normals[newIndex * 3 + 2] = normal.z;

        positions.push(positions[in3 + 0], positions[in3 + 1], positions[in3 + 2]);
        newIndex = positions.length / 3 - 1;
        indices.push(newIndex);
        texCoords[newIndex * 2 + 0] = 1;
        texCoords[newIndex * 2 + 1] = v3;
        normals[newIndex * 3 + 0] = normal.x;
        normals[newIndex * 3 + 1] = normal.y;
        normals[newIndex * 3 + 2] = normal.z;
      }

      normals[in1 + 0] = normals[in2 + 0] = normals[in3 + 0] = normal.x;
      normals[in1 + 1] = normals[in2 + 1] = normals[in3 + 1] = normal.y;
      normals[in1 + 2] = normals[in2 + 2] = normals[in3 + 2] = normal.z;

      texCoords[iu1 + 0] = u1;
      texCoords[iu1 + 1] = v1;

      texCoords[iu2 + 0] = u2;
      texCoords[iu2 + 1] = v2;

      texCoords[iu3 + 0] = u3;
      texCoords[iu3 + 1] = v3;
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(IcoSphereGeometry).call(this, _extends({}, opts, {
      attributes: {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        indices: new Uint16Array(indices)
      }
    })));
  }

  return IcoSphereGeometry;
}(_geometry2.default);

var IcoSphere = function (_Model) {
  _inherits(IcoSphere, _Model);

  function IcoSphere() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, IcoSphere);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(IcoSphere).call(this, _extends({}, opts, {
      geometry: new IcoSphereGeometry(opts)
    })));
  }

  return IcoSphere;
}(_model2.default);

exports.default = IcoSphere;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL2ljby1zcGhlcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLFNBQVMsSUFBVCxHQUFnQixDQUFFOztBQUVsQixJQUFNLGdCQUFnQixDQUFDLENBQUMsQ0FBRixFQUFJLENBQUosRUFBTSxDQUFOLEVBQVMsQ0FBVCxFQUFXLENBQVgsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQWtCLENBQWxCLEVBQW9CLENBQUMsQ0FBckIsRUFBd0IsQ0FBeEIsRUFBMEIsQ0FBMUIsRUFBNEIsQ0FBNUIsRUFBK0IsQ0FBL0IsRUFBaUMsQ0FBQyxDQUFsQyxFQUFvQyxDQUFwQyxFQUF1QyxDQUF2QyxFQUF5QyxDQUF6QyxFQUEyQyxDQUEzQyxDQUF0QjtBQUNBLElBQU0sY0FBYyxDQUFDLENBQUQsRUFBRyxDQUFILEVBQUssQ0FBTCxFQUFPLENBQVAsRUFBUyxDQUFULEVBQVcsQ0FBWCxFQUFhLENBQWIsRUFBZSxDQUFmLEVBQWlCLENBQWpCLEVBQW1CLENBQW5CLEVBQXFCLENBQXJCLEVBQXVCLENBQXZCLEVBQXlCLENBQXpCLEVBQTJCLENBQTNCLEVBQTZCLENBQTdCLEVBQStCLENBQS9CLEVBQWlDLENBQWpDLEVBQW1DLENBQW5DLEVBQXFDLENBQXJDLEVBQXVDLENBQXZDLEVBQXlDLENBQXpDLEVBQTJDLENBQTNDLEVBQTZDLENBQTdDLEVBQStDLENBQS9DLENBQXBCOztJQUVhLGlCLFdBQUEsaUI7OztBQUVYLCtCQUFnRTtBQUFBLHFFQUFKLEVBQUk7O0FBQUEsK0JBQW5ELFVBQW1EO0FBQUEsUUFBbkQsVUFBbUQsbUNBQXRDLENBQXNDO0FBQUEsZ0NBQW5DLFdBQW1DO0FBQUEsUUFBbkMsV0FBbUMsb0NBQXJCLElBQXFCOztBQUFBLFFBQVosSUFBWTs7QUFBQTs7QUFDOUQsUUFBTSxLQUFLLEtBQUssRUFBaEI7QUFDQSxRQUFNLE1BQU0sS0FB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by1zcGhlcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vZ2VvbWV0cnknO1xuaW1wb3J0IHtWZWMzfSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9tb2RlbCc7XG5cbi8qIGVzbGludC1kaXNhYmxlIGNvbW1hLXNwYWNpbmcsIG1heC1zdGF0ZW1lbnRzLCBjb21wbGV4aXR5ICovXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBJQ09fUE9TSVRJT05TID0gWy0xLDAsMCwgMCwxLDAsIDAsMCwtMSwgMCwwLDEsIDAsLTEsMCwgMSwwLDBdO1xuY29uc3QgSUNPX0lORElDRVMgPSBbMyw0LDUsMyw1LDEsMywxLDAsMywwLDQsNCwwLDIsNCwyLDUsMiwwLDEsNSwyLDFdO1xuXG5leHBvcnQgY2xhc3MgSWNvU3BoZXJlR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgY29uc3RydWN0b3Ioe2l0ZXJhdGlvbnMgPSAwLCBvbkFkZFZlcnRleCA9IG5vb3AsIC4uLm9wdHN9ID0ge30pIHtcbiAgICBjb25zdCBQSSA9IE1hdGguUEk7XG4gICAgY29uc3QgUEkyID0gUEkgKiAyO1xuXG4gICAgY29uc3QgcG9zaXRpb25zID0gWy4uLklDT19QT1NJVElPTlNdO1xuICAgIGxldCBpbmRpY2VzID0gWy4uLklDT19JTkRJQ0VTXTtcblxuICAgIHBvc2l0aW9ucy5wdXNoKCk7XG4gICAgaW5kaWNlcy5wdXNoKCk7XG5cbiAgICBjb25zdCBnZXRNaWRkbGVQb2ludCA9IChmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHBvaW50TWVtbyA9IHt9O1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24oaTEsIGkyKSB7XG4gICAgICAgIGkxICo9IDM7XG4gICAgICAgIGkyICo9IDM7XG4gICAgICAgIGNvbnN0IG1pbmkgPSBpMSA8IGkyID8gaTEgOiBpMjtcbiAgICAgICAgY29uc3QgbWF4aSA9IGkxID4gaTIgPyBpMSA6IGkyO1xuICAgICAgICBjb25zdCBrZXkgPSBtaW5pICsgJ3wnICsgbWF4aTtcblxuICAgICAgICBpZiAoa2V5IGluIHBvaW50TWVtbykge1xuICAgICAgICAgIHJldHVybiBwb2ludE1lbW9ba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHgxID0gcG9zaXRpb25zW2kxXTtcbiAgICAgICAgY29uc3QgeTEgPSBwb3NpdGlvbnNbaTEgKyAxXTtcbiAgICAgICAgY29uc3QgejEgPSBwb3NpdGlvbnNbaTEgKyAyXTtcbiAgICAgICAgY29uc3QgeDIgPSBwb3NpdGlvbnNbaTJdO1xuICAgICAgICBjb25zdCB5MiA9IHBvc2l0aW9uc1tpMiArIDFdO1xuICAgICAgICBjb25zdCB6MiA9IHBvc2l0aW9uc1tpMiArIDJdO1xuICAgICAgICBsZXQgeG0gPSAoeDEgKyB4MikgLyAyO1xuICAgICAgICBsZXQgeW0gPSAoeTEgKyB5MikgLyAyO1xuICAgICAgICBsZXQgem0gPSAoejEgKyB6MikgLyAyO1xuICAgICAgICBjb25zdCBsZW4gPSBNYXRoLnNxcnQoeG0gKiB4bSArIHltICogeW0gKyB6bSAqIHptKTtcblxuICAgICAgICB4bSAvPSBsZW47XG4gICAgICAgIHltIC89IGxlbjtcbiAgICAgICAgem0gLz0gbGVuO1xuXG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKHhtLCB5bSwgem0pO1xuXG4gICAgICAgIHJldHVybiAocG9pbnRNZW1vW2tleV0gPSAocG9zaXRpb25zLmxlbmd0aCAvIDMgLSAxKSk7XG4gICAgICB9O1xuICAgIH0oKSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZXJhdGlvbnM7IGkrKykge1xuICAgICAgY29uc3QgaW5kaWNlczIgPSBbXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5kaWNlcy5sZW5ndGg7IGogKz0gMykge1xuICAgICAgICBjb25zdCBhID0gZ2V0TWlkZGxlUG9pbnQoaW5kaWNlc1tqICsgMF0sIGluZGljZXNbaiArIDFdKTtcbiAgICAgICAgY29uc3QgYiA9IGdldE1pZGRsZVBvaW50KGluZGljZXNbaiArIDFdLCBpbmRpY2VzW2ogKyAyXSk7XG4gICAgICAgIGNvbnN0IGMgPSBnZXRNaWRkbGVQb2ludChpbmRpY2VzW2ogKyAyXSwgaW5kaWNlc1tqICsgMF0pO1xuXG4gICAgICAgIGluZGljZXMyLnB1c2goXG4gICAgICAgICAgYywgaW5kaWNlc1tqICsgMF0sIGEsXG4gICAgICAgICAgYSwgaW5kaWNlc1tqICsgMV0sIGIsXG4gICAgICAgICAgYiwgaW5kaWNlc1tqICsgMl0sIGMsXG4gICAgICAgICAgYSwgYiwgYyk7XG4gICAgICB9XG4gICAgICBpbmRpY2VzID0gaW5kaWNlczI7XG4gICAgfVxuXG4gICAgLy8gQ2FsY3VsYXRlIHRleENvb3JkcyBhbmQgbm9ybWFsc1xuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAzKTtcbiAgICBjb25zdCB0ZXhDb29yZHMgPSBuZXcgQXJyYXkoaW5kaWNlcy5sZW5ndGggKiAyKTtcblxuICAgIGNvbnN0IGwgPSBpbmRpY2VzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gbCAtIDM7IGkgPj0gMDsgaSAtPSAzKSB7XG4gICAgICBjb25zdCBpMSA9IGluZGljZXNbaSArIDBdO1xuICAgICAgY29uc3QgaTIgPSBpbmRpY2VzW2kgKyAxXTtcbiAgICAgIGNvbnN0IGkzID0gaW5kaWNlc1tpICsgMl07XG4gICAgICBjb25zdCBpbjEgPSBpMSAqIDM7XG4gICAgICBjb25zdCBpbjIgPSBpMiAqIDM7XG4gICAgICBjb25zdCBpbjMgPSBpMyAqIDM7XG4gICAgICBjb25zdCBpdTEgPSBpMSAqIDI7XG4gICAgICBjb25zdCBpdTIgPSBpMiAqIDI7XG4gICAgICBjb25zdCBpdTMgPSBpMyAqIDI7XG4gICAgICBjb25zdCB4MSA9IHBvc2l0aW9uc1tpbjEgKyAwXTtcbiAgICAgIGNvbnN0IHkxID0gcG9zaXRpb25zW2luMSArIDFdO1xuICAgICAgY29uc3QgejEgPSBwb3NpdGlvbnNbaW4xICsgMl07XG4gICAgICBjb25zdCB0aGV0YTEgPSBNYXRoLmFjb3MoejEgLyBNYXRoLnNxcnQoeDEgKiB4MSArIHkxICogeTEgKyB6MSAqIHoxKSk7XG4gICAgICBjb25zdCBwaGkxID0gTWF0aC5hdGFuMih5MSwgeDEpICsgUEk7XG4gICAgICBjb25zdCB2MSA9IHRoZXRhMSAvIFBJO1xuICAgICAgY29uc3QgdTEgPSAxIC0gcGhpMSAvIFBJMjtcbiAgICAgIGNvbnN0IHgyID0gcG9zaXRpb25zW2luMiArIDBdO1xuICAgICAgY29uc3QgeTIgPSBwb3NpdGlvbnNbaW4yICsgMV07XG4gICAgICBjb25zdCB6MiA9IHBvc2l0aW9uc1tpbjIgKyAyXTtcbiAgICAgIGNvbnN0IHRoZXRhMiA9IE1hdGguYWNvcyh6MiAvIE1hdGguc3FydCh4MiAqIHgyICsgeTIgKiB5MiArIHoyICogejIpKTtcbiAgICAgIGNvbnN0IHBoaTIgPSBNYXRoLmF0YW4yKHkyLCB4MikgKyBQSTtcbiAgICAgIGNvbnN0IHYyID0gdGhldGEyIC8gUEk7XG4gICAgICBjb25zdCB1MiA9IDEgLSBwaGkyIC8gUEkyO1xuICAgICAgY29uc3QgeDMgPSBwb3NpdGlvbnNbaW4zICsgMF07XG4gICAgICBjb25zdCB5MyA9IHBvc2l0aW9uc1tpbjMgKyAxXTtcbiAgICAgIGNvbnN0IHozID0gcG9zaXRpb25zW2luMyArIDJdO1xuICAgICAgY29uc3QgdGhldGEzID0gTWF0aC5hY29zKHozIC8gTWF0aC5zcXJ0KHgzICogeDMgKyB5MyAqIHkzICsgejMgKiB6MykpO1xuICAgICAgY29uc3QgcGhpMyA9IE1hdGguYXRhbjIoeTMsIHgzKSArIFBJO1xuICAgICAgY29uc3QgdjMgPSB0aGV0YTMgLyBQSTtcbiAgICAgIGNvbnN0IHUzID0gMSAtIHBoaTMgLyBQSTI7XG4gICAgICBjb25zdCB2ZWMxID0gW1xuICAgICAgICB4MyAtIHgyLFxuICAgICAgICB5MyAtIHkyLFxuICAgICAgICB6MyAtIHoyXG4gICAgICBdO1xuICAgICAgY29uc3QgdmVjMiA9IFtcbiAgICAgICAgeDEgLSB4MixcbiAgICAgICAgeTEgLSB5MixcbiAgICAgICAgejEgLSB6MlxuICAgICAgXTtcbiAgICAgIGNvbnN0IG5vcm1hbCA9IFZlYzMuY3Jvc3ModmVjMSwgdmVjMikuJHVuaXQoKTtcbiAgICAgIGxldCBuZXdJbmRleDtcblxuICAgICAgaWYgKCh1MSA9PT0gMCB8fCB1MiA9PT0gMCB8fCB1MyA9PT0gMCkgJiZcbiAgICAgICAgICAodTEgPT09IDAgfHwgdTEgPiAwLjUpICYmXG4gICAgICAgICAgICAodTIgPT09IDAgfHwgdTIgPiAwLjUpICYmXG4gICAgICAgICAgICAgICh1MyA9PT0gMCB8fCB1MyA+IDAuNSkpIHtcblxuICAgICAgICBwb3NpdGlvbnMucHVzaChcbiAgICAgICAgICBwb3NpdGlvbnNbaW4xICsgMF0sXG4gICAgICAgICAgcG9zaXRpb25zW2luMSArIDFdLFxuICAgICAgICAgIHBvc2l0aW9uc1tpbjEgKyAyXVxuICAgICAgICApO1xuICAgICAgICBuZXdJbmRleCA9IHBvc2l0aW9ucy5sZW5ndGggLyAzIC0gMTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKG5ld0luZGV4KTtcbiAgICAgICAgdGV4Q29vcmRzW25ld0luZGV4ICogMiArIDBdID0gMTtcbiAgICAgICAgdGV4Q29vcmRzW25ld0luZGV4ICogMiArIDFdID0gdjE7XG4gICAgICAgIG5vcm1hbHNbbmV3SW5kZXggKiAzICsgMF0gPSBub3JtYWwueDtcbiAgICAgICAgbm9ybWFsc1tuZXdJbmRleCAqIDMgKyAxXSA9IG5vcm1hbC55O1xuICAgICAgICBub3JtYWxzW25ld0luZGV4ICogMyArIDJdID0gbm9ybWFsLno7XG5cbiAgICAgICAgcG9zaXRpb25zLnB1c2goXG4gICAgICAgICAgcG9zaXRpb25zW2luMiArIDBdLFxuICAgICAgICAgIHBvc2l0aW9uc1tpbjIgKyAxXSxcbiAgICAgICAgICBwb3NpdGlvbnNbaW4yICsgMl1cbiAgICAgICAgKTtcbiAgICAgICAgbmV3SW5kZXggPSBwb3NpdGlvbnMubGVuZ3RoIC8gMyAtIDE7XG4gICAgICAgIGluZGljZXMucHVzaChuZXdJbmRleCk7XG4gICAgICAgIHRleENvb3Jkc1tuZXdJbmRleCAqIDIgKyAwXSA9IDE7XG4gICAgICAgIHRleENvb3Jkc1tuZXdJbmRleCAqIDIgKyAxXSA9IHYyO1xuICAgICAgICBub3JtYWxzW25ld0luZGV4ICogMyArIDBdID0gbm9ybWFsLng7XG4gICAgICAgIG5vcm1hbHNbbmV3SW5kZXggKiAzICsgMV0gPSBub3JtYWwueTtcbiAgICAgICAgbm9ybWFsc1tuZXdJbmRleCAqIDMgKyAyXSA9IG5vcm1hbC56O1xuXG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKFxuICAgICAgICAgIHBvc2l0aW9uc1tpbjMgKyAwXSxcbiAgICAgICAgICBwb3NpdGlvbnNbaW4zICsgMV0sXG4gICAgICAgICAgcG9zaXRpb25zW2luMyArIDJdXG4gICAgICAgICk7XG4gICAgICAgIG5ld0luZGV4ID0gcG9zaXRpb25zLmxlbmd0aCAvIDMgLSAxO1xuICAgICAgICBpbmRpY2VzLnB1c2gobmV3SW5kZXgpO1xuICAgICAgICB0ZXhDb29yZHNbbmV3SW5kZXggKiAyICsgMF0gPSAxO1xuICAgICAgICB0ZXhDb29yZHNbbmV3SW5kZXggKiAyICsgMV0gPSB2MztcbiAgICAgICAgbm9ybWFsc1tuZXdJbmRleCAqIDMgKyAwXSA9IG5vcm1hbC54O1xuICAgICAgICBub3JtYWxzW25ld0luZGV4ICogMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICAgIG5vcm1hbHNbbmV3SW5kZXggKiAzICsgMl0gPSBub3JtYWwuejtcbiAgICAgIH1cblxuICAgICAgbm9ybWFsc1tpbjEgKyAwXSA9IG5vcm1hbHNbaW4yICsgMF0gPSBub3JtYWxzW2luMyArIDBdID0gbm9ybWFsLng7XG4gICAgICBub3JtYWxzW2luMSArIDFdID0gbm9ybWFsc1tpbjIgKyAxXSA9IG5vcm1hbHNbaW4zICsgMV0gPSBub3JtYWwueTtcbiAgICAgIG5vcm1hbHNbaW4xICsgMl0gPSBub3JtYWxzW2luMiArIDJdID0gbm9ybWFsc1tpbjMgKyAyXSA9IG5vcm1hbC56O1xuXG4gICAgICB0ZXhDb29yZHNbaXUxICsgMF0gPSB1MTtcbiAgICAgIHRleENvb3Jkc1tpdTEgKyAxXSA9IHYxO1xuXG4gICAgICB0ZXhDb29yZHNbaXUyICsgMF0gPSB1MjtcbiAgICAgIHRleENvb3Jkc1tpdTIgKyAxXSA9IHYyO1xuXG4gICAgICB0ZXhDb29yZHNbaXUzICsgMF0gPSB1MztcbiAgICAgIHRleENvb3Jkc1tpdTMgKyAxXSA9IHYzO1xuICAgIH1cblxuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIHBvc2l0aW9uczogbmV3IEZsb2F0MzJBcnJheShwb3NpdGlvbnMpLFxuICAgICAgICBub3JtYWxzOiBuZXcgRmxvYXQzMkFycmF5KG5vcm1hbHMpLFxuICAgICAgICB0ZXhDb29yZHM6IG5ldyBGbG9hdDMyQXJyYXkodGV4Q29vcmRzKSxcbiAgICAgICAgaW5kaWNlczogbmV3IFVpbnQxNkFycmF5KGluZGljZXMpXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSWNvU3BoZXJlIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBJY29TcGhlcmVHZW9tZXRyeShvcHRzKVxuICAgIH0pO1xuICB9XG59XG4iXX0=