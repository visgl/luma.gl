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

    var opts = _objectWithoutProperties(_ref, ['nlat', 'nlong', 'radius']);

    _classCallCheck(this, SphereGeometry);

    var startLat = 0;
    var endLat = Math.PI;
    var latRange = endLat - startLat;
    var startLong = 0;
    var endLong = 2 * Math.PI;
    var longRange = endLong - startLong;
    var numVertices = (nlat + 1) * (nlong + 1);

    if (typeof radius === 'number') {
      var value = radius;
      radius = function radius(n1, n2, n3, u, v) {
        return value;
      };
    }

    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nlat * nlong * 6);

    // Create vertices, normals and texCoords
    for (var y = 0; y <= nlat; y++) {
      for (var x = 0; x <= nlong; x++) {

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

        var u = x / nlong;
        var v = y / nlat;

        vertices[i3 + 0] = r * ux;
        vertices[i3 + 1] = r * uy;
        vertices[i3 + 2] = r * uz;

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
      attributes: {
        vertices: vertices,
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

  function Sphere(opts) {
    _classCallCheck(this, Sphere);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Sphere).call(this, _extends({ geometry: new SphereGeometry(opts) }, opts)));
  }

  return Sphere;
}(_model2.default);

exports.default = Sphere;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3NwaGVyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztJQUVhOzs7Ozs7OztBQU1YLFdBTlcsY0FNWCxHQUErRDtxRUFBSixrQkFBSTs7eUJBQWxELEtBQWtEO1FBQWxELGlDQUFPLGVBQTJDOzBCQUF2QyxNQUF1QztRQUF2QyxtQ0FBUSxnQkFBK0I7MkJBQTNCLE9BQTJCO1FBQTNCLHFDQUFTLGdCQUFrQjs7UUFBWixtRUFBWTs7MEJBTnBELGdCQU1vRDs7QUFDN0QsUUFBTSxXQUFXLENBQVgsQ0FEdUQ7QUFFN0QsUUFBTSxTQUFTLEtBQUssRUFBTCxDQUY4QztBQUc3RCxRQUFNLFdBQVcsU0FBUyxRQUFULENBSDRDO0FBSTdELFFBQU0sWUFBWSxDQUFaLENBSnVEO0FBSzdELFFBQU0sVUFBVSxJQUFJLEtBQUssRUFBTCxDQUx5QztBQU03RCxRQUFNLFlBQVksVUFBVSxTQUFWLENBTjJDO0FBTzdELFFBQU0sY0FBYyxDQUFDLE9BQU8sQ0FBUCxDQUFELElBQWMsUUFBUSxDQUFSLENBQWQsQ0FQeUM7O0FBUzdELFFBQUksT0FBTyxNQUFQLEtBQWtCLFFBQWxCLEVBQTRCO0FBQzlCLFVBQUksUUFBUSxNQUFSLENBRDBCO0FBRTlCLGVBQVMsZ0JBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsQ0FBckIsRUFBd0IsQ0FBeEIsRUFBMkI7QUFDbEMsZUFBTyxLQUFQLENBRGtDO09BQTNCLENBRnFCO0tBQWhDOztBQU9BLFFBQU0sV0FBVyxJQUFJLFlBQUosQ0FBaUIsY0FBYyxDQUFkLENBQTVCLENBaEJ1RDtBQWlCN0QsUUFBTSxVQUFVLElBQUksWUFBSixDQUFpQixjQUFjLENBQWQsQ0FBM0IsQ0FqQnVEO0FBa0I3RCxRQUFNLFlBQVksSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBZCxDQUE3QixDQWxCdUQ7QUFtQjdELFFBQU0sVUFBVSxJQUFJ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LENBQUQsR0FBVSxjQUFWLEdBQTJCLEdBQTNCLEdBQStCLENBQS9CLENBVFM7T0FBaEM7S0FERjs7a0VBakVTLHdDQWdGSjtBQUNILGtCQUFZO0FBQ1Ysa0JBQVUsUUFBVjtBQUNBLGlCQUFTLE9BQVQ7QUFDQSxpQkFBUyxPQUFUO0FBQ0EsbUJBQVcsU0FBWDtPQUpGO1NBM0UyRDtHQUEvRDs7U0FOVzs7O0lBMkZROzs7QUFDbkIsV0FEbUIsTUFDbkIsQ0FBWSxJQUFaLEVBQWtCOzBCQURDLFFBQ0Q7O2tFQURDLDhCQUVWLFVBQVUsSUFBSSxjQUFKLENBQW1CLElBQW5CLENBQVYsSUFBdUMsUUFEOUI7R0FBbEI7O1NBRG1CIiwiZmlsZSI6InNwaGVyZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW9tZXRyeSBmcm9tICcuLi9nZW9tZXRyeSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vbW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgU3BoZXJlR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICBjb25zdHJ1Y3Rvcih7bmxhdCA9IDEwLCBubG9uZyA9IDEwLCByYWRpdXMgPSAxLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgY29uc3Qgc3RhcnRMYXQgPSAwO1xuICAgIGNvbnN0IGVuZExhdCA9IE1hdGguUEk7XG4gICAgY29uc3QgbGF0UmFuZ2UgPSBlbmRMYXQgLSBzdGFydExhdDtcbiAgICBjb25zdCBzdGFydExvbmcgPSAwO1xuICAgIGNvbnN0IGVuZExvbmcgPSAyICogTWF0aC5QSTtcbiAgICBjb25zdCBsb25nUmFuZ2UgPSBlbmRMb25nIC0gc3RhcnRMb25nO1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gKG5sYXQgKyAxKSAqIChubG9uZyArIDEpO1xuXG4gICAgaWYgKHR5cGVvZiByYWRpdXMgPT09ICdudW1iZXInKSB7XG4gICAgICB2YXIgdmFsdWUgPSByYWRpdXM7XG4gICAgICByYWRpdXMgPSBmdW5jdGlvbihuMSwgbjIsIG4zLCB1LCB2KSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMyk7XG4gICAgY29uc3Qgbm9ybWFscyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBjb25zdCB0ZXhDb29yZHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMik7XG4gICAgY29uc3QgaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheShubGF0ICogbmxvbmcgKiA2KTtcblxuICAgIC8vIENyZWF0ZSB2ZXJ0aWNlcywgbm9ybWFscyBhbmQgdGV4Q29vcmRzXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPD0gbmxhdDsgeSsrKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8PSBubG9uZzsgeCsrKSB7XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSB4ICsgeSAqIChubG9uZyArIDEpO1xuICAgICAgICBjb25zdCBpMiA9IGluZGV4ICogMjtcbiAgICAgICAgY29uc3QgaTMgPSBpbmRleCAqIDM7XG5cbiAgICAgICAgY29uc3QgdGhldGEgPSBsb25nUmFuZ2UgKiB1O1xuICAgICAgICBjb25zdCBwaGkgPSBsYXRSYW5nZSAqIHY7XG4gICAgICAgIGNvbnN0IHNpblRoZXRhID0gTWF0aC5zaW4odGhldGEpO1xuICAgICAgICBjb25zdCBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICAgICAgY29uc3Qgc2luUGhpID0gTWF0aC5zaW4ocGhpKTtcbiAgICAgICAgY29uc3QgY29zUGhpID0gTWF0aC5jb3MocGhpKTtcbiAgICAgICAgY29uc3QgdXggPSBjb3NUaGV0YSAqIHNpblBoaTtcbiAgICAgICAgY29uc3QgdXkgPSBjb3NQaGk7XG4gICAgICAgIGNvbnN0IHV6ID0gc2luVGhldGEgKiBzaW5QaGk7XG5cbiAgICAgICAgY29uc3QgciA9IHJhZGl1cyh1eCwgdXksIHV6LCB1LCB2KTtcblxuICAgICAgICBjb25zdCB1ID0geCAvIG5sb25nO1xuICAgICAgICBjb25zdCB2ID0geSAvIG5sYXQ7XG5cbiAgICAgICAgdmVydGljZXNbaTMgKyAwXSA9IHIgKiB1eDtcbiAgICAgICAgdmVydGljZXNbaTMgKyAxXSA9IHIgKiB1eTtcbiAgICAgICAgdmVydGljZXNbaTMgKyAyXSA9IHIgKiB1ejtcblxuICAgICAgICBub3JtYWxzW2kzICsgMF0gPSB1eDtcbiAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gdXk7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IHV6O1xuXG4gICAgICAgIHRleENvb3Jkc1tpMiArIDBdID0gdTtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBpbmRpY2VzXG4gICAgY29uc3QgbnVtVmVydHNBcm91bmQgPSBubGF0ICsgMTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IG5sYXQ7IHgrKykge1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBubG9uZzsgeSsrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gKHggKiBubG9uZyArIHkpICogNjtcblxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMF0gPSB5ICogbnVtVmVydHNBcm91bmQgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSB5ICogbnVtVmVydHNBcm91bmQgKyB4ICsgMTtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDJdID0gKHkgKyAxKSAqIG51bVZlcnRzQXJvdW5kICsgeDtcblxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgM10gPSAoeSArIDEpICogbnVtVmVydHNBcm91bmQgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNF0gPSB5ICogbnVtVmVydHNBcm91bmQgKyB4ICsgMTtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDVdID0gKHkgKyAxKSAqIG51bVZlcnRzQXJvdW5kICsgeCArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgdmVydGljZXM6IHZlcnRpY2VzLFxuICAgICAgICBpbmRpY2VzOiBpbmRpY2VzLFxuICAgICAgICBub3JtYWxzOiBub3JtYWxzLFxuICAgICAgICB0ZXhDb29yZHM6IHRleENvb3Jkc1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNwaGVyZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHN1cGVyKHtnZW9tZXRyeTogbmV3IFNwaGVyZUdlb21ldHJ5KG9wdHMpLCAuLi5vcHRzfSk7XG4gIH1cbn1cbiJdfQ==