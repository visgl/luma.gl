'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SphereGeometry = undefined;

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

var SphereGeometry = exports.SphereGeometry = function (_Geometry) {
  _inherits(SphereGeometry, _Geometry);

  // Primitives inspired by TDL http://code.google.com/p/webglsamples/,
  // copyright 2011 Google Inc. new BSD License
  // (http://www.opensource.org/licenses/bsd-license.php).
  /* eslint-disable max-statements, complexity */

  function SphereGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$nlat = _ref.nlat;
    var nlat = _ref$nlat === undefined ? 10 : _ref$nlat;
    var _ref$nlong = _ref.nlong;
    var nlong = _ref$nlong === undefined ? 10 : _ref$nlong;
    var _ref$radius = _ref.radius;
    var radius = _ref$radius === undefined ? 1 : _ref$radius;
    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)('sphere-geometry') : _ref$id;

    var opts = _objectWithoutProperties(_ref, ['nlat', 'nlong', 'radius', 'id']);

    _classCallCheck(this, SphereGeometry);

    var startLat = 0;
    var endLat = Math.PI;
    var latRange = endLat - startLat;
    var startLong = 0;
    var endLong = 2 * Math.PI;
    var longRange = endLong - startLong;
    var numVertices = (nlat + 1) * (nlong + 1);

    if (typeof radius === 'number') {
      (function () {
        var value = radius;
        radius = function radius(n1, n2, n3, u, v) {
          return value;
        };
      })();
    }

    var positions = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nlat * nlong * 6);

    // Create positions, normals and texCoords
    for (var y = 0; y <= nlat; y++) {
      for (var x = 0; x <= nlong; x++) {

        var u = x / nlong;
        var v = y / nlat;

        var index = x + y * (nlong + 1);
        var i2 = index * 2;
        var i3 = index * 3;

        var theta = longRange * u;
        var phi = latRange * v;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        var ux = cosTheta * sinPhi;
        var uy = cosPhi;
        var uz = sinTheta * sinPhi;

        var r = radius(ux, uy, uz, u, v);

        positions[i3 + 0] = r * ux;
        positions[i3 + 1] = r * uy;
        positions[i3 + 2] = r * uz;

        normals[i3 + 0] = ux;
        normals[i3 + 1] = uy;
        normals[i3 + 2] = uz;

        texCoords[i2 + 0] = u;
        texCoords[i2 + 1] = v;
      }
    }

    // Create indices
    var numVertsAround = nlat + 1;
    for (var _x2 = 0; _x2 < nlat; _x2++) {
      for (var _y = 0; _y < nlong; _y++) {
        var _index = (_x2 * nlong + _y) * 6;

        indices[_index + 0] = _y * numVertsAround + _x2;
        indices[_index + 1] = _y * numVertsAround + _x2 + 1;
        indices[_index + 2] = (_y + 1) * numVertsAround + _x2;

        indices[_index + 3] = (_y + 1) * numVertsAround + _x2;
        indices[_index + 4] = _y * numVertsAround + _x2 + 1;
        indices[_index + 5] = (_y + 1) * numVertsAround + _x2 + 1;
      }
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SphereGeometry).call(this, _extends({}, opts, {
      id: id,
      attributes: {
        positions: positions,
        indices: indices,
        normals: normals,
        texCoords: texCoords
      }
    })));
  }

  return SphereGeometry;
}(_geometry2.default);

var Sphere = function (_Model) {
  _inherits(Sphere, _Model);

  function Sphere() {
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2$id = _ref2.id;
    var id = _ref2$id === undefined ? (0, _utils.uid)('sphere') : _ref2$id;

    var opts = _objectWithoutProperties(_ref2, ['id']);

    _classCallCheck(this, Sphere);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Sphere).call(this, _extends({}, opts, {
      id: id,
      geometry: new SphereGeometry(opts)
    })));
  }

  return Sphere;
}(_model2.default);

exports.default = Sphere;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3NwaGVyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztJQUVhLGMsV0FBQSxjOzs7Ozs7OztBQU1YLDRCQU1RO0FBQUEscUVBQUosRUFBSTs7QUFBQSx5QkFMTixJQUtNO0FBQUEsUUFMTixJQUtNLDZCQUxDLEVBS0Q7QUFBQSwwQkFKTixLQUlNO0FBQUEsUUFKTixLQUlNLDhCQUpFLEVBSUY7QUFBQSwyQkFITixNQUdNO0FBQUEsUUFITixNQUdNLCtCQUhHLENBR0g7QUFBQSx1QkFGTixFQUVNO0FBQUEsUUFGTixFQUVNLDJCQUZELGdCQUFJLGlCQUFKLENBRUM7O0FBQUEsUUFESCxJQUNHOztBQUFBOztBQUNOLFFBQU0sV0FBVyxDQUFqQjtBQUNBLFFBQU0sU0FBUyxLQUFLLEVBQXBCO0FBQ0EsUUFBTSxXQUFXLFNBQVMsUUFBMUI7QUFDQSxRQUFNLFlBQVksQ0FBbEI7QUFDQSxRQUFNLFVBQVUsSUFBSSxLQUFLLEVBQXpCO0FBQ0EsUUFBTSxZQUFZLFVBQVUsU0FBNUI7QUFDQSxRQUFNLGNBQWMsQ0FBQyxPQUFPLENBQVIsS0FBYyxRQUFRLENBQXRCLENBQXBCOztBQUVBLFFBQUksT0FBTyxNQUFQLEtBQWtCLFFBQXRCLEVBQWdDO0FBQUE7QUFDOUIsWUFBTSxRQUFRLE1BQWQ7QUFDQSxpQkFBUyxnQkFBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixDQUFyQixFQUF3QixDQUF4QixFQUEyQjtBQUNsQyxpQkFBTyxLQUFQO0FBQ0QsU0FGRDtBQUY4QjtBQUsvQjs7QUFFRCxRQUFNLFlBQVksSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBL0IsQ0FBbEI7QUFDQSxRQUFNLFVBQVUsSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBL0IsQ0FBaEI7QUFDQSxRQUFNLFlBQVksSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBL0IsQ0FBbEI7QUFD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QUFBLFFBQVosSUFBWTs7QUFBQTs7QUFBQSxrR0FFekMsSUFGeUM7QUFHNUMsWUFINEM7QUFJNUMsZ0JBQVUsSUFBSSxjQUFKLENBQW1CLElBQW5CO0FBSmtDO0FBTS9DOzs7OztrQkFQa0IsTSIsImZpbGUiOiJzcGhlcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vZ2VvbWV0cnknO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL21vZGVsJztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBTcGhlcmVHZW9tZXRyeSBleHRlbmRzIEdlb21ldHJ5IHtcblxuICAvLyBQcmltaXRpdmVzIGluc3BpcmVkIGJ5IFRETCBodHRwOi8vY29kZS5nb29nbGUuY29tL3Avd2ViZ2xzYW1wbGVzLyxcbiAgLy8gY29weXJpZ2h0IDIwMTEgR29vZ2xlIEluYy4gbmV3IEJTRCBMaWNlbnNlXG4gIC8vIChodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL2JzZC1saWNlbnNlLnBocCkuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBjb21wbGV4aXR5ICovXG4gIGNvbnN0cnVjdG9yKHtcbiAgICBubGF0ID0gMTAsXG4gICAgbmxvbmcgPSAxMCxcbiAgICByYWRpdXMgPSAxLFxuICAgIGlkID0gdWlkKCdzcGhlcmUtZ2VvbWV0cnknKSxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IHN0YXJ0TGF0ID0gMDtcbiAgICBjb25zdCBlbmRMYXQgPSBNYXRoLlBJO1xuICAgIGNvbnN0IGxhdFJhbmdlID0gZW5kTGF0IC0gc3RhcnRMYXQ7XG4gICAgY29uc3Qgc3RhcnRMb25nID0gMDtcbiAgICBjb25zdCBlbmRMb25nID0gMiAqIE1hdGguUEk7XG4gICAgY29uc3QgbG9uZ1JhbmdlID0gZW5kTG9uZyAtIHN0YXJ0TG9uZztcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IChubGF0ICsgMSkgKiAobmxvbmcgKyAxKTtcblxuICAgIGlmICh0eXBlb2YgcmFkaXVzID09PSAnbnVtYmVyJykge1xuICAgICAgY29uc3QgdmFsdWUgPSByYWRpdXM7XG4gICAgICByYWRpdXMgPSBmdW5jdGlvbihuMSwgbjIsIG4zLCB1LCB2KSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMyk7XG4gICAgY29uc3QgdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDIpO1xuICAgIGNvbnN0IGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkobmxhdCAqIG5sb25nICogNik7XG5cbiAgICAvLyBDcmVhdGUgcG9zaXRpb25zLCBub3JtYWxzIGFuZCB0ZXhDb29yZHNcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8PSBubGF0OyB5KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDw9IG5sb25nOyB4KyspIHtcblxuICAgICAgICBjb25zdCB1ID0geCAvIG5sb25nO1xuICAgICAgICBjb25zdCB2ID0geSAvIG5sYXQ7XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSB4ICsgeSAqIChubG9uZyArIDEpO1xuICAgICAgICBjb25zdCBpMiA9IGluZGV4ICogMjtcbiAgICAgICAgY29uc3QgaTMgPSBpbmRleCAqIDM7XG5cbiAgICAgICAgY29uc3QgdGhldGEgPSBsb25nUmFuZ2UgKiB1O1xuICAgICAgICBjb25zdCBwaGkgPSBsYXRSYW5nZSAqIHY7XG4gICAgICAgIGNvbnN0IHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuICAgICAgICBjb25zdCBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICAgICAgY29uc3Qgc2luUGhpID0gTWF0aC5zaW4ocGhpKTtcbiAgICAgICAgY29uc3QgY29zUGhpID0gTWF0aC5jb3MocGhpKTtcbiAgICAgICAgY29uc3QgdXggPSBjb3NUaGV0YSAqIHNpblBoaTtcbiAgICAgICAgY29uc3QgdXkgPSBjb3NQaGk7XG4gICAgICAgIGNvbnN0IHV6ID0gc2luVGhldGEgKiBzaW5QaGk7XG5cbiAgICAgICAgY29uc3QgciA9IHJhZGl1cyh1eCwgdXksIHV6LCB1LCB2KTtcblxuICAgICAgICBwb3NpdGlvbnNbaTMgKyAwXSA9IHIgKiB1eDtcbiAgICAgICAgcG9zaXRpb25zW2kzICsgMV0gPSByICogdXk7XG4gICAgICAgIHBvc2l0aW9uc1tpMyArIDJdID0gciAqIHV6O1xuXG4gICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IHV4O1xuICAgICAgICBub3JtYWxzW2kzICsgMV0gPSB1eTtcbiAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gdXo7XG5cbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSB1O1xuICAgICAgICB0ZXhDb29yZHNbaTIgKyAxXSA9IHY7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGluZGljZXNcbiAgICBjb25zdCBudW1WZXJ0c0Fyb3VuZCA9IG5sYXQgKyAxO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDwgbmxhdDsgeCsrKSB7XG4gICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IG5sb25nOyB5KyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoeCAqIG5sb25nICsgeSkgKiA2O1xuXG4gICAgICAgIGluZGljZXNbaW5kZXggKyAwXSA9IHkgKiBudW1WZXJ0c0Fyb3VuZCArIHg7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAxXSA9IHkgKiBudW1WZXJ0c0Fyb3VuZCArIHggKyAxO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSAoeSArIDEpICogbnVtVmVydHNBcm91bmQgKyB4O1xuXG4gICAgICAgIGluZGljZXNbaW5kZXggKyAzXSA9ICh5ICsgMSkgKiBudW1WZXJ0c0Fyb3VuZCArIHg7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA0XSA9IHkgKiBudW1WZXJ0c0Fyb3VuZCArIHggKyAxO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNV0gPSAoeSArIDEpICogbnVtVmVydHNBcm91bmQgKyB4ICsgMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgaWQsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIHBvc2l0aW9uczogcG9zaXRpb25zLFxuICAgICAgICBpbmRpY2VzOiBpbmRpY2VzLFxuICAgICAgICBub3JtYWxzOiBub3JtYWxzLFxuICAgICAgICB0ZXhDb29yZHM6IHRleENvb3Jkc1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNwaGVyZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Ioe2lkID0gdWlkKCdzcGhlcmUnKSwgLi4ub3B0c30gPSB7fSkge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBpZCxcbiAgICAgIGdlb21ldHJ5OiBuZXcgU3BoZXJlR2VvbWV0cnkob3B0cylcbiAgICB9KTtcbiAgfVxufVxuIl19