'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.IcoSphereGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _math = require('../math');

var _geometry = require('../core/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../core/model');

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9pY28tc3BoZXJlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBRUEsU0FBUyxJQUFULEdBQWdCLENBQUU7O0FBRWxCLElBQU0sZ0JBQWdCLENBQUMsQ0FBQyxDQUFGLEVBQUksQ0FBSixFQUFNLENBQU4sRUFBUyxDQUFULEVBQVcsQ0FBWCxFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsRUFBa0IsQ0FBbEIsRUFBb0IsQ0FBQyxDQUFyQixFQUF3QixDQUF4QixFQUEwQixDQUExQixFQUE0QixDQUE1QixFQUErQixDQUEvQixFQUFpQyxDQUFDLENBQWxDLEVBQW9DLENBQXBDLEVBQXVDLENBQXZDLEVBQXlDLENBQXpDLEVBQTJDLENBQTNDLENBQXRCO0FBQ0EsSUFBTSxjQUFjLENBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxDQUFMLEVBQU8sQ0FBUCxFQUFTLENBQVQsRUFBVyxDQUFYLEVBQWEsQ0FBYixFQUFlLENBQWYsRUFBaUIsQ0FBakIsRUFBbUIsQ0FBbkIsRUFBcUIsQ0FBckIsRUFBdUIsQ0FBdkIsRUFBeUIsQ0FBekIsRUFBMkIsQ0FBM0IsRUFBNkIsQ0FBN0IsRUFBK0IsQ0FBL0IsRUFBaUMsQ0FBakMsRUFBbUMsQ0FBbkMsRUFBcUMsQ0FBckMsRUFBdUMsQ0FBdkMsRUFBeUMsQ0FBekMsRUFBMkMsQ0FBM0MsRUFBNkMsQ0FBN0MsRUFBK0MsQ0FBL0MsQ0FBcEI7O0lBRWEsaUIsV0FBQSxpQjs7O0FBRVgsK0JBQWdFO0FBQUEscUVBQUosRUFBSTs7QUFBQSwrQkFBbkQsVUFBbUQ7QUFBQSxRQUFuRCxVQUFtRCxtQ0FBdEMsQ0FBc0M7QUFBQSxnQ0FBbkMsV0FBbUM7QUFBQSxRQUFuQyxXQUFtQyxvQ0FBckIsSUFBcUI7O0FBQUEsUUFBWixJQUFZOztBQUFBOztBQUM5RCxRQUFNLEtBQUssS0FBSyxFQUFoQjtBQUNBLFFBQU0sTUFB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ZmlsZSI6Imljby1zcGhlcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1ZlYzN9IGZyb20gJy4uL21hdGgnO1xuaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4uL2NvcmUvZ2VvbWV0cnknO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL2NvcmUvbW9kZWwnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBjb21tYS1zcGFjaW5nLCBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgSUNPX1BPU0lUSU9OUyA9IFstMSwwLDAsIDAsMSwwLCAwLDAsLTEsIDAsMCwxLCAwLC0xLDAsIDEsMCwwXTtcbmNvbnN0IElDT19JTkRJQ0VTID0gWzMsNCw1LDMsNSwxLDMsMSwwLDMsMCw0LDQsMCwyLDQsMiw1LDIsMCwxLDUsMiwxXTtcblxuZXhwb3J0IGNsYXNzIEljb1NwaGVyZUdlb21ldHJ5IGV4dGVuZHMgR2VvbWV0cnkge1xuXG4gIGNvbnN0cnVjdG9yKHtpdGVyYXRpb25zID0gMCwgb25BZGRWZXJ0ZXggPSBub29wLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgY29uc3QgUEkgPSBNYXRoLlBJO1xuICAgIGNvbnN0IFBJMiA9IFBJICogMjtcblxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IFsuLi5JQ09fUE9TSVRJT05TXTtcbiAgICBsZXQgaW5kaWNlcyA9IFsuLi5JQ09fSU5ESUNFU107XG5cbiAgICBwb3NpdGlvbnMucHVzaCgpO1xuICAgIGluZGljZXMucHVzaCgpO1xuXG4gICAgY29uc3QgZ2V0TWlkZGxlUG9pbnQgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBwb2ludE1lbW8gPSB7fTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGkxLCBpMikge1xuICAgICAgICBpMSAqPSAzO1xuICAgICAgICBpMiAqPSAzO1xuICAgICAgICBjb25zdCBtaW5pID0gaTEgPCBpMiA/IGkxIDogaTI7XG4gICAgICAgIGNvbnN0IG1heGkgPSBpMSA+IGkyID8gaTEgOiBpMjtcbiAgICAgICAgY29uc3Qga2V5ID0gbWluaSArICd8JyArIG1heGk7XG5cbiAgICAgICAgaWYgKGtleSBpbiBwb2ludE1lbW8pIHtcbiAgICAgICAgICByZXR1cm4gcG9pbnRNZW1vW2tleV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB4MSA9IHBvc2l0aW9uc1tpMV07XG4gICAgICAgIGNvbnN0IHkxID0gcG9zaXRpb25zW2kxICsgMV07XG4gICAgICAgIGNvbnN0IHoxID0gcG9zaXRpb25zW2kxICsgMl07XG4gICAgICAgIGNvbnN0IHgyID0gcG9zaXRpb25zW2kyXTtcbiAgICAgICAgY29uc3QgeTIgPSBwb3NpdGlvbnNbaTIgKyAxXTtcbiAgICAgICAgY29uc3QgejIgPSBwb3NpdGlvbnNbaTIgKyAyXTtcbiAgICAgICAgbGV0IHhtID0gKHgxICsgeDIpIC8gMjtcbiAgICAgICAgbGV0IHltID0gKHkxICsgeTIpIC8gMjtcbiAgICAgICAgbGV0IHptID0gKHoxICsgejIpIC8gMjtcbiAgICAgICAgY29uc3QgbGVuID0gTWF0aC5zcXJ0KHhtICogeG0gKyB5bSAqIHltICsgem0gKiB6bSk7XG5cbiAgICAgICAgeG0gLz0gbGVuO1xuICAgICAgICB5bSAvPSBsZW47XG4gICAgICAgIHptIC89IGxlbjtcblxuICAgICAgICBwb3NpdGlvbnMucHVzaCh4bSwgeW0sIHptKTtcblxuICAgICAgICByZXR1cm4gKHBvaW50TWVtb1trZXldID0gKHBvc2l0aW9ucy5sZW5ndGggLyAzIC0gMSkpO1xuICAgICAgfTtcbiAgICB9KCkpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVyYXRpb25zOyBpKyspIHtcbiAgICAgIGNvbnN0IGluZGljZXMyID0gW107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluZGljZXMubGVuZ3RoOyBqICs9IDMpIHtcbiAgICAgICAgY29uc3QgYSA9IGdldE1pZGRsZVBvaW50KGluZGljZXNbaiArIDBdLCBpbmRpY2VzW2ogKyAxXSk7XG4gICAgICAgIGNvbnN0IGIgPSBnZXRNaWRkbGVQb2ludChpbmRpY2VzW2ogKyAxXSwgaW5kaWNlc1tqICsgMl0pO1xuICAgICAgICBjb25zdCBjID0gZ2V0TWlkZGxlUG9pbnQoaW5kaWNlc1tqICsgMl0sIGluZGljZXNbaiArIDBdKTtcblxuICAgICAgICBpbmRpY2VzMi5wdXNoKFxuICAgICAgICAgIGMsIGluZGljZXNbaiArIDBdLCBhLFxuICAgICAgICAgIGEsIGluZGljZXNbaiArIDFdLCBiLFxuICAgICAgICAgIGIsIGluZGljZXNbaiArIDJdLCBjLFxuICAgICAgICAgIGEsIGIsIGMpO1xuICAgICAgfVxuICAgICAgaW5kaWNlcyA9IGluZGljZXMyO1xuICAgIH1cblxuICAgIC8vIENhbGN1bGF0ZSB0ZXhDb29yZHMgYW5kIG5vcm1hbHNcbiAgICBjb25zdCBub3JtYWxzID0gbmV3IEFycmF5KGluZGljZXMubGVuZ3RoICogMyk7XG4gICAgY29uc3QgdGV4Q29vcmRzID0gbmV3IEFycmF5KGluZGljZXMubGVuZ3RoICogMik7XG5cbiAgICBjb25zdCBsID0gaW5kaWNlcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IGwgLSAzOyBpID49IDA7IGkgLT0gMykge1xuICAgICAgY29uc3QgaTEgPSBpbmRpY2VzW2kgKyAwXTtcbiAgICAgIGNvbnN0IGkyID0gaW5kaWNlc1tpICsgMV07XG4gICAgICBjb25zdCBpMyA9IGluZGljZXNbaSArIDJdO1xuICAgICAgY29uc3QgaW4xID0gaTEgKiAzO1xuICAgICAgY29uc3QgaW4yID0gaTIgKiAzO1xuICAgICAgY29uc3QgaW4zID0gaTMgKiAzO1xuICAgICAgY29uc3QgaXUxID0gaTEgKiAyO1xuICAgICAgY29uc3QgaXUyID0gaTIgKiAyO1xuICAgICAgY29uc3QgaXUzID0gaTMgKiAyO1xuICAgICAgY29uc3QgeDEgPSBwb3NpdGlvbnNbaW4xICsgMF07XG4gICAgICBjb25zdCB5MSA9IHBvc2l0aW9uc1tpbjEgKyAxXTtcbiAgICAgIGNvbnN0IHoxID0gcG9zaXRpb25zW2luMSArIDJdO1xuICAgICAgY29uc3QgdGhldGExID0gTWF0aC5hY29zKHoxIC8gTWF0aC5zcXJ0KHgxICogeDEgKyB5MSAqIHkxICsgejEgKiB6MSkpO1xuICAgICAgY29uc3QgcGhpMSA9IE1hdGguYXRhbjIoeTEsIHgxKSArIFBJO1xuICAgICAgY29uc3QgdjEgPSB0aGV0YTEgLyBQSTtcbiAgICAgIGNvbnN0IHUxID0gMSAtIHBoaTEgLyBQSTI7XG4gICAgICBjb25zdCB4MiA9IHBvc2l0aW9uc1tpbjIgKyAwXTtcbiAgICAgIGNvbnN0IHkyID0gcG9zaXRpb25zW2luMiArIDFdO1xuICAgICAgY29uc3QgejIgPSBwb3NpdGlvbnNbaW4yICsgMl07XG4gICAgICBjb25zdCB0aGV0YTIgPSBNYXRoLmFjb3MoejIgLyBNYXRoLnNxcnQoeDIgKiB4MiArIHkyICogeTIgKyB6MiAqIHoyKSk7XG4gICAgICBjb25zdCBwaGkyID0gTWF0aC5hdGFuMih5MiwgeDIpICsgUEk7XG4gICAgICBjb25zdCB2MiA9IHRoZXRhMiAvIFBJO1xuICAgICAgY29uc3QgdTIgPSAxIC0gcGhpMiAvIFBJMjtcbiAgICAgIGNvbnN0IHgzID0gcG9zaXRpb25zW2luMyArIDBdO1xuICAgICAgY29uc3QgeTMgPSBwb3NpdGlvbnNbaW4zICsgMV07XG4gICAgICBjb25zdCB6MyA9IHBvc2l0aW9uc1tpbjMgKyAyXTtcbiAgICAgIGNvbnN0IHRoZXRhMyA9IE1hdGguYWNvcyh6MyAvIE1hdGguc3FydCh4MyAqIHgzICsgeTMgKiB5MyArIHozICogejMpKTtcbiAgICAgIGNvbnN0IHBoaTMgPSBNYXRoLmF0YW4yKHkzLCB4MykgKyBQSTtcbiAgICAgIGNvbnN0IHYzID0gdGhldGEzIC8gUEk7XG4gICAgICBjb25zdCB1MyA9IDEgLSBwaGkzIC8gUEkyO1xuICAgICAgY29uc3QgdmVjMSA9IFtcbiAgICAgICAgeDMgLSB4MixcbiAgICAgICAgeTMgLSB5MixcbiAgICAgICAgejMgLSB6MlxuICAgICAgXTtcbiAgICAgIGNvbnN0IHZlYzIgPSBbXG4gICAgICAgIHgxIC0geDIsXG4gICAgICAgIHkxIC0geTIsXG4gICAgICAgIHoxIC0gejJcbiAgICAgIF07XG4gICAgICBjb25zdCBub3JtYWwgPSBWZWMzLmNyb3NzKHZlYzEsIHZlYzIpLiR1bml0KCk7XG4gICAgICBsZXQgbmV3SW5kZXg7XG5cbiAgICAgIGlmICgodTEgPT09IDAgfHwgdTIgPT09IDAgfHwgdTMgPT09IDApICYmXG4gICAgICAgICAgKHUxID09PSAwIHx8IHUxID4gMC41KSAmJlxuICAgICAgICAgICAgKHUyID09PSAwIHx8IHUyID4gMC41KSAmJlxuICAgICAgICAgICAgICAodTMgPT09IDAgfHwgdTMgPiAwLjUpKSB7XG5cbiAgICAgICAgcG9zaXRpb25zLnB1c2goXG4gICAgICAgICAgcG9zaXRpb25zW2luMSArIDBdLFxuICAgICAgICAgIHBvc2l0aW9uc1tpbjEgKyAxXSxcbiAgICAgICAgICBwb3NpdGlvbnNbaW4xICsgMl1cbiAgICAgICAgKTtcbiAgICAgICAgbmV3SW5kZXggPSBwb3NpdGlvbnMubGVuZ3RoIC8gMyAtIDE7XG4gICAgICAgIGluZGljZXMucHVzaChuZXdJbmRleCk7XG4gICAgICAgIHRleENvb3Jkc1tuZXdJbmRleCAqIDIgKyAwXSA9IDE7XG4gICAgICAgIHRleENvb3Jkc1tuZXdJbmRleCAqIDIgKyAxXSA9IHYxO1xuICAgICAgICBub3JtYWxzW25ld0luZGV4ICogMyArIDBdID0gbm9ybWFsLng7XG4gICAgICAgIG5vcm1hbHNbbmV3SW5kZXggKiAzICsgMV0gPSBub3JtYWwueTtcbiAgICAgICAgbm9ybWFsc1tuZXdJbmRleCAqIDMgKyAyXSA9IG5vcm1hbC56O1xuXG4gICAgICAgIHBvc2l0aW9ucy5wdXNoKFxuICAgICAgICAgIHBvc2l0aW9uc1tpbjIgKyAwXSxcbiAgICAgICAgICBwb3NpdGlvbnNbaW4yICsgMV0sXG4gICAgICAgICAgcG9zaXRpb25zW2luMiArIDJdXG4gICAgICAgICk7XG4gICAgICAgIG5ld0luZGV4ID0gcG9zaXRpb25zLmxlbmd0aCAvIDMgLSAxO1xuICAgICAgICBpbmRpY2VzLnB1c2gobmV3SW5kZXgpO1xuICAgICAgICB0ZXhDb29yZHNbbmV3SW5kZXggKiAyICsgMF0gPSAxO1xuICAgICAgICB0ZXhDb29yZHNbbmV3SW5kZXggKiAyICsgMV0gPSB2MjtcbiAgICAgICAgbm9ybWFsc1tuZXdJbmRleCAqIDMgKyAwXSA9IG5vcm1hbC54O1xuICAgICAgICBub3JtYWxzW25ld0luZGV4ICogMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICAgIG5vcm1hbHNbbmV3SW5kZXggKiAzICsgMl0gPSBub3JtYWwuejtcblxuICAgICAgICBwb3NpdGlvbnMucHVzaChcbiAgICAgICAgICBwb3NpdGlvbnNbaW4zICsgMF0sXG4gICAgICAgICAgcG9zaXRpb25zW2luMyArIDFdLFxuICAgICAgICAgIHBvc2l0aW9uc1tpbjMgKyAyXVxuICAgICAgICApO1xuICAgICAgICBuZXdJbmRleCA9IHBvc2l0aW9ucy5sZW5ndGggLyAzIC0gMTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKG5ld0luZGV4KTtcbiAgICAgICAgdGV4Q29vcmRzW25ld0luZGV4ICogMiArIDBdID0gMTtcbiAgICAgICAgdGV4Q29vcmRzW25ld0luZGV4ICogMiArIDFdID0gdjM7XG4gICAgICAgIG5vcm1hbHNbbmV3SW5kZXggKiAzICsgMF0gPSBub3JtYWwueDtcbiAgICAgICAgbm9ybWFsc1tuZXdJbmRleCAqIDMgKyAxXSA9IG5vcm1hbC55O1xuICAgICAgICBub3JtYWxzW25ld0luZGV4ICogMyArIDJdID0gbm9ybWFsLno7XG4gICAgICB9XG5cbiAgICAgIG5vcm1hbHNbaW4xICsgMF0gPSBub3JtYWxzW2luMiArIDBdID0gbm9ybWFsc1tpbjMgKyAwXSA9IG5vcm1hbC54O1xuICAgICAgbm9ybWFsc1tpbjEgKyAxXSA9IG5vcm1hbHNbaW4yICsgMV0gPSBub3JtYWxzW2luMyArIDFdID0gbm9ybWFsLnk7XG4gICAgICBub3JtYWxzW2luMSArIDJdID0gbm9ybWFsc1tpbjIgKyAyXSA9IG5vcm1hbHNbaW4zICsgMl0gPSBub3JtYWwuejtcblxuICAgICAgdGV4Q29vcmRzW2l1MSArIDBdID0gdTE7XG4gICAgICB0ZXhDb29yZHNbaXUxICsgMV0gPSB2MTtcblxuICAgICAgdGV4Q29vcmRzW2l1MiArIDBdID0gdTI7XG4gICAgICB0ZXhDb29yZHNbaXUyICsgMV0gPSB2MjtcblxuICAgICAgdGV4Q29vcmRzW2l1MyArIDBdID0gdTM7XG4gICAgICB0ZXhDb29yZHNbaXUzICsgMV0gPSB2MztcbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBwb3NpdGlvbnM6IG5ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zKSxcbiAgICAgICAgbm9ybWFsczogbmV3IEZsb2F0MzJBcnJheShub3JtYWxzKSxcbiAgICAgICAgdGV4Q29vcmRzOiBuZXcgRmxvYXQzMkFycmF5KHRleENvb3JkcyksXG4gICAgICAgIGluZGljZXM6IG5ldyBVaW50MTZBcnJheShpbmRpY2VzKVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEljb1NwaGVyZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGdlb21ldHJ5OiBuZXcgSWNvU3BoZXJlR2VvbWV0cnkob3B0cylcbiAgICB9KTtcbiAgfVxufVxuIl19